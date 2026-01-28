# 🛡️ Failure Scenarios & Resilience

> "Rate Limiters must fail *open*, not *closed*."

This document covers how LimitGuard handles concurrency, outages, and race conditions.

## 1. Failure Matrix

| Component | Failure Mode | Impact | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| **Redis** | Crash / Downtime | **Minor**. Rate limiting stops working. | **Fail-Open Strategy**. Middleware catches the error and allows all traffic. API remains usable. |
| **Redis** | Slow Network (Latency) | **Minor**. Request takes longer. | **Timeout**. Redis client has a 200ms timeout. If breached, it Fails Open. |
| **Node.js** | Process Crash | **Critical**. API Down. | **PM2/Docker**. Auto-restart policy handles recovery. |
| **SSL Certs** | Expired/Missing | **Major**. HTTPS Fails. | **Auto-Gen Script**. `npm run dev` regenerates valid certs on startup. |

---

## 2. Deep Dive: Race Conditions (Concurrency)

### The Problem
If User A has made 9 requests (Limit 10).
Two requests come in at **exactly** the same millisecond.
1.  **Req 1**: Reads Count (9). Check (9 < 10). Allowed.
2.  **Req 2**: Reads Count (9). Check (9 < 10). Allowed.
3.  **Result**: 11 total requests. The limit was breached.

### The Solution: Atomic Lua
We use `EVALSHA` to execute the check-and-increment as a **Single Atomic Operation**.
Redis guarantees that no other command processes while a script is running.
*   **Result**: Req 1 runs. Count becomes 10. Req 2 runs. Count becomes 11. Req 2 is **Blocked**.

---

## 3. Resilience Testing

### Test 1: The "Kill Switch" (Fail-Open)
1.  Start the app.
2.  Stop Redis: `docker stop limitguard-redis`.
3.  Send a request.
4.  **Expectation**: `200 OK`.
5.  **Log**: `❌ Redis error: Connection lost. Allowing request (Fail-Open).`

### Test 2: Concurrency Load Test
Run the included stress test to simulate 50 parallel threads.
```bash
node src/scripts/loadTest.js
```
**Expectation**: Exactly 10 successes, 40 blocked (Assuming Limit=10).
