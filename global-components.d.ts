declare module 'vue' {
    export interface GlobalComponents {
        NuxtLink: typeof import('nuxt/dist/app/components')['NuxtLink']
        NuxtPage: typeof import('nuxt/dist/pages/runtime')['NuxtPage']
        NuxtLayout: typeof import('nuxt/dist/pages/runtime')['NuxtLayout']
        NuxtRouteAnnouncer: typeof import('nuxt/dist/app/components/nuxt-route-announcer')['default']
        NuxtErrorBoundary: typeof import('nuxt/dist/app/components/nuxt-error-boundary')['default']
    }
}
export {}