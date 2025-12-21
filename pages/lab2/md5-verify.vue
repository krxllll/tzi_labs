<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useMd5 } from '~/composables/useMd5'
import { saveUrlAs } from '~/utils/saveAs'
import {ref} from "vue";

const tabs = [
  { label: 'Хешувати текст', to: '/lab2/md5-text' },
  { label: 'Хешувати файл', to: '/lab2/md5-file' },
  { label: 'Перевірити файл', to: '/lab2/md5-verify' },
]

const { ok, expected, actual, reportFile, reportFileName, loading, error, verifyFile } = useMd5()

const inputFile = ref<File | null>(null)
const inputMd5File = ref<File | null>(null)

async function onSubmit() {
  if (!inputFile.value || !inputMd5File.value) return
  await verifyFile(inputFile.value, inputMd5File.value)
}

async function onDownload() {
  await saveUrlAs(reportFile.value, reportFileName.value ?? 'md5_verify.txt')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 2: MD5 Перевірка Файлу На Цілісність</h1>

    <Tabs :tabs="tabs" />
    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="file">Файл</label>
        <input id="file" type="file" @change="(e:any) => inputFile = e.target.files?.[0] ?? null" >
      </div>
      <div class="space-x-2">
        <label for="md5File">Файл з MD5</label>
        <input id="md5File" type="file" @change="(e:any) => inputMd5File = e.target.files?.[0] ?? null" >
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading"
      >
        {{ loading ? 'Перевірка…' : 'Перевірити' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <div v-if="ok !== null" class="mt-8">
      <p>
        <b>Результат:</b>
        <span :class="ok ? 'text-green-600' : 'text-red-600'">
            {{ ok ? 'OK (хеші збігаються)' : 'FAIL (хеші не збігаються)' }}
          </span>
      </p>
      <p v-if="expected"><b>Очікуваний:</b> <code class="break-all">{{ expected }}</code></p>
      <p v-if="actual"><b>Фактичний:</b> <code class="break-all">{{ actual }}</code></p>
    </div>

    <button
        v-if="reportFile"
        class="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-800"
        @click="onDownload"
    >
      Завантажити протокол
    </button>
  </main>
</template>
