import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const CHAINS = {
  baseSepolia: {
    id: 84532,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    usdc: USDC_BASE_SEPOLIA,
    currency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  base: {
    id: 8453,
    name: "Base Mainnet",
    rpc: "https://mainnet.base.org",
    usdc: USDC_BASE_MAINNET,
    currency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
};

function loadArtifact() {
  const p = resolve(ROOT, "artifacts", "PayGuard.json");
  return JSON.parse(readFileSync(p, "utf-8"));
}

async function main() {
  if (!process.argv.includes("--deploy")) throw new Error("Deployment sends a transaction. Review configuration and explicitly pass --deploy.");
  const networkName = process.env.NETWORK || "baseSepolia";
  if (networkName !== "baseSepolia") throw new Error("This experimental deployment script only supports Base Sepolia.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY || "")) throw new Error("Set a valid PRIVATE_KEY in your local environment.");
  const chain = CHAINS[networkName];
  if (!chain) { console.error("Unknown network"); process.exit(1); }

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Deployer: ${account.address}`);
  console.log(`Network:  ${chain.name} (${chain.id})`);
  console.log(`USDC:     ${chain.usdc}`);

  const publicClient = createPublicClient({ transport: http(chain.rpc) });
  const walletClient = createWalletClient({ account, transport: http(chain.rpc) });

  if (await publicClient.getChainId() !== chain.id) throw new Error("RPC chain mismatch");
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`ETH balance: ${balance.toString()}`);
  if (balance === 0n) { console.error("Zero balance"); process.exit(1); }

  const artifact = loadArtifact();

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [chain.usdc, account.address],
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("Deployment reverted");
  console.log(`\n✅ PayGuard deployed: ${receipt.contractAddress}`);
  console.log(`Explorer: https://${networkName === "base" ? "" : "sepolia."}basescan.org/address/${receipt.contractAddress}`);

  // save
  const info = {
    network: chain.name,
    chainId: chain.id,
    address: receipt.contractAddress,
    usdc: chain.usdc,
    feeRecipient: account.address,
    platformFee: "2.5%",
  };
  console.log(`\nConfig:`);
  console.log(JSON.stringify(info, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
