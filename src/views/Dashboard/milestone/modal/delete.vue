<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ref, type PropType } from 'vue';
import type { MilestoneResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';

const props = defineProps({
    milestone: {
        type: Object as PropType<MilestoneResponse>,
        required: true,
    },
});

const client = usePocketBase();
const isDeleting = ref(false);

const deleteMilestone = async () => {
    isDeleting.value = true;
    try {
        const transactions = await client.collection('transaction').getFullList({
            filter: `milestone = "${props.milestone.id}"`,
        });
        
        for (const transaction of transactions) {
            await client.collection('transaction').update(transaction.id, {
                milestone: null
            });
        }
        
        await client.collection('milestone').delete(props.milestone.id);
        
        console.log('Milestone and references deleted successfully');
    } catch (error) {
        console.error('Error deleting milestone:', error);
    } finally {
        isDeleting.value = false;
    }
};
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start text-destructive" 
                :disabled="props.milestone.createdby !== useUser().userId || isDeleting">
                Löschen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Meilenstein löschen</DialogTitle>
                <DialogDescription>
                    Möchtest du diesen Meilenstein wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogDescription>
            </DialogHeader>
            <div class="py-4">
                <p class="text-sm text-muted-foreground">
                    <strong>{{ props.milestone.title }}</strong> wird gelöscht. 
                    Alle Transaktionen, die diesem Meilenstein zugeordnet sind, 
                    bleiben erhalten, aber verlieren ihre Zuordnung zum Meilenstein.
                </p>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button variant="destructive" @click="deleteMilestone" :disabled="isDeleting">
                        {{ isDeleting ? 'Wird gelöscht...' : 'Löschen' }}
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>