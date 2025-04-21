<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { computed, ref, type PropType } from 'vue';
import { TransactionTypeOptions, type TransactionResponse } from '@/lib/pocketbase-types';
import Switch from '@/components/ui/switch/Switch.vue';
import { usePocketBase, useUser } from '@/components/usePocketbase';

const props = defineProps({
    id: {
        type: Object as PropType<TransactionResponse>,
        required: true,
    },
});

// Define reactive variables for v-model
const title = ref(props.id.title || '');
const amount = ref(props.id.amount || 0);
const description = ref(props.id.message || '');
const ausgabe = ref(props.id.type === TransactionTypeOptions.Ausgehend); // Default value for the switch

function createTransaction() {  

    usePocketBase().collection('transaction').update(props.id.id, {
        title: title.value,
        message: description.value,
        amount: ausgabe.value ? -Math.abs(amount.value) : Math.abs(amount.value),
        type: ausgabe.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
    }).then(() => {
        console.log('Transaction updated successfully');
    }).catch((error) => {
        console.error('Error updating transaction:', error);
    });

}

const hasChanges = computed(() => {
    return title.value !== props.id.title || 
           amount.value !== props.id.amount || 
           description.value !== props.id.message || 
           ausgabe.value !== (props.id.type === TransactionTypeOptions.Ausgehend);
});

</script>

<template>
    <Dialog>
    <DialogTrigger asChild>
    <Button variant="ghost" class="text-left w-fulls justify-start" :disabled="!(props.id.createdby === useUser().userId)">
        Bearbeiten
    </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
        <DialogTitle>Transaktion</DialogTitle>
        <DialogDescription>
        Hier sind die Details zur Transaktion.
        </DialogDescription>
    </DialogHeader>
    <div class="flex flex-col  items-center space-x-2">
            <Label>Ist eine ausgabe? <Switch v-model="ausgabe"/></Label>
            
        </div>
        <Label>Titel</Label>
        <Input :placeholder="id.title || 'Titel'" v-model="title" />

        <Label>Betrag</Label>
        <Input :placeholder="id.amount || 'Betrag'" v-model="amount" type="number" />
        <Label>Beschreibung</Label>
        <Textarea :placeholder="id.message || 'Beschreibung'" v-model="description"></Textarea>

        <DialogClose as-child>
            <Button 
                @click="createTransaction" 
                type="button" 
                variant="default" 
                :disabled="!hasChanges">
                {{ hasChanges ? 'Speichern' : 'Keine Änderungen' }}
            </Button>
        </DialogClose>
    </DialogContent>
</Dialog>
</template>