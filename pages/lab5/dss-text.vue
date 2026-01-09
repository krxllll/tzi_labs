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
  signatureHex,
  signatureFile,
  signatureFileName,
  loading,
  error,
  signText,
} = useDss()

const text = ref<string>('')

const keyMode = ref<'file' | 'text'>('file')
const privateKeyFile = ref<File | null>(null)
const privateKeyText = ref<string>('')

const canSubmit = computed(() => {
  if (!text.value.trim()) return false
  if (keyMode.value === 'file') return Boolean(privateKeyFile.value)
  return privateKeyText.value.trim().length > 0
})

async function onSubmit() {
  if (!canSubmit.value) return

  if (keyMode.value === 'file') {
    await signText(text.value, privateKeyFile.value!)
  } else {
    await signText(text.value, undefined, privateKeyText.value)
  }
}

async function onDownloadSig() {
  if (!signatureFile.value) return
  await saveUrlAs(signatureFile.value, signatureFileName.value ?? 'signature.sig')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 5: DSS Підпис тексту</h1>

    <Tabs :tabs="tabs" />

    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-2">
        <label for="text" class="font-semibold">Текст</label>
        <textarea
            id="text"
            v-model="text"
            class="w-full h-40 text-gray-800 outline-gray-800 px-2 py-1 rounded"
        />
      </div>

      <div class="space-y-2">
        <div class="font-semibold">Private key</div>
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
        <label for="privKeyFile">Private key файл</label>
        <input
            id="privKeyFile"
            type="file"
            accept=".pem,.txt"
            @change="(e:any) => (privateKeyFile = e.target.files?.[0] ?? null)"
        />
      </div>

      <div v-else class="space-y-2">
        <label for="privKeyText">Private key (PEM текст)</label>
        <textarea
            id="privKeyText"
            v-model="privateKeyText"
            class="w-full h-40 text-gray-800 outline-gray-800 px-2 py-1 rounded"
            placeholder="-----BEGIN PRIVATE KEY----- ..."
        />
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading || !canSubmit"
      >
        {{ loading ? 'Підпис…' : 'Підписати текст' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">
      Помилка: {{ error }}
    </p>

    <div v-if="signatureHex" class="mt-8 space-y-3">
      <div class="font-semibold">Підпис (hex)</div>

      <textarea
          class="w-full h-32 text-gray-800 outline-gray-800 px-2 py-1 rounded"
          :value="signatureHex"
          readonly
      />


      <button
          v-if="signatureFile"
          class="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-800"
          @click="onDownloadSig"
      >
        Зберегти .sig
      </button>
    </div>
  </main>
</template>
