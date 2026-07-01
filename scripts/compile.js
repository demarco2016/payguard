import solc from "solc";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function findImports(path) {
  const fullPath = resolve(ROOT, "node_modules", path);
  if (existsSync(fullPath)) {
    return { contents: readFileSync(fullPath, "utf8") };
  }
  return { error: `File not found: ${path}` };
}

const contractPath = resolve(ROOT, "contracts", "PayGuard.sol");
const source = readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "contracts/PayGuard.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    console.error("Compilation errors:");
    errors.forEach((e) => console.error(e.formattedMessage || e.message));
    process.exit(1);
  }
}

const contract = output.contracts["contracts/PayGuard.sol"].PayGuard;
const artifact = {
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

const outDir = resolve(ROOT, "artifacts");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "PayGuard.json"), JSON.stringify(artifact, null, 2));

console.log("✅ PayGuard compiled successfully");
