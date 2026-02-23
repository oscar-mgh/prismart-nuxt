import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCartStore } from "./cart.store";
import { useNotificationStore } from "./notification.store";
import { useMessageStore } from "./message.store";
import type { AuthResponse, Cart, User } from "~~/shared/types";
import type {
  navigateTo as navigateToFn,
  useCookie as useCookieFn,
  useRuntimeConfig as useRuntimeConfigFn,
} from "nuxt/app";

declare const navigateTo: typeof navigateToFn;
declare const useCookie: typeof useCookieFn;
declare const useRuntimeConfig: typeof useRuntimeConfigFn;

const syncMessages = async (rawToken: string) => {
  const messageStore = useMessageStore();
  try {
    const config = useRuntimeConfig();
    const baseUrl = config.public.apiBase || "http://localhost:3000/api/v1";
    const conversations = await $fetch<{ unreadCount: number }[]>(
      `${baseUrl}/messages/conversations`,
      { headers: { Authorization: `Bearer ${rawToken}` } },
    );
    const total = conversations.reduce(
      (acc, c) => acc + (c.unreadCount ?? 0),
      0,
    );
    messageStore.setUnread(total);
  } catch {
    messageStore.clear();
  }
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const authCookie = useCookie<string | null>("auth_token", {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  const token = computed(() => authCookie.value ?? null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "SUPER_ADMIN");
  const isSalesAdmin = computed(() => user.value?.role === "SALES_ADMIN");
  const isCustomer = computed(() => user.value?.role === "CUSTOMER");

  const syncCart = async (rawToken: string) => {
    const cartStore = useCartStore();
    try {
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiBase || "http://localhost:3000/api/v1";
      const cart = await $fetch<Cart>(`${baseUrl}/cart`, {
        headers: { Authorization: `Bearer ${rawToken}` },
      });
      cartStore.syncFromCart(cart);
    } catch {
      cartStore.clear();
    }
  };

  const setAuth = async (authData: AuthResponse) => {
    user.value = authData.user;
    authCookie.value = authData.token;
    await syncCart(authData.token);
    await syncMessages(authData.token);
  };

  const logout = () => {
    const cartStore = useCartStore();
    const notificationStore = useNotificationStore();
    const messageStore = useMessageStore();

    cartStore.clear();
    notificationStore.disconnectSocket();
    notificationStore.notifications = [];
    messageStore.clear();

    user.value = null;
    authCookie.value = null;
    navigateTo("/login");
  };

  const initAuth = async () => {
    const rawToken = authCookie.value;
    if (!rawToken || user.value) return;

    try {
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiBase || "http://localhost:3000/api/v1";
      const data = await $fetch<User>(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${rawToken}` },
      });
      user.value = data;
      await syncCart(rawToken);
      await syncMessages(rawToken);
    } catch {
      user.value = null;
      authCookie.value = null;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isSalesAdmin,
    isCustomer,
    setAuth,
    logout,
    initAuth,
  };
});
