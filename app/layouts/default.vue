<template>
  <div class="min-h-screen flex flex-col">
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2">
          <AppLogo class="w-auto h-6 shrink-0" />
          <span class="font-bold text-xl tracking-tight">Prismart</span>
        </NuxtLink>
      </template>

      <div class="flex items-center gap-4">
        <UInput
          icon="i-lucide-search"
          placeholder="Buscar productos..."
          variant="subtle"
          color="neutral"
          class="hidden lg:block w-114"
        />
      </div>

      <template #right>
        <div class="flex items-center gap-3">
          <UButton
            label="Iniciar Sesión"
            variant="ghost"
            color="neutral"
            to="/auth/login"
          />
          <UButton label="Registrarse" color="neutral" to="/auth/register" />

          <USeparator orientation="vertical" class="h-4 mx-1" />
          <UColorModeButton class="cursor-pointer" />
        </div>
      </template>
    </UHeader>

    <UMain class="grow">
      <slot />
    </UMain>

    <UFooter class="mb-2">
      <div class="flex w-full justify-center">
        <p class="text-xs sm:text-sm text-neutral-500 text-center">
          © {{ new Date().getFullYear() }} Prismart. Todos los derechos reservados.
        </p>
      </div>
    </UFooter>
  </div>
</template>