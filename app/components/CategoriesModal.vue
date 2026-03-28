<template>
  <div>
    <UButton
      label="Categorías"
      color="neutral"
      variant="link"
      class="pl-0 text-sm cursor-pointer hover:text-primary-600"
      @click="isOpen = true"
    />

    <UModal v-model:open="isOpen">
      <template #content>
        <div class="p-6">
          <ul v-for="category in categories" :key="category" class="space-y-3">
            <li>
              <NuxtLink
                :to="`/products?category=${category}&page=1`"
                class="text-neutral-500 hover:text-primary-600 dark:text-neutral-400 block w-full py-2"
                @click="closeModal"
              >
                {{ category }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { fetchApi } = useApi();

const { data: categories } = await useAsyncData("categories", () =>
  fetchApi<string[]>("/products/categories"),
);

const isOpen = ref(false);

const closeModal = () => {
  isOpen.value = false;
};
</script>
