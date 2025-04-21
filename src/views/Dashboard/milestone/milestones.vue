<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import Input from '@/components/ui/input/Input.vue';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import pb from '@/lib/pb';
import { ref, watch, computed, onMounted } from 'vue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Button from '@/components/ui/button/Button.vue';
import { type TransactionResponse, TransactionAuthStateOptions, TransactionTypeOptions } from '@/lib/pocketbase-types';
import { usePocketBase } from '@/components/usePocketbase';
import Edit from './modal/edit.vue';
import Delete from './modal/delete.vue';
import MilestoneTransactionStats from '@/components/dashboard/MilestoneTransactionStats.vue';
import TransactionStateIcon from '@/components/dashboard/TransactionStateIcon.vue';

// Define the expanded transaction type
interface ExpandedTransaction extends TransactionResponse {
    expand?: {
        transactionAuth?: Array<{
            state: string;
        }>;
    };
}

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

// Get milestones from PocketBase
const milestones = pb.getMilestone(props.committee.id);
const client = usePocketBase();

// Define the type for milestone transactions
interface MilestoneTransactions {
    [key: string]: ExpandedTransaction[];
}

// Store associated transactions for each milestone
const milestoneTransactions = ref<MilestoneTransactions>({});

// Fetch transactions associated with each milestone
const fetchMilestoneTransactions = async () => {
    for (const milestone of milestones.value) {
        try {
            const transactions = await client.collection('transaction').getFullList({
                filter: `milestone = "${milestone.id}"`,
                sort: '-created',
                expand: 'transactionAuth' // Include expanded transactionAuth data
            });
            milestoneTransactions.value[milestone.id] = transactions as ExpandedTransaction[];
        } catch (error) {
            console.error(`Error fetching transactions for milestone ${milestone.id}:`, error);
            milestoneTransactions.value[milestone.id] = [];
        }
    }
};

// Watch for changes in milestones and update transactions
watch(milestones, fetchMilestoneTransactions, { deep: true });

// Call fetchMilestoneTransactions on mount
onMounted(fetchMilestoneTransactions);

// Calculate total amount for a milestone (sum of associated transactions)
const getTotalAmount = (milestoneId: string): number => {
    if (!milestoneTransactions.value[milestoneId]) return 0;
    
    return milestoneTransactions.value[milestoneId].reduce((total: number, transaction: ExpandedTransaction) => {
        // Simply add the transaction amount (it already has the correct sign)
        return total + transaction.amount;
    }, 0);
};

// Count transactions for a milestone
const getTransactionCount = (milestoneId: string): number => {
    if (!milestoneTransactions.value[milestoneId]) return 0;
    return milestoneTransactions.value[milestoneId].length;
};

const filter = ref('');

const filteredMilestones = computed(() => {
    if (filter.value === '') {
        return milestones.value;
    }

    return milestones.value.filter((milestone) => {
        return milestone.title.toLowerCase().includes(filter.value.toLowerCase()) || 
               (milestone.message && milestone.message.toLowerCase().includes(filter.value.toLowerCase()));
    });
});
</script>

<template>
    <div class="mb-4 flex justify-between items-center">
        <Input class="max-w-[400px]" placeholder="Suche nach Meilensteinen" v-model="filter" />
        <component :is="'create-milestone'" :committee="committee"></component>
    </div>
    <Table>
        <TableCaption>Liste aller Meilensteine.</TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead class="w-[200px]">Title</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Transaktionen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Summe</TableHead>
                <TableHead class="w-0 p-0"></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-for="milestone in filteredMilestones" :key="milestone.id">
                <TableCell class="font-medium">
                    {{ milestone.title }}
                </TableCell>
                <TableCell>{{ milestone.message || '-' }}</TableCell>
                <TableCell>{{ getTransactionCount(milestone.id) }}</TableCell>
                <TableCell>
                    <MilestoneTransactionStats 
                        :milestoneId="milestone.id" 
                        :transactions="milestoneTransactions[milestone.id] || []" 
                    />
                </TableCell>
                <TableCell class="text-right" :class="getTotalAmount(milestone.id) < 0 ? 'text-red-500' : 'text-green-500'">
                    {{ getTotalAmount(milestone.id).toFixed(2) }} €
                </TableCell>
                <TableCell class="text-right w-0 p-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button variant="ghost" class="w-9 h-9 p-0 data-[state=open]:bg-muted">
                                …
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-56">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div class="flex flex-col">
                                <Edit :milestone="milestone" :committee="committee"></Edit>
                                <Delete :milestone="milestone"></Delete>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Transaktionen</DropdownMenuLabel>
                            <div class="max-h-[200px] overflow-y-auto">
                                <div v-if="milestoneTransactions[milestone.id] && milestoneTransactions[milestone.id].length > 0">
                                    <div v-for="transaction in milestoneTransactions[milestone.id]" :key="transaction.id" class="py-1 px-2 hover:bg-muted flex justify-between items-center">
                                        <div>
                                            <div class="font-medium flex items-center gap-1">
                                                <TransactionStateIcon 
                                                    v-if="transaction.expand && transaction.expand.transactionAuth && transaction.expand.transactionAuth.length > 0"
                                                    :state="transaction.expand.transactionAuth[0].state || TransactionAuthStateOptions.Ausstehend" 
                                                    :size="14"
                                                />
                                                {{ transaction.title }}
                                            </div>
                                            <div class="text-sm text-muted-foreground">
                                                {{ transaction.amount }} € ({{ transaction.type }})
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <component :is="'remove-transaction'" :transaction="transaction" :milestone="milestone"></component>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="py-2 px-2 text-muted-foreground text-sm">
                                    Keine Transaktionen
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>

<style scoped>
.table {
  display: table;
  width: 100%;
  border-collapse: collapse;
}
.table-row {
  display: table-row;
}
.table-cell {
  display: table-cell;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}
.table-head {
  font-weight: bold;
  text-align: left;
}
</style>