<script setup lang="ts">
import type { ProductQuestion } from "~~/shared/types";

const route = useRoute();
const { fetchApi } = useApi();
const authStore = useAuthStore();
const toast = useToast();
const slug = route.params.slug as string;
const cartStore = useCartStore();

const questionText = ref("");
const submittingQuestion = ref(false);
const quantity = ref(1);
const addingToCart = ref(false);

const { data: product, error } = await useAsyncData(`product-${slug}`, () =>
  fetchApi<Product>(`/products/slug/${slug}`),
);

const isFavorite = ref(product.value?.isFavorite || false);

const { data: reviews } = await useAsyncData(`reviews-${slug}`, () =>
  fetchApi<PaginatedResponse<Review>>(`/reviews/product/${product.value?.id}`),
);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Producto no encontrado",
  });
}

const { data: questions, refresh: refreshQuestions } = await useAsyncData(
  `questions-${slug}`,
  () => fetchApi<ProductQuestion[]>(`/products/${product.value?.id}/questions`),
);

const submitQuestion = async () => {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Inicia sesión para continuar",
      description: "Necesitas una cuenta para hacer preguntas.",
      color: "warning",
      progress: false,
      duration: 3500,
    });
    navigateTo("/login");
    return;
  }

  if (!questionText.value.trim()) return;

  submittingQuestion.value = true;
  try {
    await fetchApi(`/products/${product.value?.id}/questions`, {
      method: "POST",
      body: {
        questionText: questionText.value.trim(),
      },
    });
    toast.add({
      title: "Pregunta enviada",
      description: "El vendedor responderá a la brevedad.",
      color: "success",
      progress: false,
      duration: 3500,
    });
    questionText.value = "";
    await refreshQuestions();
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message || "No se pudo enviar la pregunta.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    submittingQuestion.value = false;
  }
};

const addToCart = async () => {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Inicia sesión para continuar",
      description: "Necesitas una cuenta para agregar productos al carrito.",
      color: "warning",
      progress: false,
      duration: 3500,
    });
    return navigateTo("/login");
  }

  addingToCart.value = true;
  try {
    const updatedCart = await fetchApi<Cart>("/cart", {
      method: "POST",
      body: {
        productId: product.value?.id,
        quantity: quantity.value,
      },
    });
    toast.add({
      title: "Agregado al carrito",
      description: `${quantity.value}x ${product.value?.name} fue añadido a tu carrito.`,
      color: "info",
      progress: false,
      duration: 3500,
    });
    cartStore.syncFromCart(updatedCart);
    if (product.value) {
      product.value.stock -= quantity.value;
      quantity.value = 1;
    }
  } catch (err: any) {
    const msg =
      err?.data?.message || "No se pudo agregar el producto. Intenta de nuevo.";
    toast.add({
      title: "Error al agregar",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    addingToCart.value = false;
  }
};

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Inicia sesión para continuar",
      description: "Necesitas una cuenta para guardar productos en favoritos.",
      color: "warning",
      progress: false,
      duration: 3500,
    });

    return navigateTo("/login");
  }

  try {
    if (!isFavorite.value) {
      await fetchApi("/products/favorites", {
        method: "POST",
        body: {
          productId: product.value?.id,
        },
      });

      isFavorite.value = true;

      toast.add({
        title: "Agregado a favoritos",
        description: `${product.value?.name} fue guardado en tus favoritos.`,
        color: "success",
        progress: false,
        duration: 3500,
      });
    } else {
      await fetchApi(`/products/favorites/${product.value?.id}`, {
        method: "DELETE",
      });

      isFavorite.value = false;

      toast.add({
        title: "Eliminado de favoritos",
        description: `${product.value?.name} fue eliminado de tus favoritos.`,
        color: "neutral",
        progress: false,
        duration: 3500,
      });
    }
  } catch (err: any) {
    const msg =
      err?.data?.message ||
      "No se pudo actualizar favoritos. Intenta de nuevo.";

    toast.add({
      title: "Error",
      description: msg,
      color: "error",
      progress: false,
      duration: 3500,
    });
  }
};

const formattedPrice = computed(() => {
  if (!product.value) return { integer: "", fraction: "" };

  const parts = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).formatToParts(product.value.price);

  const integer = parts
    .filter((p) => p.type !== "decimal" && p.type !== "fraction")
    .map((p) => p.value)
    .join("");
  const fraction = parts.find((p) => p.type === "fraction")?.value || "00";

  return { integer, fraction };
});

const discountPrice = computed(() => {
  if (!product.value?.discount) return null;

  const discounted =
    product.value.price * (1 - product.value.discount.percentage / 100);

  const parts = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).formatToParts(discounted);

  const integer = parts
    .filter((p) => p.type !== "decimal" && p.type !== "fraction")
    .map((p) => p.value)
    .join("");
  const fraction = parts.find((p) => p.type === "fraction")?.value || "00";

  return { integer, fraction };
});

const canAnswer = computed(
  () => authStore.user?.storeId === product.value?.storeId,
);

const answeringId = ref<string | null>(null);
const answerText = ref("");
const submittingAnswer = ref(false);

const submitAnswer = async (questionId: string) => {
  if (!answerText.value.trim()) return;

  submittingAnswer.value = true;
  try {
    await fetchApi(
      `/products/${product.value?.id}/questions/${questionId}/answer`,
      {
        method: "PATCH",
        body: { answerText: answerText.value.trim() },
      },
    );
    toast.add({
      title: "Respuesta enviada",
      color: "success",
      progress: false,
      duration: 3500,
    });
    answerText.value = "";
    answeringId.value = null;
    await refreshQuestions();
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message || "No se pudo enviar la respuesta.",
      color: "error",
    });
  } finally {
    submittingAnswer.value = false;
  }
};
</script>

<template>
  <div v-if="product" class="space-y-16">
    <div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div class="space-y-4">
        <div
          class="aspect-square overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900"
        >
          <NuxtImg
            :src="product.productImage || '/placeholder-product.png'"
            :alt="product.name"
            class="h-full w-full object-cover"
          />
        </div>
      </div>

      <div class="flex flex-col">
        <nav class="mb-4">
          <ol class="flex text-sm text-neutral-500">
            <li>
              <NuxtLink to="/products" class="hover:text-primary-600"
                >Productos</NuxtLink
              >
            </li>
            <li class="mx-2">/</li>
            <li class="capitalize">{{ product.category }}</li>
          </ol>
        </nav>
        <p class="text-xs font-light my-1 text-neutral-500">
          {{ product.purchaseCount }} vendidos
        </p>
        <h1 class="text-4xl font-black text-neutral-900 dark:text-white">
          {{ product.name }}
        </h1>
        <div class="mt-2 flex items-center gap-2 text-neutral-500">
          <span>{{ product.averageRating }}</span>
          <StarRating
            :rating="formatStarRating(product.averageRating ?? 0)"
            :size="4"
          />
          ({{ reviews?.totalElements }})
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div class="flex flex-col">
            <span
              v-if="discountPrice"
              class="text-lg text-neutral-400 line-through"
            >
              {{ formattedPrice.integer
              }}<sup class="text-[0.6em] ml-0.5">{{
                formattedPrice.fraction
              }}</sup>

              <UBadge
                v-if="product.discount"
                color="error"
                variant="solid"
                size="xs"
                class="hidden sm:inline-block text-xs text-white font-semibold ml-4 rounded-lg p-1.5"
              >
                {{ product.discount.percentage }}% OFF
              </UBadge>
              <div class="sm:hidden mt-2">
                <UBadge
                  v-if="product.discount"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="text-xs text-white font-semibold rounded-lg p-1"
                >
                  {{ product.discount.percentage }}% OFF
                </UBadge>
              </div>
            </span>

            <span
              class="text-4xl font-black text-primary-600 dark:text-primary-400"
            >
              <template v-if="discountPrice">
                {{ discountPrice.integer
                }}<sup class="text-[0.6em] ml-0.5">{{
                  discountPrice.fraction
                }}</sup>
              </template>
              <template v-else>
                {{ formattedPrice.integer
                }}<sup class="text-[0.6em] ml-0.5">{{
                  formattedPrice.fraction
                }}</sup>
              </template>
            </span>
          </div>
        </div>

        <p
          class="mt-8 text-md leading-relaxed text-neutral-600 dark:text-neutral-300"
        >
          {{ product.description }}
        </p>

        <div v-if="product.features?.length" class="mt-8">
          <h3 class="font-bold text-neutral-900 dark:text-white">
            Características:
          </h3>
          <ul class="mt-4 space-y-3 text-sm">
            <li
              v-for="feat in product.features"
              :key="feat"
              class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
            >
              <UIcon name="i-lucide-check-circle-2" class="text-secondary-500" />
              {{ feat }}
            </li>
          </ul>
        </div>

        <div class="mt-auto pt-10">
          <div
            class="flex flex-row sm:flex-row items-center gap-2 sm:gap-3 w-full"
          >
            <UInput
              v-model="quantity"
              type="number"
              min="1"
              :max="product.stock"
              size="md"
              class="w-20 sm:w-20"
              :ui="{ root: 'rounded-lg' }"
            />
            <UButton
              color="primary"
              size="md"
              class="flex-1 rounded-lg font-bold cursor-pointer text-zinc-800/90 dark:text-zinc-900 justify-center"
              :loading="addingToCart"
              :disabled="product.stock === 0 || addingToCart"
              @click="addToCart()"
            >
              {{ addingToCart ? "Agregando..." : "Añadir al carrito" }}
            </UButton>
            <button
              type="button"
              :class="[
                'cursor-pointer transition-all duration-300 transform active:scale-90 focus:outline-none shrink-0',
                isFavorite
                  ? 'text-red-400'
                  : 'text-neutral-300 hover:text-pink-200 dark:text-neutral-600',
              ]"
              @click="toggleFavorite()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-6"
              >
                <path
                  d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
                />
              </svg>
            </button>
          </div>
          <p class="mt-4 text-center text-sm font-medium text-neutral-500">
            <template v-if="product.stock === 0">
              <span class="font-semibold text-red-300">¡Sin stock!</span>
            </template>

            <template v-else-if="product.stock === 1">
              <span class="font-semibold text-red-300"
                >¡Último disponible!</span
              >
            </template>

            <template v-else>
              Quedan
              <span class="text-primary-600 dark:text-primary-300">{{ product.stock }}</span>
              unidades disponibles
            </template>
          </p>
        </div>
      </div>
    </div>

    <section
      id="questions"
      class="border-t border-neutral-100 pt-16 dark:border-neutral-800"
    >
      <div class="mb-8">
        <h2 class="text-3xl font-black text-neutral-900 dark:text-white">
          Preguntas del producto
        </h2>
      </div>

      <div class="mb-10 rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-900/50">
        <h3 class="mb-4 font-bold text-neutral-900 dark:text-white">
          ¿Tienes alguna duda?
        </h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <UInput
            v-model="questionText"
            placeholder="Escribe tu pregunta aquí..."
            class="flex-1"
            :disabled="submittingQuestion"
            @keyup.enter="submitQuestion"
          />
          <UButton
            color="primary"
            class="w-full sm:w-auto cursor-pointer rounded-lg font-bold text-zinc-800/90 dark:text-zinc-900 justify-center"
            :loading="submittingQuestion"
            :disabled="!questionText.trim() || submittingQuestion"
            @click="submitQuestion"
          >
            Preguntar
          </UButton>
        </div>
      </div>

      <div v-if="questions?.length" class="space-y-4">
        <div
          v-for="q in questions"
          :key="q.id"
          class="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <UIcon
                name="i-lucide-help-circle"
                class="h-4 w-4 text-slate-400"
              />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                {{ q.questionText }}
              </p>
              <p class="mt-1 text-xs text-neutral-400">
                {{
                  new Date(q.createdAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                }}
              </p>
            </div>
          </div>

          <div
            v-if="q.answerText"
            class="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/10"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
            >
              <UIcon
                name="i-lucide-message-circle"
                class="h-4 w-4 text-emerald-600"
              />
            </div>
            <p class="text-sm text-neutral-700 dark:text-neutral-300">
              {{ q.answerText }}
            </p>
          </div>
          <div v-if="canAnswer && !q.answerText" class="mt-4">
            <div v-if="answeringId === q.id" class="flex gap-3">
              <UInput
                v-model="answerText"
                placeholder="Escribe tu respuesta..."
                class="flex-1"
                :disabled="submittingAnswer"
                @keyup.enter="submitAnswer(q.id)"
              />
              <UButton
                color="primary"
                class="cursor-pointer rounded-lg font-bold text-zinc-800/90"
                :loading="submittingAnswer"
                :disabled="!answerText.trim() || submittingAnswer"
                @click="submitAnswer(q.id)"
              >
                Responder
              </UButton>
              <UButton
                color="neutral"
                variant="subtle"
                class="cursor-pointer rounded-lg"
                :disabled="submittingAnswer"
                @click="
                  answeringId = null;
                  answerText = '';
                "
              >
                Cancelar
              </UButton>
            </div>
            <UButton
              v-else
              color="neutral"
              variant="subtle"
              icon="i-lucide-reply"
              class="cursor-pointer rounded-lg text-sm"
              @click="
                answeringId = q.id;
                answerText = '';
              "
            >
              Responder
            </UButton>
          </div>
        </div>
      </div>

      <div v-else class="py-10 text-center text-neutral-400">
        Aún no hay preguntas para este producto.
      </div>
    </section>

    <section class="border-t border-neutral-100 pt-16 dark:border-neutral-800">
      <div class="mb-10">
        <h2 class="text-3xl font-black text-neutral-900 dark:text-white">
          Todas las reseñas
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="review in reviews?.data"
          :key="review.id"
          class="rounded-2xl bg-neutral-50 dark:bg-neutral-900/50"
        >
          <h4 class="mb-2 font-bold text-sm text-neutral-900 dark:text-white">
            {{ review.username }}
          </h4>
          <StarRating :rating="review.rating" />
          <h4 class="mt-4 font-bold text-neutral-900 dark:text-white">
            {{ review.title }}
          </h4>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {{ review.description }}
          </p>
          <p class="mt-4 text-xs font-medium text-neutral-400">
            Fecha de la reseña:
            {{
              review.postedAt
                ? new Date(review.postedAt)
                    .toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .replace(/ de /g, " de ")
                    .replace(
                      /(^|\s)([a-z])/,
                      (m, p1, p2) => p1 + p2.toUpperCase(),
                    )
                : ""
            }}
          </p>
        </UCard>
      </div>

      <div
        v-if="!reviews?.data.length"
        class="text-center py-10 text-neutral-400"
      >
        No hay reseñas para este producto aún.
      </div>
    </section>
  </div>
</template>
