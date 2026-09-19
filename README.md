# ✈️ FinPilot AI — Autonomous Financial Workspace & Reasoning Copilot

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-FF6B6B)](https://oxc.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**FinPilot AI** is a privacy-first, agentic financial workspace that transforms raw transaction data into actionable financial decisions. Powered by a deterministic reasoning engine and natural language processing, FinPilot AI offers real-time liquid capital management, open banking account aggregation, market intelligence, multi-currency conversions, and bill splitting—all running locally in your browser.

---

## 🌟 Key Features

### 🧠 1. Agentic AI Reasoning Core & NLP Expense Logger
- **Natural Language Parsing**: Add expenses conversationally (e.g., *"I spent ₹450 on Swiggy lunch"* or *"Paid ₹1,200 for fuel"*), with auto-category assignment and balance calculations.
- **Affordability Engine**: Ask queries like *"Can I afford a ₹15,000 smartphone?"* and receive real-time evaluations based on income, fixed commitments, and sinking funds.
- **Budget Guardrails**: Dynamic warning triggers when category spending crosses 80% or 100% of defined budget caps.

### 🏦 2. Open Banking via Setu Account Aggregator (AA)
- **Live Consent Flow**: Connect real Indian bank accounts (HDFC, ICICI, Axis, etc.) using Setu's Account Aggregator framework.
- **Automated Sync & Fallback**: Fetches live bank statements and transactions securely via an integrated API proxy, with smooth fallback to realistic mock data when unconfigured.

### 📈 3. Market & Investment Intelligence
- **Real-Time Stock Quotes**: Live stock data via Alpha Vantage API for Indian market symbols (NSE/BSE).
- **IPO Intelligence Tracker**: Track upcoming and open IPOs with Grey Market Premium (GMP), subscription dates, risk metrics, and AI recommendations (`BUY` / `WAIT` / `SKIP`).

### 💱 4. Multi-Currency & Forex Engine
- **Live Exchange Rates**: Real-time currency conversions using ExchangeRate-API for 10+ currencies (INR, USD, EUR, GBP, JPY, AED, SGD, AUD, CAD, CHF).
- **Localized Formatting**: Native support for Indian number formatting (`₹1,50,000`).

### 🤝 5. Group Expense Splitting
- **Flexible Bill Split**: Split expenses equally, by percentages, exact amounts, or shares among group members.
- **Balances & Settle-Up**: Track who owes whom with single-click settlement workflows.

### 🔄 6. Recurring Subscriptions & Cashflow Management
- **Pattern Detection**: Automatically identifies recurring subscriptions and bills from historical transactions.
- **Due Date Reminders**: Tracks upcoming payment cadences (daily, weekly, monthly, yearly) and alerts before due dates.

### 🛰️ 7. System Telemetry & Agent Architecture
- **Live Trace Log**: Visual stream of agent decision-making logic, guardrail evaluation, and memory updates.
- **Stress-Test & Guarantees**: Interactive financial scenario stress tests and consumer protection guarantees.

### 🔒 8. Data Privacy & Local Backup
- **Zero Server Storage**: Your financial data stays inside your browser (`localStorage`).
- **Data Export & Import**: Full JSON data backup and restoration functionality.
- **Browser Push Notifications**: Native desktop/mobile push notifications for bill alerts and budget warnings.

---

## 🏗️ Project Architecture & Tech Stack

### Tech Stack
- **Frontend Framework**: React 19 (Functional components, Context API)
- **Build Tool & Dev Server**: Vite 8 with HMR (Hot Module Replacement)
- **Styling**: Tailwind CSS & Google Material Symbols Outlined icons
- **State Management**: React Context (`AuthContext`, `FinancialContext`, `SplitContext`)
- **Linter**: Oxlint (High-performance Rust-based JavaScript/TypeScript linter)

### Directory Structure

```
hack/
├── public/                 # Static public assets & icons
├── src/
│   ├── assets/             # SVGs, emblems, and static images
│   ├── components/         # Feature components organized by domain
│   │   ├── analytics/      # Analytics, market research & charts
│   │   ├── architecture/   # Agent trace log, telemetry & system guarantees
│   │   ├── auth/           # Login screen & onboarding wizard
│   │   ├── backup/         # Export/Import JSON data backup
│   │   ├── banking/        # Setu Account Aggregator & bank accounts
│   │   ├── cashflow/       # Expenses manager & transaction timeline
│   │   ├── common/         # Command palette & global modal overlays
│   │   ├── currency/       # Multi-currency converter & forex rates
│   │   ├── dashboard/      # Overview dashboard, liquid capital & NLP logger
│   │   ├── goals/          # Budgets, category caps & sinking funds
│   │   ├── layout/         # Header, Sidebar, Toast & Bottom Nav
│   │   ├── notifications/  # Push notifications manager
│   │   ├── recurring/      # Recurring subscriptions tracker
│   │   ├── settings/       # Profile & application settings
│   │   ├── split/          # Bill splitting & group balances
│   │   └── stocks/         # Stock quotes & IPO intelligence
│   ├── context/            # React state providers (Auth, Financial, Split)
│   ├── services/           # API service layer (Alpha Vantage, Forex, Setu)
│   ├── App.jsx             # Main router & active view gateway
│   ├── App.css             # Main stylesheet & custom utility classes
│   └── main.jsx            # React root entry point
├── .env.example            # Environment variables reference template
├── .oxlintrc.json          # Oxlint configuration
├── vite.config.js          # Vite configuration with API proxy rules
└── package.json            # Project dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gsaitejasvi-bit/Finpilot.git
   cd Finpilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your optional API keys (or leave empty to run in offline mock mode):*
   ```env
   VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key
   VITE_EXCHANGE_RATE_KEY=your_exchangerate_api_key
   VITE_SETU_CLIENT_ID=your_setu_client_id
   VITE_SETU_CLIENT_SECRET=your_setu_client_secret
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the local Vite development server with HMR |
| `npm run build` | Compiles and bundles production assets into `/dist` |
| `npm run lint` | Runs `oxlint` to check code quality and syntax standards |
| `npm run preview` | Serves the production `/dist` build locally for verification |

---

## 🌐 API Integrations & Fallbacks

FinPilot AI is built with a **resilient hybrid architecture**. All external integrations automatically fall back to mock data if API keys are omitted or network calls fail:

| Provider | Purpose | Status / Fallback |
| :--- | :--- | :--- |
| **Alpha Vantage** | Real-time Indian stock market quotes (NSE/BSE) | Live API with random-walk mock fallback |
| **ExchangeRate-API** | Multi-currency exchange rate conversions | Live API with mid-market cached fallback rates |
| **Setu AA Proxy** | Open Banking consent & FI statement pulling | Dev proxy via `/api/setu` with interactive sandbox fallback |
| **Browser Push** | System alerts & budget notifications | Web Push API with in-app Toast fallback |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/gsaitejasvi-bit/Finpilot/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
