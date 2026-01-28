# LimitGuard

![Thumbnail](docs/assets/thumbnail.png)

![Hero](docs/assets/hero_main.png)

## Distributed Rate Limiter with Atomic Redis Lua Scripting

<div align="center">

![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Pattern](https://img.shields.io/badge/Technique-Atomic_Lua_Scripting-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

**LimitGuard** is a production-grade Distributed Rate Limiter. It solves the classic "Check-Then-Act" race condition by implementing the **Token Bucket Algorithm** directly inside **Redis using Lua Scripting**. This ensures strict O(1) atomicity across distributed API clusters while maintaining a **Fail-Open** reliability posture.

---

## 🚀 Quick Start

Launch the entire stack (Infrastructure + Backend + Dashboard) with one command:

```bash
# 1. Install Dependencies
npm install && cd dashboard && npm install && cd ..

# 2. Run Dev Stack
npm run dev
```
> This script automatically:
> *   Generates SSL Certs (HTTPS).
> *   Starts Redis via Docker.
> *   Launches the API (4000) and Dashboard (3000).

> **Detailed Setup**: See [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for manual configurations.

---

## 📸 Demo & Architecture

### System Architecture
![Architecture](docs/assets/architecture.png)
*Distributed Gateway Pattern protected by Atomic Middleware*

### Concurrency Evidence
![Concurrency](docs/assets/concurrency-test.png)
*50 Concurrent Operations -> 0 Race Conditions (Exact Limit Enforced)*

> **Deep Dive**: See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the Lua Script logic.

---

## ✨ Key Features

*   **🛡️ Atomic Operations**: Uses `EVALSHA` to execute logic inside Redis, preventing race conditions.
*   **⚠️ Fail-Open Design**: Prioritizes Availability. If Redis dies, traffic is **allowed** (Circuit Breaker).
*   **🔒 End-to-End HTTPS**: Includes automated Self-Signed Certificate generation.
*   **📊 Live Telemetry**: Real-time Next.js dashboard showing Blocked vs Allowed requests.

---

## 📚 Documentation

| Document | Description |
| :--- | :--- |
| [**System Architecture**](./docs/ARCHITECTURE.md) | Lua Logic, Token Bucket Algo, and Design Decisions. |
| [**Getting Started**](./docs/GETTING_STARTED.md) | Setup guide, env variables, and troubleshooting. |
| [**Failure Scenarios**](./docs/FAILURE_SCENARIOS.md) | Fail-Open strategy and Concurrency tests. |
| [**Interview Q&A**](./docs/INTERVIEW_QA.md) | "Why Lua?" and "How to prevent Race Conditions". |

---

## 🔧 Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Middleware** | **Node.js (Express)** | Custom Rate Limit Middleware. |
| **Logic** | **Lua** | Server-side scripting for Atomicity. |
| **State** | **Redis** | Distributed Token Bucket storage. |
| **Frontend** | **Next.js 14** | Monitoring Dashboard. |

---

## 👤 Author

**Harshan Aiyappa**  
Senior Full-Stack Hybrid Engineer  
[GitHub Profile](https://github.com/Kimosabey)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
