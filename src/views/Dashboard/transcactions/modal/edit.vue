<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { computed, ref, type PropType } from 'vue';
import { TransactionAuthStateOptions, TransactionTypeOptions, type TransactionAuthResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import pb, { type ExpandTransaction } from '@/lib/pb';
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
const deletedRecipes = ref<string[]>([]);
const existingRecipes = computed(() => {
    const allRecipes = props.transaction.expand?.transaction.recipe || [];
    return allRecipes.filter(recipe => !deletedRecipes.value.includes(recipe));
});

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

    const updateData: any = {
        title: title.value,
        message: description.value,
        amount: amountKonto.value || 0,
        amount_bar: amountBar.value || 0,
        type: transactionType.value,
    };

    // Handle recipe updates
    if (images.value !== null) {
        // New files selected - replace all
        updateData.recipe = images.value;
    } else if (deletedRecipes.value.length > 0) {
        // Files were deleted - update with remaining files
        updateData.recipe = existingRecipes.value;
    }

    usePocketBase().collection('transaction').update(props.transaction.expand!.transaction.id, updateData).then(() => {
        console.log('Transaction updated successfully');
    }).catch((error) => {
        console.error('Error updating transaction:', error);
    });
}

const hasChanges = computed(() => {
    return title.value !== props.transaction.expand?.transaction.title ||
        (amountKonto.value || 0) !== (props.transaction.expand?.transaction.amount || 0) ||
        (amountBar.value || 0) !== (props.transaction.expand?.transaction.amount_bar || 0) ||
        description.value !== props.transaction.expand?.transaction.message ||
        deletedRecipes.value.length > 0 ||
        images.value !== null;
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

async function openAttachment(attachment: string) {
    const newWindow = window.open('', '_blank');
    const url = await pb.getFileURL(props.transaction.expand!.transaction, attachment);
    if (newWindow && url) {
        newWindow.location.href = url;
    } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.split('/').pop() || 'download';
        link.click();
    }
}

const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...' + filename.substring(filename.length - 4);
};

function deleteRecipe(attachment: string) {
    deletedRecipes.value.push(attachment);
};
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

            <!-- Display existing recipes -->
            <div v-if="existingRecipes.length > 0 && images === null">
                <span class="text-sm text-muted-foreground">Vorhandene Belege:</span>
                <div v-for="attachment in existingRecipes" :key="attachment" class="flex gap-2 mt-1">
                    <Button @click="openAttachment(attachment)" class="flex-1 justify-start" variant="outline">
                        {{ truncateFilename(attachment.split('/').pop() || '') }}
                    </Button>
                    <Button @click="deleteRecipe(attachment)" variant="destructive" size="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </Button>
                </div>
            </div>

            <Input type="file" multiple @change="changeImage" />
            <div v-if="images !== null" class="text-xs text-muted-foreground mt-1">
                {{ images.length }} neue(s) Dokument(e) ausgewählt (ersetzt vorhandene Belege)
            </div>

            <DialogClose as-child>
                <Button @click="updateTransaction" type="button" variant="default" :disabled="!hasChanges || !isValid">
                    {{ hasChanges ? 'Speichern' : 'Keine Änderungen' }}
                </Button>
            </DialogClose>
        </DialogContent>
    </Dialog>
</template>