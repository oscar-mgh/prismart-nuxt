<script setup lang="ts">
const { fetchApi } = useApi();

const allFavorites = ref<Product[]>([]);
const visibleFavorites = ref<Product[]>([]);
const pending = ref(true);

const itemsPerLoad = 8;
const currentLimit = ref(itemsPerLoad);

const loadMore = () => {
  visibleFavorites.value = allFavorites.value.slice(0, currentLimit.value);
  currentLimit.value += itemsPerLoad;
};

const handleScroll = () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= fullHeight - 300) {
    if (visibleFavorites.value.length < allFavorites.value.length) {
      loadMore();
    }
  }
};

onMounted(async () => {
  try {
    const response = await fetchApi<Product[]>("/products/favorites");

    allFavorites.value = response || [];
    loadMore();

    window.addEventListener("scroll", handleScroll);
  } finally {
    pending.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Favoritos
      </h1>
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton v-for="i in 8" :key="i" class="h-96 w-full rounded-2xl" />
    </div>

    <div v-else-if="visibleFavorites.length" class="space-y-10">
      <div
        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ProductCard
          v-for="product in visibleFavorites"
          :key="product.id"
          :product="product"
        />
      </div>

      <div
        v-if="visibleFavorites.length < allFavorites.length"
        class="flex justify-center pt-4"
      >
        <USkeleton class="h-10 w-40 rounded-xl" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-200/30 dark:bg-neutral-800/30 px-4 py-20 text-center dark:border-neutral-800"
    >
    <UIcon
        name="i-lucide-heart"
        class="mb-6 h-12 w-12 text-2xl text-neutral-300 dark:text-neutral-700"
      />
      <p class="text-neutral-500">Aún no tienes productos favoritos.</p>

      <UButton
        to="/products"
        color="primary"
        size="lg"
        class="mt-6 rounded-xl px-8 font-semibold"
      >
        Explorar productos
      </UButton>
    </div>
  </div>
</template>
