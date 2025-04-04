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
    <div class="flex flex-col space-y-4 items-center">
        <div class="flex items-center space-x-2">
            <Label>Ist eine ausgabe?</Label>
            <Switch v-model="ausgabe"/>
        </div>

        <Input placeholder="Titel" v-model="title" />
        <Input placeholder="Betrag" v-model="amount" type="number" />
        <Textarea placeholder="Beschreibung" v-model="description"></Textarea>


        <Button :onclick="createTransaction">Erstellen</Button>
    </div>
</template>