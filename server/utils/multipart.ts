import Busboy from 'busboy'
import type { IncomingMessage } from 'node:http'
import { PassThrough } from 'node:stream'

export type MultipartFile = {
    fieldName: string
    file: NodeJS.ReadableStream
    filename: string
    mimeType: string
}

type OptionsFiles<T> = {
    requiredFields?: string[]
    requiredFiles: string[]
    start: (args: { files: Record<string, MultipartFile>; fields: Record<string, string> }) => Promise<T>
}

export async function runMultipartFiles<T>(req: IncomingMessage, options: OptionsFiles<T>): Promise<T> {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data')) {
        throw createError({ statusCode: 400, statusMessage: 'Expected multipart/form-data' })
    }

    const requiredFields = options.requiredFields ?? []
    const requiredFiles = options.requiredFiles
    if (!Array.isArray(requiredFiles) || requiredFiles.length === 0) {
        throw createError({ statusCode: 500, statusMessage: 'Internal error: requiredFiles must be non-empty' })
    }

    const fields: Record<string, string> = {}
    const files: Record<string, MultipartFile> = {}

    let resultPromise: Promise<T> | null = null

    const haveRequiredFields = () => requiredFields.every((k) => (fields[k] ?? '') !== '')
    const haveRequiredFiles = () => requiredFiles.every((k) => Boolean(files[k]))

    const tryStart = () => {
        if (resultPromise) return
        if (!haveRequiredFields()) return
        if (!haveRequiredFiles()) return

        resultPromise = options.start({ files, fields })
    }

    return await new Promise<T>((resolve, reject) => {
        const bb = Busboy({ headers: req.headers })

        bb.on('field', (name, value) => {
            fields[name] = value
            try {
                tryStart()
            } catch (e) {
                reject(e as Error)
            }
        })

        bb.on('file', (fieldName, file, info) => {
            if (!requiredFiles.includes(fieldName)) {
                ;(file as any).resume?.()
                return
            }

            if (files[fieldName]) {
                ;(file as any).resume?.()
                return
            }

            const filename =
                info && typeof info === 'object' && 'filename' in info
                    ? String((info as any).filename || fieldName)
                    : fieldName

            const mimeType =
                info && typeof info === 'object' && 'mimeType' in info
                    ? String((info as any).mimeType || 'application/octet-stream')
                    : 'application/octet-stream'

            const pt = new PassThrough()
            file.pipe(pt)

            files[fieldName] = { fieldName, file: pt, filename, mimeType }

            try {
                tryStart()
            } catch (e) {
                reject(e as Error)
            }
        })

        bb.on('error', reject)

        bb.on('finish', () => {
            if (!haveRequiredFiles()) {
                return reject(createError({ statusCode: 400, statusMessage: 'Missing required files' }))
            }
            if (!haveRequiredFields()) {
                return reject(createError({ statusCode: 400, statusMessage: 'Missing required fields' }))
            }
            if (!resultPromise) {
                return reject(createError({ statusCode: 500, statusMessage: 'Internal error' }))
            }

            resultPromise.then(resolve, reject)
        })

        req.pipe(bb)
    })
}

type OptionsOneFile<T> = {
    requiredFields?: string[]
    start: (file: MultipartFile, fields: Record<string, string>) => Promise<T>
}

export async function runMultipartOneFile<T>(req: IncomingMessage, options: OptionsOneFile<T>): Promise<T> {
    return runMultipartFiles(req, {
        requiredFields: options.requiredFields,
        requiredFiles: ['file'],
        start: async ({ files, fields }) => {
            const f = files.file
            if (!f) throw createError({ statusCode: 400, statusMessage: 'Missing required files' })
            return options.start(f, fields)
        },
    })
}
