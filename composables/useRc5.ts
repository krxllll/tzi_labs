import { ref } from 'vue'

export function useRc5() {
    const encryptedFile = ref<string | null>(null)
    const encryptedFileName = ref<string | null>(null)

    const decryptedFile = ref<string | null>(null)
    const decryptedFileName = ref<string | null>(null)

    const loading = ref(false)
    const error = ref<string | null>(null)

    async function encryptFile(fileInput: File, password: string) {
        const pwd = (password ?? '').trim()
        if (!pwd) {
            error.value = 'Missing password'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)
            form.append('password', pwd)

            const res = await $fetch('/api/rc5-encrypt', { method: 'POST', body: form }) as any
            encryptedFile.value = res.file
            encryptedFileName.value = res.fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally {
            loading.value = false
        }
    }

    async function decryptFile(fileInput: File, password: string) {
        const pwd = (password ?? '').trim()
        if (!pwd) {
            error.value = 'Missing password'
            return
        }

        loading.value = true
        error.value = null

        try {
            const form = new FormData()
            form.append('file', fileInput)
            form.append('password', pwd)

            const res = await $fetch('/api/rc5-decrypt', { method: 'POST', body: form }) as any
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
        loading,
        error,
        encryptFile,
        decryptFile,
    }
}
