import { ref } from 'vue'

export function useMd5() {
    const hash = ref<string | null>(null)

    const file = ref<string | null>(null)
    const fileName = ref<string | null>(null)

    const ok = ref<boolean | null>(null)
    const expected = ref<string | null>(null)
    const actual = ref<string | null>(null)
    const reportFile = ref<string | null>(null)
    const reportFileName = ref<string | null>(null)

    const loading = ref(false)
    const error = ref<string | null>(null)

    async function hashText(text: string, name?: string) {
        loading.value = true; error.value = null
        try {
            const res = await $fetch('/api/md5-text', { method: 'POST', body: { text, name } })
            hash.value = (res as any).hash
            file.value = (res as any).file
            fileName.value = (res as any).fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    async function hashFile(fileInput: File, name?: string) {
        loading.value = true; error.value = null
        try {
            const form = new FormData()
            form.append('file', fileInput)
            if (name) form.append('name', name)

            const res = await $fetch('/api/md5-file', { method: 'POST', body: form })
            hash.value = (res as any).hash
            file.value = (res as any).file
            fileName.value = (res as any).fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    async function verifyFile(target: File, md5FileInput: File) {
        loading.value = true; error.value = null
        ok.value = null; expected.value = null; actual.value = null
        reportFile.value = null; reportFileName.value = null

        try {
            const form = new FormData()
            form.append('file', target)
            form.append('md5', md5FileInput)

            const res = await $fetch('/api/md5-verify', { method: 'POST', body: form })
            ok.value = (res as any).ok
            expected.value = (res as any).expected
            actual.value = (res as any).actual
            reportFile.value = (res as any).reportFile
            reportFileName.value = (res as any).reportFileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    return {
        hash, file, fileName,
        ok, expected, actual, reportFile, reportFileName,
        loading, error,
        hashText, hashFile, verifyFile,
    }
}
