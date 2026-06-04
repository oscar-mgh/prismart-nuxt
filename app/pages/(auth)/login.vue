<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

const authStore = useAuthStore();
const { fetchApi } = useApi();
const loading = ref(false);

const toast = useToast();

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  email: "",
  password: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const response = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: event.data,
    });

    authStore.setAuth(response);
    window.location.href = "/";
  } catch (error: any) {
    console.error("Login error:", error);

    const statusCode =
      error?.statusCode || error?.response?.status || error?.data?.statusCode;
    const messagePayload = error?.data?.message;

    if (statusCode === 401) {
      const hasMessage = (text: string) => {
        if (Array.isArray(messagePayload)) {
          return messagePayload.includes(text);
        }
        return messagePayload === text;
      };

      if (hasMessage("User account is disabled")) {
        toast.add({
          title: "Acceso denegado",
          description:
            "El usuario no tiene acceso, contacta con el administrador.",
          color: "error",
          icon: "i-lucide-shield-alert",
        });
      } else if (hasMessage("Invalid credentials")) {
        toast.add({
          title: "Error de autenticación",
          description: "Correo electrónico o contraseña incorrectos.",
          color: "warning",
          icon: "i-lucide-lock-keyhole",
        });
      } else {
        toast.add({
          title: "Error de autorización",
          description: "No autorizado para realizar esta acción.",
          color: "error",
        });
      }
    } else {
      toast.add({
        title: "Error del servidor",
        description: "Ocurrió un problema inesperado. Inténtalo más tarde.",
        color: "error",
      });
    }
  } finally {
    loading.value = false;
  }
}

definePageMeta({
  layout: "default",
  middleware: "guest",
});
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <UCard
      class="w-full max-w-md rounded-3xl border-none shadow-2xl dark:bg-neutral-900"
    >
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
          Bienvenido de nuevo
        </h1>
        <p class="mt-2 text-neutral-500">
          Ingresa tus datos para acceder a tu cuenta.
        </p>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
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
          Iniciar Sesión
        </UButton>
      </UForm>

      <div class="mt-8 text-center text-sm">
        <span class="text-neutral-500">¿No tienes una cuenta?</span>
        <NuxtLink
          to="/register"
          class="ml-1 font-semibold text-primary-600 hover:underline"
        >
          Registrate ahora
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
