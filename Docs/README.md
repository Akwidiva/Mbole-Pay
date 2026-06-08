# 💸 Mbole Pay

> **Community Savings & Loan Manager** — Digitizing and automating traditional tontines ("njangi") using modern web technologies and smart contracts.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [UML Diagrams](#uml-diagrams)
- [Product Backlog](#product-backlog)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

---

## 🧠 Overview

Mbole Pay is a web-based platform that modernizes traditional community savings groups. It allows members to contribute, receive payouts, and resolve disputes — all in one place, with complete transparency.

---

## ❗ Problem Statement

Traditional savings groups ("njangi" or "tontine") face:

- Manual tracking of payments 📝
- High risk of errors or fraud ❌
- Lack of transparency and trust 🤷‍♂️

---

## ✅ Solution

Mbole Pay provides:

- 📲 A secure, digital savings platform
- 🤖 Automated contribution and payout system
- ⚖️ Dispute resolution via anonymous voting
- 🔐 Smart contracts to enforce fairness and transparency

---

## ✨ Features

- Member registration and approval
- Group creation and rule-setting
- Auto-debit and scheduled payouts
- Transparent contribution tracking
- Voting-based dispute resolution
- Downloadable reports and dashboards
- Real-time notifications (email/SMS)

---

## 🏗 System Architecture

- **Frontend**: React.js (client-first, mobile responsive)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + IPFS (decentralized file storage)
- **Blockchain**: Ethereum / Binance Smart Chain (Smart Contracts)
- **Payments**: Flutterwave, Paystack, MTN MoMo
- **Infrastructure**: Docker, GitHub Actions CI/CD, Terraform (IaC), Kubernetes

---

## 🧰 Tech Stack

| Layer        | Tech                              |
| ------------ | --------------------------------- |
| Frontend     | React, TailwindCSS                |
| Backend      | Node.js, Express                  |
| Database     | PostgreSQL, IPFS                  |
| Blockchain   | Solidity, Hardhat                 |
| Infra/DevOps | Docker, GitHub Actions CI, Terraform, K8s |

---

## 📊 UML Diagrams

- ✅![Use Case Daigram](./Use%20Case%20Daigram.png)
- 🧱 [Class Daigram](./Class%20Daigram.png)
- 🔁 [Sequence Daigram](./Sequence%20Daigram.png)
- 🔄 [Activity Daigram](./Activity%20Daigram.png)
- 🌐 [Deployment Daigram](./Deployment%20Daigram.png)

*(All visuals are located in the **`/docs`** folder)*

---

## 🗂 Product Backlog (Agile User Stories)

>[See Product Backlog](./Product%20Backlog.md)




**Sample Epics:**

- User Onboarding & Authentication
- Group Creation & Management
- Contribution & Payments
- Smart Contract Logic
- Dispute Resolution
- Reporting & Notifications
- Infrastructure & CI/CD

---

## 🚀 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourUsername/Mbole-Pay.git
```

2. Navigate into the client directory and install dependencies:

```bash
npm install
```

3. Start the React app:

```bash
npx next dev
```

4. Build and deploy with Helm:

```bash
docker build -t mbole-pay:latest .
helm upgrade --install mbole-pay ./helm/mbole-pay -n mbole-pay --create-namespace
```

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

- Fork the repo
- Create a new branch
- Commit your changes
- Push to your fork
- Open a pull request

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

### 🚨 Disclaimer

Mbole Pay is a student-driven innovation project. Always test thoroughly before handling real financial data.

