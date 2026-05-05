import { defineStore } from "pinia";
import { ref } from "vue";

export const usePackageStore = defineStore("package", () => {
  const pendingCount = ref(0);
  const { fetchApi } = useApi();

  const fetchPendingCount = async () => {
    try {
      const orders = await fetchApi<any[]>("/orders/assigned/me");
      const pendingOrders = orders.filter((order) => order.status === "PAID");
      pendingCount.value = pendingOrders.length;
    } catch (error) {
      console.error("Error al obtener el conteo de paquetes:", error);
      pendingCount.value = 0;
    }
  };

  const clear = () => {
    pendingCount.value = 0;
  };

  return { pendingCount, fetchPendingCount, clear };
});
