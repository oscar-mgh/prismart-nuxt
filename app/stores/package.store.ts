import { defineStore } from "pinia";
import { ref } from "vue";
import type { Order } from "~~/shared/types";

export const usePackageStore = defineStore("package", () => {
  const pendingCount = ref(0);
  const { fetchApi } = useApi();

  const fetchPendingCount = async () => {
    try {
      const orders = await fetchApi<Order[]>("/orders/assigned/me");
      syncFromOrders(orders);
    } catch (error) {
      console.error("Error al obtener el conteo de paquetes:", error);
      pendingCount.value = 0;
    }
  };

  const syncFromOrders = (orders: Order[] = []) => {
    pendingCount.value = orders.filter(
      (order) => order.status === "PAID",
    ).length;
  };

  const clear = () => {
    pendingCount.value = 0;
  };

  return { pendingCount, fetchPendingCount, syncFromOrders, clear };
});
