<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input/Input.vue';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TransactionAuthStateOptions, TransactionTypeOptions, type TransactionResponse } from '@/lib/pocketbase-types';
import { ref } from 'vue';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const title = ref('');
const description = ref('');
const amount = ref(0);
const ausgabe = ref(false);

const user = useUser();
const pocketbase = usePocketBase();

function createTransaction() {
    if (title.value.length < 1) return;
    if (description.value.length < 1) return;
    if (amount.value < 1) return;

    const data = {
        title: title.value,
        message: description.value,
        amount: amount.value,
        ausschuss: props.committee.id,
        createdby: user.userId,
        type: ausgabe.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
    };

    pocketbase.collection('transaction').create(data).then((data) => {

        pocketbase.collection('transactionAuth').create({
            transaction: data.id,
            state: TransactionAuthStateOptions.Ausstehend,
            createdby: user.userId,
        }).then(() => {
            console.log('Transaction created successfully');
            title.value = '';
            description.value = '';
            amount.value = 0;

        }).catch((error) => {
            console.error('Error creating transaction auth:', error);
            pocketbase.collection('transaction').delete(data.id).then(() => {
                console.log('Transaction deleted successfully');

            }).catch((error) => {
                console.error('Error deleting transaction:', error);
            });
        });
    });
}


</script>

<template>
    <div class="flex flex-col space-y-4">
        <div class="flex flex-col  items-center space-x-2">
            <Label>Ist eine ausgabe? <Switch v-model="ausgabe"/></Label>
            
        </div>
        <Label>Titel</Label>
        <Input placeholder="Titel" v-model="title" />

        <Label>Betrag</Label>
        <Input placeholder="Betrag" v-model="amount" type="number" />
        <Label>Beschreibung</Label>
        <Textarea placeholder="Beschreibung" v-model="description"></Textarea>

        <DialogClose as-child>

        <Button :onclick="createTransaction" type="button" variant="default">Erstellen</Button>
        </DialogClose>
    </div>
</template>