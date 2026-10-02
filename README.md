# PayGuard

Experimental USDC invoice escrow for Base Sepolia. The payer funds an invoice and accepts completed work; the payee can withdraw only after that acceptance. The payer can dispute before withdrawal. The contract owner arbitrates disputes, and the payer or owner can refund a funded invoice after its deadline.

## Local setup and checks

Requires Node.js 22.13+.

```sh
npm ci
npm test
npm run check
npm run frontend:build
```

Tests compile Solidity and execute escrow flows on an in-memory Hardhat chain using generated accounts and a mock ERC-20 token. No external RPC, real wallet, or real funds are required. Tests cover payer acceptance, unauthorized actions, fee snapshots, deadlines, refunds, disputes, and exact decimal parsing. They are regression checks, not a security audit.

## Configuration and inspection

Copy `.env.example` to `.env`. Set `PAYGUARD_ADDRESS` only after verifying the deployment and source. `RPC_URL` is optional and must serve Base Sepolia (84532). After compiling:

```sh
node scripts/interact.js       # read invoice count only
node scripts/interact.js 1     # read invoice 1
```

This inspection command does not load a private key or submit transactions.

For the frontend, configure `frontend/config.js` with the reviewed contract address, run the frontend build, and serve the `frontend` directory over HTTP. The interface checks the contract's USDC address. Wallet actions require user approval and can consume testnet gas. Amounts use six decimal places; descriptions are rendered as text.

## Contract behavior and limits

- The fee is recorded when each invoice is created; later fee changes affect new invoices only. Initial fee: 250 basis points (2.5%), maximum: 10%.
- Funding after the deadline is rejected. A funded invoice can be refunded after the deadline if it has not been accepted or disputed.
- Payer and payee must be different addresses. Only the payer accepts work. Only the payee withdraws an accepted invoice.
- The owner controls dispute outcomes and the fee recipient. This is trusted arbitration, not decentralized dispute resolution.
- This implementation assumes a standard, non-rebasing ERC-20 such as the configured test USDC. Fee-on-transfer tokens are unsupported.
- Updating this source does not update any previously deployed contract. The former hardcoded deployment is no longer a default because its behavior cannot be changed by this PR.

Deployment is a separate, explicit action. The script supports Base Sepolia only and refuses to run without `--deploy`. Keep a test-only `PRIVATE_KEY` in the local environment; never commit or share it. Review the compiled artifact and configuration before authorizing deployment. This review did not deploy a contract or exercise a live wallet flow.

## License

MIT, as specified in the contract source. OpenZeppelin and other dependencies retain their own licenses.
