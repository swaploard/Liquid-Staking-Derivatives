
# 🏦 LSD-Collateralized Stablecoin Borrowing Protocol

A decentralized lending protocol that allows users to deposit liquid staking tokens (LSDs) such as **stETH**, **rETH**, and **bETH** as collateral to borrow **stablecoins** like DAI or USDC — without sacrificing ETH staking rewards.

---

## 🌟 Key Features

- **LSD Collateral Support**  
  Deposit stETH, rETH, or bETH as overcollateralized assets.
  
- **Stablecoin Borrowing**  
  Borrow DAI or USDC up to 75% LTV against your LSD collateral.

- **Health Factor Tracking**  
  Real-time health factor monitoring with visual feedback to avoid liquidation.

- **Safe Withdrawals**  
  Users can only withdraw collateral that maintains health factor > 1.0.

- **Mock Price Oracles**  
  Simulated LSD-ETH price feeds on testnet for accurate borrowing dynamics.

- **Testnet Deployed**  
  Built for testing on Goerli or Holesky with mock tokens and contracts.

---

## ⚙️ Tech Stack

- **Smart Contracts**: Solidity, OpenZeppelin
- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Web3 Integration**: Wagmi, Viem, Ethers.js
- **State Management**: Zustand
- **UI Components**: Shadcn/ui
- **Testing & Deployment**: Foundry, Hardhat (testnet deploy scripts)
- **Wallet Connection**: RainbowKit or ConnectKit
- **Mock Price Oracles**: Chainlink-style mock contracts

---

## 🧪 Getting Started

### Prerequisites

- Node.js ≥ 18
- Hardhat or Foundry installed
- Wallet with testnet ETH (Goerli or Holesky)

### 1. Clone the Repo

```bash
git clone https://github.com/your-org/lsd-lending-protocol.git
cd lsd-lending-protocol
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Frontend Locally

```bash
npm run dev
```

### 4. Deploy Contracts to Testnet

```bash
forge script scripts/Deploy.s.sol --rpc-url <RPC_URL> --broadcast --verify
```

## 🪙 Supported Tokens (Testnet)

* stETH (mock or faucet)
* rETH (mock or faucet)
* bETH (mock or faucet)
* DAI / USDC (testnet ERC20s)

---

## 🧮 Health Factor Formula

```
Health Factor = (Collateral Value × Liquidation Threshold) / Debt Value
```

* If **HF > 1.0** → safe
* If **HF < 1.0** → eligible for liquidation
---

