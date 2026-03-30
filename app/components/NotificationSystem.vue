<script setup lang="ts">
const store = useNotificationStore();

const typeConfig: Record<
  AppNotification["type"],
  { icon: string; color: string; label: string }
> = {
  ORDER_PAID: {
    icon: "i-lucide-credit-card",
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    label: "Pago",
  },
  ORDER_SHIPPED: {
    icon: "i-lucide-truck",
    color: "text-violet-400 bg-violet-100 dark:bg-violet-700/30",
    label: "Enviado",
  },
  ORDER_DELIVERED: {
    icon: "i-lucide-package-check",
    color: "text-green-400 bg-green-100 dark:bg-green-700/30",
    label: "Entregado",
  },
  ORDER_CANCELLED: {
    icon: "i-lucide-x-circle",
    color: "text-red-500 bg-red-100 dark:bg-red-900/30",
    label: "Cancelación",
  },
  ORDER_CANCELLED_BY_CUSTOMER: {
    icon: "i-lucide-x-circle",
    color: "text-red-500 bg-red-100 dark:bg-red-900/30",
    label: "Cancelación",
  },
  NEW_MESSAGE: {
    icon: "i-lucide-message-circle",
    color: "text-sky-500 bg-sky-100 dark:bg-sky-900/30",
    label: "Mensaje",
  },
  NEW_SALE: {
    icon: "i-lucide-tag",
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    label: "Oferta",
  },
  PRODUCT_QUESTION: {
    icon: "i-lucide-help-circle",
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    label: "Pregunta",
  },
  QUESTION_ANSWERED: {
    icon: "i-lucide-help-circle",
    color: "text-sky-500 bg-sky-100 dark:bg-sky-900/30",
    label: "Pregunta",
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const confirmDeleteAll = ref(false);

const handleDeleteAll = async () => {
  await store.deleteAll();
  confirmDeleteAll.value = false;
};

const handleMarkAllAsRead = async () => {
  await store.markAllAsRead();
};

const goToProduct = () => {
  const slug = store.selectedNotification?.productSlug;
  if (!slug) return;
  store.closeModal();
  store.isPanelOpen = false;
  navigateTo(`/product/${slug}#questions`);
};

const goToConversation = () => {
  store.closeModal();
  store.isPanelOpen = false;
  navigateTo(`/messages`);
};
</script>

<template>
  <div class="relative">
    <UButton
      color="neutral"
      variant="subtle"
      size="xl"
      icon="i-lucide-bell"
      class="cursor-pointer rounded-full bg-neutral-100 dark:bg-neutral-800"
      @click="store.isPanelOpen = !store.isPanelOpen"
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
        v-if="store.unreadCount > 0"
        class="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white"
      >
        {{ store.unreadCount > 9 ? "9+" : store.unreadCount }}
      </span>
    </transition>
  </div>

  <ClientOnly>
    <Teleport to="body" :disabled="false">
      <transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="store.isPanelOpen"
          class="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm"
          @click="store.isPanelOpen = false"
        />
      </transition>
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-250 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="store.isPanelOpen"
          class="fixed right-0 top-0 z-70 flex h-full w-full max-w-sm flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div
            class="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/50"
              >
                <UIcon
                  name="i-lucide-bell"
                  class="h-8 w-8 text-zinc-600 dark:text-zinc-300"
                />
              </div>
              <div>
                <h2 class="text-md font-black text-neutral-900 dark:text-white">
                  Notificaciones
                </h2>
                <p
                  v-if="store.unreadCount > 0"
                  class="text-xs text-neutral-1000 dark:text-neutral-400"
                >
                  {{ store.unreadCount }} sin leer
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <template v-if="confirmDeleteAll">
                <span class="text-xs text-neutral-1000">¿Eliminar todo?</span>
                <UButton
                  size="xs"
                  color="error"
                  variant="subtle"
                  class="cursor-pointer rounded-lg"
                  @click="handleDeleteAll"
                >
                  Sí
                </UButton>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  class="cursor-pointer rounded-lg"
                  @click="confirmDeleteAll = false"
                >
                  No
                </UButton>
              </template>
              <template v-else>
                <UButton
                  v-if="store.unreadCount > 0"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-check-check"
                  class="cursor-pointer rounded-lg text-neutral-400"
                  @click="handleMarkAllAsRead"
                />
                <UButton
                  v-if="store.notifications.length"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-brush-cleaning"
                  class="cursor-pointer rounded-lg text-neutral-400 mr-2"
                  @click="confirmDeleteAll = true"
                />
                <UButton
                  size="md"
                  color="neutral"
                  variant="solid"
                  icon="i-lucide-x"
                  class="cursor-pointer rounded-lg"
                  @click="store.isPanelOpen = false"
                />
              </template>
            </div>
          </div>
          <div v-if="store.loading" class="space-y-3 p-4">
            <USkeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-xl" />
          </div>
          <div
            v-else-if="!store.sortedNotifications.length"
            class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900"
            >
              <UIcon
                name="i-lucide-bell-off"
                class="h-8 w-8 text-neutral-300 dark:text-neutral-700 text-2xl"
              />
            </div>
            <p
              class="text-sm font-medium text-neutral-1000 dark:text-neutral-400"
            >
              No tienes notificaciones
            </p>
          </div>
          <div v-else class="flex-1 overflow-y-auto">
            <transition-group
              tag="div"
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0 translate-x-4"
            >
              <div
                v-for="notification in store.sortedNotifications"
                :key="notification.id"
                class="group relative flex cursor-pointer gap-4 border-b border-neutral-100 px-5 py-4 transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
                :class="{
                  'border-l-4 border-l-primary-500 dark:border-l-primary-400':
                    !notification.isRead,
                  'border-l-4 border-l-transparent': notification.isRead,
                }"
                @click="store.openDetail(notification)"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  :class="typeConfig[notification.type].color"
                >
                  <UIcon
                    :name="typeConfig[notification.type].icon"
                    class="h-5 w-5"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm text-neutral-900 dark:text-white"
                    :class="notification.isRead ? 'font-medium' : 'font-bold'"
                  >
                    {{ notification.title }}
                  </p>
                  <p
                    class="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400"
                  >
                    {{ notification.message }}
                  </p>
                  <span class="mt-1.5 block text-[10px] text-neutral-400">
                    {{ formatDate(notification.createdAt) }}
                  </span>
                </div>

                <div class="flex items-center">
                  <UButton
                    size="md"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-trash"
                    class="invisible h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100 dark:hover:bg-neutral-700"
                    @click.stop="store.deleteOne(notification.id)"
                  />
                </div>
              </div>
            </transition-group>
          </div>
        </aside>
      </transition>
      <transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-150"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="store.isModalOpen && store.selectedNotification"
          class="fixed inset-0 z-80 flex items-center justify-center p-4"
          @click.self="store.closeModal"
        >
          <div
            class="w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="p-5">
              <div class="mb-5 flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  :class="typeConfig[store.selectedNotification.type].color"
                >
                  <UIcon
                    :name="typeConfig[store.selectedNotification.type].icon"
                    class="h-6 w-6"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    :class="typeConfig[store.selectedNotification.type].color"
                  >
                    {{ typeConfig[store.selectedNotification.type].label }}
                  </span>
                  <h3
                    class="mt-1 text-lg font-black text-neutral-900 dark:text-white"
                  >
                    {{ store.selectedNotification.title }}
                  </h3>
                </div>
                <UButton
                  color="neutral"
                  variant="solid"
                  icon="i-lucide-x"
                  size="sm"
                  class="cursor-pointer rounded-lg"
                  @click="store.closeModal"
                />
              </div>
              <p
                class="rounded-xl bg-neutral-100 p-4 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {{ store.selectedNotification.message }}
              </p>
              <div
                v-if="
                  store.selectedNotification.type === 'PRODUCT_QUESTION' &&
                  store.selectedNotification.productSlug
                "
                class="mt-4"
              >
                <UButton
                  color="primary"
                  variant="soft"
                  class="w-full cursor-pointer pl-4 rounded-lg font-bold text-zinc-800/90 dark:text-zinc-200"
                  @click="goToProduct()"
                >
                  Ver producto
                </UButton>
              </div>
              <div
                v-else-if="
                  store.selectedNotification.type === 'QUESTION_ANSWERED' &&
                  store.selectedNotification.productSlug
                "
                class="mt-4"
              >
                <UButton
                  color="primary"
                  variant="soft"
                  class="w-full cursor-pointer pl-4 rounded-lg font-bold text-zinc-800/90 dark:text-zinc-200"
                  @click="goToProduct()"
                >
                  Ver producto
                </UButton>
              </div>
              <div
                v-else-if="store.selectedNotification.type === 'NEW_MESSAGE'"
                class="mt-4"
              >
                <UButton
                  color="primary"
                  variant="soft"
                  class="w-full cursor-pointer pl-4 rounded-lg font-bold text-zinc-800/90 dark:text-zinc-200"
                  @click="goToConversation()"
                >
                  Revisar mensajes
                </UButton>
              </div>
              <p class="mt-4 text-right text-xs text-neutral-400">
                {{
                  new Date(
                    store.selectedNotification.createdAt,
                  ).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </ClientOnly>
</template>
