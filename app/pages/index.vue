<script setup lang="ts">
const authStore = useAuthStore();
const { fetchApi } = useApi();

const { data: bestsellingProducts } = await useAsyncData("bestselling", () =>
  fetchApi<PaginatedResponse<Product>>(
    "/products?page=1&limit=4&sortBy=best_selling",
  ),
);
</script>

<template>
  <div class="space-y-20">
    <section
  class="relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-linear-to-br from-neutral-50 via-white to-primary-50/40 px-8 py-16 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800"
>
  <div
    class="absolute inset-0 opacity-[0.35] dark:opacity-[0.06]"
    style="
      background-image: radial-gradient(#10b981 0.6px, transparent 0.6px);
      background-size: 22px 22px;
    "
  ></div>

  <div
    class="pointer-events-none absolute -top-32 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-primary-500/15 blur-[120px]"
  ></div>

  <div
    class="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-400/10 blur-[100px]"
  ></div>

  <div
    class="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-400/10 dark:bg-primary-500/10 blur-[120px]"
  ></div>

  <div class="relative z-10 mx-auto max-w-3xl text-center">
    <h1
      class="text-4xl font-black leading-none tracking-tight text-neutral-900 dark:text-white md:text-5xl"
    >
      Compra
      <span class="relative inline-block">
        <span
          class="relative z-10 text-primary-600 dark:text-primary-400"
        >
          sin límites
        </span>

        <span
          class="absolute bottom-1 left-0 h-3 w-full rounded-full bg-primary-200/70 blur-sm dark:bg-primary-400/20"
        ></span>
      </span>
    </h1>

    <p
      class="mx-auto mt-8 max-w-2xl text-base leading-8 text-neutral-600 dark:text-neutral-400 md:text-lg"
    >
      Descubre productos de tecnología, hogar, moda y mucho más en una sola
      plataforma diseñada para encontrar lo que necesitas de forma rápida y
      simple.
    </p>

    <div class="mt-12 flex flex-wrap items-center justify-center gap-5">
      <UButton
        to="/products"
        size="lg"
        color="primary"
        class="rounded-2xl px-10 py-4 font-bold shadow-lg transition-all hover:-translate-y-0.5"
      >
        Explorar productos
      </UButton>

      <UButton
        to="/about"
        size="lg"
        color="neutral"
        variant="subtle"
        class="rounded-2xl px-10 py-4 font-bold text-neutral-600 transition-all hover:-translate-y-0.5 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
      >
        Sobre nosotros
      </UButton>
    </div>
  </div>
</section>

    <section class="mb-10">
      <div class="mb-10 flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-black text-neutral-900 dark:text-white">
            Lo más vendido
          </h2>
          <p class="mt-2 text-neutral-500 dark:text-neutral-400">
            Los productos favoritos de nuestra comunidad.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <ProductCard
          v-for="product in bestsellingProducts?.data"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <section class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div
        class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
      >
        <div
          class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-primary-600 text-xl"
        >
          <UIcon name="i-lucide-truck" class="h-6 w-6" />
        </div>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
          Envío Rápido
        </h3>
        <p
          class="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed"
        >
          Entrega garantizada en menos de 72 horas en todo el país.
        </p>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
      >
        <div
          class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-amber-500 text-xl"
        >
          <UIcon name="i-lucide-shield-check" class="h-6 w-6" />
        </div>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
          Pago Seguro
        </h3>
        <p
          class="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed"
        >
          Cuidamos tu dinero como si fuera nuestro: con total discreción y
          seguridad absoluta.
        </p>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
      >
        <div
          class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-blue-500 text-xl"
        >
          <UIcon name="i-lucide-refresh-cw" class="h-6 w-6" />
        </div>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
          Devoluciones
        </h3>
        <p
          class="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed"
        >
          ¿No te gusta? Devuélvelo gratis en los primeros 30 días.
        </p>
      </div>
    </section>

    <ClientOnly>
      <section
        v-if="!authStore.isSalesAdmin && !authStore.isAdmin"
        class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center"
      >
        <div class="mx-auto max-w-xl">
          <h2 class="text-4xl font-black text-neutral-900 dark:text-white">
            ¿Listo para vender?
          </h2>
          <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            Únete a miles de emprendedores que ya están haciendo crecer su
            negocio con Prismart.
          </p>
          <UButton
            to="/start-selling"
            size="xl"
            color="primary"
            class="mt-8 rounded-xl px-12 font-semibold"
          >
            Empezar ahora
          </UButton>
        </div>
      </section>
    </ClientOnly>
  </div>
</template>
