<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

const authStore = useAuthStore();
const { fetchApi } = useApi();
const toast = useToast();

definePageMeta({
  middleware: "auth",
});

const uploadingAvatar = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Administrador",
  SALES_ADMIN: "Vendedor",
  CUSTOMER: "Cliente",
  DELIVERY_AGENT: "Agente de entrega",
  SUPPORT: "Soporte",
};

const triggerFileInput = () => fileInput.value?.click();

const handleAvatarChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    toast.add({
      title: "Formato no permitido",
      description: "Solo se aceptan imágenes JPG, PNG o WebP.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Imagen demasiado grande",
      description: "El archivo no debe superar los 5MB.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }

  uploadingAvatar.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const updated = await fetchApi<{ avatar: string }>("/auth/avatar", {
      method: "POST",
      body: formData,
    });
    if (authStore.user) authStore.user.avatar = updated.avatar;
    toast.add({
      title: "Avatar actualizado",
      description: "Tu foto de perfil fue guardada correctamente.",
      color: "success",
      progress: false,
      duration: 3500,
    });
  } catch (err: any) {
    toast.add({
      title: "Error al subir imagen",
      description: err?.data?.message || "No se pudo actualizar el avatar.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    uploadingAvatar.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const store = ref<Store | null>(null);
const loadingStore = ref(false);
const updatingStore = ref(false);

const storeSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(60, "Máximo 60 caracteres"),
  address: z.object({
    street: z.string().min(1, "La calle es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    state: z.string().min(1, "El estado es requerido"),
    zipCode: z
      .string()
      .min(4, "Código postal inválido")
      .max(10, "Código postal inválido"),
  }),
});

type StoreForm = z.output<typeof storeSchema>;

const storeState = reactive<StoreForm>({
  name: "",
  address: { street: "", city: "", state: "", zipCode: "" },
});

const fetchStore = async () => {
  if (!authStore.user?.storeId) return;
  loadingStore.value = true;
  try {
    const response = await fetchApi<Store>(`/stores/${authStore.user.storeId}`);
    store.value = response;
    storeState.name = response.name;
    storeState.address = { ...response.address };
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo cargar la información de tu tienda.",
      color: "error",
    });
  } finally {
    loadingStore.value = false;
  }
};

const updateStore = async (event: FormSubmitEvent<StoreForm>) => {
  if (!store.value) return;
  updatingStore.value = true;
  try {
    const updated = await fetchApi<Store>(`/stores/${store.value.id}`, {
      method: "PATCH",
      body: event.data,
    });
    store.value = updated;
    toast.add({
      title: "Tienda actualizada",
      description: "Los cambios fueron guardados correctamente.",
      color: "success",
      progress: false,
      duration: 3500,
    });
  } catch (err: any) {
    toast.add({
      title: "Error al actualizar",
      description: err?.data?.message || "No se pudo actualizar la tienda.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    updatingStore.value = false;
  }
};

if (authStore.isSalesAdmin) {
  await fetchStore();
}
</script>

<template>
  <div class="mx-auto max-w-2xl py-12 space-y-8">
    <div class="flex items-center gap-6">
      <div class="relative shrink-0">
        <button
          type="button"
          class="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          :disabled="uploadingAvatar"
          @click="triggerFileInput"
        >
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.user.username"
            class="h-full w-full object-cover border-4 border-zinc-300 dark:border-neutral-800 rounded-xl"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-user" class="h-10 w-10" />
          </div>
          <div
            class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            :class="{ 'opacity-100': uploadingAvatar }"
          >
            <UIcon
              v-if="!uploadingAvatar"
              name="i-lucide-camera"
              class="h-5 w-5 text-white"
            />
            <UIcon
              v-else
              name="i-lucide-loader-2"
              class="h-5 w-5 animate-spin text-white"
            />
            <span class="text-[10px] font-semibold text-white">
              {{ uploadingAvatar ? "Subiendo..." : "Actualizar" }}
            </span>
          </div>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleAvatarChange"
        />
      </div>

      <div>
        <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
          Mi Perfil
        </h1>
        <p class="mt-2 text-neutral-500 text-sm">
          Información sobre la cuenta.
        </p>
        <p class="text-neutral-500 text-sm">
          Da click en tu avatar para actualizar tu foto de perfil.
        </p>
      </div>
    </div>

    <UCard class="rounded-xl border-none shadow-lg dark:bg-neutral-900">
      <div class="space-y-8">
        <div
          class="flex items-center justify-between rounded-xl bg-neutral-50 p-6 dark:bg-neutral-800/50"
        >
          <div>
            <p class="text-sm font-medium text-neutral-500">
              Estado de la cuenta
            </p>
            <div class="mt-1 flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-primary-500" />
              <span class="font-bold text-neutral-900 dark:text-white"
                >Activa</span
              >
            </div>
          </div>
          <UBadge color="primary" variant="subtle" class="rounded-md">
            {{ roleLabel[authStore.user?.role ?? ""] ?? authStore.user?.role }}
          </UBadge>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UFormField label="Nombre de usuario">
            <UInput
              :model-value="authStore.user?.username"
              disabled
              size="lg"
              class="w-full rounded-xl opacity-75"
            />
          </UFormField>
          <UFormField label="Correo electrónico">
            <UInput
              :model-value="authStore.user?.email"
              disabled
              size="lg"
              class="w-full rounded-xl opacity-75"
            />
          </UFormField>
        </div>
      </div>
    </UCard>

    <template v-if="authStore.isSalesAdmin">
      <div class="flex items-center gap-3 pt-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30"
        >
          <UIcon
            name="i-lucide-store"
            class="h-4 w-4 text-primary-600 dark:text-primary-400"
          />
        </div>
        <h2 class="text-xl font-black text-neutral-900 dark:text-white">
          Mi Tienda
        </h2>
      </div>

      <div v-if="loadingStore" class="space-y-4">
        <USkeleton class="h-24 w-full rounded-2xl" />
        <USkeleton class="h-48 w-full rounded-2xl" />
      </div>

      <div
        v-else-if="!store"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <UIcon
          name="i-lucide-store"
          class="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-700"
        />
        <p class="text-sm text-neutral-500">
          No se encontró información de tu tienda.
        </p>
      </div>

      <UForm
        v-else
        :schema="storeSchema"
        :state="storeState"
        class="space-y-6"
        @submit="updateStore"
      >
        <div
          class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-lg"
        >
          <h3
            class="mb-5 text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"
          >
            <UIcon name="i-lucide-tag" class="h-4 w-4 text-primary-500" />
            Identidad
          </h3>
          <UFormField label="Nombre de la tienda" name="name" required>
            <UInput
              v-model="storeState.name"
              placeholder="Ej: Tech World México"
              size="lg"
              icon="i-lucide-store"
              class="w-full"
              :ui="{ root: 'rounded-xl' }"
            />
          </UFormField>
        </div>

        <div
          class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-lg"
        >
          <h3
            class="mb-5 text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"
          >
            <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-primary-500" />
            Dirección
          </h3>
          <div class="space-y-4">
            <UFormField label="Calle y número" name="address.street" required>
              <UInput
                v-model="storeState.address.street"
                placeholder="Ej: Av. Insurgentes Sur 1234"
                size="lg"
                icon="i-lucide-map"
                class="w-full"
                :ui="{ root: 'rounded-xl' }"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Ciudad" name="address.city" required>
                <UInput
                  v-model="storeState.address.city"
                  placeholder="Ej: Ciudad de México"
                  size="lg"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>
              <UFormField
                label="Estado / Provincia"
                name="address.state"
                required
              >
                <UInput
                  v-model="storeState.address.state"
                  placeholder="Ej: CDMX"
                  size="lg"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Código postal" name="address.zipCode" required>
                <UInput
                  v-model="storeState.address.zipCode"
                  placeholder="Ej: 03100"
                  size="lg"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            class="cursor-pointer rounded-xl px-8 font-bold"
            :loading="updatingStore"
          >
            Guardar cambios
          </UButton>
        </div>
      </UForm>
    </template>
  </div>
</template>
