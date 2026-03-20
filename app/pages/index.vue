<template>
  <div>
    <UPageHero
      title="Refleja tu estilo con Prismart"
      size="sm"
      description="Descubre una colección curada de productos premium diseñados para destacar. Desde tecnología de vanguardia hasta artículos de estilo de vida."
    />

    <UPageSection
      title="Los Productos más Vendidos"
      description="Lo que nuestra comunidad está comprando ahora mismo. Calidad garantizada por miles de usuarios."
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="i in 4" :key="i" class="space-y-4">
          <div class="aspect-3/4 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div class="space-y-2">
            <div class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div class="h-4 w-1/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </UPageSection>
  </div>
</template>