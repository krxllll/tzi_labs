<script setup lang="ts">
import Tabs from "~/components/Tabs.vue";

const { run, data, loading, error } = useCesaro()

const tabs = [
  { label: 'Лінійний конгруентний генератор', to: '/lab1/lcg' },
  { label: 'Тест Чезаро', to: '/lab1/test-cesaro' },
]

const pairs = ref(100000)
const seed = ref(1)

async function onSubmit() {
  await run(pairs.value, seed.value)
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">
      Лабораторна робота 1: Тест Чезаро
    </h1>
    <Tabs :tabs="tabs" />
    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="pairs">Кількість пар</label>
        <input id="pairs" v-model.number="pairs" type="number" class="text-gray-800 outline-gray-800 px-2" min="1" required>
      </div>
      <div class="space-x-2">
        <label for="seed">Затравка для Лемера (опц.)</label>
        <input id="seed" v-model.number="seed" type="number" class="text-gray-800 outline-gray-800 px-2" min="1" required>
      </div>
      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading"
      >
        {{ loading ? 'Обчислення…' : 'Запустити' }}
      </button>
    </form>
    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>
    <div v-if="data" class="mt-8 space-y-4">
      <h2 class="text-2xl font-semibold">Результати (pairs = {{ data.pairs }})</h2>
      <table class="text-sm border-collapse">
        <thead><tr><th class="px-2">Генератор</th><th class="px-2">π (оцінка)</th><th class="px-2">P(gcd=1)</th><th class="px-2">coprime/total</th></tr></thead>
        <tbody>
        <tr><td class="px-2">LCG</td><td class="px-2">{{ data.results.lcg.pi.toFixed(6) }}</td><td class="px-2">{{ data.results.lcg.p.toFixed(6) }}</td><td class="px-2">{{ data.results.lcg.coprime }}/{{ data.results.lcg.total }}</td></tr>
        <tr><td class="px-2">Lehmer</td><td class="px-2">{{ data.results.lehmer.pi.toFixed(6) }}</td><td class="px-2">{{ data.results.lehmer.p.toFixed(6) }}</td><td class="px-2">{{ data.results.lehmer.coprime }}/{{ data.results.lehmer.total }}</td></tr>
        <tr><td class="px-2">System</td><td class="px-2">{{ data.results.system.pi.toFixed(6) }}</td><td class="px-2">{{ data.results.system.p.toFixed(6) }}</td><td class="px-2">{{ data.results.system.coprime }}/{{ data.results.system.total }}</td></tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>

</style>