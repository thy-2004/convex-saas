export function generateKey(prefix: string) {
  const rand = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}_${rand.slice(0, 32)}`;
}
