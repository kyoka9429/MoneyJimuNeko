// クライアントサイドのパスワードガード。
// ソース閲覧で平文パスワードが読めないように、ビルド時に PBKDF2-SHA256 で
// 100,000 回ストレッチしたハッシュ値だけをバンドルに焼き込む。
// 実行時に入力を同じ手順でハッシュ化して比較する。
//
// 注意: クライアントサイドの認証は本質的に「決意ある攻撃者」を止められない。
// この実装は「一般ユーザーを弾く」目的の古典的ガードであり、
// 機密データを守る本物の認証層ではない。サーバー保護は v0.3 で Supabase Auth に委ねる。

export const PBKDF2_ITERATIONS = 100_000;
export const PBKDF2_KEY_BITS = 256;
export const PBKDF2_HASH = 'SHA-256';

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('hex string length must be even');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(
  password: string,
  saltHex: string,
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex).buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    PBKDF2_KEY_BITS,
  );
  return bytesToHex(new Uint8Array(bits));
}

// 文字列比較は理論上タイミング攻撃の対象だが、ハッシュ値は固定長で
// 入力ごとに値がランダムになるため、攻撃者が情報を得られる現実的経路はない。
// 念のため定数時間に近い比較を実装。
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPassword(
  input: string,
  expectedHashHex: string,
  saltHex: string,
): Promise<boolean> {
  if (!expectedHashHex || !saltHex) return false;
  const inputHash = await hashPassword(input, saltHex);
  return constantTimeEqual(inputHash, expectedHashHex);
}

// ビルド時に焼き込まれる env vars を読み取る薄いヘルパ。
// 未設定（=ローカル開発の素の状態）なら認証スキップ判定に使う。
export function getConfiguredAuth(): {
  hash: string | undefined;
  salt: string | undefined;
} {
  return {
    hash: process.env.NEXT_PUBLIC_AUTH_HASH,
    salt: process.env.NEXT_PUBLIC_AUTH_SALT,
  };
}

export function isAuthConfigured(): boolean {
  const { hash, salt } = getConfiguredAuth();
  return Boolean(hash && salt);
}
