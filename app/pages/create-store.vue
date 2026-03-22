<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  middleware: "auth",
});

const { fetchApi } = useApi();
const toast = useToast();
const loading = ref(false);

const schema = z.object({
  name: z
    .string({ message: "El nombre es requerido" })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(60, "El nombre no puede superar 60 caracteres"),

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

export type UserSchema = z.infer<typeof schema>;

type StoreForm = z.output<typeof schema>;

const state = reactive<StoreForm>({
  name: "",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
  },
});

const createStore = async (event: FormSubmitEvent<StoreForm>) => {
  loading.value = true;
  try {
    await fetchApi("/stores", {
      method: "POST",
      body: event.data,
    });

    toast.add({
      title: "¡Tienda creada!",
      description: `Tu tienda "${event.data.name}" está lista. Ya puedes publicar productos.`,
      color: "success",
      progress: false,
      duration: 3500,
    });

    navigateTo("/publish");
  } catch (err: any) {
    const msg =
      err?.data?.message || "No se pudo crear la tienda. Intenta de nuevo.";
    toast.add({
      title: "Error al crear la tienda",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="mx-auto max-w-2xl py-12">
    <div class="mb-10">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30"
        >
          <UIcon
            name="i-lucide-store"
            class="h-5 w-5 text-primary-600 dark:text-primary-400"
          />
        </div>
        <div class="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <div
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800"
        >
          <UIcon name="i-lucide-package" class="h-5 w-5 text-neutral-400" />
        </div>
      </div>
      <p
        class="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2"
      >
        Paso 2 de 2
      </p>
      <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
        Configura tu tienda
      </h1>
      <p class="mt-2 text-neutral-500 dark:text-neutral-400">
        Completa los datos de tu negocio. Podrás editarlos después desde tu
        panel.
      </p>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="createStore"
    >
      <div
        class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2
          class="mb-5 text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2"
        >
          <UIcon name="i-lucide-tag" class="h-4 w-4 text-primary-500" />
          Identidad de la tienda
        </h2>

        <UFormField label="Nombre de la tienda" name="name" required>
          <UInput
            v-model="state.name"
            placeholder="Ej: Tech World México"
            size="lg"
            icon="i-lucide-store"
            class="w-full"
            :ui="{ root: 'rounded-xl' }"
          />
        </UFormField>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2
          class="mb-5 text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2"
        >
          <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-primary-500" />
          Dirección del negocio
        </h2>

        <div class="space-y-4">
          <UFormField label="Calle y número" name="address.street" required>
            <UInput
              v-model="state.address.street"
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
                v-model="state.address.city"
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
                v-model="state.address.state"
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
                v-model="state.address.zipCode"
                placeholder="Ej: 03100"
                size="lg"
                class="w-full"
                :ui="{ root: 'rounded-xl' }"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <UButton
          to="/start-selling"
          color="neutral"
          variant="subtle"
          size="lg"
          class="cursor-pointer rounded-xl"
        >
          Volver
        </UButton>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="cursor-pointer rounded-xl px-8 font-bold"
          :loading="loading"
        >
          Crear mi tienda
        </UButton>
      </div>
    </UForm>
  </div>
</template>
