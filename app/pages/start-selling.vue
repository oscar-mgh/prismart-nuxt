<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <div class="mx-auto max-w-4xl py-12">
    <div
      class="overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-neutral-900 lg:flex"
    >
      <div class="bg-primary-600 p-12 text-white lg:w-1/2">
        <h1 class="text-4xl font-black">Convierte tu pasión en ganancias</h1>
        <p class="mt-6 text-lg text-primary-100">
          Únete a la red de vendedores más grande de la región y llega a miles
          de clientes potenciales cada día.
        </p>

        <ul class="mt-10 space-y-4">
          <li class="flex items-center gap-3">
            <UIcon name="i-lucide-check-circle" />
            Configuración instantánea
          </li>
          <li class="flex items-center gap-3">
            <UIcon name="i-lucide-check-circle" />
            Panel de administración intuitivo
          </li>
          <li class="flex items-center gap-3">
            <UIcon name="i-lucide-check-circle" />
            Soporte técnico eficiente
          </li>
        </ul>
      </div>

      <div class="p-12 lg:w-1/2">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">
          Empieza hoy mismo
        </h2>
        <p class="mt-4 text-neutral-500 dark:text-neutral-400">
          Un solo paso para configurar tu tienda oficial en Prismart.
        </p>

        <div class="mt-10 space-y-6">
          <div class="rounded-2xl bg-amber-50 p-6 dark:bg-amber-900/20">
            <div class="flex gap-3">
              <UIcon
                name="i-lucide-badge-percent"
                class="text-amber-600 mt-0.5 shrink-0"
              />
              <div>
                <h4 class="font-bold text-amber-900 dark:text-amber-400">
                  Información Importante
                </h4>
                <p class="mt-1 text-sm text-amber-800 dark:text-amber-500">
                  Prismart aplica una comisión fija del 4% sobre cada venta
                  exitosa. Sin cargos mensuales ni costos ocultos.
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50"
          >
            <div class="flex gap-3">
              <UIcon
                name="i-lucide-info"
                class="text-neutral-500 mt-0.5 shrink-0"
              />
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Al continuar, tu cuenta será promovida a vendedor y podrás
                configurar los detalles de tu tienda en el siguiente paso.
              </p>
            </div>
          </div>

          <UButton
            to="/create-store"
            color="primary"
            size="xl"
            block
            class="rounded-xl font-bold cursor-pointer"
          >
            Continuar y crear mi tienda
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
