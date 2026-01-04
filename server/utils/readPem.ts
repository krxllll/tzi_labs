import { readFile } from 'node:fs/promises'

function looksLikePem(s: string) {
    return /-----BEGIN [^-]+-----/.test(s)
}

export async function readPemFromStringOrFile(input: string): Promise<string> {
    const v = (input ?? '').trim()
    if (!v) throw new Error('Missing PEM input')

    if (looksLikePem(v)) return v

    const buf = await readFile(v)
    return buf.toString('utf8')
}
