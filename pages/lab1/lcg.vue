<script setup lang="ts">
const { run, result, period, file, loading, error } = useLcg()

const count = ref<number>(1000)
const saveToFile = ref<boolean>(false)

async function onSubmit() {
  await run(count.value, saveToFile.value)
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">
      Лабораторна робота 1: Лінійний конгруентний генератор псевдовипадкових чисел
    </h1>
    <form @submit.prevent="onSubmit" class="mt-8 space-y-4">
      <div class="space-x-2">
        <label for="count">Довжина послідовності</label>
        <input id="count" type="number" class="text-gray-800 outline-gray-800 px-2" v-model.number="count" min="1" required>
      </div>
      <div class="space-x-2">
        <label for="file">Зберегти у файл?</label>
        <input id="file" type="checkbox" v-model="saveToFile">
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
    <div class="mt-8 space-y-4" v-if="result.length">
      <h2 class="text-2xl font-semibold">Згенерована послідовність:</h2>
      <div>
        <p class="mb-2">Перші {{ Math.min(result.length, 20) }} значень:</p>
        <code class="block whitespace-pre-wrap break-all text-sm">
          {{ result.slice(0, 20).join(', ') }}
        </code>
      </div>
      <p>Визначений період генератора: {{ period }}</p>
      <div v-if="file">
        Файл: <NuxtLink :to="file" target="_blank" class="text-blue-400 underline" download>{{ file }}</NuxtLink>
      </div>
    </div>
    <NuxtLink to="test-cesaro" class="mt-8 block text-blue-400 underline">Перейти до тесту Чезаро</NuxtLink>
  </main>
</template>

<style scoped>

</style>