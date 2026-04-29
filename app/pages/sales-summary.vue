<script setup lang="ts">
const { fetchApi } = useApi();
const authStore = useAuthStore();

const { data: storeData } = await useAsyncData("store-info", () =>
  fetchApi<any>(`/stores/${authStore.user?.storeId}`),
);

const { data: productStats } = await useAsyncData("seller-products", () =>
  fetchApi<PaginatedResponse<Product>>(
    `/products/store/${authStore.user?.storeId}?page=1&limit=50`,
  ),
);

const topProducts = computed(() =>
  [...(productStats.value?.data ?? [])]
    .sort((a, b) => (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0))
    .slice(0, 5),
);

const totalSales = computed(() => {
  return (
    productStats.value?.data.reduce(
      (acc, p) => acc + (p.purchaseCount || 0),
      0,
    ) || 0
  );
});

const estimatedRevenue = computed(() => {
  const raw =
    productStats.value?.data.reduce(
      (acc, p) => acc + p.price * (p.purchaseCount || 0),
      0,
    ) || 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(raw);
});

definePageMeta({
  middleware: "auth",
});
</script>
<template>
  <div class="space-y-8 py-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
          Resumen de Ventas
        </h1>
        <p class="mt-1 text-sm text-neutral-500">
          Bienvenido de nuevo,
          <span class="font-bold text-primary-600">{{
            authStore.user?.username
          }}</span
          >.
        </p>
      </div>
      <UButton
        to="/publish"
        color="primary"
        size="sm"
        icon="i-lucide-plus"
        class="rounded-lg font-bold cursor-pointer"
      >
        Nuevo Producto
      </UButton>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 p-5 text-white shadow-md"
      >
        <p class="text-xs font-bold uppercase tracking-wider opacity-70">
          Ventas Totales
        </p>
        <div class="mt-3 flex items-end justify-between">
          <p class="text-3xl font-black">{{ totalSales }}</p>
          <UIcon name="i-lucide-shopping-bag" class="h-8 w-8 opacity-20" />
        </div>
      </div>

      <div
        class="rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-5 text-white shadow-md"
      >
        <p class="text-xs font-bold uppercase tracking-wider opacity-70">
          Ingresos Estimados
        </p>
        <div class="mt-3 flex items-end justify-between">
          <p class="text-3xl font-black">{{ estimatedRevenue }}</p>
          <UIcon name="i-lucide-dollar-sign" class="h-8 w-8 opacity-20" />
        </div>
      </div>

      <div
        class="rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-5 text-white shadow-md"
      >
        <p class="text-xs font-bold uppercase tracking-wider opacity-70">
          Productos Activos
        </p>
        <div class="mt-3 flex items-end justify-between">
          <p class="text-3xl font-black">
            {{ productStats?.totalElements || 0 }}
          </p>
          <UIcon name="i-lucide-layers" class="h-8 w-8 opacity-20" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2
          class="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
        >
          Productos más vendidos
        </h2>
        <div class="space-y-3">
          <div
            v-for="(product, index) in topProducts"
            :key="product.id"
            class="flex items-center gap-3"
          >
            <span
              class="w-4 text-xs font-bold text-neutral-300 dark:text-neutral-600"
            >
              {{ index + 1 }}
            </span>
            <NuxtImg
              :src="product.productImage || '/placeholder-product.png'"
              class="h-10 w-10 rounded-lg object-cover"
            />
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-semibold text-neutral-900 dark:text-white"
              >
                {{ product.name }}
              </p>
              <p class="text-xs text-neutral-400">
                {{ product.purchaseCount }} ventas
              </p>
            </div>
            <p class="shrink-0 text-sm font-black text-primary-600">
              ${{ product.price }}
            </p>
          </div>

          <div
            v-if="!topProducts.length"
            class="py-6 text-center text-sm text-neutral-400"
          >
            Aún no tienes ventas registradas.
          </div>
        </div>
      </div>

      <div
        class="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-600/20"
        >
          <UIcon name="i-lucide-lightbulb" class="h-7 w-7 text-amber-400" />
        </div>
        <h2 class="mt-4 text-base font-black text-neutral-900 dark:text-white">
          Consejo de Prismart
        </h2>
        <p class="mt-2 max-w-xs text-center text-sm text-neutral-500">
          {{
            totalSales > 10
              ? "¡Excelente trabajo! Considera aplicar descuentos a tus productos menos vendidos para rotar el inventario."
              : "¡Estás empezando! Asegúrate de que tus productos tengan descripciones detalladas y fotos de alta calidad para generar confianza."
          }}
        </p>
      </div>
    </div>
  </div>
</template>
