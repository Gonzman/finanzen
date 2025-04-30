<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, type PropType, onMounted } from 'vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import type { TransactionResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { TransactionTypeOptions } from '@/lib/pocketbase-types';

const props = defineProps({
    committee: {
        type: Object as PropType<Team>,
        required: true,
    },
});

const title = ref('');
const description = ref('');

const transactionTab = ref('new');

const isLoading = ref(false);
const selectedTransactionIds = ref<string[]>([]);
const availableTransactions = ref<TransactionResponse[]>([]);

const transactionTitle = ref('');
const transactionAmount = ref(0);
const transactionDescription = ref('');
const isExpense = ref(false); 

const client = usePocketBase();
const user = useUser();

const fetchAvailableTransactions = async () => {
    isLoading.value = true;
    try {
        const result = await client.collection('transaction').getFullList({
            filter: `ausschuss = "${props.committee.id}" && (milestone = null || milestone = "")`,
            sort: '-created',
        }); //FIXME: no fetch
        
        availableTransactions.value = result;
    } catch (error) {
        console.error('Error fetching available transactions:', error);
        availableTransactions.value = [];
    } finally {
        isLoading.value = false;
    }
};

const resetForm = () => {
    title.value = '';
    description.value = '';
    resetTransactionForm();
    selectedTransactionIds.value = [];
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

const createMilestone = async () => {
    if (!title.value) return;

    try {
        const newMilestone = await client.collection('milestone').create({
            title: title.value,
            message: description.value,
            ausschuss: props.committee.id,
            createdby: user.userId,
        });

        console.log('Milestone created successfully');

        if (selectedTransactionIds.value.length > 0) {
            try {
                for (const transactionId of selectedTransactionIds.value) {
                    await client.collection('transaction').update(transactionId, {
                        milestone: newMilestone.id
                    });
                }
                console.log(`${selectedTransactionIds.value.length} existing transactions added to milestone`);
            } catch (error) {
                console.error('Error adding existing transactions to milestone:', error);
            }
        }


        resetForm();
    } catch (error) {
        console.error('Error creating milestone:', error);
    }
};

onMounted(() => {
    fetchAvailableTransactions();
});
</script>

<template>
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
            <h3 class="text-sm font-medium mb-2">Transaktionen hinzufügen</h3>
            
            <Tabs v-model="transactionTab" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="add">Bestehende hinzufügen</TabsTrigger>
                    <TabsTrigger value="new">Neue erstellen</TabsTrigger>
                </TabsList>
                
                <!-- Add existing transactions tab -->
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
                            <Input id="amount" type="number" placeholder="0.00" min="0" inputmode="numeric" v-model="transactionAmount" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="transaction-description">Beschreibung</Label>
                            <Textarea id="transaction-description" placeholder="Beschreibung der Transaktion..." v-model="transactionDescription" />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </div>
    <Button @click="createMilestone" type="submit" :disabled="!title">Erstellen</Button>
</template>