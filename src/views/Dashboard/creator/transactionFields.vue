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
const fileInput = ref<HTMLInputElement | null>(null);

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
    if (fileInput.value) {
        fileInput.value.value = '';
    }
}

function removeFile(index: number) {
    if (images.value) {
        images.value = images.value.filter((_, i) => i !== index);
        if (images.value.length === 0) {
            images.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
        }
    }
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

            <!-- Display selected files -->
            <div v-if="images && images.length > 0" class="mb-2">
                <span class="text-sm text-muted-foreground">Ausgewählte Dateien:</span>
                <div v-for="(file, index) in images" :key="index" class="flex gap-2 mt-1">
                    <div class="flex-1 px-3 py-2 bg-muted rounded text-sm">
                        {{ file.name }}
                    </div>
                    <Button @click="removeFile(index)" variant="destructive" size="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </Button>
                </div>
            </div>

            <div class="flex flex-row justify-end space-x-2">
                <input type="file" multiple @change="changeImage" ref="fileInput"
                    class="flex-1 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" />
                <Button variant="destructive" size="icon" @click="() => clearImage()" :disabled="!images">X</Button>
            </div>
        </div>

        <DialogClose as-child>
            <Button :onclick="createTransaction" type="button" variant="default" :disabled="!isValid">Erstellen</Button>
        </DialogClose>
    </div>
</template>