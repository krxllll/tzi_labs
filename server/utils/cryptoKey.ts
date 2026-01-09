export async function streamToString(s: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        s.on('data', (c) => chunks.push(Buffer.from(c)))
        s.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        s.on('error', reject)
    })
}

export async function readKeyFromMultipart(
    files: Record<string, { file: NodeJS.ReadableStream; filename: string }>,
    fields: Record<string, string>,
    fieldName: 'privateKey' | 'publicKey'
): Promise<{ pem: string; source: 'file' | 'text' }> {
    const keyFile = files.key
    if (keyFile) {
        const pem = (await streamToString(keyFile.file)).trim()
        if (!pem) throw createError({ statusCode: 400, statusMessage: 'Empty key file' })
        return { pem, source: 'file' }
    }

    const pem = (fields[fieldName] ?? '').trim()
    if (!pem) {
        throw createError({
            statusCode: 400,
            statusMessage: `Provide key as file (field "key") or text (field "${fieldName}")`,
        })
    }
    return { pem, source: 'text' }
}
