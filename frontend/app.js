import { createWalletClient, createPublicClient, custom, isAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { parseUSDC, formatUSDC, normalizeInvoice } from "./utils.js";
const PAYGUARD_ADDRESS = window.PAYGUARD_CONFIG?.contractAddress;
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const BASE_SEPOLIA_CHAIN_ID = 84532;

const PAYGUARD_ABI = [
  { "inputs": [{ "internalType": "address", "name": "_usdc", "type": "address" }, { "internalType": "address", "name": "_feeRecipient", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "BASIS_POINTS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "MAX_FEE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "feeRecipient", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "platformFee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "usdc", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "invoiceCounter", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "invoices", "outputs": [{ "internalType": "address", "name": "payer", "type": "address" }, { "internalType": "address", "name": "payee", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "uint8", "name": "status", "type": "uint8" }, { "internalType": "uint256", "name": "createdAt", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getInvoices", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_payee", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "string", "name": "_description", "type": "string" }], "name": "createInvoice", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "fundInvoice", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "confirmComplete", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "release", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "refund", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "dispute", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "bool", "name": "releaseToPayee", "type": "bool" }], "name": "resolveDispute", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_newFee", "type": "uint256" }], "name": "setFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_newRecipient", "type": "address" }], "name": "setFeeRecipient", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }], "name": "userInvoices", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getInvoiceCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "payer", "type": "address" }, { "indexed": true, "internalType": "address", "name": "payee", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "description", "type": "string" }], "name": "InvoiceCreated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "InvoiceFunded", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "InvoiceCompleted", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }], "name": "InvoiceReleased", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "InvoiceRefunded", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "InvoiceDisputed", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "oldFee", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newFee", "type": "uint256" }], "name": "FeeUpdated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "oldRecipient", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newRecipient", "type": "address" }], "name": "FeeRecipientUpdated", "type": "event" }
];

const USDC_ABI = [
  { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" }
];

const STATUS_NAMES = ["Created", "Funded", "Completed", "Released", "Refunded", "Disputed"];

let provider, walletClient, publicClient, account, chainId;

async function switchToBaseSepolia() {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x14A34" }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x14A34",
          chainName: "Base Sepolia",
          rpcUrls: ["https://sepolia.base.org"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://sepolia.basescan.org"],
        }],
      });
    } else {
      throw e;
    }
  }
}

async function connect() {
  if (!isAddress(PAYGUARD_ADDRESS || "")) return alert("Configure a verified contract address in config.js first.");
  if (!window.ethereum) return alert("Install MetaMask");
  provider = window.ethereum;

  const [addr] = await provider.request({ method: "eth_requestAccounts" });
  account = addr;
  chainId = await provider.request({ method: "eth_chainId" });

  walletClient = createWalletClient({ chain: baseSepolia, transport: custom(provider) });
  publicClient = createPublicClient({ chain: baseSepolia, transport: custom(provider) });

  if (parseInt(chainId) !== BASE_SEPOLIA_CHAIN_ID) {
    await switchToBaseSepolia();
    chainId = await provider.request({ method: "eth_chainId" });
  }

  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("account").textContent = `Connected: ${shorten(account)}`;

  if (!await publicClient.getCode({ address: PAYGUARD_ADDRESS })) throw new Error("No contract at configured address");
  const token = await publicClient.readContract({ address: PAYGUARD_ADDRESS, abi: PAYGUARD_ABI, functionName: "usdc" });
  if (token.toLowerCase() !== USDC_ADDRESS.toLowerCase()) throw new Error("Contract token does not match configured USDC");
  await Promise.all([loadInvoices(), updateBalances()]);
  provider.on?.("accountsChanged", () => window.location.reload());
  provider.on?.("chainChanged", () => window.location.reload());
}

function shorten(a) { return a.slice(0, 6) + "..." + a.slice(-4); }
function toUSDC(amount) { return parseUSDC(amount); }
function fromUSDC(amount) { return formatUSDC(amount); }
function tsToDate(ts) { return new Date(Number(ts) * 1000).toLocaleString(); }

async function createInvoice() {
  const payee = document.getElementById("payee").value;
  const amount = document.getElementById("amount").value;
  const deadlineDays = parseInt(document.getElementById("deadline").value);
  const desc = document.getElementById("desc").value;
  if (!payee || !amount || !deadlineDays || !desc) return alert("Fill all fields");

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 86400);
  try {
    if (!isAddress(payee) || payee.toLowerCase() === account.toLowerCase()) throw new Error("Use a valid payee different from payer");
    const amt = toUSDC(amount);
    if (amt <= 0n) throw new Error("Amount must be positive");
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "createInvoice",
      args: [payee, amt, deadline, desc],
      account,
    });
    await waitForSuccess(tx);
    alert("Invoice created!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function fundInvoice(id) {
  // First approve USDC
  try {
    const inv = await readInvoice(id);
    const amount = inv.amount;
    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [PAYGUARD_ADDRESS, amount],
      account,
    });
    await waitForSuccess(approveTx);

    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "fundInvoice",
      args: [BigInt(id)],
      account,
    });
    await waitForSuccess(tx);
    alert("Invoice funded!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function confirmComplete(id) {
  try {
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "confirmComplete",
      args: [BigInt(id)],
      account,
    });
    await waitForSuccess(tx);
    alert("Marked as complete!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function release(id) {
  try {
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "release",
      args: [BigInt(id)],
      account,
    });
    await waitForSuccess(tx);
    alert("Funds released!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function refund(id) {
  try {
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "refund",
      args: [BigInt(id)],
      account,
    });
    await waitForSuccess(tx);
    alert("Invoice refunded!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function disputeInvoice(id) {
  try {
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "dispute",
      args: [BigInt(id)],
      account,
    });
    await waitForSuccess(tx);
    alert("Invoice disputed!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function readInvoice(id) {
  return normalizeInvoice(await publicClient.readContract({
    address: PAYGUARD_ADDRESS,
    abi: PAYGUARD_ABI,
    functionName: "invoices",
    args: [BigInt(id)],
  }));
}

async function loadInvoices() {
  const ids = await publicClient.readContract({
    address: PAYGUARD_ADDRESS,
    abi: PAYGUARD_ABI,
    functionName: "getInvoices",
    args: [account],
  });

  const tbody = document.getElementById("invoiceList");
  tbody.innerHTML = "";

  for (const rawId of new Set(ids)) {
    const id = String(rawId);
    const inv = await readInvoice(id);
    const status = STATUS_NAMES[Number(inv.status)] || "Unknown";
    const row = document.createElement("tr");
    for (const text of [id, shorten(inv.payer), shorten(inv.payee), `${fromUSDC(inv.amount)} USDC`, tsToDate(inv.deadline), inv.description, status]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    }
    const actions = document.createElement("td");
    const payer = inv.payer.toLowerCase() === account.toLowerCase();
    const payee = inv.payee.toLowerCase() === account.toLowerCase();
    const expired = BigInt(Math.floor(Date.now() / 1000)) >= inv.deadline;
    function button(label, handler) {
      const el = document.createElement("button");
      el.className = "btn btn-sm btn-primary me-1";
      el.textContent = label;
      el.addEventListener("click", () => handler(id));
      actions.appendChild(el);
    }
    if (status === "Created" && payer && !expired) button("Fund", fundInvoice);
    if (status === "Funded" && payer) button("Accept work", confirmComplete);
    if (status === "Completed" && payee) button("Release", release);
    if (["Funded", "Completed"].includes(status) && payer) button("Dispute", disputeInvoice);
    if (status === "Funded" && payer && expired) button("Refund", refund);
    row.appendChild(actions);
    tbody.appendChild(row);
  }
}

async function updateBalances() {
  const usdcBal = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [account],
  });
  document.getElementById("usdcBalance").textContent =
    `USDC: ${fromUSDC(usdcBal)}`;
}

async function waitForSuccess(hash) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction reverted");
  return receipt;
}
Object.assign(window, { connect: () => connect().catch(error => alert(error.message)), createInvoice });
