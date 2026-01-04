import {
    constants,
    createCipheriv,
    createDecipheriv,
    privateDecrypt,
    publicEncrypt,
    randomBytes,
    type CipherGCM,
    type DecipherGCM,
} from 'node:crypto'
import { Transform, type TransformCallback } from 'node:stream'

const MAGIC = Buffer.from('RSA_AES_GCM_V1')
const AES_KEY_LEN = 32
const IV_LEN = 12
const TAG_LEN = 16

function u16be(n: number): Buffer {
    const b = Buffer.alloc(2)
    b.writeUInt16BE(n & 0xffff, 0)
    return b
}

function readU16be(buf: Buffer, off: number): number {
    if (off + 2 > buf.length) throw new Error('Bad header: u16 out of range')
    return buf.readUInt16BE(off)
}

export class RsaAesEncryptStream extends Transform {
    private headerDone = false
    private cipher: CipherGCM | null = null

    constructor(private readonly publicKeyPem: string) {
        super()
    }

    private pushHeaderOnce() {
        if (this.headerDone) return
        this.headerDone = true

        const aesKey = randomBytes(AES_KEY_LEN)
        const iv = randomBytes(IV_LEN)

        const packed = Buffer.concat([aesKey, iv])

        const encryptedKey = publicEncrypt(
            {
                key: this.publicKeyPem,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            packed
        )

        this.cipher = createCipheriv('aes-256-gcm', aesKey, iv)

        this.push(MAGIC)
        this.push(u16be(encryptedKey.length))
        this.push(encryptedKey)
    }

    override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
        try {
            this.pushHeaderOnce()
            const cipher = this.cipher
            if (!cipher) return cb(new Error('Internal: cipher not initialized'))

            const out = cipher.update(chunk)
            if (out.length) this.push(out)
            cb()
        } catch (e) {
            cb(e as Error)
        }
    }

    override _flush(cb: TransformCallback): void {
        const cipher = this.cipher
        if (!this.headerDone || !cipher) return cb(new Error('Internal: cipher not initialized'))

        try {
            const fin = cipher.final()
            if (fin.length) this.push(fin)

            const tag = cipher.getAuthTag()
            if (tag.length !== TAG_LEN) return cb(new Error('Bad GCM tag length'))
            this.push(tag)

            cb()
        } catch (e) {
            cb(e as Error)
        }
    }
}

export class RsaAesDecryptStream extends Transform {
    private buf: Buffer = Buffer.alloc(0)
    private haveHeader = false

    private decipher: DecipherGCM | null = null
    private tail: Buffer = Buffer.alloc(0)

    constructor(private readonly privateKeyPem: string) {
        super()
    }

    private tryParseHeader(): void {
        if (this.haveHeader) return

        if (this.buf.length < MAGIC.length + 2) return

        const magic = this.buf.subarray(0, MAGIC.length)
        if (!magic.equals(MAGIC)) throw new Error('Bad header: magic mismatch')

        const ekLen = readU16be(this.buf, MAGIC.length)
        const need = MAGIC.length + 2 + ekLen
        if (this.buf.length < need) return

        const encryptedKey = this.buf.subarray(MAGIC.length + 2, need)
        this.buf = this.buf.subarray(need)

        const packed = privateDecrypt(
            {
                key: this.privateKeyPem,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            encryptedKey
        )

        if (packed.length !== AES_KEY_LEN + IV_LEN) {
            throw new Error('Bad header: decrypted key/iv length mismatch')
        }

        const aesKey = packed.subarray(0, AES_KEY_LEN)
        const iv = packed.subarray(AES_KEY_LEN, AES_KEY_LEN + IV_LEN)

        this.decipher = createDecipheriv('aes-256-gcm', aesKey, iv)
        this.haveHeader = true
    }

    private pushKeepingTag(data: Buffer) {
        const combined = this.tail.length ? Buffer.concat([this.tail, data]) : data

        if (combined.length <= TAG_LEN) {
            this.tail = combined
            return
        }

        const body = combined.subarray(0, combined.length - TAG_LEN)
        this.tail = combined.subarray(combined.length - TAG_LEN)

        const decipher = this.decipher
        if (!decipher) throw new Error('Internal: decipher not initialized')

        const out = decipher.update(body)
        if (out.length) this.push(out)
    }

    override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
        try {
            this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk

            this.tryParseHeader()
            if (!this.haveHeader) return cb()

            if (this.buf.length) {
                this.pushKeepingTag(this.buf)
                this.buf = Buffer.alloc(0)
            }

            cb()
        } catch (e) {
            cb(e as Error)
        }
    }

    override _flush(cb: TransformCallback): void {
        const decipher = this.decipher
        if (!this.haveHeader || !decipher) return cb(new Error('No header / decipher not initialized'))
        if (this.buf.length) return cb(new Error('Internal: leftover buffer after header parsing'))
        if (this.tail.length !== TAG_LEN) return cb(new Error('Bad GCM tag (missing or wrong length)'))

        try {
            decipher.setAuthTag(this.tail)

            const fin = decipher.final()
            if (fin.length) this.push(fin)

            cb()
        } catch (e) {
            cb(e as Error)
        }
    }
}
