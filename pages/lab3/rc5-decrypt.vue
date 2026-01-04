<script setup lang="ts">
import Tabs from '~/components/Tabs.vue'
import { useRc5 } from "~/composables/useRc5";
import { saveUrlAs } from '~/utils/saveAs'
import {ref} from "vue";

const tabs = [
  { label: 'Шифрувати файл', to: '/lab3/rc5-encrypt' },
  { label: 'Дешифрувати файл', to: '/lab3/rc5-decrypt' },
]

const { decryptedFile, decryptedFileName, loading, error, decryptFile } = useRc5()

const inputFile = ref<File | null>(null)
const inputPassword = ref<string>('')

async function onSubmit() {
  if (!inputFile.value) return
  await decryptFile(inputFile.value, inputPassword.value)
}

async function onDownload() {
  await saveUrlAs(decryptedFile.value, decryptedFileName.value ?? 'decrypted.txt')
}
</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">Лабораторна робота 3: RC5 Дешифрування файлу</h1>

    <Tabs :tabs="tabs" />
    <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
      <div class="space-x-2">
        <label for="file">Файл</label>
        <input id="file" type="file" @change="(e:any) => inputFile = e.target.files?.[0] ?? null" >
      </div>
      <div class="space-x-2">
        <label for="password">Пароль</label>
        <input id="password" v-model="inputPassword" type="password" class="text-gray-800 outline-gray-800 px-2" >
      </div>

      <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-60"
          :disabled="loading"
      >
        {{ loading ? 'Дешифрування…' : 'Дешифрувати файл' }}
      </button>
    </form>

    <p v-if="error" class="mt-8 text-red-600">Помилка: {{ error }}</p>

    <button
        v-if="decryptedFile"
        class="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-800"
        @click="onDownload"
    >
      Зберегти файл
    </button>
  </main>
</template>
