<script setup lang="ts">
definePageMeta({
  title: 'Sobre Nosotros'
});
</script>

<template>
  <div class="mx-auto max-w-4xl py-12">
    <UCard class="rounded-3xl border-none shadow-xl dark:bg-neutral-900">
      <div class="p-8 md:p-12">
        <h1 class="text-4xl font-black text-secondary-600 dark:text-secondary-400">Sobre Prismart</h1>
        <p class="mt-6 text-lg text-neutral-600 dark:text-neutral-300">
          Prismart nació con una visión clara: revolucionar la manera en que compradores y vendedores 
          interactúan en el mundo del comercio electrónico.
        </p>
        
        <div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Nuestra Misión</h2>
            <p class="mt-4 text-neutral-600 dark:text-neutral-400">
              Proveer una plataforma segura, rápida y con diseño premium que conecte los mejores 
              productos con clientes exigentes que buscan calidad y un servicio inigualable.
            </p>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Nuestra Visión</h2>
            <p class="mt-4 text-neutral-600 dark:text-neutral-400">
              Convertirnos en el estándar de oro para las transacciones en línea en toda Hispanoamérica, 
              apoyando el crecimiento de miles de emprendedores digitales.
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
