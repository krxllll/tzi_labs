export type CesaroResult = { pi: number; p: number; coprime: number; total: number }
export type CesaroResponse = {
    pairs: number
    results: { lcg: CesaroResult; lehmer: CesaroResult; system: CesaroResult }
}

import { ref } from 'vue'

export function useCesaro() {
    const data = ref<CesaroResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function run(pairs: number, seed?: number) {
        loading.value = true; error.value = null
        try {
            data.value = await $fetch<CesaroResponse>('/api/test-cesaro', { method: 'POST', body: { pairs, seed } })
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Request failed'
        } finally { loading.value = false }
    }

    return { run, data, loading, error }
}