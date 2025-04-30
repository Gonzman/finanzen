<script setup lang="ts">
import { computed, watch } from 'vue';
import { TransactionAuthStateOptions } from '@/lib/pocketbase-types';
import TransactionStateIcon from './TransactionStateIcon.vue';
import { usePocketBase } from '@/components/usePocketbase';
import { onMounted, ref } from 'vue';
import type { TransactionResponse, TransactionAuthResponse } from '@/lib/pocketbase-types';

const props = defineProps({
  milestoneId: {
    type: String,
    required: true
  },
  transactions: {
    type: Array as () => TransactionResponse[],
    required: true
  }
});

const client = usePocketBase();
const transactionAuths = ref<{[key: string]: TransactionAuthResponse}>({});
const loading = ref(true);

const fetchTransactionAuths = async () => {
  loading.value = true;
  
  try {
    if (props.transactions.length === 0) {
      loading.value = false;
      return;
    }
    
    const transactionIds = props.transactions.map(t => t.id);
    const filter = transactionIds.map(id => `transaction="${id}"`).join('||');
    
    const results = await client.collection('transactionAuth').getFullList({
      filter: filter
    });
    
    const auths: {[key: string]: TransactionAuthResponse} = {};
    for (const auth of results) {
      if (auth.transaction) {
        auths[auth.transaction] = auth;
      }
    }
    transactionAuths.value = auths;
  } catch (error) {
    console.error('Error fetching transaction authorizations:', error);
  } finally {
    loading.value = false;
  }
};

const stateCounts = computed(() => {
  const counts = {
    [TransactionAuthStateOptions.Ausstehend]: 0,
    [TransactionAuthStateOptions['In Bearbeitung']]: 0,
    [TransactionAuthStateOptions.Autorisiert]: 0,
    [TransactionAuthStateOptions.Abgeschlossen]: 0,
    [TransactionAuthStateOptions.Fehlgeschlagen]: 0,
    [TransactionAuthStateOptions.Abgelehnt]: 0,
    unknown: 0
  };
  
  for (const transaction of props.transactions) {
    const auth = transactionAuths.value[transaction.id];
    if (auth && auth.state) {
      counts[auth.state as TransactionAuthStateOptions]++;
    } else {
      counts.unknown++;
    }
  }
  
  return counts;
});

watch(() => props.transactions, fetchTransactionAuths, { immediate: true });

onMounted(fetchTransactionAuths);
</script>

<template>
  <div class="flex items-center gap-2" v-if="!loading">
    <div v-if="stateCounts[TransactionAuthStateOptions.Ausstehend] > 0" 
         class="flex items-center gap-1" title="Ausstehende Transaktionen">
      <TransactionStateIcon :state="TransactionAuthStateOptions.Ausstehend" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions.Ausstehend] }}</span>
    </div>
    
    <div v-if="stateCounts[TransactionAuthStateOptions['In Bearbeitung']] > 0" 
         class="flex items-center gap-1" title="Transaktionen in Bearbeitung">
      <TransactionStateIcon :state="TransactionAuthStateOptions['In Bearbeitung']" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions['In Bearbeitung']] }}</span>
    </div>
    
    <div v-if="stateCounts[TransactionAuthStateOptions.Autorisiert] > 0" 
         class="flex items-center gap-1" title="Autorisierte Transaktionen">
      <TransactionStateIcon :state="TransactionAuthStateOptions.Autorisiert" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions.Autorisiert] }}</span>
    </div>
    
    <div v-if="stateCounts[TransactionAuthStateOptions.Abgeschlossen] > 0" 
         class="flex items-center gap-1" title="Abgeschlossene Transaktionen">
      <TransactionStateIcon :state="TransactionAuthStateOptions.Abgeschlossen" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions.Abgeschlossen] }}</span>
    </div>
    
    <div v-if="stateCounts[TransactionAuthStateOptions.Fehlgeschlagen] > 0" 
         class="flex items-center gap-1" title="Fehlgeschlagene Transaktionen">
      <TransactionStateIcon :state="TransactionAuthStateOptions.Fehlgeschlagen" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions.Fehlgeschlagen] }}</span>
    </div>
    <div v-if="stateCounts[TransactionAuthStateOptions.Abgelehnt] > 0" 
         class="flex items-center gap-1" title="Abgelehnte Transaktionen">
      <TransactionStateIcon :state="TransactionAuthStateOptions.Abgelehnt" :size="16" />
      <span class="text-xs">{{ stateCounts[TransactionAuthStateOptions.Abgelehnt] }}</span>
    </div>
  </div>
  <div v-else class="text-xs text-muted-foreground">Lade...</div>
</template>