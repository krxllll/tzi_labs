<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useMd5 } from '~/composables/useMd5'
import { saveUrlAs } from '~/utils/saveAs'

const tabs = [
  { label: 'Хешувати текст', to: '/lab2/md5-text' },
  { label: 'Хешувати файл', to: '/lab2/md5-file' },
  { label: 'Перевірити файл', to: '/lab2/md5-verify' },
]

const { hash, file, fileName, loading, error, hashText } = useMd5()

const inputText = ref('')

async function onSubmit() {
  await hashText(inputText.value, 'text.md5')
}

async function onDownload() {
  await saveUrlAs(file.value, fileName.value ?? 'result.md5')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 2: MD5 Хешування Рядка</h1>

    <Tabs :tabs="tabs" />
    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label>Рядок</label>
        <input v-model="inputText" class="text-gray-800 outline-gray-800 px-2" >
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading"
      >
        {{ loading ? 'Обчислення…' : 'Обчислити MD5' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <div v-if="hash" class="mt-8">
      <p><b>MD5:</b> <code class="break-all">{{ hash }}</code></p>
    </div>

    <button
        v-if="file"
        class="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-800"
        @click="onDownload"
    >
      Зберегти у файл
    </button>
  </main>
</template>
