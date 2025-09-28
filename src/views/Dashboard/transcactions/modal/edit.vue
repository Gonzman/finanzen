<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { computed, ref, type PropType } from 'vue';
import { TransactionAuthStateOptions, TransactionTypeOptions, type TransactionAuthResponse } from '@/lib/pocketbase-types';
import Switch from '@/components/ui/switch/Switch.vue';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import type { ExpandTransaction } from '@/lib/pb';

const props = defineProps({
    id: {
        type: Object as PropType<TransactionAuthResponse<ExpandTransaction>>,
        required: true,
    },
});

const title = ref(props.id.expand?.transaction.title || '');
const amount = ref(Math.abs(props.id.expand?.transaction.amount) || 0);
const description = ref(props.id.expand?.transaction.message || '');
const ausgabe = ref(props.id.expand?.transaction.type === TransactionTypeOptions.Ausgehend); // Default value for the switch
const showAmountError = ref(false);
const images = ref<File[] | null>(null);

function createTransaction() {
    if (amount.value <= 0) {
        showAmountError.value = true;
        return;
    }
    showAmountError.value = false;

    usePocketBase().collection('transaction').update(props.id.expand!.transaction.id, {
        title: title.value,
        message: description.value,
        amount: ausgabe.value ? -Math.abs(amount.value) : Math.abs(amount.value),
        type: ausgabe.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
        recipe: images.value,
    }).then(() => {
        console.log('Transaction updated successfully');
    }).catch((error) => {
        console.error('Error updating transaction:', error);
    });
}

const hasChanges = computed(() => {
    return title.value !== props.id.expand?.transaction.title ||
        amount.value !== props.id.expand.transaction.amount ||
        description.value !== props.id.expand?.transaction.message ||
        ausgabe.value !== (props.id.expand?.transaction.type === TransactionTypeOptions.Ausgehend);
});

const isValid = computed(() => {
    return amount.value > 0;
});


function changeImage(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        images.value = Array.from(target.files);
    }
}

function isUserChairOfCommittee(): boolean {
    if (!props.id.expand?.transaction?.ausschuss) return false;

    const committees = useUser().getCommitteList();
    const transactionCommittee = committees.value.find(
        committee => committee.id === props.id.expand?.transaction.ausschuss
    );

    return transactionCommittee?.chair === useUser().userId;
}
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start" :disabled="!props.id.expand?.transaction?.createdby ||
                (props.id.expand.transaction.createdby !== useUser().userId && !isUserChairOfCommittee()) ||
                props.id.state === TransactionAuthStateOptions.Autorisiert ||
                props.id.state === TransactionAuthStateOptions.Abgeschlossen">
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
                <Label>Ist eine ausgabe?
                    <Switch v-model="ausgabe" />
                </Label>

            </div>
            <Label>Titel</Label>
            <Input :placeholder="id.expand?.transaction.title || 'Titel'" v-model="title" />

            <Label>Betrag</Label>
            <Input :placeholder="id.expand?.transaction.amount || 'Betrag'" v-model="amount" type="number"
                inputmode="numeric" min="0.01" step="0.01" @input="showAmountError = false" />
            <div v-if="showAmountError" class="text-red-500 text-sm">Betrag muss größer als 0 sein</div>

            <Label>Beschreibung</Label>
            <Textarea :placeholder="id.expand?.transaction.message || 'Beschreibung'" v-model="description"></Textarea>

            <Label>Beleg</Label>
            <Input type="file" multiple @change="changeImage" />

            <DialogClose as-child>
                <Button @click="createTransaction" type="button" variant="default" :disabled="!hasChanges || !isValid">
                    {{ hasChanges ? 'Speichern' : 'Keine Änderungen' }}
                </Button>
            </DialogClose>
        </DialogContent>
    </Dialog>
</template>