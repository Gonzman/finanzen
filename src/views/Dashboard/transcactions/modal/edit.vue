<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { computed, ref, type PropType } from 'vue';
import { TransactionAuthStateOptions, TransactionTypeOptions, type TransactionAuthResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import type { ExpandTransaction } from '@/lib/pb';
import { isUserChairOfCommittee } from '@/lib/utils';
import { formatCurrency } from '@/ts/format';

const props = defineProps({
    transaction: {
        type: Object as PropType<TransactionAuthResponse<ExpandTransaction>>,
        required: true,
    },
});

const title = ref(props.transaction.expand?.transaction.title || '');
const amountKonto = ref<number | undefined>(props.transaction.expand?.transaction.amount || undefined);
const amountBar = ref<number | undefined>(props.transaction.expand?.transaction.amount_bar || undefined);
const description = ref(props.transaction.expand?.transaction.message || '');
const showAmountError = ref(false);
const images = ref<File[] | null>(null);

// Calculate the net effect (positive = gain, negative = loss)
const netEffect = computed(() => {
    return (amountKonto.value || 0) + (amountBar.value || 0);
});

// Determine transaction type based on net effect
const transactionType = computed(() => {
    if (netEffect.value >= 0) {
        return TransactionTypeOptions.Eingehend;
    }
    return TransactionTypeOptions.Ausgehend;
});

function updateTransaction() {
    if ((amountKonto.value === undefined || amountKonto.value === 0) &&
        (amountBar.value === undefined || amountBar.value === 0)) {
        showAmountError.value = true;
        return;
    }
    showAmountError.value = false;

    usePocketBase().collection('transaction').update(props.transaction.expand!.transaction.id, {
        title: title.value,
        message: description.value,
        amount: amountKonto.value || 0,
        amount_bar: amountBar.value || 0,
        type: transactionType.value,
        recipe: images.value,
    }).then(() => {
        console.log('Transaction updated successfully');
    }).catch((error) => {
        console.error('Error updating transaction:', error);
    });
}

const hasChanges = computed(() => {
    return title.value !== props.transaction.expand?.transaction.title ||
        (amountKonto.value || 0) !== (props.transaction.expand?.transaction.amount || 0) ||
        (amountBar.value || 0) !== (props.transaction.expand?.transaction.amount_bar || 0) ||
        description.value !== props.transaction.expand?.transaction.message;
});

const isValid = computed(() => {
    return (amountKonto.value !== undefined && amountKonto.value !== 0) ||
        (amountBar.value !== undefined && amountBar.value !== 0);
});

function changeImage(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        images.value = Array.from(target.files);
    }
}
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start" :disabled="!props.transaction.expand?.transaction?.createdby ||
                (props.transaction.expand.transaction.createdby !== useUser().userId && !isUserChairOfCommittee(props.transaction) && !useUser().isPruefer()) ||
                props.transaction.state === TransactionAuthStateOptions.Autorisiert ||
                props.transaction.state === TransactionAuthStateOptions.Abgeschlossen">
                Bearbeiten
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Transaktion bearbeiten</DialogTitle>
                <DialogDescription>
                    Bearbeite die Transaktionsdetails.
                </DialogDescription>
            </DialogHeader>

            <Label>Titel</Label>
            <Input :placeholder="transaction.expand?.transaction.title || 'Titel'" v-model="title" />

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <Label>Konto (Bank)</Label>
                    <Input placeholder="+100 oder -50" v-model.number="amountKonto" inputmode="decimal" type="number"
                        step="0.01" @input="showAmountError = false" />
                </div>
                <div>
                    <Label>Barkasse</Label>
                    <Input placeholder="+100 oder -50" v-model.number="amountBar" inputmode="decimal" type="number"
                        step="0.01" @input="showAmountError = false" />
                </div>
            </div>

            <div v-if="showAmountError" class="text-red-500 text-sm">Mindestens ein Betrag muss eingegeben werden</div>

            <!-- Show net effect preview -->
            <div v-if="amountKonto || amountBar" class="p-3 rounded-md bg-muted">
                <div class="text-sm text-muted-foreground mb-1">Vorschau:</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div v-if="amountKonto" class="flex justify-between">
                        <span>Konto:</span>
                        <span :class="amountKonto >= 0 ? 'text-green-600' : 'text-red-600'">
                            {{ amountKonto >= 0 ? '+' : '' }}{{ formatCurrency(amountKonto) }}
                        </span>
                    </div>
                    <div v-if="amountBar" class="flex justify-between">
                        <span>Bar:</span>
                        <span :class="amountBar >= 0 ? 'text-green-600' : 'text-red-600'">
                            {{ amountBar >= 0 ? '+' : '' }}{{ formatCurrency(amountBar) }}
                        </span>
                    </div>
                </div>
                <div class="border-t mt-2 pt-2 flex justify-between font-medium">
                    <span>Netto:</span>
                    <span :class="netEffect >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ netEffect >= 0 ? '+' : '' }}{{ formatCurrency(netEffect) }}
                    </span>
                </div>
            </div>

            <Label>Beschreibung</Label>
            <Textarea :placeholder="transaction.expand?.transaction.message || 'Beschreibung'"
                v-model="description"></Textarea>

            <Label>Beleg</Label>
            <Input type="file" multiple @change="changeImage" />

            <DialogClose as-child>
                <Button @click="updateTransaction" type="button" variant="default" :disabled="!hasChanges || !isValid">
                    {{ hasChanges ? 'Speichern' : 'Keine Änderungen' }}
                </Button>
            </DialogClose>
        </DialogContent>
    </Dialog>
</template>