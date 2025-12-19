<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { saveUrlAs } from "~/utils/saveAs";

const tabs = [
  { label: 'Лінійний конгруентний генератор', to: '/lab1/lcg' },
  { label: 'Тест Чезаро', to: '/lab1/test-cesaro' },
]

const { run, result, period, file, fileName, loading, error } = useLcg()

const count = ref<number>(1000)
const m = ref<number | undefined>(undefined)
const a = ref<number | undefined>(undefined)
const c = ref<number | undefined>(undefined)
const seed = ref<number | undefined>(undefined)

async function onSubmit() {
  await run(count.value, m.value, a.value, c.value, seed.value)
}

async function onDownload() {
  await saveUrlAs(file.value, fileName.value)
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">
      Лабораторна робота 1: Лінійний конгруентний генератор псевдовипадкових чисел
    </h1>
    <Tabs :tabs="tabs" />
    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="count">Довжина послідовності</label>
        <input id="count" v-model.number="count" type="number" class="text-gray-800 outline-gray-800 px-2" min="1" required>
      </div>
      <div class="space-x-2">
        <label for="m">Модуль</label>
        <input id="m" v-model.number="m" type="number" class="text-gray-800 outline-gray-800 px-2" min="1">
      </div>
      <div class="space-x-2">
        <label for="a">Множник</label>
        <input id="a" v-model.number="a" type="number" class="text-gray-800 outline-gray-800 px-2" min="1">
      </div>
      <div class="space-x-2">
        <label for="c">Приріст</label>
        <input id="c" v-model.number="c" type="number" class="text-gray-800 outline-gray-800 px-2" min="0">
      </div>
      <div class="space-x-2">
        <label for="seed">Початкове значення</label>
        <input id="seed" v-model.number="seed" type="number" class="text-gray-800 outline-gray-800 px-2" min="0">
      </div>
      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading"
      >
        {{ loading ? 'Обчислення…' : 'Згенерувати' }}
      </button>
    </form>
    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>
    <div v-if="result.length" class="mt-8 space-y-4">
      <h2 class="text-2xl font-semibold">Згенерована послідовність:</h2>
      <p>Визначений період генератора: {{ period }}</p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800" @click="onDownload">
        Зберегти у файл
      </button>
      <div>
        <code class="block whitespace-pre-wrap break-all text-sm">
          {{ result.slice().join(', ') }}
        </code>
      </div>
    </div>
  </main>
</template>

<style scoped>

</style>