<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useRsaAes } from '~/composables/useRsaAes'
import { saveUrlAs } from '~/utils/saveAs'
import { ref, computed } from 'vue'

const tabs = [
  { label: 'Згенерувати ключі', to: '/lab4/rsa-keys' },
  { label: 'Шифрувати файл', to: '/lab4/rsa-aes-encrypt' },
  { label: 'Дешифрувати файл', to: '/lab4/rsa-aes-decrypt' },
]

const { encryptedFile, encryptedFileName, loading, error, encryptFile } = useRsaAes()

const inputFile = ref<File | null>(null)

const keyMode = ref<'file' | 'text'>('file')
const publicKeyFile = ref<File | null>(null)
const publicKeyText = ref<string>('')

const canSubmit = computed(() => {
  if (!inputFile.value) return false
  if (keyMode.value === 'file') return Boolean(publicKeyFile.value)
  return (publicKeyText.value ?? '').trim().length > 0
})

async function onSubmit() {
  if (!inputFile.value) return

  if (keyMode.value === 'file') {
    if (!publicKeyFile.value) return
    await encryptFile(inputFile.value, publicKeyFile.value, undefined)
  } else {
    await encryptFile(inputFile.value, undefined, publicKeyText.value)
  }
}

async function onDownload() {
  if (!encryptedFile.value) return
  await saveUrlAs(encryptedFile.value, encryptedFileName.value ?? 'encrypted.bin')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 4: RSA-AES Шифрування файлу</h1>

    <Tabs :tabs="tabs" />

    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="file">Файл</label>
        <input id="file" type="file" @change="(e:any) => (inputFile = e.target.files?.[0] ?? null)"/>
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
        <input id="pubKeyFile" type="file" accept=".pem,.txt" @change="(e:any) => (publicKeyFile = e.target.files?.[0] ?? null)"/>
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
        {{ loading ? 'Шифрування…' : 'Шифрувати файл' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <button
        v-if="encryptedFile"
        class="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-800"
        @click="onDownload"
    >
      Зберегти файл
    </button>
  </main>
</template>
