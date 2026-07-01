import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = process.env.NETWORK || "baseSepolia";

const CHAINS = {
  baseSepolia: { id: 84532, rpc: "https://sepolia.base.org", usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
  base: { id: 8453, rpc: "https://mainnet.base.org", usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
};

const chain = CHAINS[NETWORK];
const artifact = JSON.parse(readFileSync(resolve(ROOT, "artifacts", "PayGuard.json"), "utf-8"));
const PAYGUARD_ADDRESS = "0x9f32910e811f239d2c8cd808901f5a0d786122aa";

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ transport: http(chain.rpc) });
const walletClient = createWalletClient({ account, transport: http(chain.rpc) });

async function read(functionName, args = []) {
  return await publicClient.readContract({
    address: PAYGUARD_ADDRESS, abi: artifact.abi,
    functionName, args,
  });
}

async function write(functionName, args = []) {
  const hash = await walletClient.writeContract({
    address: PAYGUARD_ADDRESS, abi: artifact.abi,
    functionName, args, account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ${functionName}: tx ${receipt.transactionHash}`);
  return receipt;
}

async function main() {
  console.log(`Account: ${account.address}`);
  console.log(`PayGuard: ${PAYGUARD_ADDRESS}\n`);

  // 1. Check basic state
  const fee = await read("platformFee");
  const count = await read("invoiceCounter");
  console.log(`Platform fee: ${Number(fee)} bps (${Number(fee) / 100}%)`);
  console.log(`Invoice count: ${Number(count)}\n`);

  // 2. Create invoice
  console.log("Creating invoice...");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
  const amount = BigInt(10 * 1e6); // 10 USDC
  await write("createInvoice", [account.address, amount, deadline, "Test payment"]);
  const newCount = await read("invoiceCounter");
  console.log(`  New invoice count: ${Number(newCount)}\n`);

  // 3. Read invoice
  const inv = await read("invoices", [BigInt(1)]);
  const statuses = ["Created", "Funded", "Completed", "Released", "Refunded", "Disputed"];
  console.log(`Invoice #1:`);
  console.log(`  Payer:  ${inv[0]}`);
  console.log(`  Payee:  ${inv[1]}`);
  console.log(`  Amount: ${Number(inv[2]) / 1e6} USDC`);
  console.log(`  Status: ${statuses[Number(inv[5])]}\n`);

  // 4. Fund invoice (approve USDC first)
  console.log("Approving USDC...");
  const usdcAbi = [
    { constant: false, inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function" },
    { constant: true, inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
  ];
  const approveHash = await walletClient.writeContract({
    address: chain.usdc, abi: usdcAbi,
    functionName: "approve", args: [PAYGUARD_ADDRESS, amount], account,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log(`  Approve: ${approveHash}\n`);

  console.log("Funding invoice...");
  await write("fundInvoice", [BigInt(1)]);

  // 5. Confirm complete
  console.log("Confirming complete...");
  await write("confirmComplete", [BigInt(1)]);

  // 6. Release
  console.log("Releasing funds...");
  await write("release", [BigInt(1)]);

  // 7. Verify
  const finalInv = await read("invoices", [BigInt(1)]);
  console.log(`\nFinal status: ${statuses[Number(finalInv[5])]}`);
  console.log("✅ All steps completed successfully!");
}

main().catch(console.error);
