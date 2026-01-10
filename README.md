# LimitGuard
## Distributed Rate Limiter with Atomic Redis Lua Scripting

<div align="center">

![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Tech Stack**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Lua-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Patterns**

![Rate Limiting](https://img.shields.io/badge/Pattern-Rate_Limiting-FF6B6B?style=flat-square)
![Token Bucket](https://img.shields.io/badge/Algorithm-Token_Bucket-4ECDC4?style=flat-square)
![Atomic Operations](https://img.shields.io/badge/Pattern-Atomic_Operations-95E1D3?style=flat-square)
![Fail-Open](https://img.shields.io/badge/Strategy-Fail--Open-F38181?style=flat-square)

</div>

---

## Visual Overview

### System Architecture

<p align="center">
  <img src="./docs/assets/architecture.png" alt="LimitGuard Architecture" width="800"/>
</p>

*Distributed Rate Limiting Architecture with Redis Token Buckets*

### Atomic Flow

<p align="center">
  <img src="./docs/assets/atomic-flow.png" alt="Atomic Operation Flow" width="750"/>
</p>

*Lua-based atomic operations prevent race conditions*

### Concurrency Test Results

<p align="center">
  <img src="./docs/assets/concurrency-test.png" alt="Concurrency Test" width="750"/>
</p>

*100 concurrent requests, zero race conditions - atomicity proven*

---

## Overview

**LimitGuard** is a distributed rate limiter that solves the fundamental race condition problem in traditional rate limiters by implementing the **Token Bucket Algorithm** directly inside Redis using **Lua Scripting**, guaranteeing O(1) atomicity even under massive concurrency.

### The Problem

Traditional rate limiters suffer from **race conditions** when they perform `GET` then `INCR` operations separately. Under high concurrency, this can allow more requests than the configured limit.

### The Solution

**Atomic Operations**: LimitGuard executes validation and increment in a single Redis Lua script, achieving 0% race conditions (verified with `autocannon` at 100 concurrent connections).

### Key Features

- **Atomic Operations**: 0% race conditions with Redis Lua scripting
- **Fail-Open Strategy**: System degrades gracefully if Redis crashes (allows traffic vs. causing outage)
- **End-to-End Encryption**: Self-signed HTTPS (TLS 1.2+) for API and Dashboard
- **Precision Timer**: Propagates Redis TTL to frontend for real-time "Reset Countdown"
- **Real-time Dashboard**: Live visualization of traffic spikes, blocked requests, and metrics

---

## Architecture

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as Node.js (LimitGuard)
    participant Redis as Redis (Lua)
    
    Client->>Gateway: HTTPS Request
    Gateway->>Redis: EVAL (Atomic Check + Increment)
    
    alt Allowed
        Redis-->>Gateway: 1
        Gateway->>Client: 200 OK
    else Denied
        Redis-->>Gateway: 0
        Gateway->>Client: 429 Too Many Requests
    end
```

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js v18+

### 1. Installation & Infrastructure
```bash
# Clone the repo
git clone https://github.com/Kimosabey/limit-guard.git
cd limit-guard

# Start Redis Infrastructure
docker-compose up -d

# Install Dependencies
npm install
cd dashboard && npm install && cd ..
```

### 2. Generate SSL Certificates (Security First)
```bash
node src/scripts/generateCert.js
# Output: server.key, server.cert
```

### 3. Run the Stack

**Backend (Port 8800)**
```bash
node src/server.js
```

**Frontend Dashboard (Port 3300)**
```bash
cd dashboard
npm run dev
```

---

## Verification

Run the Load Test to prove atomicity:
```bash
node src/scripts/loadTest.js
```

**Expected Output:**
```text
Success (200 OK): 10 (Matches Limit)
Blocked (429):    190
TEST PASSED: strict rate limit enforced.
```

---

## Documentation Index

| Doc | Description |
| :--- | :--- |
| **[SETUP.md](./docs/SETUP.md)** | Step-by-step installation & troubleshooting |
| **[FLOW.md](./docs/FLOW.md)** | Deep dive into Architecture & Atomic Logic |
| **[CASES.md](./docs/CASES.md)** | QA Playbook & Failure Scenarios |
| **[INTERVIEW.md](./docs/INTERVIEW.md)** | Senior QA: "Defend Your Design" |

---

## Project Structure

```
limit-guard/
├── src/
│   ├── scripts/
│   │   └── rateLimit.lua       # The Atomic Brain
│   ├── middleware/
│   │   └── rateLimiter.js      # Fail-Open Logic
│   └── server.js               # HTTPS Gateway
├── dashboard/                  # Next.js Visualization
└── docker-compose.yml          # Infrastructure
```

---

## 👤 Author

**Harshan Aiyappa**

- GitHub: [@Kimosabey](https://github.com/Kimosabey)

---

**Tech Stack**: Node.js • Redis • Lua • Next.js  
**Pattern**: Rate Limiting • Token Bucket • Atomic Operations

