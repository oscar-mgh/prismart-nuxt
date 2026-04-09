<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    statusMessage: string;
    message: string;
  };
}>();

const is404 = computed(() => props.error.statusCode === 404);

const handleError = () => clearError({ redirect: "/" });
const goBack = () => {
  clearError();
  window.history.back();
};
</script>

<template>
  <div
    class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4"
  >
    <div class="text-center max-w-lg">
      <div class="relative mb-8 select-none">
        <p
          class="text-[10rem] font-black leading-none tracking-tighter text-neutral-100 dark:text-neutral-900"
        >
          {{ error.statusCode }}
        </p>
      </div>

      <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
        {{ is404 ? "Página no encontrada" : "Algo salió mal" }}
      </h1>

      <p class="mt-3 text-neutral-500 dark:text-neutral-400">
        {{
          is404
            ? "La página que buscas no existe."
            : "Ocurrió un error inesperado. Intenta de nuevo en unos momentos."
        }}
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-5">
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-house"
          class="cursor-pointer rounded-xl px-6 font-semibold"
          @click="handleError"
        >
          Volver al inicio
        </UButton>

        <UButton
          color="neutral"
          variant="subtle"
          size="lg"
          class="cursor-pointer rounded-xl px-6 font-semibold"
          @click="goBack"
        >
          Página anterior
        </UButton>
      </div>
    </div>
  </div>
</template>
