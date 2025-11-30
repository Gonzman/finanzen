<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { onMounted, ref, type PropType, computed } from 'vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import type { MilestoneResponse, TransactionResponse } from '@/lib/pocketbase-types';
import { TransactionTypeOptions } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { ScrollArea } from '@/components/ui/scroll-area';
import pb from '@/lib/pb';
import { formatCurrency } from '@/ts/format';

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

const title = ref('');
const amountKonto = ref<number | undefined>(undefined);
const amountBar = ref<number | undefined>(undefined);
const description = ref('');
const showAmountError = ref(false);

// Calculate the net effect
const netEffect = computed(() => {
    return (amountKonto.value || 0) + (amountBar.value || 0);
});

// Determine transaction type based on net effect
const transactionType = computed(() => {
    if (netEffect.value >= 0) {
        return TransactionTypeOptions.Eingehend;
    }
    return TransactionTypeOptions.Ausgehend;
});

const fetchAvailableTransactions = async () => {
    isLoading.value = true;
    try {
        const result = await client.collection('transaction').getFullList({
            filter: `ausschuss = "${props.committee.id}" && (milestone = null || milestone = "")`,
            sort: '-created',
        }); //FIXME: no fetch
        
        transactions.value = result;
        console.log('Available transactions:', result);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        transactions.value = [];
    } finally {
        isLoading.value = false;
    }
};

const addExistingTransactions = async () => {
    if (selectedTransactionIds.value.length === 0) return;
    
    isLoading.value = true;
    try {
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

const createNewTransaction = async () => {
    if ((amountKonto.value === undefined || amountKonto.value === 0) && 
        (amountBar.value === undefined || amountBar.value === 0)) {
        showAmountError.value = true;
        return;
    }
    
    isLoading.value = true;
    try {
        const newTransaction = await client.collection('transaction').create({
            title: title.value,
            amount: amountKonto.value || 0,
            amount_bar: amountBar.value || 0,
            message: description.value,
            type: transactionType.value,
            milestone: props.milestone.id,
            ausschuss: props.committee.id,
            createdby: user.userId,
        });
        
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
    amountKonto.value = undefined;
    amountBar.value = undefined;
    description.value = '';
    showAmountError.value = false;
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
                                    <div class="text-right text-sm">
                                        <div :class="(transaction.amount || 0) >= 0 ? 'text-green-500' : 'text-red-500'">
                                            K: {{ transaction.amount }} €
                                        </div>
                                        <div :class="(transaction.amount_bar || 0) >= 0 ? 'text-green-500' : 'text-red-500'">
                                            B: {{ transaction.amount_bar }} €
                                        </div>
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
                        <div class="grid gap-2">
                            <Label for="title">Titel</Label>
                            <Input id="title" placeholder="Titel der Transaktion" v-model="title" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="grid gap-2">
                                <Label for="amountKonto">Konto (€)</Label>
                                <Input id="amountKonto" type="number" placeholder="+100 oder -50" v-model.number="amountKonto" step="0.01" />
                            </div>
                            <div class="grid gap-2">
                                <Label for="amountBar">Bar (€)</Label>
                                <Input id="amountBar" type="number" placeholder="+100 oder -50" v-model.number="amountBar" step="0.01" />
                            </div>
                        </div>
                        <p v-if="showAmountError" class="text-red-500 text-sm">Mindestens ein Betrag muss eingegeben werden.</p>
                        
                        <!-- Preview -->
                        <div v-if="amountKonto || amountBar" class="p-3 rounded-md bg-muted">
                            <div class="text-sm text-muted-foreground mb-1">Vorschau:</div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div v-if="amountKonto" class="flex justify-between">
                                    <span>Konto:</span>
                                    <span :class="amountKonto >= 0 ? 'text-green-600' : 'text-red-600'">
                                        {{ amountKonto >= 0 ? '+' : '' }}{{ formatCurrency(amountKonto) }}
                                    </span>
                                </div>
                                <div v-if="amountBar" class="flex justify-between">
                                    <span>Bar:</span>
                                    <span :class="amountBar >= 0 ? 'text-green-600' : 'text-red-600'">
                                        {{ amountBar >= 0 ? '+' : '' }}{{ formatCurrency(amountBar) }}
                                    </span>
                                </div>
                            </div>
                            <div class="border-t mt-2 pt-2 flex justify-between font-medium">
                                <span>Netto:</span>
                                <span :class="netEffect >= 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ netEffect >= 0 ? '+' : '' }}{{ formatCurrency(netEffect) }}
                                </span>
                            </div>
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
                            <Button @click="createNewTransaction" :disabled="!title || ((amountKonto === undefined || amountKonto === 0) && (amountBar === undefined || amountBar === 0)) || isLoading">
                                {{ isLoading ? 'Wird erstellt...' : 'Transaktion erstellen' }}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
</template>