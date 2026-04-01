<script setup>
import { Star, StarHalf } from "lucide-vue-next";

const props = defineProps({
  rating: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 5,
  },
  size: {
    type: [Number, String],
    default: 5,
  },
});

const getStarType = (index) => {
  if (props.rating >= index) return "full";
  if (props.rating >= index - 0.5) return "half";
  return "empty";
};

const bgStyles = { fill: "#505050", strokeWidth: 2 };
const fgStyles = { fill: "#FFD700", strokeWidth: 2 };
</script>

<template>
  <div class="flex items-center gap-1 text-zinc-600 dark:text-zinc-800">
    <div class="star-rating">
      <div class="stars background">
        <Star
          v-for="i in max"
          :key="`bg-${i}`"
          v-bind="bgStyles"
          :class="[`w-${size}`, `h-${size}`]"
        />
      </div>

      <div class="stars foreground">
        <template v-for="i in max" :key="`fg-${i}`">
          <Star
            v-if="getStarType(i) === 'full'"
            v-bind="fgStyles"
            :class="[`w-${size}`, `h-${size}`]"
          />
          <StarHalf
            v-else-if="getStarType(i) === 'half'"
            v-bind="fgStyles"
            :class="[`w-${size}`, `h-${size}`]"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.star-rating {
  position: relative;
  display: inline-flex;
  -webkit-font-smoothing: antialiased;
}

.stars {
  display: flex;
  gap: 2px;
}

.foreground {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
