<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { fetchApi } = useApi()
const toast = useToast()
const cartStore = useCartStore()

const cart = ref<Cart | null>(null)
const loading = ref(false)
const clearingCart = ref(false)
const confirmClear = ref(false)
const updatingItems = ref<Set<string>>(new Set())

const { shippingFee, freeShippingThreshold, getShippingCost, isShippingFree }
  = useCartShipping()

const fetchCart = async () => {
  loading.value = true
  try {
    const response = await fetchApi<Cart>('/cart')

    cart.value = {
      ...response,
      items: [...response.items]
    }
    cartStore.syncFromCart(response)
  } catch {
    toast.add({
      title: 'Error al cargar el carrito',
      description: 'No se pudo obtener tu carrito. Intenta de nuevo.',
      color: 'error',
      progress: false,
      duration: 3500
    })
  } finally {
    loading.value = false
  }
}

await fetchCart()

const subtotalOriginal = computed(
  () =>
    cart.value?.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) ?? 0
)

const subtotalFinal = computed(
  () =>
    cart.value?.items.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0
    ) ?? 0
)

const hasDiscount = computed(
  () => subtotalOriginal.value > subtotalFinal.value
)

const shippingFree = computed(() => isShippingFree(subtotalFinal.value))

const shippingCost = computed(() => getShippingCost(subtotalFinal.value))

const grandTotal = computed(() => subtotalFinal.value + shippingCost.value)

const isEmpty = computed(() => !cart.value?.items?.length)

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'data' in err) {
    const maybeData = err.data

    if (maybeData && typeof maybeData === 'object' && 'message' in maybeData) {
      const message = maybeData.message

      if (typeof message === 'string') return message
    }
  }

  return fallback
}

const formatPrice = (n: number) => {
  const value = n ?? 0

  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

const isUpdating = (productId: string) => updatingItems.value.has(productId)

const syncCartKeepingOrder = (updatedCart: Cart) => {
  if (!cart.value) {
    cart.value = updatedCart
    return
  }

  const previousOrder = cart.value.items.map(item => item.productId)

  const orderedItems = [...updatedCart.items].sort((a, b) => {
    const indexA = previousOrder.indexOf(a.productId)
    const indexB = previousOrder.indexOf(b.productId)

    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    return indexA - indexB
  })

  cart.value = {
    ...updatedCart,
    items: orderedItems
  }
}

const updateQuantity = async (productId: string, delta: number) => {
  if (isUpdating(productId)) return

  updatingItems.value.add(productId)

  try {
    const updatedCart = await fetchApi<Cart>(`/cart/${productId}`, {
      method: 'PATCH',
      body: {
        quantity: delta
      }
    })

    syncCartKeepingOrder(updatedCart)
    cartStore.syncFromCart(updatedCart)
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'No se pudo actualizar la cantidad.')

    toast.add({
      title: 'Error de stock',
      description: msg,
      color: 'error',
      progress: false,
      duration: 3500
    })
  } finally {
    updatingItems.value.delete(productId)
  }
}

const removeItem = async (productId: string, quantity: number) => {
  await updateQuantity(productId, -quantity)
}

const checkout = async () => {
  await navigateTo('/checkout')
}

const clearCart = async () => {
  clearingCart.value = true

  try {
    await fetchApi('/cart', {
      method: 'DELETE'
    })

    cart.value = {
      id: cart.value?.id || '',
      userId: cart.value?.userId || '',
      items: [],
      totalItems: 0,
      updatedAt: cart.value?.updatedAt || ''
    }

    toast.add({
      title: 'Se vació el carrito',
      description: 'Todos los productos fueron eliminados.',
      color: 'success',
      progress: false,
      duration: 3500
    })
    cartStore.clear()
  } catch {
    toast.add({
      title: 'Error',
      description: 'No se pudo vaciar el carrito.',
      color: 'error',
      progress: false,
      duration: 3500
    })
  } finally {
    clearingCart.value = false
    confirmClear.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl py-10">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
        Mi Carrito
      </h1>

      <p class="mt-1 text-neutral-500 dark:text-neutral-400">
        {{ cart?.items?.length ?? 0 }} producto{{
          (cart?.items?.length ?? 0) !== 1 ? "s" : ""
        }}
      </p>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <div class="space-y-4 lg:col-span-2">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-36 w-full rounded-2xl"
        />
      </div>

      <USkeleton class="h-80 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <UIcon
        name="i-lucide-shopping-cart"
        class="mb-6 h-16 w-16 text-neutral-300 dark:text-neutral-700 text-3xl"
      />

      <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
        Tu carrito está vacío
      </h2>

      <p class="mt-2 text-neutral-500 dark:text-neutral-400">
        Agrega productos para comenzar.
      </p>

      <UButton
        to="/products"
        color="primary"
        size="lg"
        class="mt-8 cursor-pointer rounded-xl px-8 font-semibold"
      >
        Explorar productos
      </UButton>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      <div class="space-y-4 lg:col-span-2">
        <div
          v-if="!shippingFree"
          class="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 dark:border-red-800/40 dark:bg-red-900/20"
        >
          <UIcon
            name="i-lucide-truck"
            class="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
          />

          <p class="text-sm text-red-800 dark:text-red-300">
            Te faltan
            <span class="font-bold">
              {{ formatPrice(freeShippingThreshold - subtotalFinal) }}
            </span>
            para obtener envío gratis.
          </p>
        </div>

        <div
          v-else
          class="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-3 dark:border-primary-800/40 dark:bg-primary-900/20"
        >
          <UIcon
            name="i-lucide-package-check"
            class="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400"
          />

          <p class="text-sm font-medium text-primary-800 dark:text-primary-300">
            ¡Tienes envío gratis en este pedido!
          </p>
        </div>

        <div
          v-for="item in cart?.items"
          :key="item.productId"
          class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          :class="{ 'opacity-60': isUpdating(item.productId) }"
        >
          <div class="flex flex-col sm:flex-row gap-5">
            <NuxtLink
              :to="`/product/${item.slug}`"
              class="shrink-0"
            >
              <div
                class="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800"
              >
                <NuxtImg
                  :src="item.productImage"
                  :alt="item.name"
                  class="h-full w-full object-contain p-2"
                />
              </div>
            </NuxtLink>

            <div class="flex min-w-0 flex-1 flex-col justify-between">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <NuxtLink
                    :to="`/product/${item.slug}`"
                    class="block truncate font-bold text-neutral-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                  >
                    {{ item.name }}
                  </NuxtLink>
                </div>

                <div class="shrink-0 text-right">
                  <p class="font-black text-neutral-900 dark:text-white">
                    {{ formatPrice(item.finalPrice * item.quantity) }}
                  </p>

                  <p
                    v-if="item.finalPrice < item.price"
                    class="text-xs text-neutral-400 line-through"
                  >
                    {{ formatPrice(item.price * item.quantity) }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="flex items-center gap-1">
                  <span
                    v-if="item.finalPrice < item.price"
                    class="text-xs text-neutral-400 line-through"
                  >
                    {{ formatPrice(item.price) }}
                  </span>

                  <span
                    class="text-sm font-semibold text-primary-600 dark:text-primary-400"
                  >
                    {{ formatPrice(item.finalPrice) }}
                  </span>

                  <span class="text-xs text-neutral-400"> c/u </span>
                </div>

                <div class="flex items-center gap-2">
                  <div
                    class="flex items-center overflow-hidden border border-neutral-200 rounded-lg dark:border-neutral-700"
                  >
                    <UButton
                      color="neutral"
                      variant="link"
                      size="md"
                      class="rounded-none cursor-pointer"
                      :disabled="
                        isUpdating(item.productId) || item.quantity <= 1
                      "
                      @click="updateQuantity(item.productId, -1)"
                    >
                      <UIcon
                        name="i-lucide-minus"
                        class="h-3.5 w-3.5"
                      />
                    </UButton>

                    <div
                      class="flex h-8 min-w-[48px] items-center justify-center border-x border-neutral-200 px-3 text-sm font-bold text-neutral-900 dark:border-neutral-700 dark:text-white"
                    >
                      {{ item.quantity }}
                    </div>

                    <UButton
                      color="neutral"
                      variant="link"
                      size="md"
                      class="rounded-none cursor-pointer"
                      :disabled="isUpdating(item.productId)"
                      @click="updateQuantity(item.productId, 1)"
                    >
                      <UIcon
                        name="i-lucide-plus"
                        class="h-3.5 w-3.5"
                      />
                    </UButton>
                  </div>

                  <UButton
                    color="error"
                    variant="ghost"
                    size="lg"
                    icon="i-lucide-trash-2"
                    class="cursor-pointer rounded-lg ml-0 sm:ml-4"
                    :disabled="isUpdating(item.productId)"
                    @click="removeItem(item.productId, item.quantity)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="isUpdating(item.productId)"
            class="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-neutral-900/60"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="h-5 w-5 animate-spin text-primary-600"
            />
          </div>
        </div>

        <div class="flex justify-center sm:justify-end pt-2">
          <div
            v-if="confirmClear"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-neutral-500">
              ¿Vaciar todo el carrito?
            </span>

            <UButton
              size="sm"
              color="error"
              variant="soft"
              class="cursor-pointer rounded-lg"
              :loading="clearingCart"
              @click="clearCart"
            >
              Sí, vaciar
            </UButton>

            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              class="cursor-pointer rounded-lg"
              @click="confirmClear = false"
            >
              Cancelar
            </UButton>
          </div>

          <UButton
            v-else
            size="md"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            class="cursor-pointer rounded-lg"
            @click="confirmClear = true"
          >
            Vaciar carrito
          </UButton>
        </div>
      </div>

      <div
        class="h-fit rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24"
      >
        <h2 class="mb-6 text-lg font-black text-neutral-900 dark:text-white">
          Resumen del pedido
        </h2>

        <div class="space-y-3 text-sm">
          <div
            class="flex items-center justify-between text-neutral-500 dark:text-neutral-400"
          >
            <span>Subtotal</span>

            <span :class="{ 'line-through': hasDiscount }">
              {{ formatPrice(subtotalOriginal) }}
            </span>
          </div>

          <div
            v-if="hasDiscount"
            class="flex items-center justify-between text-primary-600 dark:text-primary-400"
          >
            <span>Descuento</span>

            <span> -{{ formatPrice(subtotalOriginal - subtotalFinal) }} </span>
          </div>

          <div
            v-if="hasDiscount"
            class="flex items-center justify-between font-semibold text-neutral-900 dark:text-white"
          >
            <span>Subtotal con descuento</span>

            <span>
              {{ formatPrice(subtotalFinal) }}
            </span>
          </div>

          <div
            class="flex items-center justify-between text-neutral-500 dark:text-neutral-400"
          >
            <span>Envío estándar</span>

            <span
              v-if="shippingFree"
              class="flex items-center gap-2"
            >
              <span class="text-neutral-400 line-through">
                {{ formatPrice(shippingFee) }}
              </span>

              <span
                class="font-semibold text-primary-600 dark:text-primary-400"
              >
                Gratis
              </span>
            </span>

            <span v-else>
              {{ formatPrice(shippingFee) }}
            </span>
          </div>

          <div
            class="border-t border-neutral-100 pt-3 dark:border-neutral-800"
          />

          <div class="flex items-center justify-between">
            <span class="text-base font-black text-neutral-900 dark:text-white">
              Total
            </span>

            <div class="text-right">
              <p class="text-xl font-black text-neutral-900 dark:text-white">
                {{ formatPrice(grandTotal) }}
              </p>

              <p
                v-if="hasDiscount"
                class="text-xs text-primary-600 dark:text-primary-400"
              >
                Ahorrás
                {{ formatPrice(subtotalOriginal - subtotalFinal) }}
              </p>
            </div>
          </div>
        </div>

        <p
          class="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500"
        >
          Envío gratis en pedidos mayores a
          {{ formatPrice(freeShippingThreshold) }}
        </p>

        <UButton
          color="primary"
          block
          size="xl"
          class="mt-6 cursor-pointer rounded-xl font-bold"
          @click="checkout"
        >
          Finalizar compra
        </UButton>

        <div
          class="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400"
        >
          <UIcon
            name="i-lucide-shield-check"
            class="h-3.5 w-3.5"
          />
          Pago 100% seguro
        </div>
      </div>
    </div>
  </div>
</template>
