import { Transform, type TransformCallback } from 'node:stream'
import type { RC5Key } from './rc5'
import { pad16, rc5DecryptBlock64, rc5EncryptBlock64, unpad16, xorBlock16 } from './rc5'

const BLOCK = 16

export class Rc5CbcPadEncryptStream extends Transform {
    private buf: Buffer = Buffer.alloc(0)
    private prevC: Uint8Array
    private headerDone = false

    constructor(private readonly key: RC5Key, iv16: Uint8Array) {
        super()
        this.prevC = Uint8Array.from(iv16)
    }

    private pushHeaderOnce() {
        if (this.headerDone) return
        this.headerDone = true
        const encIv = rc5EncryptBlock64(this.key, this.prevC)
        this.push(Buffer.from(encIv))
    }

    override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
        this.pushHeaderOnce()

        this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk

        while (this.buf.length >= BLOCK) {
            const block = this.buf.subarray(0, BLOCK)
            this.buf = this.buf.subarray(BLOCK)

            const x = xorBlock16(block, this.prevC)
            const c = rc5EncryptBlock64(this.key, x)
            this.push(Buffer.from(c))
            this.prevC = c
        }

        cb()
    }

    override _flush(cb: TransformCallback): void {
        this.pushHeaderOnce()

        const padded = pad16(this.buf)
        for (let off = 0; off < padded.length; off += BLOCK) {
            const block = padded.subarray(off, off + BLOCK)
            const x = xorBlock16(block, this.prevC)
            const c = rc5EncryptBlock64(this.key, x)
            this.push(Buffer.from(c))
            this.prevC = c
        }

        cb()
    }
}

export class Rc5CbcPadDecryptStream extends Transform {
    private buf: Buffer = Buffer.alloc(0)
    private haveHeader = false
    private prevC: Uint8Array | null = null
    private pendingPlain: Uint8Array | null = null

    constructor(private readonly key: RC5Key) {
        super()
    }

    override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
        this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk

        if (!this.haveHeader) {
            if (this.buf.length < BLOCK) return cb()
            const encIv = this.buf.subarray(0, BLOCK)
            this.buf = this.buf.subarray(BLOCK)

            this.prevC = rc5DecryptBlock64(this.key, encIv)
            this.haveHeader = true
        }

        while (this.buf.length >= BLOCK) {
            const c = this.buf.subarray(0, BLOCK)
            this.buf = this.buf.subarray(BLOCK)

            const dec = rc5DecryptBlock64(this.key, c)
            const prev = this.prevC
            if (!prev) return cb(new Error('Internal: missing IV'))

            const p = xorBlock16(dec, prev)
            this.prevC = new Uint8Array(c)

            if (this.pendingPlain) this.push(Buffer.from(this.pendingPlain))
            this.pendingPlain = p
        }

        cb()
    }

    override _flush(cb: TransformCallback): void {
        if (!this.haveHeader) return cb(new Error('Empty ciphertext (no header)'))
        if (this.buf.length !== 0) return cb(new Error('Ciphertext is not aligned to block size'))
        if (!this.pendingPlain) return cb(new Error('No ciphertext blocks after header'))

        let last: Uint8Array
        try {
            last = unpad16(this.pendingPlain)
        } catch (e) {
            return cb(e as Error)
        }

        this.push(Buffer.from(last))
        cb()
    }
}
