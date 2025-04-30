<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, type PropType, onMounted } from 'vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import type { MilestoneResponse, TransactionResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TransactionTypeOptions } from '@/lib/pocketbase-types';
import TransactionStateIcon from '@/components/dashboard/TransactionStateIcon.vue';
import { TransactionAuthStateOptions } from '@/lib/pocketbase-types';

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

const title = ref(props.milestone.title);
const description = ref(props.milestone.message || '');

const transactionTab = ref('current');

interface ExpandedTransaction extends TransactionResponse {
    expand?: {
        transactionAuth?: Array<{
            state: string;
        }>;
    };
}

const existingTransactions = ref<ExpandedTransaction[]>([]);
const isLoading = ref(false);
const selectedTransactionIds = ref<string[]>([]);
const availableTransactions = ref<TransactionResponse[]>([]);

const transactionTitle = ref('');
const transactionAmount = ref(0);
const transactionDescription = ref('');
const isExpense = ref(false);

const client = usePocketBase();
const user = useUser();

const fetchExistingTransactions = async () => {
    isLoading.value = true;
    try {
        const transactions = await client.collection('transaction').getFullList({
            filter: `milestone = "${props.milestone.id}"`,
            sort: '-created',
            expand: 'transactionAuth'
        });
        existingTransactions.value = transactions as ExpandedTransaction[];
    } catch (error) {
        console.error('Error fetching existing transactions:', error);
    } finally {
        isLoading.value = false;
    }
};

const fetchAvailableTransactions = async () => {
    isLoading.value = true;
    try {
        const result = await client.collection('transaction').getFullList({
            filter: `ausschuss = "${props.committee.id}" && (milestone = null || milestone = "")`,
            sort: '-created',
        });
        
        availableTransactions.value = result;
    } catch (error) {
        console.error('Error fetching available transactions:', error);
        availableTransactions.value = [];
    } finally {
        isLoading.value = false;
    }
};

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
        
        await fetchExistingTransactions();
        await fetchAvailableTransactions();
        
        selectedTransactionIds.value = [];
    } catch (error) {
        console.error('Error adding transactions to milestone:', error);
    } finally {
        isLoading.value = false;
    }
};

const createNewTransaction = async () => {
    if (!transactionTitle.value || transactionAmount.value <= 0) return;
    
    isLoading.value = true;
    try {
        const newTransaction = await client.collection('transaction').create({
            title: transactionTitle.value,
            amount: transactionAmount.value,
            message: transactionDescription.value,
            type: isExpense.value ? TransactionTypeOptions.Ausgehend : TransactionTypeOptions.Eingehend,
            milestone: props.milestone.id,
            ausschuss: props.committee.id,
            createdby: user.userId,
        });
        
        await client.collection('transactionAuth').create({
            transaction: newTransaction.id,
            state: 'Ausstehend'
        });
        
        await fetchExistingTransactions();
        
        // Reset form
        resetTransactionForm();
    } catch (error) {
        console.error('Error creating transaction:', error);
    } finally {
        isLoading.value = false;
    }
};

const updateMilestone = async () => {
    try {
        await client.collection('milestone').update(props.milestone.id, {
            title: title.value,
            message: description.value,
        });
        
        if (selectedTransactionIds.value.length > 0) {
            for (const transactionId of selectedTransactionIds.value) {
                await client.collection('transaction').update(transactionId, {
                    milestone: props.milestone.id
                });
            }
            
            selectedTransactionIds.value = [];
        }
        
        await fetchExistingTransactions();
        await fetchAvailableTransactions();
        
        console.log('Milestone updated successfully');
    } catch (error) {
        console.error('Error updating milestone:', error);
    }
};

const resetTransactionForm = () => {
    transactionTitle.value = '';
    transactionAmount.value = 0;
    transactionDescription.value = '';
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

const removeTransaction = async (transactionId: string) => {
    try {
        await client.collection('transaction').update(transactionId, {
            milestone: null
        });
        
        await fetchExistingTransactions();
        await fetchAvailableTransactions();
    } catch (error) {
        console.error('Error removing transaction from milestone:', error);
    }
};

onMounted(() => {
    fetchExistingTransactions();
    fetchAvailableTransactions();
});
</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start" 
                :disabled="props.milestone.createdby !== useUser().userId">
                Bearbeiten
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[550px]">
            <DialogHeader>
                <DialogTitle>Meilenstein bearbeiten</DialogTitle>
                <DialogDescription>
                    Ändere die Details des Meilensteins und verwalte seine Transaktionen.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="title">Titel</Label>
                    <Input id="title" placeholder="Titel des Meilensteins" v-model="title" />
                </div>
                <div class="grid gap-2">
                    <Label for="description">Beschreibung</Label>
                    <Textarea id="description" placeholder="Beschreibe den Meilenstein..." v-model="description" />
                </div>
                
                <div class="border-t pt-4 mt-2">
                    <h3 class="text-sm font-medium mb-2">Transaktionen</h3>
                    
                    <Tabs v-model="transactionTab" class="w-full">
                        <TabsList class="grid w-full grid-cols-3">
                            <TabsTrigger value="current">Bestehend</TabsTrigger>
                            <TabsTrigger value="add">Hinzufügen</TabsTrigger>
                            <TabsTrigger value="new">Neu erstellen</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="current">
                            <div v-if="isLoading" class="py-4 text-center">
                                Lade Transaktionen...
                            </div>
                            <ScrollArea v-else-if="existingTransactions.length > 0" class="h-[200px] pr-4">
                                <div class="space-y-2 py-2">
                                    <div v-for="transaction in existingTransactions" :key="transaction.id" 
                                        class="flex items-center justify-between p-2 rounded hover:bg-muted">
                                        <div>
                                            <div class="font-medium flex items-center gap-1">
                                                <TransactionStateIcon 
                                                    v-if="transaction.expand && transaction.expand.transactionAuth && transaction.expand.transactionAuth.length > 0"
                                                    :state="transaction.expand.transactionAuth[0].state || TransactionAuthStateOptions.Ausstehend" 
                                                    :size="14"
                                                />
                                                {{ transaction.title }}
                                            </div>
                                            <div class="text-sm text-muted-foreground">{{ transaction.message }}</div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div :class="transaction.type === TransactionTypeOptions.Eingehend ? 'text-green-500' : 'text-red-500'">
                                                {{ transaction.amount }} €
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                class="h-8 w-8" 
                                                @click="removeTransaction(transaction.id)">
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <div v-else class="py-4 text-center text-muted-foreground">
                                Keine Transaktionen für diesen Meilenstein.
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="add">
                            <div v-if="isLoading" class="py-4 text-center">
                                Lade Transaktionen...
                            </div>
                            <ScrollArea v-else-if="availableTransactions.length > 0" class="h-[200px] pr-4">
                                <div class="space-y-2 py-2">
                                    <div v-for="transaction in availableTransactions" :key="transaction.id" 
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
                            <div v-if="selectedTransactionIds.length > 0" class="mt-4 flex justify-end">
                                <div class="text-sm text-muted-foreground">
                                    {{ selectedTransactionIds.length }} Transaktion(en) ausgewählt
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="new">
                            <div class="grid gap-4 py-2">
                                <div class="flex items-center gap-2">
                                    <Label for="isExpense">Ausgabe</Label>
                                    <Switch id="isExpense" v-model="isExpense" />
                                </div>
                                <div class="grid gap-2">
                                    <Label for="transaction-title">Titel</Label>
                                    <Input id="transaction-title" placeholder="Titel der Transaktion" v-model="transactionTitle" />
                                </div>
                                <div class="grid gap-2">
                                    <Label for="amount">Betrag (€)</Label>
                                    <Input id="amount" type="number" placeholder="0.00" inputmode="numeric" min="0" v-model="transactionAmount" />
                                </div>
                                <div class="grid gap-2">
                                    <Label for="transaction-description">Beschreibung</Label>
                                    <Textarea id="transaction-description" placeholder="Beschreibung..." v-model="transactionDescription" />
                                </div>
                                <div class="flex justify-end">
                                    <Button 
                                        @click="createNewTransaction" 
                                        :disabled="!transactionTitle || transactionAmount <= 0 || isLoading">
                                        {{ isLoading ? 'Wird erstellt...' : 'Transaktion erstellen' }}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button @click="updateMilestone" type="submit">Speichern</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>