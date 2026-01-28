<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type PropType } from 'vue';
import type { TransactionAuthResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { isUserChairOfCommittee } from '@/lib/utils';
import type { ExpandTransaction } from '@/lib/pb';

const props = defineProps({
    id: {
        type: Object as PropType<TransactionAuthResponse<ExpandTransaction>>,
        required: true,
    },
});


function deleteTransaction() {

    usePocketBase().collection('transaction').delete(props.id.id).then(() => {
        console.log('Transaction deleted successfully');
    }).catch((error) => {
        console.error('Error deleting transaction:', error);
    });

}


</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="destructive" class="text-left w-fulls justify-start"
                :disabled="!(props.id.expand.transaction.createdby === useUser().userId && !isUserChairOfCommittee(props.id) && !useUser().isPruefer())">
                Löschen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Transaktion</DialogTitle>
                <DialogDescription>
                    Soll die Transaktion wirklich gelöscht werden?
                </DialogDescription>
            </DialogHeader>
            <div>
                <DialogClose asChild>
                    <Button variant="destructive" class="w-full" @click="deleteTransaction">
                        Löschen
                    </Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button variant="outline" class="w-full">
                        Abbrechen
                    </Button>
                </DialogClose>
            </div>
        </DialogContent>
    </Dialog>
</template>