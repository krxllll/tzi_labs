<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useRsaAes } from '~/composables/useRsaAes'
import { saveUrlAs } from '~/utils/saveAs'

const tabs = [
  { label: 'Згенерувати ключі', to: '/lab4/rsa-keys' },
  { label: 'Шифрувати файл', to: '/lab4/rsa-aes-encrypt' },
  { label: 'Дешифрувати файл', to: '/lab4/rsa-aes-decrypt' },
]

const {
  loading,
  error,
  generateKeys,
  publicKeyFile,
  privateKeyFile,
  publicKeyFileName,
  privateKeyFileName,
  publicKeyText,
  privateKeyText,
} = useRsaAes()

async function onGenerate() {
  await generateKeys()
}

async function downloadPublic() {
  if (!publicKeyFile.value) return
  await saveUrlAs(publicKeyFile.value, publicKeyFileName.value ?? 'public.pem')
}

async function downloadPrivate() {
  if (!privateKeyFile.value) return
  await saveUrlAs(privateKeyFile.value, privateKeyFileName.value ?? 'private.pem')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 4: RSA Генерація ключів</h1>

    <Tabs :tabs="tabs" />

    <button
        class="bg-blue-600 text-white px-4 py-2 mt-8 rounded hover:bg-blue-800 disabled:opacity-60"
        :disabled="loading"
        @click="onGenerate"
    >
      {{ loading ? 'Генерація…' : 'Згенерувати RSA ключі' }}
    </button>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <div v-if="publicKeyFile && privateKeyFile" class="mt-8 space-y-4">
      <div class="flex items-center gap-3">
        <span class="font-semibold">Public key:</span>
        <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800" @click="downloadPublic">
          Завантажити {{ publicKeyFileName ?? 'public.pem' }}
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span class="font-semibold">Private key:</span>
        <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800" @click="downloadPrivate">
          Завантажити {{ privateKeyFileName ?? 'private.pem' }}
        </button>
      </div>

      <div v-if="publicKeyText">
        <h2 class="text-xl font-semibold">Public key (PEM)</h2>
        <textarea class="w-full mt-2 h-40 text-gray-800 p-2 rounded outline-gray-800" readonly :value="publicKeyText" />
      </div>

      <div v-if="privateKeyText">
        <h2 class="text-xl font-semibold">Private key (PEM)</h2>
        <textarea class="w-full mt-2 h-40 text-gray-800 p-2 rounded outline-gray-800" readonly :value="privateKeyText" />
      </div>
    </div>
  </main>
</template>
