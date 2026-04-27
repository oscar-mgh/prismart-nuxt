<script setup lang="ts">
const { fetchApi } = useApi();
const authStore = useAuthStore();
const toast = useToast();

const page = ref(1);
const limit = ref(8);

definePageMeta({ middleware: "auth" });

const {
  data: productsData,
  pending,
  refresh,
} = await useAsyncData(
  "store-products",
  () =>
    fetchApi<PaginatedResponse<Product>>(
      `/products/store/${authStore.user?.storeId}?page=${page.value}&limit=${limit.value}`,
    ),
  { watch: [page] },
);

const isModalOpen = ref(false);
const selectedProductId = ref<string | null>(null);
const selectedProductName = ref("");
const imageFile = ref<File | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const loadingImage = ref(false);
const productToDeleteId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const isStockModalOpen = ref(false);
const stockProductId = ref<string | null>(null);
const stockProductName = ref("");
const stockQuantity = ref<number>(1);
const loadingStock = ref(false);
const isValidStockQuantity = computed(
  () => Number.isInteger(stockQuantity.value) && stockQuantity.value >= 1,
);

const imagePreviewUrl = computed(() =>
  imageFile.value ? URL.createObjectURL(imageFile.value) : null,
);

const onImageChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  imageFile.value = input.files?.[0] ?? null;
};

const openImageModal = (product: Product) => {
  selectedProductId.value = product.id;
  selectedProductName.value = product.name;
  imageFile.value = null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedProductId.value = null;
  selectedProductName.value = "";
  imageFile.value = null;
};

const openStockModal = (product: Product) => {
  stockProductId.value = product.id;
  stockProductName.value = product.name;
  stockQuantity.value = Math.max(product.stock, 1);
  isStockModalOpen.value = true;
};

const closeStockModal = () => {
  isStockModalOpen.value = false;
  stockProductId.value = null;
  stockProductName.value = "";
  stockQuantity.value = 1;
};

const onUpdateStock = async () => {
  if (!stockProductId.value || !isValidStockQuantity.value) return;

  loadingStock.value = true;
  try {
    await fetchApi(`/products/${stockProductId.value}/stock`, {
      method: "PATCH",
      body: {
        quantity: stockQuantity.value,
      },
    });

    toast.add({
      title: "Stock actualizado",
      description: `El stock de "${stockProductName.value}" fue actualizado exitosamente.`,
      color: "success",
      progress: false,
      duration: 3500,
    });

    closeStockModal();
    refresh();
  } catch (err: any) {
    const msg =
      err?.data?.message || "No se pudo actualizar el stock. Intenta de nuevo.";
    toast.add({
      title: "Error al actualizar stock",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingStock.value = false;
  }
};

const onUploadImage = async () => {
  if (!imageFile.value || !selectedProductId.value) return;
  loadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append("file", imageFile.value);
    await fetchApi(`/products/${selectedProductId.value}/image`, {
      method: "POST",
      body: formData,
    });
    toast.add({
      title: "Imagen actualizada",
      description: `La imagen de "${selectedProductName.value}" fue actualizada exitosamente.`,
      color: "success",
      progress: false,
      duration: 3000,
    });
    closeModal();
    refresh();
  } catch (err: any) {
    const msg =
      err?.data?.message ||
      "No se pudo actualizar la imagen. Intenta de nuevo.";
    toast.add({
      title: "Error al actualizar imagen",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingImage.value = false;
  }
};

const deleteProduct = async (product: Product) => {
  deletingId.value = product.id;
  try {
    await fetchApi(`/products/${product.id}`, {
      method: "DELETE",
    });

    toast.add({
      title: "Producto eliminado",
      description: `"${product.name}" ha sido eliminado.`,
      color: "success",
      progress: false,
      duration: 3500,
    });

    productToDeleteId.value = null;
    refresh();
  } catch (err: any) {
    const msg = err?.data?.message || "No se pudo eliminar el producto.";
    toast.add({
      title: "Error al eliminar",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    deletingId.value = null;
  }
};
</script>

<template>
  <div>
    <div class="mx-auto max-w-7xl py-12">
      <div class="mb-10 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black text-neutral-900 dark:text-white">
            Mis productos
          </h1>
          <p class="mt-2 text-neutral-500">
            Gestiona los productos de tu tienda.
            <span
              v-if="productsData?.totalElements"
              class="font-medium text-neutral-700 dark:text-neutral-300"
            >
              {{ productsData.totalElements }} productos en total.
            </span>
          </p>
        </div>
        <UButton
          to="/publish"
          color="primary"
          size="lg"
          icon="i-lucide-plus"
          class="hidden sm:flex rounded-xl font-bold cursor-pointer"
        >
          Publicar producto
        </UButton>
      </div>

      <div
        v-if="pending"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton v-for="i in 8" :key="i" class="h-80 w-full rounded-3xl" />
      </div>

      <div
        v-else-if="!productsData?.data?.length"
        class="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <UIcon
          name="i-lucide-package-x"
          class="h-12 w-12 text-3xl text-neutral-300 dark:text-neutral-700"
        />
        <p class="mt-4 font-medium text-neutral-500">
          Aún no tienes productos publicados.
        </p>
        <UButton
          to="/publish"
          color="primary"
          variant="subtle"
          class="mt-4 cursor-pointer rounded-xl"
        >
          Publicar tu primer producto
        </UButton>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="product in productsData.data"
          :key="product.id"
          class="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-neutral-900"
        >
          <div
            class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <NuxtImg
              :src="product.productImage || '/placeholder-product.png'"
              :alt="product.name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <button
              class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              @click="openImageModal(product)"
            >
              <div class="flex flex-col items-center gap-2 text-white">
                <UIcon name="i-lucide-camera" class="h-8 w-8" />
                <span class="text-xs font-semibold">Actualizar imagen</span>
              </div>
            </button>
          </div>

          <div class="flex flex-1 flex-col p-5">
            <p class="text-xs font-medium capitalize text-neutral-400">
              {{ product.category }}
            </p>
            <h3
              class="mt-1 font-bold text-neutral-900 dark:text-white line-clamp-2"
            >
              {{ product.name }}
            </h3>
            <p class="mt-1 text-xs text-neutral-400">SKU: {{ product.sku }}</p>

            <div class="mt-3 flex items-center justify-between">
              <span
                class="text-lg font-black text-primary-600 dark:text-primary-400"
              >
                {{
                  new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(product.price)
                }}
              </span>
              <UBadge
                :color="product.stock > 0 ? 'success' : 'error'"
                variant="subtle"
                size="sm"
              >
                {{
                  product.stock > 0 ? `${product.stock} en stock` : "Sin stock"
                }}
              </UBadge>
            </div>

            <UButton
              color="primary"
              variant="subtle"
              size="sm"
              icon="i-lucide-boxes"
              class="mt-3 cursor-pointer rounded-xl"
              @click="openStockModal(product)"
            >
              Actualizar stock
            </UButton>

            <div class="mt-4 flex flex-col gap-2">
              <div
                v-if="productToDeleteId === product.id"
                class="flex items-center justify-between gap-2 bg-red-50 dark:bg-red-950/20 p-2 rounded-xl border border-red-100 dark:border-red-900/30"
              >
                <span
                  class="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase ml-1"
                >
                  ¿Borrar?
                </span>

                <div class="flex gap-1">
                  <UButton
                    size="xs"
                    color="error"
                    variant="solid"
                    class="cursor-pointer rounded-lg font-bold"
                    :loading="deletingId === product.id"
                    @click="deleteProduct(product)"
                  >
                    Sí
                  </UButton>

                  <UButton
                    size="xs"
                    color="neutral"
                    variant="subtle"
                    class="cursor-pointer rounded-lg"
                    @click="productToDeleteId = null"
                  >
                    No
                  </UButton>
                </div>
              </div>

              <div v-else class="flex gap-2">
                <UButton
                  :to="`/product/${product.slug}`"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  icon="i-lucide-eye"
                  class="flex-1 cursor-pointer rounded-xl"
                >
                  Ver
                </UButton>
                <UButton
                  color="error"
                  variant="subtle"
                  size="sm"
                  icon="i-lucide-trash-2"
                  class="flex-1 cursor-pointer rounded-xl"
                  @click="productToDeleteId = product.id"
                >
                  Borrar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="productsData?.totalPages && productsData.totalPages > 1"
        class="mt-12 flex justify-center border-t border-neutral-100 pt-12 dark:border-neutral-800"
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

    <UModal
      v-model:open="isModalOpen"
      :ui="{ content: 'rounded-3xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-8">
          <div class="mb-6 flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
                Actualizar imagen
              </h2>
              <p class="mt-1 text-sm text-neutral-500 line-clamp-1">
                {{ selectedProductName }}
              </p>
            </div>
            <UButton
              color="error"
              variant="solid"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="closeModal"
            />
          </div>

          <div
            class="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors"
            :class="
              imagePreviewUrl
                ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/10'
                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-800'
            "
            style="aspect-ratio: 4/3"
            @click="imageInput?.click()"
          >
            <div v-if="!imagePreviewUrl" class="text-center">
              <UIcon
                name="i-lucide-image-plus"
                class="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600"
              />
              <p class="mt-3 text-sm font-medium text-neutral-500">
                Click para seleccionar imagen
              </p>
              <p class="mt-1 text-xs text-neutral-400">
                PNG, JPG, WEBP hasta 10MB
              </p>
            </div>
            <div v-else class="h-full w-full p-2">
              <img
                :src="imagePreviewUrl"
                class="h-full w-full rounded-xl object-cover"
              />
            </div>
            <input
              ref="imageInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="onImageChange"
            />
          </div>

          <div class="mt-6 flex gap-3">
            <UButton
              v-if="imageFile"
              color="neutral"
              variant="subtle"
              size="md"
              icon="i-lucide-trash-2"
              class="cursor-pointer rounded-xl"
              @click="imageFile = null"
            >
              Quitar
            </UButton>
            <div class="flex-1" />
            <UButton
              color="error"
              variant="solid"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="closeModal"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="md"
              class="cursor-pointer rounded-xl font-bold"
              :loading="loadingImage"
              :disabled="!imageFile"
              @click="onUploadImage"
            >
              Guardar imagen
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isStockModalOpen"
      :ui="{ content: 'rounded-3xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-8">
          <div class="mb-6 flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
                Actualizar stock
              </h2>
              <p class="mt-1 text-sm text-neutral-500 line-clamp-1">
                {{ stockProductName }}
              </p>
            </div>
            <UButton
              color="error"
              variant="solid"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="closeStockModal"
            />
          </div>

          <UFormField
            label="Cantidad"
            name="quantity"
            required
            class="w-full"
            hint="Debe ser al menos 1"
          >
            <UInput
              v-model.number="stockQuantity"
              type="number"
              min="1"
              step="1"
              size="xl"
              icon="i-lucide-box"
              class="w-full"
            />
          </UFormField>

          <div class="mt-6 flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="subtle"
              size="md"
              class="cursor-pointer rounded-xl"
              @click="closeStockModal"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="md"
              class="cursor-pointer rounded-xl font-bold"
              :loading="loadingStock"
              :disabled="!isValidStockQuantity"
              @click="onUpdateStock"
            >
              Guardar stock
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
