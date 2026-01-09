<!-- pages/lab5/dss-verify.vue -->
<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useDss } from '~/composables/useDss'
import { saveUrlAs } from '~/utils/saveAs'
import { ref, computed } from 'vue'

const tabs = [
  { label: 'Згенерувати ключі', to: '/lab5/dss-keys' },
  { label: 'Підписати текст', to: '/lab5/dss-text' },
  { label: 'Підписати файл', to: '/lab5/dss-file' },
  { label: 'Перевірити підпис', to: '/lab5/dss-verify' },
]

const {
  verified,
  reportFile,
  reportFileName,
  loading,
  error,
  verifyFile,
} = useDss()

const inputFile = ref<File | null>(null)
const sigFile = ref<File | null>(null)

const keyMode = ref<'file' | 'text'>('file')
const publicKeyFile = ref<File | null>(null)
const publicKeyText = ref<string>('')

const canSubmit = computed(() => {
  if (!inputFile.value) return false
  if (!sigFile.value) return false
  if (keyMode.value === 'file') return Boolean(publicKeyFile.value)
  return publicKeyText.value.trim().length > 0
})

async function onSubmit() {
  if (!inputFile.value || !sigFile.value) return

  if (keyMode.value === 'file') {
    if (!publicKeyFile.value) return
    await verifyFile(inputFile.value, sigFile.value, publicKeyFile.value, undefined)
  } else {
    await verifyFile(inputFile.value, sigFile.value, undefined, publicKeyText.value)
  }
}

async function onDownloadReport() {
  if (!reportFile.value) return
  await saveUrlAs(reportFile.value, reportFileName.value ?? 'verify_report.txt')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 5: DSS Перевірка підпису файлу</h1>

    <Tabs :tabs="tabs" />

    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="file">Файл</label>
        <input id="file" type="file" @change="(e:any) => (inputFile = e.target.files?.[0] ?? null)" />
      </div>

      <div class="space-x-2">
        <label for="sig">Файл підпису (.sig)</label>
        <input id="sig" type="file" accept=".sig,.txt" @change="(e:any) => (sigFile = e.target.files?.[0] ?? null)" />
      </div>

      <div class="space-y-2">
        <div class="font-semibold">Public key</div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2">
            <input type="radio" value="file" v-model="keyMode" />
            Файл (.pem)
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" value="text" v-model="keyMode" />
            Рядок (PEM)
          </label>
        </div>
      </div>

      <div v-if="keyMode === 'file'" class="space-x-2">
        <label for="pubKeyFile">Public key файл</label>
        <input
            id="pubKeyFile"
            type="file"
            accept=".pem,.txt"
            @change="(e:any) => (publicKeyFile = e.target.files?.[0] ?? null)"
        />
      </div>

      <div v-else class="space-y-2">
        <label for="pubKeyText">Public key (PEM текст)</label>
        <textarea
            id="pubKeyText"
            v-model="publicKeyText"
            class="w-full h-40 text-gray-800 outline-gray-800 px-2 py-1 rounded"
            placeholder="-----BEGIN PUBLIC KEY----- ..."
        />
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading || !canSubmit"
      >
        {{ loading ? 'Перевірка…' : 'Перевірити підпис' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <div v-if="verified !== null" class="mt-8 space-y-2">
      <div class="font-semibold">
        Результат:
        <span :class="verified ? 'text-green-700' : 'text-red-700'">
          {{ verified ? 'OK (підпис дійсний)' : 'FAIL (підпис недійсний)' }}
        </span>
      </div>

      <button
          v-if="reportFile"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          @click="onDownloadReport"
      >
        Зберегти звіт
      </button>
    </div>
  </main>
</template>
