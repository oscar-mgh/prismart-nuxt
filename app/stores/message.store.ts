import { defineStore } from "pinia";
import { ref } from "vue";

export const useMessageStore = defineStore("messages", () => {
  const totalUnread = ref(0);

  const clear = () => (totalUnread.value = 0);
  const setUnread = (count: number) => {
    totalUnread.value = Math.max(0, count);
  };
  const incrementUnread = (count: number = 1) => {
    setUnread(totalUnread.value + count);
  };
  const decrementUnread = (count: number = 1) => {
    setUnread(totalUnread.value - count);
  };

  return { totalUnread, clear, setUnread, incrementUnread, decrementUnread };
});
