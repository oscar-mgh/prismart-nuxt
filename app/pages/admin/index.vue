<script setup lang="ts">
const { fetchApi } = useApi();
const toast = useToast();

definePageMeta({ middleware: "admin" });

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
  storeId?: string;
  avatar?: string;
  favorites: string[];
  addresses: { street: string; city: string; state: string; zipCode: string }[];
}

interface AdminStore {
  id: string;
  name: string;
  slug: string;
  adminIds: string[];
  active: boolean;
  address: { street: string; city: string; state: string; zipCode: string };
  createdAt: string;
  updatedAt: string;
}

const { data: users, refresh: refreshUsers } = await useAsyncData(
  "admin-users",
  () => fetchApi<AdminUser[]>("/auth/all"),
);

const { data: stores, refresh: refreshStores } = await useAsyncData(
  "admin-stores",
  () => fetchApi<AdminStore[]>("/stores/all"),
);

const activeUsers = computed(
  () => users.value?.filter((u) => u.active).length ?? 0,
);
const totalStores = computed(() => stores.value?.length ?? 0);
const totalSellers = computed(
  () => users.value?.filter((u) => u.role === "SALES_ADMIN").length ?? 0,
);
const totalDelivery = computed(
  () => users.value?.filter((u) => u.role === "DELIVERY_AGENT").length ?? 0,
);

const activeTab = ref<"users" | "stores">("users");

const userSearch = ref("");
const roleFilter = ref("ALL");

const roleOptions = [
  { label: "Todos los roles", value: "ALL" },
  { label: "Administrador", value: "SUPER_ADMIN" },
  { label: "Vendedor", value: "SALES_ADMIN" },
  { label: "Cliente", value: "CUSTOMER" },
  { label: "Agente de entrega", value: "DELIVERY_AGENT" },
  { label: "Soporte", value: "SUPPORT" },
];

const filteredUsers = computed(() => {
  let list = users.value ?? [];
  if (roleFilter.value !== "ALL")
    list = list.filter((u) => u.role === roleFilter.value);
  if (userSearch.value.trim()) {
    const q = userSearch.value.toLowerCase();
    list = list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }
  return list;
});

const storeSearch = ref("");

const filteredStores = computed(() => {
  if (!storeSearch.value.trim()) return stores.value ?? [];
  const q = storeSearch.value.toLowerCase();
  return (stores.value ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.address.city.toLowerCase().includes(q),
  );
});

const roleConfig: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: {
    label: "Administrador",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  SALES_ADMIN: {
    label: "Vendedor",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  CUSTOMER: {
    label: "Cliente",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  DELIVERY_AGENT: {
    label: "Agente de entrega",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SUPPORT: {
    label: "Soporte",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

const getRoleConfig = (role: string) =>
  roleConfig[role] ?? {
    label: role,
    color:
      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
  };

const togglingId = ref<string | null>(null);

const toggleUserStatus = async (user: AdminUser) => {
  togglingId.value = user.id;
  try {
    if (user.active) {
      await fetchApi(`/auth/disable/${user.id}`, { method: "DELETE" });
    } else {
      await fetchApi(`/auth/enable/${user.id}`, { method: "PATCH" });
    }
    toast.add({
      title: user.active ? "Usuario desactivado" : "Usuario activado",
      description: `${user.username} fue ${user.active ? "desactivado" : "activado"} correctamente.`,
      color: "success",
      duration: 3000,
    });
    await refreshUsers();
  } catch (err: any) {
    toast.add({
      title: "Error",
      description:
        err?.data?.message || "No se pudo cambiar el estado del usuario.",
      color: "error",
    });
  } finally {
    togglingId.value = null;
  }
};

const isPromoteModalOpen = ref(false);
const promotingUser = ref<AdminUser | null>(null);
const loadingPromote = ref(false);

const openPromoteModal = (user: AdminUser) => {
  promotingUser.value = user;
  isPromoteModalOpen.value = true;
};

const promoteUser = async () => {
  if (!promotingUser.value) return;
  loadingPromote.value = true;
  try {
    await fetchApi("/auth/promote", {
      method: "POST",
      body: {
        email: promotingUser.value.email,
        username: promotingUser.value.username,
      },
    });
    toast.add({
      title: "Usuario promovido",
      description: `${promotingUser.value.username} ahora es Vendedor.`,
      color: "success",
      duration: 3000,
    });
    isPromoteModalOpen.value = false;
    promotingUser.value = null;
    await refreshUsers();
  } catch (err: any) {
    toast.add({
      title: "Error al promover",
      description: err?.data?.message || "No se pudo promover al usuario.",
      color: "error",
    });
  } finally {
    loadingPromote.value = false;
  }
};

const storeToDeleteId = ref<string | null>(null);
const deletingStoreId = ref<string | null>(null);

const deleteStore = async (store: AdminStore) => {
  deletingStoreId.value = store.id;
  try {
    await fetchApi(`/stores/${store.id}`, { method: "DELETE" });
    toast.add({
      title: "Tienda eliminada",
      description: `"${store.name}" fue eliminada correctamente.`,
      color: "success",
      duration: 3000,
    });
    storeToDeleteId.value = null;
    await refreshStores();
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err?.data?.message || "No se pudo eliminar la tienda.",
      color: "error",
    });
  } finally {
    deletingStoreId.value = null;
  }
};

const togglingStoreId = ref<string | null>(null);

const toggleStoreStatus = async (store: AdminStore) => {
  togglingStoreId.value = store.id;
  try {
    await fetchApi(
      `/stores/${store.id}/${store.active ? "deactivate" : "activate"}`,
      {
        method: "PATCH",
      },
    );
    toast.add({
      title: store.active ? "Tienda desactivada" : "Tienda activada",
      description: `"${store.name}" fue ${store.active ? "desactivada" : "activada"} correctamente.`,
      color: "success",
      duration: 3000,
    });
    await refreshStores();
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message || "No se pudo cambiar el estado.",
      color: "error",
    });
  } finally {
    togglingStoreId.value = null;
  }
};

const getOwnerUsername = (adminIds: string[]) => {
  const owner = users.value?.find((u) => adminIds.includes(u.id));
  return owner?.username ?? "—";
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-8 py-10">
    <div>
      <h1 class="text-4xl font-black text-neutral-900 dark:text-white">
        Panel de Administración
      </h1>
      <p class="mt-2 text-neutral-500 dark:text-neutral-400">
        Gestión global de usuarios y tiendas de Prismart.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div
        class="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Usuarios activos
        </p>
        <p class="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
          {{ activeUsers }}
        </p>
        <div class="mt-2 flex items-center gap-1.5">
          <UIcon name="i-lucide-users" class="h-3.5 w-3.5 text-emerald-500" />
          <span class="text-xs text-neutral-500"
            >de {{ users?.length ?? 0 }} totales</span
          >
        </div>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Tiendas
        </p>
        <p class="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
          {{ totalStores }}
        </p>
        <div class="mt-2 flex items-center gap-1.5">
          <UIcon name="i-lucide-store" class="h-3.5 w-3.5 text-blue-500" />
          <span class="text-xs text-neutral-500">registradas</span>
        </div>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Vendedores
        </p>
        <p class="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
          {{ totalSellers }}
        </p>
        <div class="mt-2 flex items-center gap-1.5">
          <UIcon
            name="i-lucide-briefcase"
            class="h-3.5 w-3.5 text-violet-500"
          />
          <span class="text-xs text-neutral-500">Vendedores activos</span>
        </div>
      </div>

      <div
        class="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Agentes
        </p>
        <p class="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
          {{ totalDelivery }}
        </p>
        <div class="mt-2 flex items-center gap-1.5">
          <UIcon name="i-lucide-truck" class="h-3.5 w-3.5 text-amber-500" />
          <span class="text-xs text-neutral-500">agentes de entrega</span>
        </div>
      </div>
    </div>

    <div
      class="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <button
        class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
        :class="
          activeTab === 'users'
            ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        "
        @click="activeTab = 'users'"
      >
        <UIcon name="i-lucide-users" class="h-4 w-4" />
        Usuarios
        <span
          class="rounded-full bg-neutral-200 px-1.5 py-px text-[10px] font-black dark:bg-neutral-700"
        >
          {{ users?.length ?? 0 }}
        </span>
      </button>
      <button
        class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
        :class="
          activeTab === 'stores'
            ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        "
        @click="activeTab = 'stores'"
      >
        <UIcon name="i-lucide-store" class="h-4 w-4" />
        Tiendas
        <span
          class="rounded-full bg-neutral-200 px-1.5 py-px text-[10px] font-black dark:bg-neutral-700"
        >
          {{ stores?.length ?? 0 }}
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'users'" class="space-y-4">
      <div class="flex flex-wrap gap-3">
        <div
          class="flex flex-1 min-w-48 overflow-hidden rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800"
        >
          <UIcon
            name="i-lucide-search"
            class="my-auto h-4 w-4 shrink-0 text-neutral-400"
          />
          <input
            v-model="userSearch"
            placeholder="Buscar por nombre o email..."
            class="w-full bg-transparent py-2.5 pl-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white"
          />
        </div>
        <select
          v-model="roleFilter"
          class="cursor-pointer rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <option
            v-for="opt in roleOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th
                  class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Usuario
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Rol
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Estado
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Tienda
                </th>
                <th
                  class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="relative shrink-0">
                      <img
                        v-if="user.avatar"
                        :src="user.avatar"
                        :alt="user.username"
                        class="h-9 w-9 rounded-full object-cover"
                      />
                      <div
                        v-else
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                      >
                        <span
                          class="text-sm font-bold text-emerald-700 dark:text-emerald-400"
                        >
                          {{ user.username.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div
                        class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-900"
                        :class="
                          user.active ? 'bg-emerald-500' : 'bg-neutral-400'
                        "
                      />
                    </div>
                    <div>
                      <p
                        class="text-sm font-semibold text-neutral-900 dark:text-white"
                      >
                        {{ user.username }}
                      </p>
                      <p class="text-xs text-neutral-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="getRoleConfig(user.role).color"
                  >
                    {{ getRoleConfig(user.role).label }}
                  </span>
                </td>

                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 text-xs font-medium"
                    :class="
                      user.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-400'
                    "
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="user.active ? 'bg-emerald-500' : 'bg-neutral-400'"
                    />
                    {{ user.active ? "Activo" : "Inactivo" }}
                  </span>
                </td>

                <td class="px-6 py-4">
                  <span class="text-xs text-neutral-500">
                    {{
                      user.storeId
                        ? (stores?.find((s) => s.adminIds.includes(user.id))
                            ?.name ?? "—")
                        : "—"
                    }}
                  </span>
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <UButton
                      v-if="user.role === 'CUSTOMER'"
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-lucide-trending-up"
                      class="cursor-pointer rounded-lg"
                      @click="openPromoteModal(user)"
                    >
                      Promover
                    </UButton>

                    <UButton
                      v-if="user.role !== 'SUPER_ADMIN'"
                      size="xs"
                      :color="user.active ? 'error' : 'success'"
                      variant="soft"
                      :icon="
                        user.active ? 'i-lucide-user-x' : 'i-lucide-user-check'
                      "
                      class="cursor-pointer rounded-lg"
                      :loading="togglingId === user.id"
                      @click="toggleUserStatus(user)"
                    >
                      {{ user.active ? "Desactivar" : "Activar" }}
                    </UButton>

                    <span
                      v-if="user.role === 'SUPER_ADMIN'"
                      class="text-xs text-neutral-400"
                      >—</span
                    >
                  </div>
                </td>
              </tr>

              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="px-6 py-12 text-center">
                  <UIcon
                    name="i-lucide-search-x"
                    class="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-700"
                  />
                  <p class="mt-2 text-sm text-neutral-500">
                    No se encontraron usuarios.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        class="flex overflow-hidden rounded-xl bg-neutral-100 px-3 dark:bg-neutral-800"
      >
        <UIcon
          name="i-lucide-search"
          class="my-auto h-4 w-4 shrink-0 text-neutral-400"
        />
        <input
          v-model="storeSearch"
          placeholder="Buscar tienda por nombre o ciudad..."
          class="w-full bg-transparent py-2.5 pl-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="store in filteredStores"
          :key="store.id"
          class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div
            class="border-b border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <UIcon
                    name="i-lucide-store"
                    class="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div class="min-w-0">
                  <p
                    class="truncate font-bold text-neutral-900 dark:text-white"
                  >
                    {{ store.name }}
                  </p>
                  <p class="text-xs text-neutral-400 font-mono">
                    {{ store.slug }}
                  </p>
                  <span
                    class="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold"
                    :class="
                      store.active ? 'text-emerald-500' : 'text-neutral-400'
                    "
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="store.active ? 'bg-emerald-500' : 'bg-neutral-400'"
                    />
                    {{ store.active ? "Activa" : "Inactiva" }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3 p-5">
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-map-pin"
                class="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
              />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                {{ store.address.street }}, {{ store.address.city }},
                {{ store.address.state }} {{ store.address.zipCode }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="h-3.5 w-3.5 shrink-0 text-neutral-400"
              />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                <span class="font-medium">Propietario:</span>
                {{ getOwnerUsername(store.adminIds) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-calendar"
                class="h-3.5 w-3.5 shrink-0 text-neutral-400"
              />
              <p class="text-xs text-neutral-500">
                Creada {{ formatDate(store.createdAt) }}
              </p>
            </div>
          </div>

          <div
            class="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800 space-y-2"
          >
            <UButton
              :color="store.active ? 'warning' : 'success'"
              variant="soft"
              size="xs"
              :icon="
                store.active ? 'i-lucide-pause-circle' : 'i-lucide-play-circle'
              "
              block
              class="cursor-pointer rounded-lg"
              :loading="togglingStoreId === store.id"
              @click="toggleStoreStatus(store)"
            >
              {{ store.active ? "Desactivar" : "Activar" }}
            </UButton>

            <div
              v-if="storeToDeleteId === store.id"
              class="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 p-2 dark:border-red-900/30 dark:bg-red-950/20"
            >
              <span
                class="text-[10px] font-bold uppercase text-red-600 dark:text-red-400"
                >¿Eliminar tienda?</span
              >
              <div class="flex gap-1.5">
                <UButton
                  size="xs"
                  color="error"
                  variant="solid"
                  class="cursor-pointer rounded-lg font-bold"
                  :loading="deletingStoreId === store.id"
                  @click="deleteStore(store)"
                >
                  Sí, eliminar
                </UButton>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  class="cursor-pointer rounded-lg"
                  @click="storeToDeleteId = null"
                >
                  Cancelar
                </UButton>
              </div>
            </div>

            <UButton
              v-else
              color="error"
              variant="soft"
              size="xs"
              icon="i-lucide-trash-2"
              block
              class="cursor-pointer rounded-lg"
              @click="storeToDeleteId = store.id"
            >
              Eliminar tienda
            </UButton>
          </div>
        </div>

        <div
          v-if="filteredStores.length === 0"
          class="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800"
        >
          <UIcon
            name="i-lucide-store-x"
            class="h-10 w-10 text-neutral-300 dark:text-neutral-700"
          />
          <p class="mt-3 text-sm text-neutral-500">
            No se encontraron tiendas.
          </p>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isPromoteModalOpen"
      :ui="{ content: 'rounded-2xl p-0 overflow-hidden' }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                Promover a Vendedor
              </h2>
              <p class="mt-0.5 text-sm text-neutral-500">
                Esta acción cambiará el rol del usuario.
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer rounded-xl"
              @click="isPromoteModalOpen = false"
            />
          </div>

          <div
            v-if="promotingUser"
            class="mb-5 flex items-center gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
            >
              <span
                class="text-sm font-bold text-emerald-700 dark:text-emerald-400"
              >
                {{ promotingUser.username.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-neutral-900 dark:text-white">
                {{ promotingUser.username }}
              </p>
              <p class="text-xs text-neutral-500">{{ promotingUser.email }}</p>
            </div>
            <div
              class="ml-auto flex items-center gap-1.5 text-xs font-medium text-neutral-400"
            >
              <span
                class="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >Cliente</span
              >
              <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
              <span
                class="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                >Vendedor</span
              >
            </div>
          </div>

          <div
            class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20"
          >
            <div class="flex gap-2">
              <UIcon
                name="i-lucide-triangle-alert"
                class="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              />
              <p class="text-sm text-amber-700 dark:text-amber-400">
                El usuario podrá crear y gestionar una tienda en Prismart. Esta
                acción no se puede revertir fácilmente.
              </p>
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              size="md"
              class="cursor-pointer rounded-xl"
              @click="isPromoteModalOpen = false"
              >Cancelar</UButton
            >
            <UButton
              color="primary"
              size="md"
              class="cursor-pointer rounded-xl font-bold"
              :loading="loadingPromote"
              icon="i-lucide-trending-up"
              @click="promoteUser"
            >
              Confirmar promoción
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
