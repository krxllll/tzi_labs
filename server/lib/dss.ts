import crypto from 'node:crypto'

export type DssKeyPairPem = {
    publicKeyPem: string
    privateKeyPem: string
}

export function generateDssKeys(): DssKeyPairPem {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('dsa', {
        modulusLength: 2048,
        divisorLength: 256,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    return { publicKeyPem: publicKey, privateKeyPem: privateKey }
}

export function toHex(buf: Buffer): string {
    return buf.toString('hex')
}

export function fromHex(hex: string): Buffer {
    const cleaned = (hex ?? '')
        .trim()
        .replace(/^0x/i, '')
        .replace(/\s+/g, '')

    if (!cleaned) throw new Error('Empty signature')
    if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
        throw new Error('Invalid hex signature')
    }
    return Buffer.from(cleaned, 'hex')
}

export function signStreamDssSha1(stream: NodeJS.ReadableStream, privateKeyPem: string) {
    const signer = crypto.createSign('sha1')
    let sizeBytes = 0

    return new Promise<{ signatureDer: Buffer; sizeBytes: number }>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
            sizeBytes += chunk.length
            signer.update(chunk)
        })
        stream.on('error', reject)
        stream.on('end', () => {
            try {
                const signatureDer = signer.sign({ key: privateKeyPem, dsaEncoding: 'der' })
                resolve({ signatureDer, sizeBytes })
            } catch (e) {
                reject(e as Error)
            }
        })
    })
}

export function verifyStreamDssSha1(
    stream: NodeJS.ReadableStream,
    signatureDer: Buffer,
    publicKeyPem: string
) {
    const verifier = crypto.createVerify('sha1')
    let sizeBytes = 0

    return new Promise<{ ok: boolean; sizeBytes: number }>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
            sizeBytes += chunk.length
            verifier.update(chunk)
        })
        stream.on('error', reject)
        stream.on('end', () => {
            try {
                const ok = verifier.verify(publicKeyPem, signatureDer)
                resolve({ ok, sizeBytes })
            } catch (e) {
                reject(e as Error)
            }
        })
    })
}

export function signTextDssSha1(text: string, privateKeyPem: string): Buffer {
    return crypto.sign('sha1', Buffer.from(text ?? '', 'utf8'), {
        key: privateKeyPem,
        dsaEncoding: 'der',
    })
}

export function verifyTextDssSha1(text: string, signatureDer: Buffer, publicKeyPem: string): boolean {
    return crypto.verify('sha1', Buffer.from(text ?? '', 'utf8'), publicKeyPem, signatureDer)
}
