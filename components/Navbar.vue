<script setup lang="ts">
const route = useRoute()

const links = [
  { label: 'Лабораторна 1', to: '/lab1', href: '/lab1/lcg' },
  { label: 'Лабораторна 2', to: '/lab2', href: '/lab2/md5-text' },
  { label: 'Лабораторна 3', to: '/lab3', href: '/lab3/rc5-encrypt' },
]

function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/')
}
</script>

<template>
  <nav class="bg-gray-800 text-white px-20 py-6 flex justify-between items-center">
    <NuxtLink to="/" class="font-bold text-xl hover:text-blue-400">
      TZI Labs
    </NuxtLink>

    <div class="space-x-4">
      <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.href"
          class="hover:text-blue-400"
          :class="isActive(l.to) ? 'text-blue-500 font-semibold' : ''"
      >
        {{ l.label }}
      </NuxtLink>
    </div>
  </nav>
</template>


<style scoped>

</style>