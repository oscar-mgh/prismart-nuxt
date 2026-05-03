import { defineStore } from "pinia";
import { io, type Socket } from "socket.io-client";
import { computed, ref } from "vue";
import { useAuthStore } from "./auth.store";
import { useMessageStore } from "./message.store";
import { usePackageStore } from "./package.store";
import { type AppNotification } from "~~/shared/types";
import type { useRuntimeConfig as useRuntimeConfigFn } from "nuxt/app";

declare const useRuntimeConfig: typeof useRuntimeConfigFn;

export const useNotificationStore = defineStore("notifications", () => {
  const { fetchApi } = useApi();
  const authStore = useAuthStore();
  const messageStore = useMessageStore();
  const config = useRuntimeConfig();

  const notifications = ref<AppNotification[]>([]);
  const loading = ref(false);
  const selectedNotification = ref<AppNotification | null>(null);
  const isPanelOpen = ref(false);
  const isModalOpen = ref(false);

  let socket: Socket | null = null;

  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.isRead).length,
  );

  const sortedNotifications = computed(() =>
    [...notifications.value].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const fetchNotifications = async () => {
    if (!authStore.isAuthenticated) return;
    loading.value = true;
    try {
      const data = await fetchApi<AppNotification[]>("/notifications");
      notifications.value = data;
    } catch {
      console.error("Failed to fetch notifications");
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    try {
      await fetchApi(`/notifications/${notification.id}/read`, {
        method: "PATCH",
      });

      notifications.value = notifications.value.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n,
      );
    } catch {}
  };

  const deleteOne = async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}`, { method: "DELETE" });
      notifications.value = notifications.value.filter((n) => n.id !== id);
    } catch {}
  };

  const deleteAll = async () => {
    try {
      await fetchApi("/notifications/all", { method: "DELETE" });
      notifications.value = [];
    } catch {}
  };

  const openDetail = async (notification: AppNotification) => {
    selectedNotification.value = notification;
    isModalOpen.value = true;
    await markAsRead(notification);
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi("/notifications/read/all", { method: "PATCH" });
      notifications.value = notifications.value.map((n) => ({
        ...n,
        isRead: true,
      }));
    } catch {}
  };

  const closeModal = () => {
    isModalOpen.value = false;
    selectedNotification.value = null;
  };

  const connectSocket = () => {
    if (import.meta.server) return;
    if (!authStore.isAuthenticated || !authStore.user?.id) return;
    if (socket?.connected) return;

    const socketUrl =
      (config.public.websocketBase as string) || "http://localhost:3000";

    socket = io(`${socketUrl}/notifications`, {
      transports: ["websocket"],
      auth: { userId: authStore.user.id },
    });

    socket.on("connect", () => {
      socket?.emit("notifications:join", { userId: authStore.user!.id });
    });

    socket.on("notification.created", (notification: AppNotification) => {
      const nextNotification = { ...notification, isRead: false };
      notifications.value = [
        nextNotification,
        ...notifications.value.filter((n) => n.id !== notification.id),
      ];

      if (notification.type === "NEW_MESSAGE") {
        messageStore.incrementUnread();
      }

      if (
        notification.type === "ORDER_PAID" ||
        notification.type === "ORDER_SHIPPED" ||
        notification.type === "ORDER_DELIVERED" ||
        notification.type === "ORDER_CANCELLED"
      ) {
        const packageStore = usePackageStore();
        if (authStore.user?.role === "DELIVERY_AGENT") {
          packageStore.fetchPendingCount();
        }
      }
    });

    socket.on("package_count_changed", () => {
      const packageStore = usePackageStore();
      if (typeof packageStore.fetchPendingCount === "function") {
        packageStore.fetchPendingCount();
      }
    });

    socket.on("disconnect", () => {});
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.off("connect");
      socket.off("notification.created");
      socket.off("package_count_changed");
      socket.off("disconnect");
      socket.disconnect();
    }
    socket = null;
  };

  return {
    notifications,
    sortedNotifications,
    loading,
    unreadCount,
    selectedNotification,
    isPanelOpen,
    isModalOpen,
    fetchNotifications,
    markAsRead,
    deleteOne,
    deleteAll,
    openDetail,
    closeModal,
    connectSocket,
    disconnectSocket,
    markAllAsRead,
  };
});
