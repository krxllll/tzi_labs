<script setup lang="ts">
type Tab = { label: string; to: string }

const props = defineProps<{
  tabs: Tab[]
}>()

const route = useRoute()

const activeTo = computed(() => {
  const path = route.path
  const exact = props.tabs.find(t => t.to === path)
  if (exact) return exact.to

  const pref = props.tabs
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find(t => path.startsWith(t.to))

  return pref?.to ?? props.tabs[0]?.to
})
</script>

<template>
  <nav class="mt-4 flex gap-2 border-b border-gray-600">
    <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="px-4 py-2 rounded-t text-sm"
        :class="activeTo === t.to
        ? 'bg-blue-600 text-white'
        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'"
    >
      {{ t.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>

</style>