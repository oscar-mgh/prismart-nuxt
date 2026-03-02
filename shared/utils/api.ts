import { useAuthStore } from "~/stores/auth.store";

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const fetchApi = async <T>(endpoint: string, options: any = {}) => {
    const baseUrl = config.public.apiBase || "http://localhost:3000/api/v1";
    const currentToken = authStore.token;

    const headers = {
      ...options.headers,
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const response = await $fetch<T>(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  };

  return { fetchApi };
};
