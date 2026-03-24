<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import { toTitleCase } from "~~/shared/utils/title-case";

const { fetchApi } = useApi();
const router = useRouter();
const authStore = useAuthStore();

const step = ref<1 | 2>(1);
const createdProductId = ref<string | null>(null);
const createdProductSlug = ref<string | null>(null);
const loadingProduct = ref(false);
const toast = useToast();

const schema = z.object({
  name: z.string().min(4, "El nombre debe tener al menos 4 caracteres"),
  description: z
    .string()
    .min(30, "La descripción debe ser más detallada (30+ car)"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  sku: z.string().min(4, "El SKU es obligatorio"),
  category: z.string().min(1, "La categoría es obligatoria"),
  features: z.string().min(1, "Agrega al menos una especificación"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  name: "",
  description: "",
  price: 0,
  stock: 0,
  sku: "",
  category: "",
  features: "",
});

const onSubmitProduct = async (event: FormSubmitEvent<Schema>) => {
  if (!authStore.user?.storeId) {
    toast.add({
      title: "Sin tienda asignada",
      description:
        "Tu cuenta no tiene una tienda asociada. Contacta a soporte.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }
  loadingProduct.value = true;
  try {
    const product = await fetchApi<any>("/products", {
      method: "POST",
      body: {
        ...event.data,
        category: toTitleCase(event.data.category.trim()),
        features: event.data.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        storeId: authStore.user.storeId,
      },
    });
    createdProductId.value = product.id;
    createdProductSlug.value = product.slug;
    step.value = 2;
  } catch (err: any) {
    const msg =
      err?.data?.message || "No se pudo crear el producto. Intenta de nuevo.";
    toast.add({
      title: "Error al crear producto",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingProduct.value = false;
  }
};

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

const onUploadImage = async () => {
  if (!createdProductId.value) return;

  if (!imageFile.value) {
    toast.add({
      title: "¡Producto publicado!",
      description:
        "Tu producto ya está disponible. Puedes agregar una imagen después.",
      color: "success",
      progress: false,
      duration: 3500,
    });
    return navigateTo(`/product/${createdProductSlug.value}`);
  }

  loadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append("file", imageFile.value);
    await fetchApi(`/products/${createdProductId.value}/image`, {
      method: "POST",
      body: formData,
    });
    toast.add({
      title: "¡Producto publicado!",
      description: "Tu producto y su imagen fueron publicados exitosamente.",
      color: "success",
      progress: false,
      duration: 3500,
    });
    navigateTo(`/product/${createdProductSlug.value}`);
  } catch (err: any) {
    const msg =
      err?.data?.message ||
      "El producto se creó pero la imagen no pudo subirse.";
    toast.add({
      title: "Error al subir imagen",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingImage.value = false;
  }
};

const skipImage = () => {
  toast.add({
    title: "¡Producto publicado!",
    description:
      "Puedes agregar una imagen desde el panel de tu producto cuando quieras.",
    color: "neutral",
    progress: false,
    duration: 3500,
  });
  navigateTo(`/product/${createdProductSlug.value}`);
};

definePageMeta({ middleware: "auth" });
</script>

<template>
  <div class="mx-auto max-w-4xl py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
        Publicar Nuevo Producto
      </h1>
      <p class="mt-1 text-sm text-neutral-500">
        Llena los detalles para poner tu producto frente a miles de compradores.
      </p>
    </div>

    <div class="mb-6 flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
          :class="
            step === 1
              ? 'bg-primary-500 text-white'
              : 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
          "
        >
          <UIcon v-if="step === 2" name="i-lucide-check" class="h-3.5 w-3.5" />
          <span v-else>1</span>
        </div>
        <span
          class="text-sm font-medium"
          :class="
            step === 1 ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
          "
        >
          Información del producto
        </span>
      </div>

      <div class="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />

      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
          :class="
            step === 2
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-700'
          "
        >
          2
        </div>
        <span
          class="text-sm font-medium"
          :class="
            step === 2 ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
          "
        >
          Imagen del producto
        </span>
      </div>
    </div>

    <UForm
      v-if="step === 1"
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmitProduct"
    >
      <section
        class="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormField
            label="Nombre del producto"
            name="name"
            required
            class="w-full"
          >
            <UInput
              v-model="state.name"
              placeholder="Ej: Galaxy S25 Edge"
              size="md"
              class="w-full"
            />
          </UFormField>

          <UFormField label="SKU / Código" name="sku" required class="w-full">
            <UInput
              v-model="state.sku"
              placeholder="GALAXY-S25-EDGE"
              size="md"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Precio (MXN)" name="price" required class="w-full">
            <UInput
              v-model.number="state.price"
              type="number"
              step="0.01"
              size="md"
              icon="i-lucide-dollar-sign"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Stock inicial"
            name="stock"
            required
            class="w-full"
          >
            <UInput
              v-model.number="state.stock"
              type="number"
              size="md"
              icon="i-lucide-box"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Categoría"
            name="category"
            required
            class="w-full md:col-span-2"
          >
            <UInput
              v-model="state.category"
              placeholder="Smartphones, Ropa, Accesorios, etc."
              size="md"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Descripción detallada"
          name="description"
          required
          class="w-full"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Describe las ventajas y características de tu producto..."
            :rows="4"
            size="md"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Especificaciones"
          name="features"
          required
          class="w-full"
          hint="Una especificación por línea"
        >
          <UTextarea
            v-model="state.features"
            placeholder='Pantalla: AMOLED 6.7" QHD+ 120Hz&#10;Batería: 3900mAh, 25W wired&#10;Memoria: 256GB ROM 12GB RAM'
            :rows="5"
            size="md"
            class="w-full font-mono text-sm"
          />
        </UFormField>
      </section>

      <div class="flex justify-end gap-3">
        <UButton
          variant="subtle"
          color="error"
          size="md"
          class="rounded-lg px-6 cursor-pointer"
          @click="router.back()"
        >
          Cancelar
        </UButton>
        <UButton
          type="submit"
          color="primary"
          size="md"
          class="rounded-lg px-8 font-bold cursor-pointer"
          :loading="loadingProduct"
        >
          Continuar
        </UButton>
      </div>
    </UForm>

    <div v-else class="space-y-4">
      <section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <div class="mb-4">
          <h2 class="text-base font-bold text-neutral-900 dark:text-white">
            Imagen del producto
          </h2>
          <p class="mt-1 text-sm text-neutral-500">
            Agrega una imagen principal para que los compradores puedan ver tu
            producto. Puedes omitir este paso y hacerlo después.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
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
                class="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600"
              />
              <p class="mt-2 text-sm font-medium text-neutral-500">
                Click para seleccionar imagen
              </p>
              <p class="mt-0.5 text-xs text-neutral-400">
                PNG, JPG, WEBP hasta 10MB
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

          <div class="flex flex-col justify-center space-y-3">
            <div class="flex items-start gap-3">
              <div
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40"
              >
                <UIcon
                  name="i-lucide-image"
                  class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <p
                  class="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Imagen principal
                </p>
                <p class="text-xs text-neutral-500">
                  Esta será la imagen que los compradores verán primero en los
                  listados.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
              >
                <UIcon
                  name="i-lucide-zap"
                  class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                />
              </div>
              <div>
                <p
                  class="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Recomendado
                </p>
                <p class="text-xs text-neutral-500">
                  Los productos con imagen reciben hasta 3x más visitas.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon
                  name="i-lucide-settings-2"
                  class="h-3.5 w-3.5 text-neutral-500"
                />
              </div>
              <div>
                <p
                  class="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Editable después
                </p>
                <p class="text-xs text-neutral-500">
                  Puedes cambiar la imagen desde el panel de tu producto en
                  cualquier momento.
                </p>
              </div>
            </div>

            <UButton
              v-if="imageFile"
              variant="subtle"
              color="error"
              size="sm"
              icon="i-lucide-trash-2"
              class="mt-2 w-fit cursor-pointer"
              @click="imageFile = null"
            >
              Quitar imagen
            </UButton>
          </div>
        </div>
      </section>

      <div class="flex justify-between gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          size="md"
          class="rounded-lg px-6 cursor-pointer"
          @click="skipImage"
        >
          Omitir por ahora
        </UButton>
        <UButton
          color="primary"
          size="md"
          class="rounded-lg px-8 font-bold cursor-pointer"
          :loading="loadingImage"
          :disabled="!imageFile"
          @click="onUploadImage()"
        >
          Publicar producto
          <template #trailing>
            <UIcon name="i-lucide-check" />
          </template>
        </UButton>
      </div>
    </div>
  </div>
</template>
