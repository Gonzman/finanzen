<template>
<Dialog>
    <DialogTrigger as-child class="bg-blue-500 text-white px-4 py-2 rounded">
        <Button>Erstellen</Button>
    </DialogTrigger>
    <DialogContent>
        <Tabs>
            <DialogHeader>
                <DialogTitle>Erstellen</DialogTitle>
                <DialogDescription>Erstellen Sie eine neue Transaktion oder einen neuen Meilenstein.</DialogDescription>
            </DialogHeader>
            <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="transaktion">Transkation</TabsTrigger>
                <TabsTrigger value="meilenstein" disabled>Meilenstein</TabsTrigger>
            </TabsList>
            <TabsContent value="transaktion">
                <div class="space-y-4">
                    <TransactionFields :committee="props.committee"/>
                </div>
            </TabsContent>
            <TabsContent value="meilenstein">
                <div class="space-y-4">
                    <Input placeholder="Einladungslink" />
                    <Button>Beitreten</Button>
                </div>
            </TabsContent>
        </Tabs>
        <DialogClose>12</DialogClose>
    </DialogContent>
</Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/button/Button.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import TransactionFields from './transactionFields.vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';


const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

</script>