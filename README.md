# PayGuard — USDC Escrow on Base

Smart contract escrow service on **Base** (Base Sepolia testnet). Lock USDC into invoices, confirm work, and release funds automatically with a 2.5% platform fee.

## Contract

- **Network:** Base Sepolia (chain ID 84532)
- **PayGuard:** `0x9f32910e811f239d2c8cd808901f5a0d786122aa`
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- [Explorer](https://sepolia.basescan.org/address/0x9f32910e811f239d2c8cd808901f5a0d786122aa)

## Flow

1. **Payer creates invoice** — specify payee, amount, deadline, description
2. **Payer funds invoice** — USDC locked in contract
3. **Payee completes work** — marks invoice complete
4. **Payee releases funds** — receives amount minus 2.5% fee
5. **Dispute** — payer can dispute before release; owner resolves
6. **Refund** — if deadline passes without completion, payer or owner can refund

## Usage

```bash
# install
npm install

# compile
node scripts/compile.js

# deploy
cp .env.example .env
# set PRIVATE_KEY
node scripts/deploy.js

# interact
node scripts/interact.js
```

## Frontend

Open `frontend/index.html` in a browser with MetaMask configured for Base Sepolia.

Get test USDC from [Circle Faucet](https://faucet.circle.com/) or use a bridge.

## Builder Code

This app uses Builder Code `bc_se8lr3yd` for on-chain activity attribution on Base.

## License

MIT
