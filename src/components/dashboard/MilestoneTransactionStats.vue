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

// Fetch transaction authorizations for all transactions in this milestone
const fetchTransactionAuths = async () => {
  loading.value = true;
  
  try {
    // Only fetch for transactions that exist
    if (props.transactions.length === 0) {
      loading.value = false;
      return;
    }
    
    // Create a filter with all transaction IDs
    const transactionIds = props.transactions.map(t => t.id);
    const filter = transactionIds.map(id => `transaction="${id}"`).join('||');
    
    const results = await client.collection('transactionAuth').getFullList({
      filter: filter
    });
    
    // Store results in a lookup object for easy access
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

// Count transactions by state
const stateCounts = computed(() => {
  const counts = {
    [TransactionAuthStateOptions.Ausstehend]: 0,
    [TransactionAuthStateOptions['In Bearbeitung']]: 0,
    [TransactionAuthStateOptions.Autorisiert]: 0,
    [TransactionAuthStateOptions.Abgeschlossen]: 0,
    [TransactionAuthStateOptions.Fehlgeschlagen]: 0,
    unknown: 0
  };
  
  // Count transactions by their authorization state
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

// Watch for changes to transactions and update auth records
watch(() => props.transactions, fetchTransactionAuths, { immediate: true });

onMounted(fetchTransactionAuths);
</script>

<template>
  <div class="flex items-center gap-2" v-if="!loading">
    <!-- Only display states that have at least one transaction in that state -->
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
  </div>
  <div v-else class="text-xs text-muted-foreground">Lade...</div>
</template>