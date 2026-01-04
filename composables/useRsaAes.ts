import { ref } from 'vue'

type CryptoRes = { file: string; fileName: string }

type KeysRes = {
    publicKeyFile: string
    privateKeyFile: string
    publicKeyName: string
    privateKeyName: string
    publicKey?: string
    privateKey?: string
}

export function useRsaAes() {
    const encryptedFile = ref<string | null>(null)
    const encryptedFileName = ref<string | null>(null)

    const decryptedFile = ref<string | null>(null)
    const decryptedFileName = ref<string | null>(null)

    const publicKeyFile = ref<string | null>(null)
    const privateKeyFile = ref<string | null>(null)
    const publicKeyFileName = ref<string | null>(null)
    const privateKeyFileName = ref<string | null>(null)

    const publicKeyText = ref<string | null>(null)
    const privateKeyText = ref<string | null>(null)

    const loading = ref(false)
    const error = ref<string | null>(null)

    async function generateKeys() {
        loading.value = true
        error.value = null

        try {
            const res = (await $fetch('/api/rsa-generate-keys', { method: 'POST' })) as KeysRes

            publicKeyFile.value = res.publicKeyFile
            privateKeyFile.value = res.privateKeyFile
            publicKeyFileName.value = res.publicKeyName
            privateKeyFileName.value = res.privateKeyName

            publicKeyText.value = res.publicKey ?? null
            privateKeyText.value = res.privateKey ?? null
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function encryptFile(fileInput: File, publicKeyFile?: File, publicKeyPemText?: string) {
        if (!fileInput) {
            error.value = 'Missing file'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)

            if (publicKeyFile) {
                form.append('key', publicKeyFile)
            } else {
                const t = (publicKeyPemText ?? '').trim()
                if (!t) {
                    error.value = 'Provide public key as file or text'
                    return
                }
                form.append('publicKey', t)
            }

            const res = (await $fetch('/api/rsa-aes-encrypt', { method: 'POST', body: form })) as CryptoRes
            encryptedFile.value = res.file
            encryptedFileName.value = res.fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function decryptFile(fileInput: File, privateKeyFile?: File, privateKeyPemText?: string) {
        if (!fileInput) {
            error.value = 'Missing file'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)

            if (privateKeyFile) {
                form.append('key', privateKeyFile)
            } else {
                const t = (privateKeyPemText ?? '').trim()
                if (!t) {
                    error.value = 'Provide private key as file or text'
                    return
                }
                form.append('privateKey', t)
            }

            const res = (await $fetch('/api/rsa-aes-decrypt', { method: 'POST', body: form })) as CryptoRes
            decryptedFile.value = res.file
            decryptedFileName.value = res.fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    return {
        encryptedFile,
        encryptedFileName,
        decryptedFile,
        decryptedFileName,

        publicKeyFile,
        privateKeyFile,
        publicKeyFileName,
        privateKeyFileName,
        publicKeyText,
        privateKeyText,

        loading,
        error,

        generateKeys,
        encryptFile,
        decryptFile,
    }
}
