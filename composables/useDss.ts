import { ref } from 'vue'

type KeysRes = {
    publicKeyFile: string
    privateKeyFile: string
    publicKeyFileName: string
    privateKeyFileName: string
    publicKey?: string
    privateKey?: string
}

type SignTextRes = {
    signatureHex: string
    signatureFile: string
    signatureFileName: string
}

type SignFileRes = {
    signatureHex: string
    sizeBytes: number
    signatureFile: string
    signatureFileName: string
}

type VerifyFileRes = {
    ok: boolean
    sizeBytes: number
    reportFile: string
    reportFileName: string
}

export function useDss() {
    const publicKeyFile = ref<string | null>(null)
    const privateKeyFile = ref<string | null>(null)
    const publicKeyFileName = ref<string | null>(null)
    const privateKeyFileName = ref<string | null>(null)

    const publicKeyText = ref<string | null>(null)
    const privateKeyText = ref<string | null>(null)

    const signatureHex = ref<string | null>(null)
    const signatureFile = ref<string | null>(null)
    const signatureFileName = ref<string | null>(null)

    const reportFile = ref<string | null>(null)
    const reportFileName = ref<string | null>(null)
    const verified = ref<boolean | null>(null)

    const loading = ref(false)
    const error = ref<string | null>(null)

    async function generateKeys() {
        loading.value = true
        error.value = null

        try {
            const res = (await $fetch('/api/dss-generate-keys', { method: 'POST' })) as KeysRes

            publicKeyFile.value = res.publicKeyFile
            privateKeyFile.value = res.privateKeyFile
            publicKeyFileName.value = res.publicKeyFileName
            privateKeyFileName.value = res.privateKeyFileName

            publicKeyText.value = res.publicKey ?? null
            privateKeyText.value = res.privateKey ?? null
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function signText(text: string, privateKeyFileInput?: File, privateKeyPemText?: string, name?: string) {
        const t = (text ?? '').trim()
        if (!t) {
            error.value = 'Missing text'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('text', t)
            if ((name ?? '').trim()) form.append('name', name!.trim())

            if (privateKeyFileInput) {
                form.append('key', privateKeyFileInput)
            } else {
                const pem = (privateKeyPemText ?? '').trim()
                if (!pem) {
                    error.value = 'Provide private key as file or text'
                    return
                }
                form.append('privateKey', pem)
            }

            const res = (await $fetch('/api/dss-sign-text', { method: 'POST', body: form })) as SignTextRes

            signatureHex.value = res.signatureHex
            signatureFile.value = res.signatureFile
            signatureFileName.value = res.signatureFileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function signFile(fileInput: File, privateKeyFileInput?: File, privateKeyPemText?: string) {
        if (!fileInput) {
            error.value = 'Missing file'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)

            if (privateKeyFileInput) {
                form.append('key', privateKeyFileInput)
            } else {
                const pem = (privateKeyPemText ?? '').trim()
                if (!pem) {
                    error.value = 'Provide private key as file or text'
                    return
                }
                form.append('privateKey', pem)
            }

            const res = (await $fetch('/api/dss-sign-file', { method: 'POST', body: form })) as SignFileRes

            signatureHex.value = res.signatureHex
            signatureFile.value = res.signatureFile
            signatureFileName.value = res.signatureFileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function verifyFile(fileInput: File, sigFileInput: File, publicKeyFileInput?: File, publicKeyPemText?: string) {
        if (!fileInput) {
            error.value = 'Missing file'
            return
        }
        if (!sigFileInput) {
            error.value = 'Missing signature file'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)
            form.append('sig', sigFileInput)

            if (publicKeyFileInput) {
                form.append('key', publicKeyFileInput)
            } else {
                const pem = (publicKeyPemText ?? '').trim()
                if (!pem) {
                    error.value = 'Provide public key as file or text'
                    return
                }
                form.append('publicKey', pem)
            }

            const res = (await $fetch('/api/dss-verify-file', { method: 'POST', body: form })) as VerifyFileRes

            verified.value = res.ok
            reportFile.value = res.reportFile
            reportFileName.value = res.reportFileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    return {
        publicKeyFile,
        privateKeyFile,
        publicKeyFileName,
        privateKeyFileName,
        publicKeyText,
        privateKeyText,

        signatureHex,
        signatureFile,
        signatureFileName,

        reportFile,
        reportFileName,
        verified,

        loading,
        error,

        generateKeys,
        signText,
        signFile,
        verifyFile,
    }
}
