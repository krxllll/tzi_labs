<script setup lang="ts">

</script>

<template>
  <main class="px-20 py-10">
    <h1 class="text-4xl font-bold">
      Лабораторні роботи з дисципліни "Технології захисту інформації"
    </h1>
    <ul class="list-disc list-inside mt-4 space-y-2">
      <li>
        <NuxtLink to="/lab1/lcg" class="text-blue-400 hover:underline">
          Лабораторна робота 1: Лінійний конгруентний генератор
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/lab2/md5-text" class="text-blue-400 hover:underline">
          Лабораторна робота 2: MD5 (RFC 1321)
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>

</style>