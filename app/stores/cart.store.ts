import { defineStore } from "pinia";
import { ref } from "vue";
import type { Cart } from "~~/shared/types";

export const useCartStore = defineStore("cart", () => {
  const totalItems = ref(0);

  const setTotal = (n: number = 0) => {
    totalItems.value = Math.max(0, n);
  };

  const syncFromCart = (cart: Cart | null | undefined) => {
    setTotal(cart?.totalItems ?? 0);
  };

  const clear = () => setTotal(0);
  const increment = (n: number = 1) => setTotal(totalItems.value + n);
  const decrement = (n: number = 1) => setTotal(totalItems.value - n);

  return { totalItems, setTotal, syncFromCart, clear, increment, decrement };
});
