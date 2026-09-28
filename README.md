# QUANTORA — 3D Quantitative Multi-Asset Financial Intelligence & Systematic Backtesting Terminal

[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-purple.svg)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg)](https://www.python.org/)
[![Featherless AI](https://img.shields.io/badge/Featherless%20AI-Ready-orange.svg)](https://featherless.ai/)

**QUANTORA** is an institutional-grade quantitative financial intelligence and systematic backtesting research terminal. Built with an interactive **Three.js WebGL 3D Market Universe**, a Python **FastAPI quantitative analytics engine**, real **yfinance market data**, and an integrated **QUANTORA AI Analyst Assistant** powered by **Featherless AI**, QUANTORA empowers researchers, quantitative analysts, and algorithmic traders to analyze multi-asset dynamics, test systematic alpha strategies with zero look-ahead bias, and evaluate risk across historical market regimes.

---

## 🎯 What the Project Does

QUANTORA enables researchers to:
1. **Analyze Key Macro Assets**: Track real market performance, volatility, and drawdowns for **Gold** (`GC=F`), **Bitcoin** (`BTC-USD`), and **NVIDIA** (`NVDA`).
2. **Visualize Cross-Asset Dynamics in Real 3D**: Explore market correlations and asset dispersion in a hardware-optimized WebGL 3D orbital universe.
3. **Consult QUANTORA AI Analyst**: Ask natural language financial research questions answered by Featherless AI (or the local analytical engine), grounded strictly in Python calculations.
4. **Conduct Systematic Backtesting**: Simulate trading strategies with strict execution discipline (signals generated at bar $t$ close $\rightarrow$ executed at bar $t+1$ open) and realistic frictions (basis-point commissions and adverse slippage).
5. **Evaluate Model Robustness**: Detect curve-fitting traps via 2D parameter heatmaps, cost-drag stress testing (0–100 bps), 70/30 in-sample vs out-of-sample splits, and a composite robustness scorecard.
6. **Classify Market Regimes**: Segment market history into Bull, Bear, High Volatility, and Low Volatility states to analyze strategy suitability under shifting macro regimes.

---

## ✨ Main Features

### 1. Interactive 3D Market Universe (`MarketUniverse3D`)
- Built with **Three.js**, **React Three Fiber**, and **@react-three/drei**.
- Features an illuminated central **QUANTORA Core** with rotating concentric orbital rings and ambient particle dust.
- 3 interactive 3D nodes for **Gold**, **Bitcoin**, and **NVIDIA** with real-time price overlays, glowing materials, and selection halos.
- Interactive mouse/touch rotation, zoom controls, and smooth damping.
- Synchronized with the entire dashboard: selecting an asset in 3D updates its card, focuses the performance chart, and switches the AI Analyst context.
- Laptop-optimized with prefers-reduced-motion support and an automated 2D fallback.

### 2. QUANTORA AI Analyst (`AIAnalyst`)
- Integrated financial research assistant panel connected to the FastAPI backend at `POST /ai/analyze`.
- Formulates structured financial context (latest price, period return, volatility, Sharpe, max drawdown) calculated strictly by the Python engine.
- Supports **Featherless AI** cloud models (e.g. `meta-llama/Meta-Llama-3.1-8B-Instruct`) via backend environment variables.
- Automated fallback to a local deterministic quantitative engine when no API key is provided, clearly disclosed in the interface.
- 7 one-click suggested questions exploring outperformance, volatility dispersion, and portfolio diversification.

### 3. Upgraded Core Asset Cards (`AssetCard`)
- Real backend data fetching from `/market/BTC-USD`, `/market/GC=F`, and `/market/NVDA`.
- Displays latest price, 24h change, period net return, annualized volatility, and interactive SVG sparklines.
- "Analyze / Deep Dive" action to transition directly into single-asset inspection.

### 4. Multi-Asset Normalized Performance (`PerformanceChart`)
- Base-100 indexed performance chart for comparative evaluation across disparate asset classes.
- Interactive toggles for Gold, Bitcoin, and NVIDIA with custom dark tooltips displaying normalized values and relative percentages.

### 5. Institutional Quantitative Metrics (`QuantMetrics`)
- Institutional statistical cards: Initial Capital, Final Capital, Total Return, CAGR, Annualized Volatility, Sharpe Ratio ($R_f=4.0\%$), Maximum Drawdown, and Win Rate.
- Uncomputed strategy fields explicitly show `"Awaiting Backtest Engine"` status badges, reinforcing Python as the source of truth.

### 6. Systematic Strategy Lab (Hero Backtest Engine)
- 4 strategy archetypes: **SMA Crossover**, **EMA Trend Filter**, **Momentum (ROC)**, and **Mean Reversion (Z-Score)**.
- **Zero Look-Ahead Bias**: Mark-to-market decisions at bar $t$ close $\rightarrow$ executed at bar $t+1$ open.
- Explicit basis-point transaction fees (10 bps) and slippage (5 bps) deducted on both entry and exit.
- Benchmark comparison (strategy vs. buy-and-hold), underwater drawdown overlay, monthly return matrix, and full CSV trade logs.
- Robustness Suite: 2D parameter sensitivity grid, transaction cost drag curve, and 70/30 out-of-sample validation.

### 7. Market Regime Classifier & Cross-Asset Correlations
- 4-state classifier (Bull, Bear, High Vol, Low Vol) with historical regime timelines and strategy performance breakdown.
- 3×3 Pearson correlation heatmap and sliding rolling correlation chart (30/60/90/180 days).

---

## 🛠️ Technologies Used

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 6.0, Vite 8.3 |
| **3D Graphics & WebGL** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Styling & Design** | Tailwind CSS v4, Custom Fintech Dark Theme (`#070a12`) |
| **Data Visualization** | Recharts, SVG Sparklines |
| **Icons & UI** | Lucide React |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn |
| **Quantitative Analytics** | Pandas, NumPy, yfinance |
| **AI Inference** | Featherless AI API (`/v1/chat/completions`) |

---

## 🚀 How to Run the Project

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.11 or higher) & **pip**

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/quantora.git
cd quantora
```

### 2. Set Up and Run the Python Backend
```bash
# Navigate to project root
# (Optional: create and activate a virtual environment)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install Python backend dependencies
pip install -r backend/requirements.txt

# (Optional) Configure Featherless AI Key
# Copy example environment file:
# cp backend/.env.example backend/.env
# Set FEATHERLESS_API_KEY=your_key_here

# Launch the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Set Up and Run the React Frontend
In a new terminal window:
```bash
# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev -- --host 0.0.0.0 --port 5188
```

### 4. Open in Your Browser
- **Local Application URL**: [http://localhost:5188](http://localhost:5188)
- **LAN / Wi-Fi Network URL**: `http://<your-lan-ip>:5188` (e.g. `http://192.168.20.25:5188`)
- **FastAPI Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🎬 How to Use & Demo the Platform

Follow this 5-step walkthrough to experience the full terminal capabilities:

1. **Explore the 3D Market Universe**:
   - On the **Overview** dashboard, drag with your mouse/touch to rotate the camera around the glowing **QUANTORA Core**.
   - Scroll to zoom in and observe the orbital rings and data particles.
   - Click the **Bitcoin** node: notice how Bitcoin is highlighted in 3D, the Bitcoin asset card is focused, the performance chart isolates BTC, and the AI Analyst switches focus to `BTC-USD`.
2. **Consult the QUANTORA AI Analyst**:
   - In the right-hand panel, click the suggestion chip: *"Why did Bitcoin outperform Gold?"*.
   - The question is dispatched to the backend at `POST /ai/analyze`.
   - The AI returns an explanation grounded in actual Python-calculated returns, volatility, and Sharpe ratios.
3. **Inspect Multi-Asset Dynamics**:
   - Scroll down to the **Multi-Asset Normalized Performance** chart. Toggle the `GOLD`, `BTC`, or `NVDA` pills to isolate specific trajectories.
   - Review the **Institutional Quantitative Metrics** table to see CAGR, Volatility, Sharpe, and Maximum Drawdown.
4. **Conduct a Backtest in the Strategy Lab**:
   - Click **Strategy Lab** in the left sidebar.
   - Select an asset (e.g. **Bitcoin**), choose a strategy (e.g. **SMA Crossover**), set Fast Period = 20 and Slow Period = 50.
   - Click **Run Backtest**: observe the simulated equity curve vs. Buy-and-Hold, monthly return matrix, and the trade execution log with fee and slippage deductions.
   - Switch to the **Robustness & Sensitivity** tab to review the 2D parameter heatmap and cost sensitivity curve.
5. **Examine Market Regimes & Correlations**:
   - Navigate to **Correlations** to inspect the 3×3 Pearson matrix and rolling correlation decoupling events.
   - Navigate to **Market Regimes** to explore the 4-state regime segmentation across historical macro cycles.

---

## ⚙️ Environment Variables (Optional)

The platform runs 100% out-of-the-box with built-in analytical fallbacks. To activate live cloud Featherless AI LLM responses, set the following in `backend/.env` or in your system environment:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `FEATHERLESS_API_KEY` | Your Featherless AI authorization token | `""` (runs in local analytical mode if empty) |
| `FEATHERLESS_MODEL` | HuggingFace model identifier hosted on Featherless | `meta-llama/Meta-Llama-3.1-8B-Instruct` |
| `FEATHERLESS_API_URL` | Featherless chat completions endpoint | `https://api.featherless.ai/v1/chat/completions` |

---

## 🔒 Security & Best Practices

- **Zero Client-Side Secrets**: `FEATHERLESS_API_KEY` is strictly managed within the Python server environment and is never exposed to the client.
- **CORS Restricted**: The backend restricts or safely manages cross-origin access for terminal frontends.
- **Execution Authenticity**: All financial indicators, backtest fills, and risk metrics are computed mathematically in Python and TypeScript, not hallucinated by generative models.

---

## ⚖️ Educational Disclaimer

*Historical analysis and algorithmic simulations are for educational and research purposes only. Past performance does not guarantee future results. QUANTORA does not provide investment, financial, or trading advice.*
