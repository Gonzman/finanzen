<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import Input from '@/components/ui/input/Input.vue';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TransactionTypeOptions, } from '@/lib/pocketbase-types';
import { ref, computed } from 'vue';
import { formatCurrency } from '@/ts/format';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const title = ref('');
const description = ref("");
const amountKonto = ref<number | undefined>(undefined);
const amountBar = ref<number | undefined>(undefined);
const showAmountError = ref(false);

const images = ref<File[] | null>(null);

const user = useUser();
const pocketbase = usePocketBase();

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

function createTransaction() {
    if (title.value.length < 1) return;
    if ((amountKonto.value === undefined || amountKonto.value === 0) &&
        (amountBar.value === undefined || amountBar.value === 0)) {
        showAmountError.value = true;
        return;
    }

    showAmountError.value = false;

    const data = {
        title: title.value,
        message: description.value,
        amount: amountKonto.value || 0,
        amount_bar: amountBar.value || 0,
        ausschuss: props.committee.id,
        createdby: user.userId,
        recipe: images.value,
        type: transactionType.value,
    };

    pocketbase.collection('transaction').create(data).then(() => {
        title.value = '';
        description.value = '';
        amountKonto.value = undefined;
        amountBar.value = undefined;
    }).catch((error) => {
        console.error('Error creating transaction:', error);
    });
}

function changeImage(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
        images.value = Array.from(files)
    }
}

function clearImage() {
    images.value = null;
}

const isValid = computed(() => {
    return title.value.length > 0 &&
        ((amountKonto.value !== undefined && amountKonto.value !== 0) ||
            (amountBar.value !== undefined && amountBar.value !== 0));
});
</script>

<template>
    <div class="flex flex-col space-y-4">
        <Label>Titel<span class="text-red-500">*</span></Label>
        <Input placeholder="Titel" v-model.trim="title" />

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
        <Textarea placeholder="Beschreibung" v-model.trim="description"></Textarea>

        <div>
            <Label>Belege</Label>
            <div class="flex flex-row justify-end space-x-2">
                <Input type="file" multiple @change="changeImage" />
                <Button variant="destructive" size="icon" @click="() => clearImage()" :disabled="!images">X</Button>
            </div>
        </div>

        <DialogClose as-child>
            <Button :onclick="createTransaction" type="button" variant="default" :disabled="!isValid">Erstellen</Button>
        </DialogClose>
    </div>
</template>