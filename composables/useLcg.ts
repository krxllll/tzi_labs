import { ref } from 'vue'

export function useLcg() {
    const result = ref<number[]>([])
    const period = ref<number | null>(null)
    const file = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function run(count: number, saveToFile = false) {
        loading.value = true; error.value = null
        try {
            const res = await $fetch('/api/lcg', { method: 'POST', body: { count, saveToFile } })
            result.value = (res as any).data
            period.value = (res as any).period
            file.value = (res as any).file
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    return { run, result, period, file, loading, error }
}