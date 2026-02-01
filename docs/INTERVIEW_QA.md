# 🎓 Interview Q&A: LimitGuard

## 1. The Elevator Pitch (2 Minutes)

"LimitGuard is a distributed, atomic rate limiter built for high-scale APIs.

Unlike simple in-memory counters (which fail in distributed environments), I implemented the **Token Bucket Algorithm** using **Redis Lua Scripting**.
This ensures two critical things:
1.  **Atomicity**: It prevents race conditions (`TOCTOU`) even when thousands of requests hit simultaneously.
2.  **Scalability**: The state is shared across all API nodes.

I also prioritized reliability by implementing a **Fail-Open** strategy—meaning if Redis goes down, the API stays up (allowing traffic) rather than blocking legit users."

---

## 2. "Explain Like I'm 5" (The Bouncer)

"Imagine a Nightclub (The API).
*   **The Bouncer (LimitGuard)**: Stands at the door. He has a clicker counter.
*   **The Rule**: Only 10 people allowed per minute.
*   **The Problem**: If you have 2 doors (2 Servers), and 2 Bouncers, they don't know how many people the *other* bouncer let in. You might let in 20 people!
*   **My Solution**: The Bouncers share one single Clicker (Redis). Before letting anyone in, they check the Master Clicker. Because they share the state, the count is always accurate."

---

## 3. Tough Technical Questions

### Q: Why use Lua? Why not just `GET` and `INCR`?
**A:** "`GET` and `INCR` are two separate network calls. In the 10ms between the `GET` (reading 9) and the `INCR`, another request could slip in. This is a classic race condition. **Lua Scripting** executes the entire logic inside Redis as a single, atomic transaction. It blocks other commands for that microsecond, guaranteeing mathematical correctness."

### Q: What is your Fail-Over strategy?
**A:** "**Fail-Open**. In a security product, you might want to 'Fail-Closed' (block everything if you can't verify), but for a general API rate limiter, Availability is king. I wrap the Redis logic in a global Try/Catch. If Redis times out or throws an error, I log it and let the request through. I'd rather accept a temporary DDOS risk than cause a guaranteed P0 outage for all customers."

### Q: How does this handle Distributed Delay (Latency)?
**A:** "Because Redis is the single source of truth, there is no synchronization lag between API nodes. However, there is network latency between the Node API and Redis. I minimize this by using persistent connections and ensuring Redis is in the same VPC/Region as the API servers."
