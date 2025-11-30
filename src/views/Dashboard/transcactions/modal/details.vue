<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { type PropType, computed, ref } from 'vue';
import type {
    TransactionAuthResponse,
    TransactionResponse,
} from '@/lib/pocketbase-types';
import {
    TransactionAuthStateOptions,
    TransactionTypeOptions,
} from '@/lib/pocketbase-types';
import type { ExpandTransaction } from '@/lib/pb';
import { usePocketBase, User, useUser } from '@/components/usePocketbase';
import Switch from '@/components/ui/switch/Switch.vue';

const props = defineProps({
    id: {
        type: Object as PropType<TransactionAuthResponse<ExpandTransaction>>,
        required: true,
    },
});

const auth = ref(props.id.acceptedby.includes(useUser().userId));

const transactionData = computed(() => {
    const amount = props.id.expand!.transaction.amount;
    const amount_bar = props.id.expand!.transaction.amount_bar;
    const isIncoming =
        props.id.expand!.transaction.type === TransactionTypeOptions.Eingehend;

    const bgColor = isIncoming ? 'bg-green-100' : 'bg-red-100';
    const textColor = isIncoming ? 'text-green-700' : 'text-red-700';

    const formattedAmount = formatCurrency(amount);
    const formattedAmountBar = formatCurrency(amount_bar);

    const shortDisplay = isIncoming
        ? `+${formattedAmount}`
        : `-${formattedAmount}`;

    const shortDisplayBar = isIncoming
        ? `+${formattedAmountBar}`
        : `-${formattedAmountBar}`;

    return {
        bgColor,
        textColor,
        formattedAmount,
        formattedAmountBar,
        shortDisplay,
        shortDisplayBar,
        isIncoming,
    };
});

async function openAttachment(attachment: string) {
    // Open window immediately to avoid iOS blocking
    const newWindow = window.open('', '_blank');

    const url = await pb.getFileURL(props.id.expand?.transaction, attachment);

    if (newWindow && url) {
        newWindow.location.href = url;
    } else {
        // Fallback: download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.split('/').pop() || 'download';
        link.click();
    }
}

import { watch } from 'vue';
import pb from '@/lib/pb';
import { formatCurrency } from '@/ts/format';
watch(auth, (value: boolean) => {
    if (value) {
        let stateT = props.id.state;

        if (
            auth.value &&
            stateT === TransactionAuthStateOptions['Ausstehend']
        ) {
            stateT = TransactionAuthStateOptions['In Bearbeitung'];
        }

        if (
            auth.value != props.id.acceptedby.includes(useUser().userId) &&
            stateT == TransactionAuthStateOptions['Autorisiert']
        ) {
            stateT = TransactionAuthStateOptions['In Bearbeitung'];
        }
        usePocketBase()
            .collection('transactionAuth')
            .update(props.id.id, {
                state: stateT,
                'acceptedby+': useUser().userId,
            })
            .then(() => {
                console.log('Transaction updated successfully');
            })
            .catch(error => {
                console.error('Error updating transaction:', error);
            });
    } else {
        usePocketBase()
            .collection('transactionAuth')
            .update(props.id.id, {
                'acceptedby-': useUser().userId,
            })
            .then(() => {
                console.log('Transaction updated successfully');
            })
            .catch(error => {
                console.error('Error updating transaction:', error);
            });
    }
});

// Add function to truncate filenames if they're too long
const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    return (
        filename.substring(0, maxLength) +
        '...' +
        filename.substring(filename.length - 4)
    );
};
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start">
                Details anzeigen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Transaktion</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col space-y-4">
                <div class="flex items-center space-x-4">
                    <div>
                        <h3 class="font-medium">
                            {{ props.id.expand?.transaction.title }}
                        </h3>
                        <div class="text-sm text-muted-foreground space-y-1">
                            <p>Konto: {{ transactionData.formattedAmount }}</p>
                            <p>Bar: {{ transactionData.formattedAmountBar }}</p>
                        </div>
                        <span :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${transactionData.isIncoming
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`">
                            {{ props.id.expand?.transaction.type }}
                        </span>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm text-muted-foreground">Erstellt am</span>
                        <span class="text-sm">{{
                            new Date(props.id.created).toLocaleDateString(
                                'de-DE',
                            )
                        }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-sm text-muted-foreground">Erstellt von</span>
                        <span class="text-sm">
                            {{
                                props.id.expand?.transaction.expand?.createdby
                                    ?.name ||
                                props.id.expand?.transaction.expand?.createdby
                                    ?.email ||
                                'Unbekannt'
                            }}
                        </span>
                    </div>

                    <div v-if="props.id.expand?.transaction.message" class="mt-2">
                        <span class="text-sm text-muted-foreground">Nachricht:</span>
                        <p class="text-sm mt-1 p-2 bg-muted rounded-md">
                            {{ props.id.expand?.transaction.message }}
                        </p>
                    </div>

                    <div v-if="
                        props.id.expand?.transaction.recipe &&
                        props.id.expand?.transaction.recipe.length > 0
                    ">
                        <span class="text-sm text-muted-foreground">Anhang:</span>

                        <Button v-for="attachment in props.id.expand?.transaction
                            .recipe" :key="attachment" @click="openAttachment(attachment)"
                            class="mt-1 w-full justify-start" variant="outline">
                            {{
                                truncateFilename(
                                    attachment.split('/').pop() || '',
                                )
                            }}
                        </Button>
                    </div>
                </div>

                <div v-if="User.getInstance().isPruefer()" class="flex justify-between">
                    <div class="flex items-center space-x-2 pt-4">
                        <p>
                            Autorisieren?
                            <Switch v-model="auth" />
                        </p>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <DialogClose asChild>
                    <Button variant="outline" class="w-full">
                        Schließen
                    </Button>
                </DialogClose>
            </div>
        </DialogContent>
    </Dialog>
</template>
