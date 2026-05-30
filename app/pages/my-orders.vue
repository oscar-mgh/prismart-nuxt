<script setup lang="ts">
import { differenceInHours } from "date-fns";
definePageMeta({
  middleware: "auth",
});

const { fetchApi } = useApi();
const toast = useToast();
const route = useRoute();

const orders = ref<Order[]>([]);
const loading = ref(false);
const cancellingOrders = ref<Set<string>>(new Set());
const confirmCancel = ref<string | null>(null);
const hoveredOrderId = ref<string | null>(null);

let paymentRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
let paymentRefreshAttempts = 0;

const fetchOrders = async (options: { showLoading?: boolean } = {}) => {
  const { showLoading = true } = options;
  if (showLoading) loading.value = true;
  try {
    const response = await fetchApi<Order[]>("/orders");
    orders.value = response;
  } catch (err) {
    toast.add({
      title: "Error al cargar los pedidos",
      description: "No se pudieron obtener tus pedidos. Intenta de nuevo.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    if (showLoading) loading.value = false;
  }
};

await fetchOrders();

const sortedOrders = computed(() => {
  return [...orders.value].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const isEmpty = computed(() => !orders.value?.length);

const isCancelling = (orderId: string) => cancellingOrders.value.has(orderId);

const hasPendingOrders = () =>
  orders.value.some((order) => order.status === "PENDING");

const clearPaymentRefresh = () => {
  if (!paymentRefreshTimeout) return;
  clearTimeout(paymentRefreshTimeout);
  paymentRefreshTimeout = null;
};

const schedulePaymentRefresh = () => {
  clearPaymentRefresh();

  if (paymentRefreshAttempts >= 10 || !hasPendingOrders()) {
    return;
  }

  paymentRefreshTimeout = setTimeout(async () => {
    paymentRefreshAttempts += 1;
    await fetchOrders({ showLoading: false });
    schedulePaymentRefresh();
  }, 1000);
};

const canCancel = (status: Order["status"], createdAt: string) => {
  const validStatus = ["PENDING", "PAID"].includes(status);
  if (!validStatus) return false;

  return differenceInHours(new Date(), new Date(createdAt)) < 24;
};

const canMessageSeller = (status: Order["status"]) =>
  ["PAID", "SHIPPED", "DELIVERED"].includes(status);

const formatPrice = (n: number) => {
  return (n ?? 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusConfig: Record<
  Order["status"],
  { label: string; color: string; icon: string }
> = {
  PENDING: {
    label: "Pendiente",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: "i-lucide-clock",
  },
  PAID: {
    label: "Pagado",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "i-lucide-credit-card",
  },
  SHIPPED: {
    label: "Enviado",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: "i-lucide-truck",
  },
  DELIVERED: {
    label: "Entregado",
    color:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    icon: "i-lucide-package-check",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "i-lucide-x-circle",
  },
  REFUNDED: {
    label: "Reembolsado",
    color:
      "bg-secondary-100 text-neutral-700 dark:bg-secondary-800/30 dark:text-secondary-400",
    icon: "i-lucide-refresh-cw",
  },
};

const cancelOrder = async (orderId: string) => {
  cancellingOrders.value.add(orderId);
  try {
    await fetchApi(`/orders/${orderId}`, {
      method: "DELETE",
    });

    const order = orders.value.find((o) => o.id === orderId);
    if (order) order.status = "CANCELLED";

    toast.add({
      title: "Orden cancelada",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } catch (err: any) {
    toast.add({
      title: "Error al cancelar",
      description: err?.data?.message || "No se pudo cancelar la orden.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    cancellingOrders.value.delete(orderId);
    confirmCancel.value = null;
  }
};

const notificationStore = useNotificationStore();
const orderNotificationTypes: AppNotification["type"][] = [
  "ORDER_PAID",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
];

watch(
  () =>
    notificationStore.notifications
      .filter((n) => orderNotificationTypes.includes(n.type))
      .map((n) => `${n.id}:${n.type}`),
  (orderNotifications) => {
    if (orderNotifications.length) {
      setTimeout(() => {
        fetchOrders({ showLoading: false });
      }, 400);
    }
  },
);

onMounted(() => {
  if (route.query.payment === "success") {
    paymentRefreshAttempts = 0;
    schedulePaymentRefresh();
  }
});

onBeforeUnmount(() => {
  clearPaymentRefresh();
});
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-neutral-900 dark:text-white sm:text-3xl">
        Mis Pedidos
      </h1>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {{ orders.length }} pedido{{ orders.length !== 1 ? "s" : "" }}
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-48 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-200/30 dark:bg-neutral-800/30 px-4 py-20 text-center dark:border-neutral-800"
    >
      <UIcon
        name="i-lucide-shopping-bag"
        class="mb-6 h-14 w-14 text-2xl text-neutral-300 dark:text-neutral-700"
      />
      <h2 class="text-lg font-bold text-neutral-900 dark:text-white sm:text-xl">
        Aún no tienes pedidos
      </h2>
      <UButton
        to="/products"
        color="primary"
        size="lg"
        class="mt-6 rounded-xl px-8 font-semibold"
      >
        Explorar productos
      </UButton>
    </div>

    <div v-else class="space-y-6 sm:space-y-8">
      <div
        v-for="order in sortedOrders"
        :key="order.id"
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div
          class="border-b border-neutral-100 bg-neutral-50/70 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/60 sm:px-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            
            <div class="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3 sm:border-none sm:pb-0">
              <div
                @mouseenter="hoveredOrderId = order.id"
                @mouseleave="hoveredOrderId = null"
              >
                <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Orden</p>
                <p class="font-mono text-sm font-black text-neutral-900 dark:text-white">
                  #{{ order.orderNumber }}
                </p>
              </div>
              <div class="hidden h-8 w-px bg-neutral-200 dark:bg-neutral-700 sm:block" />
              <div class="text-right sm:text-left">
                <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Fecha</p>
                <p class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {{ formatDate(order.createdAt) }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 sm:justify-end">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusConfig[order.status].color"
              >
                <UIcon
                  :name="statusConfig[order.status].icon"
                  class="h-3.5 w-3.5"
                />
                {{ statusConfig[order.status].label }}
              </span>
              <div class="text-right">
                <span class="text-xl font-black text-neutral-900 dark:text-white sm:text-lg">
                  {{ formatPrice(order.totalAmount) }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div class="divide-y divide-neutral-100 px-4 dark:divide-neutral-800 sm:px-6">
          <div
            v-for="item in order.items"
            :key="item.productId"
            class="flex items-start justify-between gap-4 py-4 sm:items-center"
          >
            <div class="flex items-start gap-3 min-w-0 sm:items-center">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon name="i-lucide-box" class="h-5 w-5 text-neutral-400" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
                  {{ item.name }}
                </p>
                <p class="text-xs text-neutral-500 sm:text-sm">
                  {{ formatPrice(item.price) }} × {{ item.quantity }}
                </p>
              </div>
            </div>
            <div class="shrink-0 text-right pt-0.5 sm:pt-0">
              <p class="text-sm font-black text-neutral-900 dark:text-white sm:text-base">
                {{ formatPrice(item.subtotal) }}
              </p>
            </div>
          </div>

          <div
            v-if="order.totalAmount > order.items.reduce((acc, item) => acc + item.subtotal, 0)"
            class="flex items-center justify-between gap-4 bg-neutral-50/50 px-4 py-4 dark:bg-neutral-800/20 -mx-4 sm:-mx-6 sm:px-6"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30"
              >
                <UIcon name="i-lucide-truck" class="h-5 w-5 text-primary-500" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-neutral-900 dark:text-white">
                  Costo de envío
                </p>
                <p class="text-xs text-neutral-500">Entrega a domicilio</p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-black text-neutral-900 dark:text-white sm:text-base">
                {{
                  formatPrice(
                    order.totalAmount -
                      order.items.reduce((acc, item) => acc + item.subtotal, 0),
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="canCancel(order.status, order.createdAt) || canMessageSeller(order.status)"
          class="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-100 px-4 py-3.5 dark:border-neutral-800 sm:px-6"
        >
          <UButton
            v-if="canMessageSeller(order.status)"
            :to="`/messages?order=${order.id}`"
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-message-circle"
            class="w-full justify-center cursor-pointer rounded-xl px-4 sm:w-auto"
          >
            Mensajes
          </UButton>

          <template v-if="confirmCancel === order.id">
            <div class="flex w-full flex-col items-center gap-2 text-center sm:w-auto sm:flex-row sm:text-left">
              <span class="text-xs font-semibold text-neutral-500">¿Cancelar este pedido?</span>
              <div class="flex w-full gap-2 sm:w-auto">
                <UButton
                  size="sm"
                  color="error"
                  variant="soft"
                  class="flex-1 justify-center cursor-pointer rounded-xl sm:flex-initial"
                  :loading="isCancelling(order.id)"
                  @click="cancelOrder(order.id)"
                >
                  Sí, cancelar
                </UButton>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  class="flex-1 justify-center cursor-pointer rounded-xl sm:flex-initial"
                  @click="confirmCancel = null"
                >
                  No, mantener
                </UButton>
              </div>
            </div>
          </template>

          <UButton
            v-else-if="canCancel(order.status, order.createdAt)"
            size="sm"
            color="error"
            variant="soft"
            icon="i-lucide-x-circle"
            class="w-full justify-center cursor-pointer rounded-xl px-4 sm:w-auto"
            @click="confirmCancel = order.id"
          >
            Cancelar orden
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>