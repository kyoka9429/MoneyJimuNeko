#!/usr/bin/env node
// パスワードを PBKDF2-SHA256 で 100,000 回ストレッチしてハッシュ + salt を吐く CLI。
// 出力をそのまま GitHub Actions の Repository Secrets に貼り付ける想定。
//
// 使い方:
//   pnpm hash-password "ねこの合言葉"
//
// 出力例:
//   NEXT_PUBLIC_AUTH_HASH=<64 文字の hex>
//   NEXT_PUBLIC_AUTH_SALT=<32 文字の hex>
//
// 注意: 平文パスワードは echo / シェル履歴 / プロセスリストに残るので、
// 公開環境では shell history の disable や zsh のスペース prefix を活用すること。

import { webcrypto } from 'node:crypto';

const ITERATIONS = 100_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const password = process.argv[2];
if (!password) {
  console.error('Usage: pnpm hash-password "<password>"');
  process.exit(1);
}

const salt = new Uint8Array(SALT_BYTES);
webcrypto.getRandomValues(salt);

const keyMaterial = await webcrypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits'],
);

const bits = await webcrypto.subtle.deriveBits(
  {
    name: 'PBKDF2',
    salt,
    iterations: ITERATIONS,
    hash: 'SHA-256',
  },
  keyMaterial,
  KEY_BITS,
);

const hashHex = bytesToHex(new Uint8Array(bits));
const saltHex = bytesToHex(salt);

console.log('# 以下を .env.local または GitHub Actions Secrets に設定してください');
console.log(`NEXT_PUBLIC_AUTH_HASH=${hashHex}`);
console.log(`NEXT_PUBLIC_AUTH_SALT=${saltHex}`);
