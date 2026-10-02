import "dotenv/config";
import { createPublicClient, http, isAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { readFileSync } from "node:fs";
const address = process.env.PAYGUARD_ADDRESS;
async function main() {
  if (!isAddress(address || "")) throw new Error("Set PAYGUARD_ADDRESS to the contract you want to inspect.");
  const client = createPublicClient({ chain: baseSepolia, transport: http(process.env.RPC_URL || baseSepolia.rpcUrls.default.http[0]) });
  if (await client.getChainId() !== baseSepolia.id) throw new Error("RPC chain mismatch");
  if (!await client.getCode({ address })) throw new Error("No contract at configured address");
  const { abi } = JSON.parse(readFileSync(new URL("../artifacts/PayGuard.json", import.meta.url), "utf8"));
  console.log("Invoice count:", String(await client.readContract({ address, abi, functionName: "getInvoiceCount" })));
  if (process.argv[2]) {
    if (!/^[1-9]\d*$/.test(process.argv[2])) throw new Error("Invoice ID must be a positive integer");
    const invoice = await client.readContract({ address, abi, functionName: "invoices", args: [BigInt(process.argv[2])] });
    console.log(JSON.stringify(invoice, (_, value) => typeof value === "bigint" ? String(value) : value, 2));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
