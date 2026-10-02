export function parseUSDC(value) {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(value)) throw new Error("Enter a decimal amount with at most six decimal places");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
}
export function formatUSDC(value) {
  const units = BigInt(value);
  return `${units / 1000000n}.${String(units % 1000000n).padStart(6, "0")}`;
}
export function normalizeInvoice(tuple) {
  const [payer, payee, amount, deadline, description, status, createdAt] = tuple;
  return { payer, payee, amount, deadline, description, status, createdAt };
}
