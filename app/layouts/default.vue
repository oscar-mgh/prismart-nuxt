<script setup lang="ts">
const searchQuery = ref("");
const authStore = useAuthStore();
const colorMode = useColorMode();
const notificationStore = useNotificationStore();
const cartStore = useCartStore();
const messageStore = useMessageStore();
const packageStore = usePackageStore();
const { fetchApi } = useApi();

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const loadCart = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const cart = await fetchApi<Cart>("/cart");
    cartStore.syncFromCart(cart);

    if (authStore.user?.role === "DELIVERY_AGENT") {
      await packageStore.fetchPendingCount();
    }
  } catch {
    cartStore.clear();
  }
};

await loadCart();

watch(
  () => authStore.user?.id,
  async (newUserId) => {
    if (newUserId) {
      await loadCart();
      await notificationStore.fetchNotifications();
      notificationStore.connectSocket();
    } else {
      cartStore.clear();
      packageStore.clear();
      notificationStore.disconnectSocket();
      dropdownOpen.value = false;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await authStore.initAuth();
  if (authStore.isAuthenticated) {
    if (authStore.user?.role === "DELIVERY_AGENT") {
      await packageStore.fetchPendingCount();
    }
  }

  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  notificationStore.disconnectSocket();
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    navigateTo(`/products?name=${searchQuery.value}`);
    searchQuery.value = "";
  }
};

const isDark = computed({
  get: () => colorMode.value === "dark",
  set: (value: boolean) => {
    colorMode.preference = value ? "dark" : "light";
  },
});

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Administrador",
  SALES_ADMIN: "Vendedor",
  CUSTOMER: "Cliente",
  DELIVERY_AGENT: "Agente de entrega",
  SUPPORT: "Soporte",
};

const handleLogout = () => {
  dropdownOpen.value = false;
  authStore.logout();
};

const navigateAndClose = (path: string) => {
  dropdownOpen.value = false;
  navigateTo(path);
};
</script>

<template>
  <div class="min-h-screen bg-neutral-50 font-sans dark:bg-neutral-950">
    <header
      class="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80"
    >
      <nav
        class="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:grid-cols-[minmax(0,1fr)_minmax(18rem,36rem)_minmax(0,1fr)] sm:px-6 lg:px-8"
      >
        <NuxtLink
          to="/"
          class="flex shrink-0 items-center gap-2 justify-self-start font-bold text-neutral-900 dark:text-white"
        >
          <img
            src="~/assets/prismart_logo.svg"
            alt="Prismart Logo"
            class="h-10 w-10"
          />
          Prismart
        </NuxtLink>

        <button
          @click="toggleMobileMenu"
          class="ml-2 inline-flex items-center justify-center justify-self-end rounded-md p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:hidden"
          aria-label="Abrir menú"
        >
          <UIcon
            :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            class="h-6 w-6"
          />
        </button>

        <div class="hidden w-full max-w-xl justify-self-center sm:flex">
          <div
            class="flex w-full overflow-hidden rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            <UInput
              v-model="searchQuery"
              placeholder="Buscar productos, categorías o marcas..."
              class="mr-1 w-full"
              variant="none"
              size="md"
              :ui="{
                base: 'text-neutral-900 dark:text-white placeholder-neutral-500',
              }"
              @keyup.enter="handleSearch"
            />
            <UButton
              color="neutral"
              variant="soft"
              size="lg"
              icon="i-lucide-search"
              class="cursor-pointer rounded-lg"
              @click="handleSearch"
            />
          </div>
        </div>

        <div class="hidden shrink-0 items-center gap-1.5 justify-self-end sm:flex">
          <ClientOnly>
            <NuxtLink
              v-if="authStore.isAuthenticated"
              to="/cart"
              class="relative"
            >
              <UButton
                color="neutral"
                variant="subtle"
                size="xl"
                icon="i-lucide-shopping-cart"
                class="cursor-pointer rounded-full bg-neutral-100 dark:bg-neutral-800"
              />
              <transition
                enter-active-class="transition-all duration-300"
                enter-from-class="scale-0 opacity-0"
                enter-to-class="scale-100 opacity-100"
                leave-active-class="transition-all duration-200"
                leave-from-class="scale-100 opacity-100"
                leave-to-class="scale-0 opacity-0"
              >
                <span
                  v-if="cartStore.totalItems > 0"
                  class="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-black text-white"
                >
                  {{ cartStore.totalItems > 9 ? "9+" : cartStore.totalItems }}
                </span>
              </transition>
            </NuxtLink>

            <NotificationSystem v-if="authStore.isAuthenticated" />

            <NuxtLink
              v-if="
                authStore.isAuthenticated &&
                authStore.user?.role === 'DELIVERY_AGENT'
              "
              to="/packages"
              class="relative"
            >
              <UButton
                color="neutral"
                variant="subtle"
                size="xl"
                icon="i-lucide-package"
                class="cursor-pointer rounded-full bg-neutral-100 dark:bg-neutral-800"
              />
              <transition
                enter-active-class="transition-all duration-300"
                enter-from-class="scale-0 opacity-0"
                enter-to-class="scale-100 opacity-100"
                leave-active-class="transition-all duration-200"
                leave-from-class="scale-100 opacity-100"
                leave-to-class="scale-0 opacity-0"
              >
                <span
                  v-if="packageStore.pendingCount > 0"
                  class="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-black text-white"
                >
                  {{
                    packageStore.pendingCount > 9
                      ? "9+"
                      : packageStore.pendingCount
                  }}
                </span>
              </transition>
            </NuxtLink>

            <div
              v-if="!authStore.isAuthenticated"
              class="flex items-center gap-1.5"
            >
              <UTooltip text="Iniciar sesión">
                <UButton
                  to="/login"
                  color="neutral"
                  variant="soft"
                  size="xl"
                  icon="i-lucide-log-in"
                  class="cursor-pointer rounded-full p-2.25 mr-1"
                  aria-label="Iniciar sesión"
                />
              </UTooltip>
              <UTooltip text="Registrarse">
                <UButton
                  to="/register"
                  color="neutral"
                  variant="soft"
                  size="xl"
                  icon="i-lucide-user-plus"
                  class="cursor-pointer rounded-full p-2.25"
                  aria-label="Registrarse"
                />
              </UTooltip>
            </div>

            <div v-else ref="dropdownRef" class="relative">
              <button
                class="flex cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 focus:outline-none"
                @click="dropdownOpen = !dropdownOpen"
              >
                <img
                  v-if="authStore.user?.avatar"
                  :src="authStore.user.avatar"
                  :alt="authStore.user.username"
                  class="h-9 w-9 rounded-full border-2 border-neutral-200 object-cover dark:border-neutral-700"
                />
                <div
                  v-else
                  class="flex h-8 w-8 items-center justify-center border border-zinc-800/20 dark:border dark:border-zinc-100/20 rounded-full bg-neutral-100 dark:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-user"
                    class="h-5 w-5 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
              </button>

              <transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 scale-95 -translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 -translate-y-1"
              >
                <div
                  v-if="dropdownOpen"
                  class="absolute right-0 top-full z-100 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <template v-if="authStore.isAuthenticated">
                    <div
                      class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"
                    >
                      <p
                        class="truncate my-1 text-md font-bold text-neutral-900 dark:text-white"
                      >
                        {{ authStore.user?.username }}
                      </p>
                      <p
                        class="truncate text-sm text-neutral-500 dark:text-neutral-400"
                      >
                        {{ authStore.user?.email }}
                      </p>
                      <span
                        class="mt-2 inline-block rounded-full text-xs font-semibold text-primary-700 dark:text-primary-400"
                      >
                        {{
                          roleLabel[authStore.user?.role ?? ""] ??
                          authStore.user?.role
                        }}
                      </span>
                    </div>

                    <div class="p-1.5">
                      <button
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="navigateAndClose('/my-profile')"
                      >
                        <UIcon
                          name="i-lucide-user"
                          class="h-4 w-4 shrink-0 text-neutral-400"
                        />
                        Mi Perfil
                      </button>

                      <button
                        v-if="!authStore.isAdmin"
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="navigateAndClose('/my-orders')"
                      >
                        <UIcon
                          name="i-lucide-shopping-bag"
                          class="h-4 w-4 shrink-0 text-neutral-400"
                        />
                        Mis Pedidos
                      </button>

                      <button
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="navigateAndClose('/favorites')"
                      >
                        <UIcon
                          name="i-lucide-heart"
                          class="h-4 w-4 shrink-0 text-neutral-400"
                        />
                        Favoritos
                      </button>

                      <button
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="navigateAndClose('/messages')"
                      >
                        <UIcon
                          name="i-lucide-message-circle"
                          class="h-4 w-4 shrink-0 text-neutral-400"
                        />
                        <span class="flex-1 text-left">Mensajes</span>
                        <span
                          v-if="messageStore.totalUnread > 0"
                          class="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-black text-white"
                        >
                          {{
                            messageStore.totalUnread > 9
                              ? "9+"
                              : messageStore.totalUnread
                          }}
                        </span>
                      </button>
                    </div>

                    <template
                      v-if="authStore.isAdmin || authStore.isSalesAdmin"
                    >
                      <div
                        class="mx-3 border-t border-neutral-100 dark:border-neutral-800"
                      />
                      <div class="p-1.5">
                        <button
                          v-if="authStore.isAdmin"
                          class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          @click="navigateAndClose('/admin')"
                        >
                          <UIcon
                            name="i-lucide-shield-check"
                            class="h-4 w-4 shrink-0 text-neutral-400"
                          />
                          Admin Panel
                        </button>

                        <template v-if="authStore.isSalesAdmin">
                          <button
                            class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="navigateAndClose('/publish')"
                          >
                            <UIcon
                              name="i-lucide-plus-circle"
                              class="h-4 w-4 shrink-0 text-neutral-400"
                            />
                            Publicar Producto
                          </button>
                          <button
                            class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="navigateAndClose('/my-products')"
                          >
                            <UIcon
                              name="i-lucide-wallet"
                              class="h-4 w-4 shrink-0 text-neutral-400"
                            />
                            Mis Productos
                          </button>
                          <button
                            class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="navigateAndClose('/sales-summary')"
                          >
                            <UIcon
                              name="i-lucide-trending-up"
                              class="h-4 w-4 shrink-0 text-neutral-400"
                            />
                            Resumen de Ventas
                          </button>
                        </template>
                      </div>
                    </template>

                    <div
                      class="mx-3 border-t border-neutral-100 dark:border-neutral-800"
                    />
                    <div class="p-1.5">
                      <div
                        class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="isDark = !isDark"
                      >
                        <UIcon
                          :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
                          class="h-4 w-4 shrink-0 text-neutral-400"
                        />
                        <span class="flex-1">Modo oscuro</span>
                        <div
                          class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
                          :class="
                            isDark
                              ? 'bg-primary-500'
                              : 'bg-neutral-300 dark:bg-neutral-600'
                          "
                        >
                          <span
                            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                            :class="
                              isDark ? 'translate-x-4' : 'translate-x-0.5'
                            "
                          />
                        </div>
                      </div>

                      <button
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        @click="handleLogout"
                      >
                        <UIcon
                          name="i-lucide-log-out"
                          class="h-4 w-4 shrink-0"
                        />
                        Cerrar Sesión
                      </button>
                    </div>
                  </template>
                </div>
              </transition>
            </div>

            <template #fallback>
              <div
                class="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon name="i-lucide-user" class="h-5 w-5 text-neutral-400" />
              </div>
            </template>
          </ClientOnly>
        </div>
      </nav>
    </header>

    <transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-900 sm:hidden"
      >
        <div class="px-4 pt-6">
          <div class="flex items-center justify-between">
            <NuxtLink to="/" class="flex items-center gap-2 font-bold">
              <img
                src="~/assets/prismart_logo.svg"
                alt="Logo"
                class="h-8 w-7"
              />
              Prismart
            </NuxtLink>
            <button @click="toggleMobileMenu" class="p-2">
              <UIcon name="i-lucide-x" class="h-6 w-6" />
            </button>
          </div>

          <div class="mt-4">
            <div
              class="flex w-full items-center gap-2 rounded-xl bg-neutral-100 p-2 dark:bg-neutral-800"
            >
              <UInput
                v-model="searchQuery"
                placeholder="Buscar productos, categorías o marcas..."
                class="w-full"
                variant="none"
                size="md"
                :ui="{
                  base: 'text-neutral-900 dark:text-white placeholder-neutral-500',
                }"
                @keyup.enter="
                  () => {
                    handleSearch();
                    toggleMobileMenu();
                  }
                "
              />
              <UButton
                color="neutral"
                variant="soft"
                size="lg"
                icon="i-lucide-search"
                class="cursor-pointer rounded-lg"
                @click="
                  () => {
                    handleSearch();
                    toggleMobileMenu();
                  }
                "
              />
            </div>
          </div>
        </div>

        <div class="mt-6 flex-1 overflow-auto px-4">
          <ul class="space-y-2">
            <li>
              <NuxtLink
                @click.native="toggleMobileMenu"
                to="/products"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <UIcon
                  name="i-lucide-layout-grid"
                  class="h-5 w-5 text-neutral-400"
                />
                <span>Todos los productos</span>
              </NuxtLink>
            </li>

            <template v-if="authStore.isAuthenticated">
              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/my-profile"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-user"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Mi Perfil</span>
                </NuxtLink>
              </li>

              <li v-if="!authStore.isAdmin">
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/my-orders"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-shopping-bag"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Mis Pedidos</span>
                </NuxtLink>
              </li>

              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/favorites"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-heart"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Favoritos</span>
                </NuxtLink>
              </li>

              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/messages"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-message-circle"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span class="flex-1">Mensajes</span>
                  <span
                    v-if="messageStore.totalUnread > 0"
                    class="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-500 px-1.5 text-[10px] font-black text-white"
                  >
                    {{
                      messageStore.totalUnread > 9
                        ? "9+"
                        : messageStore.totalUnread
                    }}
                  </span>
                </NuxtLink>
              </li>

              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/cart"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-shopping-cart"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span class="flex-1">Carrito</span>
                  <span
                    v-if="cartStore.totalItems > 0"
                    class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-black text-white"
                  >
                    {{ cartStore.totalItems > 9 ? "9+" : cartStore.totalItems }}
                  </span>
                </NuxtLink>
              </li>

              <li v-if="authStore.user?.role === 'DELIVERY_AGENT'">
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/packages"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-package"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span class="flex-1">Paquetes pendientes</span>
                  <span
                    v-if="packageStore.pendingCount > 0"
                    class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-black text-white"
                  >
                    {{
                      packageStore.pendingCount > 9
                        ? "9+"
                        : packageStore.pendingCount
                    }}
                  </span>
                </NuxtLink>
              </li>

              <li v-if="authStore.isAdmin">
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/admin"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-shield-check"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Admin Panel</span>
                </NuxtLink>
              </li>

              <template v-if="authStore.isSalesAdmin">
                <li>
                  <NuxtLink
                    @click.native="toggleMobileMenu"
                    to="/publish"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <UIcon
                      name="i-lucide-plus-circle"
                      class="h-5 w-5 text-neutral-400"
                    />
                    <span>Publicar Producto</span>
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink
                    @click.native="toggleMobileMenu"
                    to="/my-products"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <UIcon
                      name="i-lucide-wallet"
                      class="h-5 w-5 text-neutral-400"
                    />
                    <span>Mis Productos</span>
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink
                    @click.native="toggleMobileMenu"
                    to="/sales-summary"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <UIcon
                      name="i-lucide-trending-up"
                      class="h-5 w-5 text-neutral-400"
                    />
                    <span>Resumen de Ventas</span>
                  </NuxtLink>
                </li>
              </template>
            </template>

            <template v-else>
              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/login"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-log-in"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Iniciar Sesión</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  @click.native="toggleMobileMenu"
                  to="/register"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UIcon
                    name="i-lucide-user-plus"
                    class="h-5 w-5 text-neutral-400"
                  />
                  <span>Registrarse</span>
                </NuxtLink>
              </li>
            </template>
          </ul>
        </div>

        <div
          class="border-t border-neutral-100 px-4 py-4 dark:border-neutral-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon
                :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
                class="h-5 w-5 text-neutral-600"
              />
              <button @click="isDark = !isDark" class="text-sm">
                {{ isDark ? "Modo claro" : "Modo oscuro" }}
              </button>
            </div>
            <div>
              <button
                v-if="authStore.isAuthenticated"
                @click="
                  () => {
                    handleLogout();
                    toggleMobileMenu();
                  }
                "
                class="text-sm text-red-600 dark:text-red-400"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <main class="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-8">
      <slot />
    </main>

    <footer
      class="mt-auto border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div class="col-span-2">
            <h2
              class="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white"
            >
              Innovación Digital
            </h2>
            <p
              class="mt-4 max-w-sm text-sm text-neutral-500 dark:text-neutral-400"
            >
              Precisión con propósito. El punto exacto donde la alta tecnología
              se vuelve personal.
            </p>
          </div>

          <div>
            <h3
              class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white"
            >
              Explorar
            </h3>
            <ul class="mt-4 space-y-2">
              <li>
                <NuxtLink
                  to="/products"
                  class="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400"
                >
                  Todos los productos
                </NuxtLink>
              </li>
              <CategoriesModal />
            </ul>
          </div>

          <div>
            <h3
              class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white"
            >
              Compañía
            </h3>
            <ul class="mt-4 space-y-2">
              <li>
                <NuxtLink
                  to="/about"
                  class="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400"
                >
                  Sobre nosotros
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/terms"
                  class="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400"
                >
                  Términos y condiciones
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="mt-12 border-t border-neutral-100 pt-8 text-center text-sm text-neutral-500 dark:border-neutral-800"
        >
          &copy; {{ new Date().getFullYear() }} Prismart. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  </div>
</template>
