<script setup lang="ts">
const props = defineProps<{
  product: Product;
}>();

const formattedPrice = computed(() => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(props.product.price);
});

const discountPrice = computed(() => {
  if (!props.product.discount) return null;
  const discounted =
    props.product.price * (1 - props.product.discount.percentage / 100);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(discounted);
});
</script>

<template>
  <NuxtLink
    :to="`/product/${product.slug}`"
    class="group block cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-300 hover:ring-2 hover:ring-primary-500 shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden">
      <NuxtImg
        :src="product.productImage || '/placeholder-product.png'"
        :alt="product.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-if="product.discount" class="absolute right-4 top-4">
        <UBadge
          color="error"
          variant="solid"
          size="lg"
          class="font-semibold text-white"
        >
          -{{ product.discount.percentage }}%
        </UBadge>
      </div>
    </div>

    <hr class="text-zinc-400/40 dark:text-zinc-700/50 w-11/12 m-auto" />

    <div class="p-4 space-y-2">
      <h3
        class="line-clamp-1 text-lg font-bold text-neutral-900 dark:text-white"
      >
        {{ product.name }}
      </h3>
      <p class="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
        {{ product.description }}
      </p>

      <div class="pt-2 flex flex-col">
        <span
          v-if="discountPrice"
          class="text-xs text-neutral-400 line-through"
        >
          {{ formattedPrice }}
        </span>
        <span class="text-xl font-black text-neutral-900 text-primary">
          {{ discountPrice || formattedPrice }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
