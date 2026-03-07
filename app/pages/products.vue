<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { fetchApi } = useApi();

const page = ref(Number(route.query.page) || 1);
const limit = ref(Number(route.query.limit) || 8);
const category = ref(route.query.category?.toString() || "");
const name = ref(route.query.name?.toString() || "");

const sortOptions = [
  { label: "Más recientes", value: "recent" },
  { label: "Precio: Bajo a Alto", value: "price_low" },
  { label: "Precio: Alto a Bajo", value: "price_high" },
  { label: "Más vendidos", value: "best_selling" },
  { label: "Mejor calificados", value: "best_rated" },
];

const sortBy = ref(route.query.sortBy?.toString() || "recent");

const selectedSort = computed({
  get: () => sortBy.value,
  set: (value) => {
    sortBy.value = value;
    category.value = "";
    page.value = 1;
  },
});

const getEndpoint = () => {
  const hasCategory = !!category.value;
  const hasName = !!name.value.trim();

  if (hasCategory || hasName) {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
      sortByPurchaseCount: "asc",
    });

    if (hasCategory) {
      params.append("category", category.value);
    }

    if (hasName) {
      params.append("name", name.value.trim());
    }

    return `/products/criteria?${params.toString()}`;
  }

  return `/products?page=${page.value}&limit=${limit.value}&sortBy=${sortBy.value}`;
};

const { data: productsData, pending } = await useAsyncData(
  "products",
  () => fetchApi<PaginatedResponse<Product>>(getEndpoint()),
  {
    watch: [page, limit, sortBy, category, name],
  },
);

const { data: categories } = await useAsyncData("categories", () =>
  fetchApi<string[]>("/products/categories"),
);

watch([page, limit, sortBy, category, name], async () => {
  const useCriteria = !!category.value || !!name.value.trim();

  await router.replace({
    query: {
      page: page.value.toString(),
      limit: limit.value.toString(),
      sortBy: useCriteria ? undefined : sortBy.value,
      category: category.value || undefined,
      name: name.value.trim() || undefined,
    },
  });
});

watch(
  () => route.query,
  () => {
    page.value = Number(route.query.page) || 1;
    limit.value = Number(route.query.limit) || 8;
    sortBy.value = route.query.sortBy?.toString() || "recent";
    category.value = route.query.category?.toString() || "";
    name.value = route.query.name?.toString() || "";
  },
);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-end gap-8">
      <div v-if="!name" class="shrink-0 w-full sm:w-auto">
        <h3
          class="mb-2 text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100"
        >
          Ordenar por
        </h3>
        <USelect
          v-model="selectedSort"
          :items="sortOptions"
          value-key="value"
          option-attribute="label"
          class="w-full sm:w-48"
          size="md"
        />
      </div>

      <div v-if="!name" class="min-w-0 w-full flex-1 mt-4 sm:mt-0">
        <h3
          class="mb-2 text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100"
        >
          Categorías
        </h3>
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <NuxtLink
            v-for="cat in categories"
            :key="cat"
            :to="`/products?category=${cat}&page=1`"
            class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            :class="
              category === cat
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-primary-500 dark:hover:text-primary-400'
            "
          >
            {{ cat }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="flex-1 space-y-12">
      <div
        v-if="pending"
        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton v-for="i in 8" :key="i" class="h-96 w-full rounded-3xl" />
      </div>

      <div
        v-else-if="productsData?.data?.length"
        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ProductCard
          v-for="product in productsData.data"
          :key="product.id"
          :product="product"
        />
      </div>

      <div
        v-else
        class="flex h-64 items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <p class="text-neutral-500">
          No se encontraron productos
        </p>
      </div>

      <div
        v-if="productsData?.totalPages"
        class="flex justify-center border-t border-neutral-100 pt-12 dark:border-neutral-800"
      >
        <UPagination
          v-model:page="page"
          :total="productsData.totalElements"
          :items-per-page="limit"
          size="lg"
          :ui="{ item: 'cursor-pointer' }"
        />
      </div>
    </div>
  </div>
</template>
