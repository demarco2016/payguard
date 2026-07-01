const PAYGUARD_ADDRESS = "0x9f32910e811f239d2c8cd808901f5a0d786122aa";
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
  if (!window.ethereum) return alert("Install MetaMask");
  provider = window.ethereum;

  const [addr] = await provider.request({ method: "eth_requestAccounts" });
  account = addr;
  chainId = await provider.request({ method: "eth_chainId" });

  walletClient = await createWalletClientFromProvider(provider);
  publicClient = createPublicClient({ transport: custom(provider) });

  if (parseInt(chainId) !== BASE_SEPOLIA_CHAIN_ID) {
    await switchToBaseSepolia();
    chainId = await provider.request({ method: "eth_chainId" });
  }

  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("account").textContent = `Connected: ${shorten(account)}`;

  loadInvoices();
  updateBalances();
}

function shorten(a) { return a.slice(0, 6) + "..." + a.slice(-4); }
function toUSDC(amount) { return BigInt(Math.round(amount * 1e6)); }
function fromUSDC(amount) { return Number(amount) / 1e6; }
function tsToDate(ts) { return new Date(Number(ts) * 1000).toLocaleString(); }

async function createInvoice() {
  const payee = document.getElementById("payee").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const deadlineDays = parseInt(document.getElementById("deadline").value);
  const desc = document.getElementById("desc").value;
  if (!payee || !amount || !deadlineDays || !desc) return alert("Fill all fields");

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 86400);
  const amt = toUSDC(amount);

  try {
    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "createInvoice",
      args: [payee, amt, deadline, desc],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    alert("Invoice created!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function fundInvoice(id) {
  // First approve USDC
  const inv = await readInvoice(id);
  const amount = inv.amount;
  try {
    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [PAYGUARD_ADDRESS, amount],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    const tx = await walletClient.writeContract({
      address: PAYGUARD_ADDRESS,
      abi: PAYGUARD_ABI,
      functionName: "fundInvoice",
      args: [BigInt(id)],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
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
    await publicClient.waitForTransactionReceipt({ hash: tx });
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
    await publicClient.waitForTransactionReceipt({ hash: tx });
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
    await publicClient.waitForTransactionReceipt({ hash: tx });
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
    await publicClient.waitForTransactionReceipt({ hash: tx });
    alert("Invoice disputed!");
    loadInvoices();
  } catch (e) { alert(e.message); }
}

async function readInvoice(id) {
  return await publicClient.readContract({
    address: PAYGUARD_ADDRESS,
    abi: PAYGUARD_ABI,
    functionName: "invoices",
    args: [BigInt(id)],
  });
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

  for (const rawId of ids) {
    const id = Number(rawId);
    const inv = await readInvoice(id);
    const status = STATUS_NAMES[Number(inv.status)];

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${id}</td>
      <td>${shorten(inv.payer)}</td>
      <td>${shorten(inv.payee)}</td>
      <td>${fromUSDC(inv.amount).toFixed(2)} USDC</td>
      <td>${tsToDate(inv.deadline)}</td>
      <td>${inv.description}</td>
      <td><span class="badge ${status.toLowerCase()}">${status}</span></td>
      <td class="actions">
        ${status === "Created" && inv.payer.toLowerCase() === account.toLowerCase()
          ? `<button onclick="fundInvoice(${id})" class="btn btn-sm btn-primary">Fund</button>` : ""}
        ${status === "Funded" && inv.payee.toLowerCase() === account.toLowerCase()
          ? `<button onclick="confirmComplete(${id})" class="btn btn-sm btn-success">Complete</button>` : ""}
        ${status === "Completed" && inv.payee.toLowerCase() === account.toLowerCase()
          ? `<button onclick="release(${id})" class="btn btn-sm btn-success">Release</button>` : ""}
        ${(status === "Funded" && inv.payer.toLowerCase() === account.toLowerCase())
          ? `<button onclick="disputeInvoice(${id})" class="btn btn-sm btn-warning">Dispute</button>` : ""}
        ${(status === "Funded" && Number(inv.deadline) * 1000 < Date.now())
          ? `<button onclick="refund(${id})" class="btn btn-sm btn-danger">Refund</button>` : ""}
        ${status === "Created" && inv.payer.toLowerCase() === account.toLowerCase()
          ? `<span class="text-muted small">Fund to activate</span>` : ""}
      </td>
    `;
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
    `USDC: ${fromUSDC(usdcBal).toFixed(2)}`;
}
