const S = new Uint32Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]);

// T[i] = floor(abs(sin(i+1)) * 2^32)
const T = (() => {
    const out = new Uint32Array(64);
    for (let i = 0; i < 64; i++) out[i] = (Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
    return out;
})();

function rotl(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function readLE32(bytes: Uint8Array, off: number): number {
    if (off < 0 || off + 3 >= bytes.length) {
        throw new RangeError(`readLE32 out of range: off=${off}, len=${bytes.length}`);
    }

    const b0 = bytes[off];
    const b1 = bytes[off + 1];
    const b2 = bytes[off + 2];
    const b3 = bytes[off + 3];

    if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
        throw new RangeError("Unexpected OOB");
    }

    return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
}

function writeLE32(out: Uint8Array, off: number, x: number) {
    out[off] = x & 0xff;
    out[off + 1] = (x >>> 8) & 0xff;
    out[off + 2] = (x >>> 16) & 0xff;
    out[off + 3] = (x >>> 24) & 0xff;
}

function toHex(bytes: Uint8Array): string {
    let s = "";
    for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b === undefined) throw new RangeError("Unexpected OOB in toHex");
        s += b.toString(16).padStart(2, "0");
    }
    return s;
}

export class MD5 {
    private a = 0x67452301;
    private b = 0xefcdab89;
    private c = 0x98badcfe;
    private d = 0x10325476;

    private buf = new Uint8Array(64);
    private bufLen = 0;

    private totalBits: bigint = 0n;

    update(chunk: Uint8Array): this {
        this.totalBits += BigInt(chunk.length) * 8n;

        let i = 0;
        while (i < chunk.length) {
            const space = 64 - this.bufLen;
            const take = Math.min(space, chunk.length - i);
            this.buf.set(chunk.subarray(i, i + take), this.bufLen);
            this.bufLen += take;
            i += take;

            if (this.bufLen === 64) {
                this.processBlock(this.buf);
                this.bufLen = 0;
            }
        }
        return this;
    }

    private updateRaw(chunk: Uint8Array): void {
        let i = 0;
        while (i < chunk.length) {
            const space = 64 - this.bufLen;
            const take = Math.min(space, chunk.length - i);
            this.buf.set(chunk.subarray(i, i + take), this.bufLen);
            this.bufLen += take;
            i += take;

            if (this.bufLen === 64) {
                this.processBlock(this.buf);
                this.bufLen = 0;
            }
        }
    }

    digestBytes(): Uint8Array {
        const mod = this.bufLen % 64;
        const padLen = mod < 56 ? (56 - mod) : (56 + 64 - mod);

        const padding = new Uint8Array(padLen + 8);
        padding[0] = 0x80;

        const bitLen = this.totalBits;
        for (let i = 0; i < 8; i++) {
            padding[padLen + i] = Number((bitLen >> BigInt(8 * i)) & 0xffn);
        }

        this.updateRaw(padding);

        const out = new Uint8Array(16);
        writeLE32(out, 0, this.a);
        writeLE32(out, 4, this.b);
        writeLE32(out, 8, this.c);
        writeLE32(out, 12, this.d);
        return out;
    }

    digestHex(): string {
        return toHex(this.digestBytes());
    }

    private processBlock(block: Uint8Array) {
        const X = new Uint32Array(16);
        for (let i = 0; i < 16; i++) X[i] = readLE32(block, i * 4);

        let A = this.a, B = this.b, C = this.c, D = this.d;

        for (let i = 0; i < 64; i++) {
            let Fv: number;
            let g: number;

            if (i < 16) {
                Fv = (B & C) | (~B & D);
                g = i;
            } else if (i < 32) {
                Fv = (D & B) | (~D & C);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                Fv = B ^ C ^ D;
                g = (3 * i + 5) % 16;
            } else {
                Fv = C ^ (B | ~D);
                g = (7 * i) % 16;
            }

            const Ti = T[i];
            const Si = S[i];
            const Xg = X[g];

            if (Ti === undefined || Si === undefined || Xg === undefined) {
                throw new RangeError(`Index out of range: i=${i}, g=${g}`);
            }

            const tmp = (Fv + A + Ti + Xg) >>> 0;
            A = D;
            D = C;
            C = B;
            B = (B + rotl(tmp, Si)) >>> 0;
        }

        this.a = (this.a + A) >>> 0;
        this.b = (this.b + B) >>> 0;
        this.c = (this.c + C) >>> 0;
        this.d = (this.d + D) >>> 0;
    }
}

export function md5Hex(input: string | Uint8Array): string {
    const md5 = new MD5();
    if (typeof input === "string") md5.update(new TextEncoder().encode(input));
    else md5.update(input);
    return md5.digestHex();
}
