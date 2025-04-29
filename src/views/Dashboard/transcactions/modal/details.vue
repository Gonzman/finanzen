<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type PropType, computed } from 'vue';
import type { TransactionResponse } from '@/lib/pocketbase-types';
import { TransactionTypeOptions } from '@/lib/pocketbase-types';
import type { ExpandTransactionMilestone } from '@/lib/pb';

const props = defineProps({
    id: {
        type: Object as PropType<TransactionResponse<ExpandTransactionMilestone>>,
        required: true,
    },
});

// Compute style and text for the transaction avatar
const transactionData = computed(() => {
    const amount = props.id.amount;
    const isIncoming = props.id.type === TransactionTypeOptions.Eingehend;
    
    // Calculate background color based on transaction type
    const bgColor = isIncoming ? 'bg-green-100' : 'bg-red-100';
    const textColor = isIncoming ? 'text-green-700' : 'text-red-700';
    
    // Format amount for display
    const formattedAmount = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
    
    // Create short display for avatar fallback (e.g., "€50" or "-€50")
    const shortDisplay = isIncoming ? `+${amount}€` : `-${amount}€`;
    
    return {
        bgColor,
        textColor,
        formattedAmount,
        shortDisplay,
        isIncoming
    };
});
</script>

<template>
    <Dialog>
    <DialogTrigger asChild>
    <Button variant="ghost" class="text-left w-fulls justify-start">
        Details anzeigen
    </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
        <DialogTitle>Transaktion</DialogTitle>
    </DialogHeader>
    <div class="flex flex-col space-y-4">
        <!-- Transaction Avatar - similar to UserNav Avatar -->
        <div class="flex items-center space-x-4">
 
            <div>
                <h3 class="font-medium">{{ props.id.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ transactionData.formattedAmount }}</p>
                <span :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    transactionData.isIncoming ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`">
                    {{ props.id.type }}
                </span>
            </div>
        </div>
        
        <!-- Transaction Details -->
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Erstellt am</span>
                <span class="text-sm">{{ new Date(props.id.created).toLocaleDateString('de-DE') }}</span>
            </div>

            <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Erstellt von</span>
                <span class="text-sm">{{ props.id.expand?.createdby.name ?? props.id.expand?.createdby?.email }}</span>
            </div>
            
            <div v-if="props.id.message" class="mt-2">
                <span class="text-sm text-muted-foreground">Nachricht:</span>
                <p class="text-sm mt-1 p-2 bg-muted rounded-md">{{ props.id.message }}</p>
            </div>
        </div>
    </div>
    <div class="mt-4">
        <DialogClose asChild>
            <Button variant="outline" class="w-full">
                Schließen
            </Button>
        </DialogClose>
    </div>
    </DialogContent>
</Dialog>
</template>