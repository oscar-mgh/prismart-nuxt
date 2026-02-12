<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

const authStore = useAuthStore();
const { fetchApi } = useApi();
const loading = ref(false);

const schema = z.object({
  username: z
    .string()
    .min(4, "El nombre de usuario debe tener al menos 4 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  username: "",
  email: "",
  password: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const response = await fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: event.data,
    });

    authStore.setAuth(response);
    navigateTo("/");
  } catch (error: any) {
    console.error("Registration error:", error);
  } finally {
    loading.value = false;
  }
}

definePageMeta({
  middleware: "guest",
  layout: "default",
});
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <UCard
      class="w-full max-w-md rounded-3xl border-none shadow-2xl dark:bg-neutral-900"
    >
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
          Crea tu cuenta
        </h1>
        <p class="mt-2 text-neutral-500">
          Únete a Prismart y empieza a comprar o vender hoy mismo.
        </p>
      </div>

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Nombre de usuario" name="username">
          <UInput
            v-model="state.username"
            placeholder="usuario123"
            size="lg"
            icon="i-lucide-user"
            class="rounded-xl w-full"
          />
        </UFormField>

        <UFormField label="Correo electrónico" name="email">
          <UInput
            v-model="state.email"
            placeholder="ejemplo@correo.com"
            size="lg"
            icon="i-lucide-mail"
            class="rounded-xl w-full"
          />
        </UFormField>

        <UFormField label="Contraseña" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            size="lg"
            icon="i-lucide-lock"
            class="rounded-xl w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          block
          size="xl"
          class="rounded-xl font-semibold cursor-pointer"
          :loading="loading"
        >
          Crear Cuenta
        </UButton>
      </UForm>

      <div class="mt-8 text-center text-sm">
        <span class="text-neutral-500">¿Ya tienes una cuenta?</span>
        <NuxtLink
          to="/login"
          class="ml-1 font-semibold cursor-pointer text-primary-600 hover:underline"
        >
          Inicia sesión
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
