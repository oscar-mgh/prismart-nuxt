<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { fetchApi } = useApi();
const toast = useToast();
const authStore = useAuthStore();

const orders = ref<Order[]>([]);
const loading = ref(false);
const processing = ref<Set<string>>(new Set());

if (authStore.user?.role !== "DELIVERY_AGENT") {
  navigateTo("/");
}

const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await fetchApi<Order[]>("/orders/assigned/me");
    orders.value = response || [];
  } catch (err) {
    toast.add({
      title: "Error al cargar las órdenes",
      description: "No se pudieron obtener las órdenes asignadas.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loading.value = false;
  }
};

await fetchOrders();

const statusConfig: Record<
  Order["status"],
  { label: string; color: string; icon: string }
> = {
  PENDING: {
    label: "Pendiente",
    color: "bg-amber-100 text-amber-700",
    icon: "i-lucide-clock",
  },
  PAID: {
    label: "Pagado",
    color: "bg-blue-100 text-blue-700",
    icon: "i-lucide-credit-card",
  },
  SHIPPED: {
    label: "Enviado",
    color: "bg-violet-100 text-violet-700",
    icon: "i-lucide-truck",
  },
  DELIVERED: {
    label: "Entregado",
    color: "bg-primary-100 text-primary-700",
    icon: "i-lucide-package-check",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    icon: "i-lucide-x-circle",
  },
  REFUNDED: {
    label: "Reembolsado",
    color: "bg-secondary-100 text-neutral-700",
    icon: "i-lucide-refresh-cw",
  },
};

const markAsShipped = async (orderId: string) => {
  processing.value.add(orderId);
  try {
    await fetchApi(`/orders/${orderId}/shipped`, {
      method: "PATCH",
    });

    const order = orders.value.find((o) => o.id === orderId);
    if (order) order.status = "SHIPPED";

    toast.add({
      title: "Orden marcada como enviada",
      color: "success",
      progress: false,
      duration: 3000,
    });
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message || "No se pudo actualizar la orden.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    processing.value.delete(orderId);
  }
};

const markAsDelivered = async (orderId: string) => {
  processing.value.add(orderId);
  try {
    await fetchApi(`/orders/${orderId}/delivered`, {
      method: "PATCH",
    });

    const order = orders.value.find((o) => o.id === orderId);
    if (order) order.status = "DELIVERED";

    toast.add({
      title: "Orden marcada como entregada",
      color: "success",
      progress: false,
      duration: 3000,
    });
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message || "No se pudo actualizar la orden.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    processing.value.delete(orderId);
  }
};
</script>

<template>
  <div class="mx-auto max-w-4xl pb-10">
    <div class="mb-8">
      <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
        Paquetes
      </h1>
      <p class="mt-1 text-neutral-500 dark:text-neutral-400">
        {{ orders.length }} orden{{ orders.length !== 1 ? "es" : "" }}
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-48 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="!orders.length"
      class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <UIcon
        name="i-lucide-truck"
        class="mb-6 h-16 w-16 text-neutral-300 dark:text-neutral-700"
      />
      <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
        No hay órdenes asignadas
      </h2>
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="order in orders"
        :key="order.id"
        class="overflow-hidden shadow-lg rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div
          class="border-b border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/60"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-4">
              <div>
                <p class="text-xs font-medium text-neutral-400">Orden</p>
                <p
                  class="font-mono text-sm font-bold text-neutral-900 dark:text-white"
                >
                  #{{ order.orderNumber }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusConfig[order.status].color"
              >
                <UIcon
                  :name="statusConfig[order.status].icon"
                  class="h-3.5 w-3.5"
                />
                {{ statusConfig[order.status].label }}
              </span>
              <span class="text-lg font-black text-neutral-900 dark:text-white">
                {{
                  order.totalAmount?.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="divide-y divide-neutral-100 px-6 dark:divide-neutral-800">
          <div
            v-for="item in order.items"
            :key="item.productId"
            class="flex items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon name="i-lucide-box" class="h-5 w-5 text-neutral-400" />
              </div>
              <div class="min-w-0">
                <p
                  class="truncate font-semibold text-neutral-900 dark:text-white"
                >
                  {{ item.name }}
                </p>
                <p class="text-sm text-neutral-500">
                  {{
                    (item.price ?? 0).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })
                  }}
                  × {{ item.quantity }}
                </p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-bold text-neutral-900 dark:text-white">
                {{
                  (item.subtotal ?? 0).toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })
                }}
              </p>
            </div>
          </div>

          <div
            v-if="order.totalAmount > order.items.reduce((acc, item) => acc + (item.subtotal ?? 0), 0)"
            class="flex items-center justify-between gap-4 py-4 bg-neutral-50/50 dark:bg-neutral-800/20 -mx-6 px-6"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30"
              >
                <UIcon name="i-lucide-truck" class="h-5 w-5 text-primary-500" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-neutral-900 dark:text-white">
                  Costo de envío
                </p>
                <p class="text-sm text-neutral-500">
                  Entrega a domicilio
                </p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-bold text-neutral-900 dark:text-white">
                {{
                  (order.totalAmount - order.items.reduce((acc, item) => acc + (item.subtotal ?? 0), 0)).toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })
                }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
        >
          <UButton
            v-if="order.status === 'PAID'"
            size="sm"
            class="cursor-pointer"
            color="primary"
            :loading="processing.has(order.id)"
            @click="markAsShipped(order.id)"
          >
            Marcar como enviado
          </UButton>
          <UButton
            v-else-if="order.status === 'SHIPPED'"
            size="sm"
            class="cursor-pointer"
            color="primary"
            :loading="processing.has(order.id)"
            @click="markAsDelivered(order.id)"
          >
            Marcar como entregado
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>