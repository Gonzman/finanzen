<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import Input from '@/components/ui/input/Input.vue';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TransactionTypeOptions, } from '@/lib/pocketbase-types';
import { ref, computed } from 'vue';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const title = ref('');
const description = ref("");
const amount = ref(0);
const ausgabe = ref(true);
const showAmountError = ref(false);

const images = ref<File[] | null>(null);

const user = useUser();
const pocketbase = usePocketBase();

function createTransaction() {
    if (title.value.length < 1) return;
    if (amount.value <= 0) {
        showAmountError.value = true;
        return;
    }
    
    showAmountError.value = false;

    const data = {
        title: title.value,
        message: description.value,
        amount: ausgabe.value ? -Math.abs(amount.value) : Math.abs(amount.value),
        ausschuss: props.committee.id,
        createdby: user.userId,
        recipe: images.value,
        type: ausgabe.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
    };

    pocketbase.collection('transaction').create(data).then(() => {
        title.value = '';
        description.value = '';
        amount.value = 0;   
    }).catch((error) => {
        console.error('Error creating transaction:', error);
    });
}

function changeImage(event: Event){
  
    const files = (event.target as HTMLInputElement).files;
    if (files) {
        images.value = Array.from(files)
    }   
}

function clearImage() {
    images.value = null;
}

const isValid = computed(() => {
    return title.value.length > 0 && amount.value > 0 && images.value && images.value.length > 0;
});

</script>

<template>
    <div class="flex flex-col space-y-4">
        <div class="flex flex-col  items-center space-x-2">
            <Label>Ist eine ausgabe? <Switch v-model="ausgabe"/></Label>
            
        </div>
        <Label>Titel</Label>
        <Input placeholder="Titel" v-model.trim="title" />

        <Label>Betrag</Label>
        <Input 
            placeholder="Betrag" 
            v-model.number="amount" 
            inputmode="numeric"
            type="number" 
            @input="showAmountError = false"
        />
        <div v-if="showAmountError" class="text-red-500 text-sm">Betrag muss größer als 0 sein</div>
        
        <Label>Beschreibung</Label>
        <Textarea placeholder="Beschreibung" v-model.trim="description"></Textarea>

        <div>
            <Label>Belege</Label>
            <div class="flex flex-row justify-end space-x-2">
                <Input type="file" multiple @change="changeImage"/>  
                <Button variant="destructive" size="icon" @click="() => clearImage()" :disabled="!images">X</Button>
            </div>
        </div>

        <DialogClose as-child>
            <Button :onclick="createTransaction" type="button" variant="default" :disabled="!isValid">Erstellen</Button>
        </DialogClose>
    </div>
</template>