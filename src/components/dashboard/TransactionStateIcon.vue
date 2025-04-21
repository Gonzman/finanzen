<script setup lang="ts">
import { computed } from 'vue';
import { TransactionAuthStateOptions } from '@/lib/pocketbase-types';

// Import icons from lucide-vue-next
import { 
  Clock, 
  CircleEllipsis, 
  CheckCircle, 
  CircleCheck, 
  AlertCircle
} from 'lucide-vue-next';

const props = defineProps({
  state: {
    type: String,
    required: true,
    validator: (value: string) => {
      return Object.values(TransactionAuthStateOptions).includes(value as TransactionAuthStateOptions);
    }
  },
  size: {
    type: Number,
    default: 16
  }
});

const stateConfig = computed(() => {
  switch (props.state) {
    case TransactionAuthStateOptions.Ausstehend:
      return {
        icon: Clock,
        color: 'text-amber-500',
        tooltip: 'Ausstehend'
      };
    case TransactionAuthStateOptions["In Bearbeitung"]:
      return {
        icon: CircleEllipsis,
        color: 'text-blue-500',
        tooltip: 'In Bearbeitung'
      };
    case TransactionAuthStateOptions.Autorisiert:
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        tooltip: 'Autorisiert'
      };
    case TransactionAuthStateOptions.Abgeschlossen:
      return {
        icon: CircleCheck,
        color: 'text-emerald-600',
        tooltip: 'Abgeschlossen'
      };
    case TransactionAuthStateOptions.Fehlgeschlagen:
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        tooltip: 'Fehlgeschlagen'
      };
    default:
      return {
        icon: Clock,
        color: 'text-gray-400',
        tooltip: 'Unbekannt'
      };
  }
});
</script>

<template>
  <div class="inline-flex items-center" :title="stateConfig.tooltip">
    <component 
      :is="stateConfig.icon" 
      :class="stateConfig.color" 
      :size="size"
    />
    <span v-if="$slots.default" class="ml-1">
      <slot></slot>
    </span>
  </div>
</template>