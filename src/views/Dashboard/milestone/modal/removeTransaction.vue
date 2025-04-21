<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ref, type PropType } from 'vue';
import type { MilestoneResponse, TransactionResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TrashIcon } from '@radix-icons/vue';

const props = defineProps({
    transaction: {
        type: Object as PropType<TransactionResponse>,
        required: true,
    },
    milestone: {
        type: Object as PropType<MilestoneResponse>,
        required: true,
    },
});

const client = usePocketBase();
const user = useUser();
const isProcessing = ref(false);
const mode = ref<'remove' | 'delete'>('remove');

const removeTransaction = async () => {
    isProcessing.value = true;
    try {
        // Update transaction to remove milestone reference
        await client.collection('transaction').update(props.transaction.id, {
            milestone: null
        });
        
        console.log('Transaction removed from milestone successfully');
    } catch (error) {
        console.error('Error removing transaction from milestone:', error);
    } finally {
        isProcessing.value = false;
    }
};

const deleteTransaction = async () => {
    isProcessing.value = true;
    try {
        // First find and delete any transaction auth records
        const authRecords = await client.collection('transactionAuth').getFullList({
            filter: `transaction = "${props.transaction.id}"`,
        });
        
        for (const record of authRecords) {
            await client.collection('transactionAuth').delete(record.id);
        }
        
        // Then delete the transaction
        await client.collection('transaction').delete(props.transaction.id);
        
        console.log('Transaction deleted successfully');
    } catch (error) {
        console.error('Error deleting transaction:', error);
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" class="h-6 w-6">
                <TrashIcon class="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Transaktion Management</DialogTitle>
                <DialogDescription>
                    Wähle, ob du die Transaktion vom Meilenstein entfernen oder komplett löschen möchtest.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="flex flex-col space-y-2">
                    <div class="font-medium">{{ props.transaction.title }}</div>
                    <div class="text-sm text-muted-foreground">{{ props.transaction.amount }} € ({{ props.transaction.type }})</div>
                    <div class="text-sm text-muted-foreground">{{ props.transaction.message }}</div>
                </div>
                
                <div class="flex flex-col space-y-2">
                    <label class="flex items-center space-x-2">
                        <input type="radio" value="remove" v-model="mode" class="form-radio" />
                        <span>Vom Meilenstein entfernen (Transaktion bleibt erhalten)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="radio" value="delete" v-model="mode" class="form-radio" 
                               :disabled="props.transaction.createdby !== user.userId" />
                        <span :class="{ 'opacity-50': props.transaction.createdby !== user.userId }">
                            Transaktion komplett löschen
                        </span>
                    </label>
                    <p v-if="props.transaction.createdby !== user.userId" class="text-xs text-muted-foreground">
                        Du kannst nur Transaktionen löschen, die du selbst erstellt hast.
                    </p>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button 
                        v-if="mode === 'remove'" 
                        @click="removeTransaction" 
                        :disabled="isProcessing"
                    >
                        {{ isProcessing ? 'Wird entfernt...' : 'Von Meilenstein entfernen' }}
                    </Button>
                    <Button 
                        v-else 
                        variant="destructive" 
                        @click="deleteTransaction" 
                        :disabled="isProcessing || props.transaction.createdby !== user.userId"
                    >
                        {{ isProcessing ? 'Wird gelöscht...' : 'Transaktion löschen' }}
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>