<template>
    <Card class="pt-0">
        <Table>
            <TableCaption>Liste aller zu prüfenden Transaktionen</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead class="w-[100px]">Gremium</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Meilenstein</TableHead>
                    <TableHead class="text-right">Betrag (Konto)</TableHead>
                    <TableHead class="text-right">Betrag (Bar)</TableHead>
                    <TableHead class="w-0 p-0" v-if="useUser().isPruefer()"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow v-if="isLoading">
                    <TableCell :colspan="useUser().isPruefer() ? 8 : 7" class="text-center">
                        Lade Transaktionen...
                    </TableCell>
                </TableRow>
                <TableRow v-else-if="transactions.length === 0">
                    <TableCell :colspan="useUser().isPruefer() ? 8 : 7" class="text-center">
                        Keine zu prüfenden Transaktionen
                    </TableCell>
                </TableRow>
                <TableRow v-for="invoice in transactions" :key="invoice.id">
                    <TableCell>
                        {{ invoice.expand?.transaction?.expand?.ausschuss?.name || '-' }}
                    </TableCell>
                    <TableCell class="font-medium">{{ invoice.expand?.transaction?.title }}</TableCell>
                    <TableCell>
                        <TransactionStateIcon :state="invoice.state" :size="14" />
                        <span class="text-sm">
                            {{ " " + invoice.state }}
                        </span>
                    </TableCell>
                    <TableCell>
                        <span :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${invoice.expand?.transaction?.type === TransactionTypeOptions.Eingehend
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                            }`">
                            {{ invoice.expand?.transaction?.type }}
                        </span>
                    </TableCell>
                    <TableCell>{{ invoice.expand?.transaction?.expand?.milestone?.title || "/" }}</TableCell>
                    <TableCell class="text-right">
                        <div class="flex items-center justify-end"
                            :class="invoice.expand!.transaction.amount < 0 ? 'text-red-500' : 'text-green-500'">
                            {{ formatTransaction(invoice.expand!.transaction.amount,
                                invoice.expand!.transaction.type).formattedAmount
                            }}
                        </div>
                    </TableCell>
                    <TableCell class="text-right">
                        <div class="flex items-center justify-end"
                            :class="invoice.expand!.transaction.amount_bar < 0 ? 'text-red-500' : 'text-green-500'">
                            {{ formatTransaction(invoice.expand!.transaction.amount_bar,
                                invoice.expand!.transaction.type).formattedAmount
                            }}
                        </div>
                    </TableCell>
                    <TableCell class="text-right w-0 p-0" v-if="useUser().isPruefer()">
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
                                    <Details :id="invoice" />
                                    <Pruefen :id="invoice" />
                                    <Edit :transaction="invoice" @updated="fetchTransactions" />
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </Card>
</template>

<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransactionAuthStateOptions, TransactionTypeOptions, type TransactionAuthResponse, type AusschussResponse, type TransactionResponse, type MilestoneResponse, type UsersResponse } from '@/lib/pocketbase-types';
import { formatTransaction } from '@/ts/format';
import { onMounted, ref } from 'vue';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Button from '@/components/ui/button/Button.vue';
import TransactionStateIcon from '@/components/dashboard/TransactionStateIcon.vue';
import Details from '../transcactions/modal/details.vue';
import Pruefen from '../transcactions/modal/pruefen.vue';
import Edit from '../transcactions/modal/edit.vue';

type ExpandedTransactionAuth = {
    transaction: TransactionResponse<{
        ausschuss: AusschussResponse;
        milestone: MilestoneResponse;
        createdby: UsersResponse;
    }>;
};

const transactions = ref<TransactionAuthResponse<ExpandedTransactionAuth>[]>([]);
const isLoading = ref(false);
const client = usePocketBase();

const fetchTransactions = async () => {
    isLoading.value = true;
    try {
        const result = await client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandedTransactionAuth>>({
            expand: 'transaction, transaction.createdby, transaction.milestone, transaction.ausschuss',
            filter: `state = "${TransactionAuthStateOptions.Ausstehend}" || state = "${TransactionAuthStateOptions['In Bearbeitung']}"`,
            sort: '-updated',
        });
        transactions.value = result;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        transactions.value = [];
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchTransactions();
});

</script>