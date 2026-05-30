<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { fetchApi } = useApi();
const authStore = useAuthStore();
const route = useRoute();
const toast = useToast();
const messageStore = useMessageStore();

const conversations = ref<Conversation[]>([]);
const messages = ref<Message[]>([]);
const selectedConversationId = ref<string | null>(null);
const draft = ref("");
const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);

const selectedConversation = computed(() =>
  conversations.value.find(
    (conversation) => conversation.id === selectedConversationId.value,
  ),
);

const filteredConversations = computed(() => {
  const orderId =
    typeof route.query.order === "string" ? route.query.order : null;
  if (!orderId) return conversations.value;
  return conversations.value.filter(
    (conversation) => conversation.orderId === orderId,
  );
});

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("es-MX", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const loadMessages = async (conversationId: string) => {
  loadingMessages.value = true;
  try {
    messages.value = await fetchApi<Message[]>(
      `/messages/conversations/${conversationId}`,
    );
  } catch (err: any) {
    toast.add({
      title: "Error al cargar mensajes",
      description: err?.data?.message || "No se pudo abrir la conversación.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingMessages.value = false;
  }
};

const selectConversation = async (conversationId: string) => {
  const prev = conversations.value.find((c) => c.id === conversationId);
  const wasUnread = prev?.unreadCount ?? 0;

  selectedConversationId.value = conversationId;
  await loadMessages(conversationId);

  if (prev) prev.unreadCount = 0;
  messageStore.setUnread(Math.max(0, messageStore.totalUnread - wasUnread));
};

const loadConversations = async () => {
  loadingConversations.value = true;
  try {
    conversations.value = await fetchApi<Conversation[]>(
      "/messages/conversations",
    );
    const initial =
      filteredConversations.value[0]?.id ?? conversations.value[0]?.id ?? null;
    if (initial) {
      await selectConversation(initial);
    } else {
      selectedConversationId.value = null;
      messages.value = [];
    }
  } catch (err: any) {
    toast.add({
      title: "Error al cargar conversaciones",
      description: err?.data?.message || "No se pudieron obtener tus mensajes.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    loadingConversations.value = false;
  }
};

const sendMessage = async () => {
  if (!selectedConversationId.value || !draft.value.trim()) return;

  sending.value = true;
  try {
    const message = await fetchApi<Message>(
      `/messages/conversations/${selectedConversationId.value}`,
      {
        method: "POST",
        body: { body: draft.value },
      },
    );
    messages.value.push(message);
    draft.value = "";
    await loadConversations();
    selectedConversationId.value = message.conversationId;
  } catch (err: any) {
    toast.add({
      title: "No se pudo enviar",
      description: err?.data?.message || "Intenta de nuevo.",
      color: "error",
      progress: false,
      duration: 3500,
    });
  } finally {
    sending.value = false;
  }
};

await loadConversations();
</script>

<template>
  <div class="mx-auto max-w-6xl pb-10">
    <div class="mb-8">
      <h1 class="text-3xl font-black text-neutral-900 dark:text-white">
        Mensajes
      </h1>
    </div>

    <div
      v-if="loadingConversations"
      class="grid gap-5 lg:grid-cols-[320px_1fr]"
    >
      <USkeleton class="h-155 rounded-2xl" />
      <USkeleton class="h-155 rounded-2xl" />
    </div>

    <div
      v-else-if="!conversations.length"
      class="flex min-h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-200/30 dark:bg-neutral-800/30 px-6 text-center dark:border-neutral-800"
    >
      <UIcon
        name="i-lucide-message-circle"
        class="mb-5 h-14 w-14 text-neutral-300 text-3xl dark:text-neutral-700"
      />
      <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
        Aún no tienes conversaciones
      </h2>
      <p class="mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        Los mensajes se habilitan cuando se confirma una compra entre comprador
        y vendedor.
      </p>
    </div>

    <div
      v-else-if="!filteredConversations.length"
      class="flex min-h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 text-center dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <UIcon
        name="i-lucide-message-circle"
        class="mb-5 h-14 w-14 text-neutral-300 dark:text-neutral-700"
      />
      <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
        No hay mensajes para esta orden
      </h2>
      <p class="mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        La conversación aparecerá cuando el pago quede confirmado.
      </p>
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <button
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          type="button"
          class="flex w-full cursor-pointer flex-col gap-2 border-b border-neutral-100 p-4 text-left transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
          :class="{
            'bg-primary-50 dark:bg-primary-950/20':
              selectedConversationId === conversation.id,
          }"
          @click="selectConversation(conversation.id)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-bold text-neutral-900 dark:text-white">
                {{ conversation.storeName }}
              </p>
              <p class="text-xs text-neutral-500">
                {{ conversation.otherUserName }}
              </p>
              <p class="font-mono text-xs text-neutral-400">
                #{{ conversation.orderNumber }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span class="text-xs text-neutral-400">{{
                formatDate(conversation.updatedAt)
              }}</span>
              <span
                v-if="conversation.unreadCount > 0"
                class="flex h-4 w-4 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-black text-white"
              >
                {{ conversation.unreadCount }}
              </span>
            </div>
          </div>
          <p
            class="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400"
          >
            {{ conversation.lastMessage || conversation.itemSummary }}
          </p>
        </button>
      </aside>

      <section
        class="flex min-h-155 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div
          v-if="selectedConversation"
          class="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800"
        >
          <p class="font-bold text-neutral-900 dark:text-white">
            {{ selectedConversation.storeName }}
          </p>
          <p class="text-sm text-neutral-500">
            Orden #{{ selectedConversation.orderNumber }}
          </p>
        </div>

        <div
          class="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-5 dark:bg-neutral-950/40"
        >
          <template v-if="loadingMessages">
            <USkeleton v-for="i in 5" :key="i" class="h-16 rounded-xl" />
          </template>

          <template v-else>
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="{
                'justify-end': message.senderId === authStore.user?.id,
                'justify-start': message.senderId !== authStore.user?.id,
              }"
            >
              <div
                class="max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm"
                :class="
                  message.senderId === authStore.user?.id
                    ? 'bg-primary-600 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                "
              >
                <p class="whitespace-pre-wrap">{{ message.body }}</p>
                <p
                  class="mt-2 text-right text-[11px]"
                  :class="
                    message.senderId === authStore.user?.id
                      ? 'text-primary-100'
                      : 'text-neutral-400'
                  "
                >
                  {{ formatDate(message.createdAt) }}
                </p>
              </div>
            </div>
          </template>
        </div>

        <form
          class="flex items-end gap-3 border-t border-neutral-100 p-4 dark:border-neutral-800"
          @submit.prevent="sendMessage"
        >
          <UTextarea
            v-model="draft"
            autoresize
            :rows="1"
            :maxrows="4"
            placeholder="Escribe un mensaje..."
            class="flex-1"
            :disabled="!selectedConversationId || sending"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <UButton
            type="submit"
            icon="i-lucide-send"
            color="primary"
            variant="solid"
            class="flex items-center justify-center p-2.25 aspect-square rounded-xl cursor-pointer transition-all hover:scale-105"
            :loading="sending"
            :disabled="!selectedConversationId || !draft.trim()"
          />
        </form>
      </section>
    </div>
  </div>
</template>
