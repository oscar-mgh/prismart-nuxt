<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

definePageMeta({
  middleware: "auth",
});

type UserAddress = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type CheckoutIntentResponse = {
  clientSecret: string;
  subtotal: number;
  shippingCost: number;
  total: number;
};

type StripeCardElement = {
  mount: (selector: string) => void;
  destroy: () => void;
  on: (
    event: "change",
    callback: (event: {
      error?: { message: string };
      complete: boolean;
    }) => void,
  ) => void;
};

type StripeInstance = {
  elements: () => {
    create: (
      type: "card",
      options?: Record<string, unknown>,
    ) => StripeCardElement;
  };
  confirmCardPayment: (
    clientSecret: string,
    data: Record<string, unknown>,
  ) => Promise<{
    error?: { message?: string };
    paymentIntent?: { status?: string };
  }>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

const { fetchApi } = useApi();
const toast = useToast();
const cartStore = useCartStore();
const config = useRuntimeConfig();
const { getShippingCost } = useCartShipping();

const cart = ref<Cart | null>(null);
const addresses = ref<UserAddress[]>([]);
const selectedAddressIndex = ref<number | null>(null);
const loading = ref(false);
const loadingAddresses = ref(false);
const addingAddress = ref(false);
const deletingAddressIndex = ref<number | null>(null);
const processingPayment = ref(false);
const stripeReady = ref(false);
const cardComplete = ref(false);
const cardError = ref("");
const paymentSummary = ref<CheckoutIntentResponse | null>(null);

let stripe: StripeInstance | null = null;
let cardElement: StripeCardElement | null = null;

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const maybeData = "data" in err ? err.data : undefined;
    const maybeMessage = "message" in err ? err.message : undefined;

    if (maybeData && typeof maybeData === "object" && "message" in maybeData) {
      const dataMessage = maybeData.message;

      if (typeof dataMessage === "string") return dataMessage;
    }

    if (typeof maybeMessage === "string") return maybeMessage;
  }

  return fallback;
};

const addressSchema = z.object({
  street: z
    .string()
    .trim()
    .min(5, "La calle debe tener al menos 5 caracteres")
    .max(100, "La calle no puede superar 100 caracteres"),
  city: z
    .string()
    .trim()
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(50, "La ciudad no puede superar 50 caracteres"),
  state: z
    .string()
    .trim()
    .min(2, "El estado debe tener al menos 2 caracteres")
    .max(50, "El estado no puede superar 50 caracteres"),
  zipCode: z
    .string()
    .trim()
    .min(5, "El código postal debe tener al menos 5 caracteres")
    .max(10, "El código postal no puede superar 10 caracteres"),
});

type AddressForm = z.output<typeof addressSchema>;

const newAddress = reactive<AddressForm>({
  street: "",
  city: "",
  state: "",
  zipCode: "",
});

const paymentState = reactive({
  fullName: "",
  email: "",
  phone: "",
});

const subtotalFinal = computed(
  () =>
    cart.value?.items.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0,
    ) ?? 0,
);

const subtotalOriginal = computed(
  () =>
    cart.value?.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ) ?? 0,
);

const hasDiscount = computed(
  () => subtotalOriginal.value > subtotalFinal.value,
);

const localShippingCost = computed(() => getShippingCost(subtotalFinal.value));
const localTotal = computed(
  () => subtotalFinal.value + localShippingCost.value,
);
const selectedAddress = computed(() =>
  selectedAddressIndex.value === null
    ? null
    : addresses.value[selectedAddressIndex.value],
);
const isEmpty = computed(() => !cart.value?.items?.length);

const displaySubtotal = computed(
  () => paymentSummary.value?.subtotal ?? subtotalFinal.value,
);
const displayShipping = computed(
  () => paymentSummary.value?.shippingCost ?? localShippingCost.value,
);
const displayTotal = computed(
  () => paymentSummary.value?.total ?? localTotal.value,
);

const formatPrice = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const fetchCart = async () => {
  loading.value = true;

  try {
    const response = await fetchApi<Cart>("/cart");
    cart.value = {
      ...response,
      items: [...response.items],
    };
    cartStore.syncFromCart(response);
  } catch {
    toast.add({
      title: "Error al cargar el carrito",
      description: "No se pudo obtener tu carrito. Intenta de nuevo.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loading.value = false;
  }
};

const normalizeAddresses = (
  response: UserAddress[] | { addresses: UserAddress[] },
) => (Array.isArray(response) ? response : (response.addresses ?? []));

const fetchAddresses = async () => {
  loadingAddresses.value = true;

  try {
    const response = await fetchApi<
      UserAddress[] | { addresses: UserAddress[] }
    >("/auth/addresses");
    addresses.value = normalizeAddresses(response);

    if (addresses.value.length && selectedAddressIndex.value === null) {
      selectedAddressIndex.value = 0;
    }
  } catch {
    toast.add({
      title: "Error al cargar direcciones",
      description: "No se pudieron obtener tus direcciones guardadas.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingAddresses.value = false;
  }
};

const resetAddressForm = () => {
  newAddress.street = "";
  newAddress.city = "";
  newAddress.state = "";
  newAddress.zipCode = "";
};

const addAddress = async (event: FormSubmitEvent<AddressForm>) => {
  addingAddress.value = true;

  try {
    await fetchApi("/auth/address", {
      method: "POST",
      body: event.data,
    });

    await fetchAddresses();
    selectedAddressIndex.value = Math.max(addresses.value.length - 1, 0);
    resetAddressForm();

    toast.add({
      title: "Dirección agregada",
      description: "Ya puedes usarla para este pedido.",
      color: "success",
      progress: false,
      duration: 3500,
    });
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, "No se pudo agregar la dirección.");
    toast.add({
      title: "Error al guardar",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    addingAddress.value = false;
  }
};

const deleteAddress = async (addressIndex: number) => {
  deletingAddressIndex.value = addressIndex;

  try {
    await fetchApi(`/auth/address/${addressIndex}`, {
      method: "DELETE",
    });

    addresses.value = addresses.value.filter(
      (_, index) => index !== addressIndex,
    );

    if (!addresses.value.length) {
      selectedAddressIndex.value = null;
    } else if (
      selectedAddressIndex.value === addressIndex ||
      selectedAddressIndex.value === null
    ) {
      selectedAddressIndex.value = 0;
    } else if (selectedAddressIndex.value > addressIndex) {
      selectedAddressIndex.value -= 1;
    }

    toast.add({
      title: "Dirección eliminada",
      color: "success",
    });
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, "No se pudo eliminar la dirección.");
    toast.add({
      title: "Error al eliminar",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    deletingAddressIndex.value = null;
  }
};

const loadStripeScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Stripe) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.stripe.com/v3/"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

const setupStripe = async () => {
  const publishableKey = config.public.stripePublishableKey;

  if (!publishableKey) {
    cardError.value = "Variable de entorno faltante.";
    return;
  }

  try {
    await loadStripeScript();

    if (!window.Stripe) {
      throw new Error("Stripe.js no está disponible.");
    }

    stripe = window.Stripe(publishableKey);
    const elements = stripe.elements();

    cardElement = elements.create("card", {
      hidePostalCode: true,
      style: {
        base: {
          color: window.matchMedia("(prefers-color-scheme: dark").matches
            ? "#ffffff"
            : "#171717",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "16px",
          "::placeholder": {
            color: "#a3a3a3",
          },
        },
        invalid: {
          color: "#dc2626",
        },
      },
    });

    cardElement.on("change", (event) => {
      cardComplete.value = event.complete;
      cardError.value = event.error?.message ?? "";
    });

    cardElement.mount("#stripe-card-element");
    stripeReady.value = true;
  } catch {
    cardError.value = "No se pudo cargar el formulario de pago.";
  }
};

const processPayment = async () => {
  if (!stripe || !cardElement) {
    toast.add({
      title: "Stripe no está listo",
      description: "Espera a que el formulario de pago termine de cargar.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }

  if (!selectedAddress.value || selectedAddressIndex.value === null) {
    toast.add({
      title: "Selecciona una dirección",
      description: "Necesitas una dirección de envío para continuar.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }

  if (!paymentState.fullName.trim() || !paymentState.email.trim()) {
    toast.add({
      title: "Completa tus datos de pago",
      description: "El nombre y correo son requeridos.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }

  if (!cardComplete.value) {
    toast.add({
      title: "Revisa tu tarjeta",
      description: cardError.value || "La información de pago está incompleta.",
      color: "error",
      progress: false,
      duration: 3500,
    });
    return;
  }

  processingPayment.value = true;

  try {
    const checkoutIntent = await fetchApi<CheckoutIntentResponse>(
      "/checkout/payment-intent",
      {
        method: "POST",
        body: {
          addressIndex: selectedAddressIndex.value,
        },
      },
    );
    paymentSummary.value = checkoutIntent;

    const stripeAddress = {
      line1: selectedAddress.value.street,
      city: selectedAddress.value.city,
      state: selectedAddress.value.state,
      postal_code: selectedAddress.value.zipCode,
    };

    const result = await stripe.confirmCardPayment(
      checkoutIntent.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: paymentState.fullName,
            email: paymentState.email,
            phone: paymentState.phone || undefined,
            address: stripeAddress,
          },
        },
        shipping: {
          name: paymentState.fullName,
          phone: paymentState.phone || undefined,
          address: stripeAddress,
        },
      },
    );

    if (result.error) {
      throw new Error(result.error.message || "No se pudo procesar el pago.");
    }

    await fetchApi("/cart", {
      method: "DELETE",
    });

    toast.add({
      title: "Pago exitoso",
      description: "Tu pedido ha sido confirmado correctamente.",
      color: "success",
      progress: false,
      duration: 3500,
    });

    cartStore.clear();
    await navigateTo("/my-orders?payment=success");
  } catch (err: unknown) {
    const msg = getApiErrorMessage(
      err,
      "No se pudo procesar el pago. Intenta de nuevo.",
    );
    toast.add({
      title: "Error en el pago",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    processingPayment.value = false;
  }
};

await Promise.all([fetchCart(), fetchAddresses()]);

onMounted(() => {
  setupStripe();
});

onBeforeUnmount(() => {
  cardElement?.destroy();
});
</script>

<template>
  <div class="mx-auto max-w-6xl py-10">
    <div
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">
          Checkout
        </p>
        <h1 class="mt-1 text-3xl font-black text-neutral-900 dark:text-white">
          Finalizar compra
        </h1>
      </div>

      <UButton
        to="/cart"
        color="neutral"
        variant="soft"
        class="w-fit rounded-xl"
      >
        Volver al carrito
      </UButton>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <USkeleton class="h-64 w-full rounded-2xl" />
        <USkeleton class="h-72 w-full rounded-2xl" />
      </div>
      <USkeleton class="h-96 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <UIcon
        name="i-lucide-shopping-cart"
        class="mb-6 h-16 w-16 text-3xl text-neutral-300 dark:text-neutral-700"
      />
      <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
        Tu carrito está vacío
      </h2>
      <UButton to="/products" color="primary" size="lg" class="mt-8 rounded-xl">
        Explorar productos
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <section
          class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="mb-5 flex items-center justify-between gap-4">
            <h2
              class="flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white"
            >
              <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-primary-500" />
              Dirección de envío
            </h2>

            <UIcon
              v-if="loadingAddresses"
              name="i-lucide-loader-2"
              class="h-5 w-5 animate-spin text-neutral-400"
            />
          </div>

          <div v-if="addresses.length" class="space-y-3">
            <label
              v-for="(address, index) in addresses"
              :key="`${address.street}-${index}`"
              class="flex items-center cursor-pointer gap-3 rounded-xl border p-4 transition-colors"
              :class="
                selectedAddressIndex === index
                  ? 'border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
              "
            >
              <input
                v-model="selectedAddressIndex"
                type="radio"
                name="shipping-address"
                :value="index"
                class="mt-1 h-4 w-4 accent-primary-600"
              />

              <div class="min-w-0 flex-1">
                <p class="font-semibold text-neutral-900 dark:text-white">
                  {{ address.street }}
                </p>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {{ address.city }}, {{ address.state }} {{ address.zipCode }}
                </p>
              </div>

              <UButton
                color="error"
                variant="ghost"
                size="lg"
                icon="i-lucide-trash-2"
                class="shrink-0 h-fit rounded-lg cursor-pointer"
                :loading="deletingAddressIndex === index"
                @click.prevent="deleteAddress(index)"
              />
            </label>
          </div>

          <p
            v-else
            class="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
          >
            Aún no tienes direcciones guardadas.
          </p>
        </section>

        <UForm
          :schema="addressSchema"
          :state="newAddress"
          class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          @submit="addAddress"
        >
          <h2
            class="mb-5 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4 text-primary-500" />
            Agregar dirección
          </h2>

          <div class="space-y-4">
            <UFormField label="Calle y número" name="street" required>
              <UInput
                v-model="newAddress.street"
                placeholder="Ej: Av. Insurgentes Sur 1234"
                size="lg"
                icon="i-lucide-map"
                class="w-full"
                :ui="{ root: 'rounded-xl' }"
              />
            </UFormField>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField label="Ciudad / Municipio" name="city" required>
                <UInput
                  v-model="newAddress.city"
                  placeholder="Ej: Ciudad de México"
                  size="lg"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Estado" name="state" required>
                  <UInput
                    v-model="newAddress.state"
                    placeholder="Ej: CDMX"
                    size="lg"
                    class="w-full"
                    :ui="{ root: 'rounded-xl' }"
                  />
                </UFormField>

                <UFormField label="Código postal" name="zipCode" required>
                  <UInput
                    v-model="newAddress.zipCode"
                    placeholder="Ej: 06820"
                    size="lg"
                    class="w-full"
                    :ui="{ root: 'rounded-xl' }"
                  />
                </UFormField>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <UButton
                type="submit"
                color="neutral"
                size="lg"
                variant="soft"
                icon="i-lucide-save"
                class="rounded-xl cursor-pointer w-full sm:w-auto"
                :loading="addingAddress"
              >
                Guardar dirección
              </UButton>
            </div>
          </div>
        </UForm>

        <section
          class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2
            class="mb-5 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white"
          >
            <UIcon
              name="i-lucide-credit-card"
              class="h-4 w-4 text-primary-500"
            />
            Información de pago
          </h2>

          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField label="Nombre del titular" required>
                <UInput
                  v-model="paymentState.fullName"
                  placeholder="Nombre completo"
                  size="lg"
                  icon="i-lucide-user"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>

              <UFormField label="Correo electrónico" required>
                <UInput
                  v-model="paymentState.email"
                  type="email"
                  placeholder="correo@dominio.com"
                  size="lg"
                  icon="i-lucide-mail"
                  class="w-full"
                  :ui="{ root: 'rounded-xl' }"
                />
              </UFormField>
            </div>

            <UFormField label="Teléfono">
              <UInput
                v-model="paymentState.phone"
                placeholder="Opcional"
                size="lg"
                icon="i-lucide-phone"
                class="w-full"
                :ui="{ root: 'rounded-xl' }"
              />
            </UFormField>

            <UFormField label="Tarjeta" required>
              <div
                id="stripe-card-element"
                class="min-h-12 rounded-xl border border-neutral-200 dark:text-white bg-neutral-800 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
              />
              <p v-if="cardError" class="mt-2 text-sm text-red-600">
                {{ cardError }}
              </p>
            </UFormField>
          </div>
        </section>
      </div>

      <aside
        class="h-fit rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24"
      >
        <h2 class="mb-6 text-lg font-black text-neutral-900 dark:text-white">
          Resumen del pedido
        </h2>

        <div class="space-y-4">
          <div
            v-for="item in cart?.items"
            :key="item.productId"
            class="flex gap-3"
          >
            <div
              class="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800"
            >
              <NuxtImg
                :src="item.productImage"
                :alt="item.name"
                class="h-full w-full object-contain p-1.5"
              />
            </div>

            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-semibold text-neutral-900 dark:text-white"
              >
                {{ item.name }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ item.quantity }} x {{ formatPrice(item.finalPrice) }}
              </p>
            </div>

            <p
              class="shrink-0 text-sm font-bold text-neutral-900 dark:text-white"
            >
              {{ formatPrice(item.finalPrice * item.quantity) }}
            </p>
          </div>
        </div>

        <div
          class="mt-6 space-y-3 border-t border-neutral-100 pt-5 text-sm dark:border-neutral-800"
        >
          <div
            class="flex items-center justify-between text-neutral-500 dark:text-neutral-400"
          >
            <span>Subtotal</span>
            <span>{{ formatPrice(displaySubtotal) }}</span>
          </div>

          <div
            v-if="hasDiscount"
            class="flex items-center justify-between text-primary-600 dark:text-primary-400"
          >
            <span>Descuento</span>
            <span>-{{ formatPrice(subtotalOriginal - subtotalFinal) }}</span>
          </div>

          <div
            class="flex items-center justify-between text-neutral-500 dark:text-neutral-400"
          >
            <span>Envío</span>
            <span>{{
              displayShipping === 0 ? "Gratis" : formatPrice(displayShipping)
            }}</span>
          </div>

          <div
            class="border-t border-neutral-100 pt-3 dark:border-neutral-800"
          />

          <div class="flex items-center justify-between">
            <span class="text-base font-black text-neutral-900 dark:text-white">
              Total
            </span>
            <span class="text-xl font-black text-neutral-900 dark:text-white">
              {{ formatPrice(displayTotal) }}
            </span>
          </div>
        </div>

        <UButton
          color="primary"
          block
          size="xl"
          icon="i-lucide-lock"
          class="mt-6 rounded-xl font-bold cursor-pointer"
          :loading="processingPayment"
          :disabled="!stripeReady || !selectedAddress || processingPayment"
          @click="processPayment"
        >
          Procesar pago
        </UButton>

        <div
          class="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400"
        >
          <UIcon name="i-lucide-shield-check" class="h-3.5 w-3.5" />
          Pago seguro con Stripe
        </div>
      </aside>
    </div>
  </div>
</template>
