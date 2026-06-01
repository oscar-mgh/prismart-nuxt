<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

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

// ── Image modal ──────────────────────────────────────────────────────────────
const isImageModalOpen = ref(false);
const selectedProductId = ref<string | null>(null);
const selectedProductName = ref("");
const imageFile = ref<File | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const loadingImage = ref(false);

const imagePreviewUrl = computed(() =>
  imageFile.value ? URL.createObjectURL(imageFile.value) : null,
);

const onImageChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  imageFile.value = input.files?.[0] ?? null;
};

const openImageModal = (product: Product, e: Event) => {
  e.stopPropagation();
  selectedProductId.value = product.id;
  selectedProductName.value = product.name;
  imageFile.value = null;
  isImageModalOpen.value = true;
};

const closeImageModal = () => {
  isImageModalOpen.value = false;
  selectedProductId.value = null;
  selectedProductName.value = "";
  imageFile.value = null;
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
      description: `La imagen de "${selectedProductName.value}" fue actualizada.`,
      color: "success",
      progress: false,
      duration: 3000,
    });
    closeImageModal();
    refresh();
  } catch (err: any) {
    toast.add({
      title: "Error al actualizar imagen",
      description: err?.data?.message || "No se pudo actualizar la imagen.",
      color: "error",
    });
  } finally {
    loadingImage.value = false;
  }
};

// ── Stock modal ───────────────────────────────────────────────────────────────
const isStockModalOpen = ref(false);
const stockProductId = ref<string | null>(null);
const stockProductName = ref("");
const stockQuantity = ref<number>(1);
const loadingStock = ref(false);

const isValidStockQuantity = computed(
  () => Number.isInteger(stockQuantity.value) && stockQuantity.value >= 1,
);

const openStockModal = (product: Product, e: Event) => {
  e.stopPropagation();
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
      body: { quantity: stockQuantity.value },
    });
    toast.add({
      title: "Stock actualizado",
      description: `El stock de "${stockProductName.value}" fue actualizado.`,
      color: "success",
      progress: false,
      duration: 3500,
    });
    closeStockModal();
    refresh();
  } catch (err: any) {
    toast.add({
      title: "Error al actualizar stock",
      description: err?.data?.message || "No se pudo actualizar el stock.",
      color: "error",
    });
  } finally {
    loadingStock.value = false;
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
const productToDeleteId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

const deleteProduct = async (product: Product, e: Event) => {
  e.stopPropagation();
  deletingId.value = product.id;
  try {
    await fetchApi(`/products/${product.id}`, { method: "DELETE" });
    toast.add({
      title: "Producto eliminado",
      description: `"${product.name}" fue eliminado.`,
      color: "success",
      progress: false,
      duration: 3500,
    });
    productToDeleteId.value = null;
    refresh();
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err?.data?.message || "No se pudo eliminar el producto.",
      color: "error",
    });
  } finally {
    deletingId.value = null;
  }
};

// ── Multi-select ──────────────────────────────────────────────────────────────
const selectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) selectedIds.value = new Set();
};

const toggleSelect = (id: string, e: Event) => {
  e.stopPropagation();
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
};

const selectAll = () => {
  if (!productsData.value?.data) return;
  const all = productsData.value.data.map((p) => p.id);
  if (selectedIds.value.size === all.length) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(all);
  }
};

const allSelected = computed(() => {
  const count = productsData.value?.data?.length ?? 0;
  return count > 0 && selectedIds.value.size === count;
});

// ── Discount modal ────────────────────────────────────────────────────────────
const isDiscountModalOpen = ref(false);
const loadingDiscount = ref(false);

const discountSchema = z.object({
  code: z
    .string()
    .min(3, "El código debe tener al menos 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[A-Z0-9_-]+$/, "Solo letras mayúsculas, números, _ o -"),
  percentage: z
    .number({ message: "Ingresa un porcentaje válido" })
    .min(1, "Mínimo 1%")
    .max(90, "Máximo 90%"),
  expirationDate: z.string().min(1, "La fecha es requerida"),
});

type DiscountForm = z.output<typeof discountSchema>;

const discountState = reactive<DiscountForm>({
  code: "",
  percentage: 10,
  expirationDate: "",
});

const selectedProducts = computed(
  () =>
    productsData.value?.data?.filter((p) => selectedIds.value.has(p.id)) ?? [],
);

const openDiscountModal = () => {
  discountState.code = "";
  discountState.percentage = 10;
  discountState.expirationDate = "";
  isDiscountModalOpen.value = true;
};

const applyDiscount = async (event: FormSubmitEvent<DiscountForm>) => {
  if (selectedIds.value.size === 0) return;
  loadingDiscount.value = true;

  try {
    const ids = Array.from(selectedIds.value);
    const skus = selectedProducts.value.map((p) => p.sku);

    await fetchApi("/products/apply-discount", {
      method: "PATCH",
      body: {
        ids,
        skus,
        code: event.data.code,
        percentage: event.data.percentage,
        expirationDate: new Date(event.data.expirationDate).toISOString(),
      },
    });

    toast.add({
      title: "Descuento aplicado",
      description: `Se aplicó ${event.data.percentage}% OFF a ${ids.length} producto${ids.length !== 1 ? "s" : ""}.`,
      color: "success",
      progress: false,
      duration: 4000,
    });

    isDiscountModalOpen.value = false;
    selectedIds.value = new Set();
    selectionMode.value = false;
    refresh();
  } catch (err: any) {
    toast.add({
      title: "Error al aplicar descuento",
      description: err?.data?.message || "No se pudo aplicar el descuento.",
      color: "error",
    });
  } finally {
    loadingDiscount.value = false;
  }
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    n,
  );
</script>

<template>
  <div>
    <div class="mx-auto max-w-7xl py-12">
      <div class="mb-10 flex items-center justify-between gap-4">
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
              {{ productsData.totalElements }} en total.
            </span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            v-if="productsData?.data?.length"
            :color="selectionMode ? 'primary' : 'neutral'"
            :variant="selectionMode ? 'solid' : 'subtle'"
            size="md"
            :icon="selectionMode ? 'i-lucide-check-square' : 'i-lucide-square'"
            class="cursor-pointer rounded-xl"
            @click="toggleSelectionMode"
          >
            {{ selectionMode ? "Cancelar selección" : "Aplicar descuentos" }}
          </UButton>

          <UButton
            to="/publish"
            color="primary"
            size="md"
            icon="i-lucide-plus"
            class="hidden sm:flex cursor-pointer rounded-xl font-bold"
          >
            Publicar
          </UButton>
        </div>
      </div>

      <transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="selectionMode"
          class="mb-6 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <input
            type="checkbox"
            :checked="allSelected"
            class="h-4 w-4 cursor-pointer accent-emerald-500"
            @change="selectAll"
          />
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ allSelected ? "Deseleccionar todos" : "Seleccionar todos" }}
          </span>
          <span
            v-if="selectedIds.size > 0"
            class="ml-auto text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          >
            {{ selectedIds.size }} seleccionado{{
              selectedIds.size !== 1 ? "s" : ""
            }}
          </span>
        </div>
      </transition>

      <div
        v-if="pending"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton v-for="i in 8" :key="i" class="h-80 w-full rounded-xl" />
      </div>

      <div
        v-else-if="!productsData?.data?.length"
        class="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <UIcon
          name="i-lucide-package-x"
          class="h-12 w-12 text-neutral-300 dark:text-neutral-700"
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
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="product in productsData.data"
          :key="product.id"
          class="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition-all duration-200 dark:bg-neutral-900 dark:ring-neutral-800"
          :class="[
            selectionMode && selectedIds.has(product.id)
              ? 'ring-2 ring-red-500 shadow-red-500/10 shadow-lg'
              : 'hover:shadow-md hover:ring-primary-300 dark:hover:ring-primary-700',
            selectionMode ? 'cursor-pointer' : 'cursor-pointer',
          ]"
          @click="
            selectionMode
              ? toggleSelect(product.id, $event)
              : navigateTo(`/product/${product.slug}`)
          "
        >
          <transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75"
          >
            <div
              v-if="selectionMode"
              class="absolute left-3 top-3 z-10"
              @click.stop="toggleSelect(product.id, $event)"
            >
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-150"
                :class="
                  selectedIds.has(product.id)
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-white/80 bg-black/30 backdrop-blur-sm'
                "
              >
                <UIcon
                  v-if="selectedIds.has(product.id)"
                  name="i-lucide-check"
                  class="h-3.5 w-3.5 text-white"
                />
              </div>
            </div>
          </transition>

          <div
            class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <NuxtImg
              :src="product.productImage || '/placeholder-product.png'"
              :alt="product.name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <div v-if="product.discount" class="absolute left-2 top-2">
              <span
                class="inline-flex items-center justify-center rounded-md bg-red-400 px-2.5 py-1 text-xs font-semibold text-white tracking-wide shadow-sm"
              >
                -{{ product.discount.percentage }}%
              </span>
            </div>

            <button
              v-if="!selectionMode"
              class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              @click="openImageModal(product, $event)"
            >
              <div class="flex flex-col items-center gap-2 text-white">
                <UIcon name="i-lucide-camera" class="h-7 w-7" />
                <span class="text-xs font-semibold">Cambiar imagen</span>
              </div>
            </button>
          </div>

          <div class="flex flex-1 flex-col p-4">
            <h3
              class="line-clamp-2 text-sm font-bold text-neutral-900 dark:text-white"
            >
              {{ product.name }}
            </h3>
            <p class="mt-0.5 text-[11px] text-neutral-400">
              SKU: {{ product.sku }}
            </p>
            <p class="text-[11px] capitalize text-neutral-400">
              {{ product.category }}
            </p>

            <div class="mt-2.5 flex items-center justify-between">
              <span
                class="text-base font-black text-emerald-600 dark:text-emerald-400"
              >
                {{ formatPrice(product.price) }}
              </span>
              <UBadge
                :color="product.stock > 0 ? 'success' : 'error'"
                variant="subtle"
                size="xs"
              >
                {{ product.stock > 0 ? `${product.stock} uds` : "Sin stock" }}
              </UBadge>
            </div>

            <div v-if="!selectionMode" class="mt-3 space-y-2">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="i-lucide-boxes"
                block
                class="cursor-pointer rounded-lg"
                @click="openStockModal(product, $event)"
              >
                Actualizar stock
              </UButton>

              <div
                v-if="productToDeleteId === product.id"
                class="flex items-center justify-between gap-1.5 rounded-lg border border-red-100 bg-red-50 p-1.5 dark:border-red-900/30 dark:bg-red-950/20"
              >
                <span
                  class="ml-1 text-[10px] font-bold uppercase text-red-600 dark:text-red-400"
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
                    @click="deleteProduct(product, $event)"
                  >
                    Sí
                  </UButton>
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="subtle"
                    class="cursor-pointer rounded-lg"
                    @click.stop="productToDeleteId = null"
                  >
                    No
                  </UButton>
                </div>
              </div>

              <UButton
                v-else
                color="error"
                variant="subtle"
                size="xs"
                icon="i-lucide-trash-2"
                block
                class="cursor-pointer rounded-lg"
                @click.stop="productToDeleteId = product.id"
              >
                Borrar
              </UButton>
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

    <Teleport to="body">
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-6"
      >
        <div
          v-if="selectionMode && selectedIds.size > 0"
          class="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div
            class="flex items-center gap-3 rounded-2xl border border-neutral-200/50 bg-white/90 px-5 py-3.5 shadow-2xl backdrop-blur-md dark:border-neutral-700/50 dark:bg-neutral-900/90"
          >
            <div class="flex items-center gap-2">
              <div
                class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500"
              >
                <span class="text-xs font-black text-white">{{
                  selectedIds.size
                }}</span>
              </div>
              <span
                class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
              >
                producto{{ selectedIds.size !== 1 ? "s" : "" }} seleccionado{{
                  selectedIds.size !== 1 ? "s" : ""
                }}
              </span>
            </div>

            <div class="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

            <UButton
              color="primary"
              size="sm"
              icon="i-lucide-tag"
              class="cursor-pointer rounded-xl font-semibold"
              @click="openDiscountModal"
            >
              Aplicar descuento
            </UButton>

            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              class="cursor-pointer rounded-xl"
              @click="selectedIds = new Set()"
            />
          </div>
        </div>
      </transition>
    </Teleport>

    <UModal
      v-model:open="isImageModalOpen"
      :ui="{ content: 'rounded-2xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                Actualizar imagen
              </h2>
              <p class="mt-0.5 line-clamp-1 text-sm text-neutral-500">
                {{ selectedProductName }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="closeImageModal"
            />
          </div>

          <div
            class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
            :class="
              imagePreviewUrl
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50'
            "
            style="aspect-ratio: 4/3"
            @click="imageInput?.click()"
          >
            <div v-if="!imagePreviewUrl" class="text-center">
              <UIcon
                name="i-lucide-image-plus"
                class="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600"
              />
              <p class="mt-2 text-sm font-medium text-neutral-500">
                Click para seleccionar
              </p>
              <p class="mt-1 text-xs text-neutral-400">
                PNG, JPG, WEBP — máx 10MB
              </p>
            </div>
            <div v-else class="h-full w-full p-2">
              <img
                :src="imagePreviewUrl"
                class="h-full w-full rounded-lg object-cover"
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

          <div class="mt-5 flex justify-end gap-2">
            <UButton
              v-if="imageFile"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-trash-2"
              class="cursor-pointer rounded-lg"
              @click="imageFile = null"
              >Quitar</UButton
            >
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="cursor-pointer rounded-lg"
              @click="closeImageModal"
              >Cancelar</UButton
            >
            <UButton
              color="primary"
              size="sm"
              class="cursor-pointer rounded-lg font-bold"
              :loading="loadingImage"
              :disabled="!imageFile"
              @click="onUploadImage"
              >Guardar</UButton
            >
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isStockModalOpen"
      :ui="{ content: 'rounded-2xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                Actualizar stock
              </h2>
              <p class="mt-0.5 line-clamp-1 text-sm text-neutral-500">
                {{ stockProductName }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="closeStockModal"
            />
          </div>

          <UFormField
            label="Cantidad en stock"
            name="quantity"
            required
            hint="Mínimo 1 unidad"
          >
            <UInput
              v-model.number="stockQuantity"
              type="number"
              min="1"
              step="1"
              size="lg"
              icon="i-lucide-box"
              class="w-full"
              :ui="{ root: 'rounded-xl' }"
            />
          </UFormField>

          <div class="mt-5 flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="cursor-pointer rounded-lg"
              @click="closeStockModal"
              >Cancelar</UButton
            >
            <UButton
              color="primary"
              size="sm"
              class="cursor-pointer rounded-lg font-bold"
              :loading="loadingStock"
              :disabled="!isValidStockQuantity"
              @click="onUpdateStock"
              >Guardar stock</UButton
            >
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isDiscountModalOpen"
      :ui="{ content: 'rounded-2xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-6 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                Aplicar descuento
              </h2>
              <p class="mt-0.5 text-sm text-neutral-500">
                {{ selectedIds.size }} producto{{
                  selectedIds.size !== 1 ? "s" : ""
                }}
                seleccionado{{ selectedIds.size !== 1 ? "s" : "" }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="isDiscountModalOpen = false"
            />
          </div>

          <div class="mb-5 flex flex-wrap gap-2">
            <div
              v-for="p in selectedProducts.slice(0, 5)"
              :key="p.id"
              class="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/30"
            >
              <div class="h-4 w-4 overflow-hidden rounded-full bg-neutral-200">
                <NuxtImg
                  v-if="p.productImage"
                  :src="p.productImage"
                  :alt="p.name"
                  class="h-full w-full object-cover"
                />
              </div>
              <span
                class="max-w-20 truncate text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >{{ p.name }}</span
              >
            </div>
            <div
              v-if="selectedProducts.length > 5"
              class="flex items-center rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800"
            >
              <span class="text-xs font-medium text-neutral-500"
                >+{{ selectedProducts.length - 5 }} más</span
              >
            </div>
          </div>

          <UForm
            :schema="discountSchema"
            :state="discountState"
            class="space-y-4"
            @submit="applyDiscount"
          >
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Código" name="code" required>
                <UInput
                  v-model="discountState.code"
                  placeholder="SUMMER2026"
                  size="lg"
                  icon="i-lucide-ticket"
                  class="w-full font-mono uppercase"
                  :ui="{ root: 'rounded-xl' }"
                  @input="discountState.code = discountState.code.toUpperCase()"
                />
              </UFormField>

              <UFormField label="Porcentaje (%)" name="percentage" required>
                <UInput
                  v-model.number="discountState.percentage"
                  type="number"
                  min="1"
                  max="90"
                  size="lg"
                  icon="i-lucide-percent"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>
            </div>

            <UFormField
              label="Fecha de expiración"
              name="expirationDate"
              required
            >
              <UInput
                v-model="discountState.expirationDate"
                type="datetime-local"
                size="lg"
                icon="i-lucide-calendar"
                class="w-full"
                :ui="{ root: 'rounded-xl' }"
              />
            </UFormField>

            <div
              v-if="discountState.percentage >= 1"
              class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-tag"
                  class="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                />
                <p class="text-sm text-emerald-700 dark:text-emerald-300">
                  Se aplicará
                  <span class="font-black"
                    >{{ discountState.percentage }}% OFF</span
                  >
                  con el código
                  <span class="font-mono font-bold">{{
                    discountState.code || "—"
                  }}</span>
                  a {{ selectedIds.size }} producto{{
                    selectedIds.size !== 1 ? "s" : ""
                  }}.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                color="neutral"
                variant="subtle"
                size="md"
                class="cursor-pointer rounded-xl"
                @click="isDiscountModalOpen = false"
                >Cancelar</UButton
              >
              <UButton
                type="submit"
                color="primary"
                size="md"
                class="cursor-pointer rounded-xl font-bold"
                :loading="loadingDiscount"
                icon="i-lucide-tag"
              >
                Aplicar descuento
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
