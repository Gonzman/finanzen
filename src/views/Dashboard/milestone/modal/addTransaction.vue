<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { onMounted, ref, type PropType } from 'vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import type { MilestoneResponse, TransactionResponse } from '@/lib/pocketbase-types';
import { TransactionTypeOptions } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { ScrollArea } from '@/components/ui/scroll-area';
import pb from '@/lib/pb';

const props = defineProps({
    milestone: {
        type: Object as PropType<MilestoneResponse>,
        required: true,
    },
    committee: {
        type: Object as PropType<Team>,
        required: true,
    },
});

const client = usePocketBase();
const user = useUser();
const transactions = ref<TransactionResponse[]>([]);
const isLoading = ref(false);
const selectedTransactionIds = ref<string[]>([]);
const mode = ref('existing');

// New transaction form
const title = ref('');
const amount = ref(0);
const description = ref('');
const isExpense = ref(false); // If true, this is an outgoing transaction

// Fetch transactions that aren't already assigned to this milestone
const fetchAvailableTransactions = async () => {
    isLoading.value = true;
    try {
        const result = await client.collection('transaction').getFullList({
            filter: `ausschuss = "${props.committee.id}" && (milestone = null || milestone = "")`,
            sort: '-created',
        });
        
        transactions.value = result;
        console.log('Available transactions:', result);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        transactions.value = [];
    } finally {
        isLoading.value = false;
    }
};

// Add selected transactions to the milestone
const addExistingTransactions = async () => {
    if (selectedTransactionIds.value.length === 0) return;
    
    isLoading.value = true;
    try {
        // Update each selected transaction to reference this milestone
        for (const transactionId of selectedTransactionIds.value) {
            await client.collection('transaction').update(transactionId, {
                milestone: props.milestone.id
            });
        }
        selectedTransactionIds.value = [];
        console.log('Transactions added to milestone successfully');
    } catch (error) {
        console.error('Error adding transactions to milestone:', error);
    } finally {
        isLoading.value = false;
    }
};

// Create a new transaction and associate it with the milestone
const createNewTransaction = async () => {
    isLoading.value = true;
    try {
        // Create transaction
        const newTransaction = await client.collection('transaction').create({
            title: title.value,
            amount: amount.value,
            message: description.value,
            type: isExpense.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
            milestone: props.milestone.id,
            ausschuss: props.committee.id,
            createdby: user.userId,
        });
        
        // Create transaction auth record
        await client.collection('transactionAuth').create({
            transaction: newTransaction.id,
            state: 'Ausstehend'
        });
        
        console.log('New transaction created and added to milestone successfully');
        resetForm();
    } catch (error) {
        console.error('Error creating transaction:', error);
    } finally {
        isLoading.value = false;
    }
};

const resetForm = () => {
    title.value = '';
    amount.value = 0;
    description.value = '';
    isExpense.value = false;
};

const toggleSelection = (id: string) => {
    const index = selectedTransactionIds.value.indexOf(id);
    if (index === -1) {
        selectedTransactionIds.value.push(id);
    } else {
        selectedTransactionIds.value.splice(index, 1);
    }
};

const isSelected = (id: string) => {
    return selectedTransactionIds.value.includes(id);
};

onMounted(() => {
    fetchAvailableTransactions();
});
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start">
                Transaktion hinzufügen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[550px]">
            <DialogHeader>
                <DialogTitle>Transaktion zum Meilenstein hinzufügen</DialogTitle>
                <DialogDescription>
                    Füge eine bestehende Transaktion hinzu oder erstelle eine neue.
                </DialogDescription>
            </DialogHeader>
            
            <Tabs v-model="mode" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Bestehende Transaktionen</TabsTrigger>
                    <TabsTrigger value="new">Neue Transaktion</TabsTrigger>
                </TabsList>
                <TabsContent value="existing">
                    <div v-if="isLoading" class="py-4 text-center">
                        Lade Transaktionen...
                    </div>
                    <ScrollArea v-else-if="transactions.length > 0" class="h-[300px] pr-4">
                        <div class="space-y-2 py-2">
                            <div v-for="transaction in transactions" :key="transaction.id" 
                                class="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                                :class="{ 'bg-muted': isSelected(transaction.id) }"
                                @click="toggleSelection(transaction.id)">
                                <div>
                                    <div class="font-medium">{{ transaction.title }}</div>
                                    <div class="text-sm text-muted-foreground">{{ transaction.message }}</div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div :class="transaction.type === TransactionTypeOptions.Eingehend ? 'text-green-500' : 'text-red-500'">
                                        {{ transaction.amount }} €
                                    </div>
                                    <div class="w-5 h-5 rounded-full border flex items-center justify-center" 
                                        :class="{ 'bg-primary border-primary': isSelected(transaction.id), 'border-muted-foreground': !isSelected(transaction.id) }">
                                        <div v-if="isSelected(transaction.id)" class="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <div v-else class="py-4 text-center text-muted-foreground">
                        Keine verfügbaren Transaktionen gefunden.
                    </div>
                    <DialogFooter class="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Abbrechen</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button @click="addExistingTransactions" :disabled="selectedTransactionIds.length === 0 || isLoading">
                                {{ selectedTransactionIds.length }} Transaktion(en) hinzufügen
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </TabsContent>
                <TabsContent value="new">
                    <div class="grid gap-4 py-4">
                        <div class="flex items-center gap-2">
                            <Label for="isExpense">Ausgabe</Label>
                            <Switch id="isExpense" v-model="isExpense" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="title">Titel</Label>
                            <Input id="title" placeholder="Titel der Transaktion" v-model="title" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="amount">Betrag (€)</Label>
                            <Input id="amount" type="number" placeholder="0.00" v-model="amount" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="description">Beschreibung</Label>
                            <Textarea id="description" placeholder="Beschreibung..." v-model="description" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Abbrechen</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button @click="createNewTransaction" :disabled="!title || amount <= 0 || isLoading">
                                {{ isLoading ? 'Wird erstellt...' : 'Transaktion erstellen' }}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
</template>