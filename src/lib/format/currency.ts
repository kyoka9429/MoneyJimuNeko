// PROJECTSPEC §10: 千円区切り・円通貨。負値は括弧表記。
// 色装飾（赤）は呼び出し側で `amount < 0` を見て付与する責務分離。

const yenFormatter = new Intl.NumberFormat('ja-JP');

export function formatYen(amount: number): string {
  if (!Number.isFinite(amount)) return '¥-';
  const abs = Math.abs(Math.trunc(amount));
  const body = `¥${yenFormatter.format(abs)}`;
  return amount < 0 ? `(${body})` : body;
}

export function isNegativeAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount < 0;
}
