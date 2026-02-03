<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import Input from '@/components/ui/input/Input.vue';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import pb from '@/lib/pb';
import { ref, watch, computed, onMounted } from 'vue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Button from '@/components/ui/button/Button.vue';
import { TransactionAuthStateOptions, type TransactionAuthResponse, type TransactionResponse } from '@/lib/pocketbase-types';
import { usePocketBase } from '@/components/usePocketbase';
import Edit from './modal/edit.vue';
import Delete from './modal/delete.vue';
import Details from './modal/details.vue';
import MilestoneTransactionStats from '@/components/dashboard/MilestoneTransactionStats.vue';

interface ExpandedTransaction {
    transactionAuth_via_transaction?: TransactionAuthResponse[];
}

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const milestones = pb.getMilestone(props.committee.id);
const client = usePocketBase();

interface MilestoneTransactions {
    [key: string]: TransactionResponse<ExpandedTransaction>[];
}

const milestoneTransactions = ref<MilestoneTransactions>({});

const fetchMilestoneTransactions = async () => {
    for (const milestone of milestones.value) {
        try {
            const transactions = await client.collection('transaction').getFullList({
                filter: `milestone = "${milestone.id}"`,
                sort: '-created',
                expand: 'transactionAuth_via_transaction',
            });
            milestoneTransactions.value[milestone.id] = transactions as TransactionResponse<ExpandedTransaction>[];
        } catch (error) {
            console.error(`Error fetching transactions for milestone ${milestone.id}:`, error);
            milestoneTransactions.value[milestone.id] = [];
        }
    }
};

watch(milestones, fetchMilestoneTransactions, { deep: true });

onMounted(fetchMilestoneTransactions);

const getTotalAmount = (milestoneId: string): { konto: number; bar: number } => {
    if (!milestoneTransactions.value[milestoneId]) return { konto: 0, bar: 0 };

    return milestoneTransactions.value[milestoneId].reduce(
        (total: { konto: number; bar: number }, transaction: TransactionResponse<ExpandedTransaction>) => {
            return {
                konto: total.konto + (transaction.amount || 0),
                bar: total.bar + (transaction.amount_bar || 0),
            };
        },
        { konto: 0, bar: 0 },
    );
};

const getApprovedAmount = (milestoneId: string): { konto: number; bar: number } => {
    if (!milestoneTransactions.value[milestoneId]) return { konto: 0, bar: 0 };

    return milestoneTransactions.value[milestoneId].reduce(
        (total: { konto: number; bar: number }, transaction: TransactionResponse<ExpandedTransaction>) => {
            console.log('Checking transaction:', transaction.expand?.transactionAuth_via_transaction?.[0]?.state ?? 'undefined');
            if (transaction.expand?.transactionAuth_via_transaction?.[0]?.state === TransactionAuthStateOptions.Autorisiert) {
                console.log('Adding approved transaction:', transaction);
                return {
                    konto: total.konto + (transaction.amount || 0),
                    bar: total.bar + (transaction.amount_bar || 0),
                };
            }
            return total;
        },
        { konto: 0, bar: 0 },
    );
};

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
        return milestone.title.toLowerCase().includes(filter.value.toLowerCase()) || (milestone.message && milestone.message.toLowerCase().includes(filter.value.toLowerCase()));
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
                <TableHead class="max-w-[300px]">Beschreibung</TableHead>
                <TableHead>Anzahl Transaktionen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Summe (Konto)</TableHead>
                <TableHead class="text-right">Summe (Bar)</TableHead>
                <TableHead class="text-right">Genehmigt (Konto)</TableHead>
                <TableHead class="text-right">Genehmigt (Bar)</TableHead>
                <TableHead class="w-0 p-0">Genehmigte Summe</TableHead>
                <TableHead class="w-0 p-0"></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-for="milestone in filteredMilestones" :key="milestone.id">
                <TableCell class="font-medium">
                    {{ milestone.title }}
                </TableCell>
                <TableCell class="max-w-[300px] truncate">{{ milestone.message || '-' }}</TableCell>
                <TableCell>{{ getTransactionCount(milestone.id) }}</TableCell>
                <TableCell>
                    <MilestoneTransactionStats :milestoneId="milestone.id"
                        :transactions="milestoneTransactions[milestone.id] || []" />
                </TableCell>

                <TableCell class="text-right"
                    :class="getTotalAmount(milestone.id).konto < 0 ? 'text-red-500' : 'text-green-500'">
                    {{ getTotalAmount(milestone.id).konto.toFixed(2) }} €
                </TableCell>
                <TableCell class="text-right"
                    :class="getTotalAmount(milestone.id).bar < 0 ? 'text-red-500' : 'text-green-500'">{{
                        getTotalAmount(milestone.id).bar.toFixed(2) }} €
                </TableCell>

                <TableCell class="text-right"
                    :class="getApprovedAmount(milestone.id).konto < 0 ? 'text-red-500' : 'text-green-500'">
                    {{ getApprovedAmount(milestone.id).konto.toFixed(2) }} €
                </TableCell>
                <TableCell class="text-right"
                    :class="getApprovedAmount(milestone.id).bar < 0 ? 'text-red-500' : 'text-green-500'">{{
                        getApprovedAmount(milestone.id).bar.toFixed(2) }} €</TableCell>
                <TableCell class="w-0 p-0 text-right"
                    :class="getApprovedAmount(milestone.id).konto + getApprovedAmount(milestone.id).bar < 0 ? 'text-red-500' : 'text-green-500'">
                    {{ (getApprovedAmount(milestone.id).konto + getApprovedAmount(milestone.id).bar).toFixed(2) }}
                    €
                </TableCell>

                <TableCell class="text-right w-0 p-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button variant="ghost" class="w-9 h-9 p-0 data-[state=open]:bg-muted">…</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-56">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div class="flex flex-col">
                                <Details :milestone="milestone" :committee="committee" />
                                <Edit :milestone="milestone" :committee="committee" />
                                <Delete :milestone="milestone" />
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
