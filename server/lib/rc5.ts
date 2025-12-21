import { RC5_VARIANT } from './variant'
import { md5Hex } from './md5'
import { lehmerNext } from './lcg'

const MASK_64 = (1n << 64n) - 1n

function add64(a: bigint, b: bigint) { return (a + b) & MASK_64 }
function sub64(a: bigint, b: bigint) { return (a - b) & MASK_64 }
function xor64(a: bigint, b: bigint) { return (a ^ b) & MASK_64 }

function rotl64(x: bigint, s: bigint) {
    const r = s & 63n
    return ((x << r) | (x >> (64n - r))) & MASK_64
}
function rotr64(x: bigint, s: bigint) {
    const r = s & 63n
    return ((x >> r) | (x << (64n - r))) & MASK_64
}

function readLE64(block: Uint8Array, off: number): bigint {
    let x = 0n
    for (let i = 0; i < 8; i++) {
        const b = block[off + i] ?? 0
        x |= BigInt(b) << BigInt(8 * i)
    }
    return x
}
function writeLE64(dst: Uint8Array, off: number, x: bigint) {
    for (let i = 0; i < 8; i++) dst[off + i] = Number((x >> BigInt(8 * i)) & 0xffn)
}

export type RC5Key = { S: bigint[]; r: number }

const Pw = 0xB7E151628AED2A6Bn
const Qw = 0x9E3779B97F4A7C15n

export function keyFromPassphrase(passphrase: string): Uint8Array {
    const hex = md5Hex(passphrase).trim()
    if (!/^[0-9a-fA-F]{32}$/.test(hex)) throw new Error('Invalid MD5 hex (expected 32 hex chars)')

    const out = new Uint8Array(16)
    for (let i = 0; i < 16; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    return out
}

export function rc5KeySchedule64(keyBytes: Uint8Array, r = RC5_VARIANT.r): RC5Key {
    const w = 64
    const u = w / 8
    const b = keyBytes.length
    const c = Math.max(1, Math.ceil(b / u))

    const L = new Array<bigint>(c).fill(0n)
    for (let i = b - 1; i >= 0; i--) {
        const li = Math.floor(i / u)
        const byte = keyBytes[i] ?? 0
        L[li] = (((L[li] ?? 0n) << 8n) + BigInt(byte)) & MASK_64
    }

    const t = 2 * r + 2
    const S = new Array<bigint>(t)
    S[0] = Pw
    for (let i = 1; i < t; i++) S[i] = add64(S[i - 1] ?? 0n, Qw)

    let A = 0n, B = 0n
    let i = 0, j = 0
    const n = 3 * Math.max(t, c)

    for (let s = 0; s < n; s++) {
        const Si = S[i] ?? 0n
        const Lj = L[j] ?? 0n
        A = S[i] = rotl64(add64(add64(Si, A), B), 3n)
        B = L[j] = rotl64(add64(add64(Lj, A), B), (A + B) & 63n)
        i = (i + 1) % t
        j = (j + 1) % c
    }

    return { S, r }
}

export function rc5EncryptBlock64(key: RC5Key, block16: Uint8Array): Uint8Array {
    const { S, r } = key
    let A = readLE64(block16, 0)
    let B = readLE64(block16, 8)

    A = add64(A, S[0] ?? 0n)
    B = add64(B, S[1] ?? 0n)

    for (let i = 1; i <= r; i++) {
        A = add64(rotl64(xor64(A, B), B), S[2 * i] ?? 0n)
        B = add64(rotl64(xor64(B, A), A), S[2 * i + 1] ?? 0n)
    }

    const out = new Uint8Array(16)
    writeLE64(out, 0, A)
    writeLE64(out, 8, B)
    return out
}

export function rc5DecryptBlock64(key: RC5Key, block16: Uint8Array): Uint8Array {
    const { S, r } = key
    let A = readLE64(block16, 0)
    let B = readLE64(block16, 8)

    for (let i = r; i >= 1; i--) {
        B = xor64(rotr64(sub64(B, S[2 * i + 1] ?? 0n), A), A)
        A = xor64(rotr64(sub64(A, S[2 * i] ?? 0n), B), B)
    }

    B = sub64(B, S[1] ?? 0n)
    A = sub64(A, S[0] ?? 0n)

    const out = new Uint8Array(16)
    writeLE64(out, 0, A)
    writeLE64(out, 8, B)
    return out
}

export function xorBlock16(a: Uint8Array, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(16)
    for (let i = 0; i < 16; i++) out[i] = (a[i] ?? 0) ^ (b[i] ?? 0)
    return out
}

export function pad16(buf: Uint8Array): Uint8Array {
    const block = 16
    const rem = buf.length % block
    const padLen = rem === 0 ? block : block - rem

    const out = new Uint8Array(buf.length + padLen)
    out.set(buf)
    out.fill(padLen, buf.length)
    return out
}

export function unpad16(buf: Uint8Array): Uint8Array {
    if (buf.length === 0 || buf.length % 16 !== 0) throw new Error('Invalid padded plaintext length')
    const padLen = buf[buf.length - 1] ?? 0
    if (padLen < 1 || padLen > 16) throw new Error('Invalid padding length')

    for (let i = buf.length - padLen; i < buf.length; i++) {
        if ((buf[i] ?? 0) !== padLen) throw new Error('Invalid padding bytes')
    }
    return buf.subarray(0, buf.length - padLen)
}

export function iv16fromLehmer(seed0?: number): Uint8Array {
    let x = (seed0 ?? (Date.now() & 0x7fffffff)) >>> 0
    if (x === 0) x = 1

    const iv = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
        x = lehmerNext(x) >>> 0
        iv[i] = x & 0xff
    }
    return iv
}
