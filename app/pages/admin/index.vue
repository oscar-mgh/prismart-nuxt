<script setup lang="ts">

const { fetchApi } = useApi();

const { data: users, refresh: refreshUsers } = await useAsyncData(
  "admin-users",
  () => fetchApi<User[]>("/auth/all"),
);

const toggleUserStatus = async (user: User) => {
  try {
    if (user.active) {
      await fetchApi(`/auth/disable/${user.id}`, { method: "DELETE" });
    } else {
      await fetchApi(`/auth/enable/${user.id}`, { method: "PATCH" });
    }
    refreshUsers();
  } catch (error) {
    console.error("Error toggling user status:", error);
  }
};

definePageMeta({
  middleware: "admin",
});
</script>

<template>
  <div class="space-y-10 py-12">
    <div>
      <h1 class="text-4xl font-black text-neutral-900 dark:text-white">
        Panel de Administración
      </h1>
      <p class="mt-2 text-neutral-500">
        Gestión global de usuarios y tiendas de Prismart.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      <UCard class="rounded-xl bg-primary-50 dark:bg-primary-950/20">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white"
          >
            <UIcon name="i-lucide-users" />
          </div>
          <div>
            <p
              class="text-sm text-primary-600 dark:text-primary-400 font-bold uppercase"
            >
              Usuarios
            </p>
            <p class="text-2xl font-black text-neutral-900 dark:text-white">
              {{ users?.length || 0 }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-xl bg-blue-50 dark:bg-blue-950/20">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"
          >
            <UIcon name="i-lucide-store" />
          </div>
          <div>
            <p
              class="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase"
            >
              Tiendas
            </p>
            <p class="text-2xl font-black text-neutral-900 dark:text-white">
              --
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-xl bg-amber-50 dark:bg-amber-950/20">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white"
          >
            <UIcon name="i-lucide-activity" />
          </div>
          <div>
            <p
              class="text-sm text-amber-600 dark:text-amber-400 font-bold uppercase"
            >
              Ventas Totales
            </p>
            <p class="text-2xl font-black text-neutral-900 dark:text-white">
              --
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="rounded-xl border-none shadow-xl dark:bg-neutral-900">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold dark:text-white">Listado de Usuarios</h2>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="pb-4 pt-0 font-bold text-neutral-400">Usuario</th>
              <th class="pb-4 pt-0 font-bold text-neutral-400">Rol</th>
              <th class="pb-4 pt-0 font-bold text-neutral-400">Estado</th>
              <th class="pb-4 pt-0 font-bold text-neutral-400 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="user in users"
              :key="user.id"
              class="group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <td class="py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-primary-600 dark:bg-neutral-800"
                  >
                    {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <p class="font-bold text-neutral-900 dark:text-white">
                      {{ user.username }}
                    </p>
                    <p class="text-xs text-neutral-500">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4">
                <UBadge
                  :color="user.role === 'SUPER_ADMIN' ? 'primary' : 'secondary'"
                  variant="subtle"
                  size="xs"
                >
                  {{ user.role }}
                </UBadge>
              </td>
              <td class="py-4">
                <UBadge
                  :color="user.active ? 'primary' : 'secondary'"
                  variant="solid"
                  size="xs"
                  class="rounded-full"
                >
                  {{ user.active ? "Activo" : "Inactivo" }}
                </UBadge>
              </td>
              <td class="py-4 text-right">
                <UButton
                  v-if="user.role !== 'SUPER_ADMIN'"
                  :color="user.active ? 'primary' : 'secondary'"
                  variant="ghost"
                  size="sm"
                  :icon="
                    user.active ? 'i-lucide-user-x' : 'i-lucide-user-check'
                  "
                  @click="toggleUserStatus(user)"
                >
                  {{ user.active ? "Desactivar" : "Activar" }}
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
