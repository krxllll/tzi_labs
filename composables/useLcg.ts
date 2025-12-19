import { ref } from 'vue'

export function useLcg() {
    const result = ref<number[]>([])
    const period = ref<number | null>(null)
    const file = ref<string | null>(null)
    const fileName = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function run(count: number, m?: number, a?: number, c?: number, seed?: number) {
        loading.value = true; error.value = null
        try {
            const res = await $fetch('/api/lcg', { method: 'POST', body: { count, m, a, c, seed } })
            result.value = (res as any).data
            period.value = (res as any).period
            file.value = (res as any).file
            fileName.value = (res as any).fileName
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    return { run, result, period, file, fileName, loading, error }
}