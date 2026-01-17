# LimitGuard

![Thumbnail](docs/assets/thumbnail.png)

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

## 🚀 Quick Start

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

### 2. Generate SSL Certificates
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

## 📸 Screenshots

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

## ✨ Key Features

### 🛡️ Atomic Rate Limiting
- **Redis Lua Scripting**: Executes check + increment in a single atomic step.
- **Zero Race Conditions**: Verified with 100 concurrent connections.

### ⚠️ Fail-Open Strategy
- **High Availability Focus**: If Redis fails, traffic is **allowed** rather than blocked.
- **Circuit Breaker**: Prevents cascading failures during outages.

### 🔒 Security First
- **TLS 1.2+**: End-to-end HTTPS encryption for API and Dashboard.
- **Self-Signed Certs**: Automated generation script included.

### 📊 Real-Time Observability
- **Live Dashboard**: Visualizes allowed vs blocked requests.
- **Precision Timer**: Syncs Redis TTL with frontend for accurate countdowns.

---

## 🏗️ Architecture

![Architecture](docs/assets/architecture.png)

**LimitGuard** implements the **Token Bucket Algorithm** directly inside Redis using **Lua Scripting**. This guarantees **O(1)** complexity and strict atomicity, solving the "check-then-act" race condition found in traditional rate limiters.

---

## 🧪 Testing & Scripts

### Run Load Test
Prove atomicity by simulating high concurrency:
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

## 📚 Documentation

| Doc | Description |
| :--- | :--- |
| **[SETUP.md](./docs/SETUP.md)** | Step-by-step installation & troubleshooting |
| **[FLOW.md](./docs/FLOW.md)** | Deep dive into architecture & atomic logic |
| **[CASES.md](./docs/CASES.md)** | QA playbook & failure scenarios |
| **[INTERVIEW.md](./docs/INTERVIEW.md)** | Technical design defense |

---

## 🔧 Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Logic** | Node.js + Lua | Atomic rate limiting engine |
| **Storage** | Redis 7 | Distributed counter & TTL management |
| **Frontend** | Next.js 14 | Real-time monitoring dashboard |
| **Security** | OpenSSL | HTTPS/TLS encryption |
| **Ops** | Docker Compose | Infrastructure orchestration |

---

## 🚀 Future Enhancements

- [ ] Distributed Redis (Cluster Mode) support
- [ ] IP Whitelisting/Blacklisting middleware
- [ ] Multiple rate limit policies (Per User, Per Route)
- [ ] Prometheus metrics export
- [ ] GraphQL API gateway integration

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 👤 Author

**Harshan Aiyappa**  
Senior Full-Stack Engineer  
📧 [GitHub](https://github.com/Kimosabey)

---

**Built with**: Node.js • Redis • Lua • Next.js  
**Pattern**: Rate Limiting • Token Bucket • Atomic Operations
