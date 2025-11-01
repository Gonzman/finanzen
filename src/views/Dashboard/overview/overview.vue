<template>
  <div class="grid gap-10 px-10 grid-cols-[repeat(auto-fit,minmax(0,350px))] justify-center">

    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Gesamt Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(overAllBudget) }}</div>
      </CardContent>
    </Card>
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Ein & Ausgaben des Gremiums</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(budget) }}</div>
      </CardContent>
    </Card>
  </div>
  <br></br>
  <Table>
    <TableCaption>Liste aller Transaktionen</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[100px]">Gremium</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Art</TableHead>
        <TableHead>Meilenstein</TableHead>
        <TableHead class="text-right">Betrag</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in transactions">
        <TableCell>
          {{ invoice.ausschuss_name }}
        </TableCell>
        <TableCell class="font-medium">{{ invoice.title }}</TableCell>
        <TableCell>
          <TransactionStateIcon :state="invoice.auth_state" :size="14" />
          <span class="text-sm">
            {{ " " + invoice.auth_state }}
          </span>
        </TableCell>
        <TableCell>
          <span :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${invoice.type === OverviewTransactionTypeOptions.Eingehend
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
            }`">
            {{ invoice.type }}
          </span>
        </TableCell>
        <TableCell>{{ invoice.milestone_name || "/" }}</TableCell>
        <TableCell class="text-right">
          <div class="flex items-center justify-end" :class="invoice.amount < 0 ? 'text-red-500' : 'text-green-500'">
            {{ formatTransaction(invoice.amount, invoice.type).formattedAmount
            }}
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePocketBase } from '@/components/usePocketbase';
import pb from '@/lib/pb';
import { OverviewTransactionTypeOptions, type OverviewTransactionResponse } from '@/lib/pocketbase-types';
import { formatCurrency, formatTransaction } from '@/ts/format';
import { onMounted, ref } from 'vue';

const props = defineProps({
  committee: {
    type: Object as () => Team,
    required: true,
  } as const,
});

const budget = ref(0);
const overAllBudget = ref(0);

const fetchBudget = (committeeId: string) => {
  pb.getBudget(committeeId)
    .then((res) => {
      budget.value = res;
    })
    .catch((err) => {
      console.error('Error fetching budget:', err);
    });
};

const fetchOverAllBudget = () => {
  pb.overAllBudget()
    .then((res) => {
      overAllBudget.value = res;
    })
    .catch((err) => {
      console.error('Error fetching overall budget:', err);
    });
};

const transactions = ref<OverviewTransactionResponse<any>[]>([]);

const fetchTransactions = () => {
  usePocketBase().collection('overview_transaction').getFullList()
    .then((res) => {
      transactions.value = res;
    })
    .catch((err) => {
      console.error('Error fetching transactions:', err);
    });
};

onMounted(() => {
  fetchBudget(props.committee.id);
  fetchOverAllBudget();
  fetchTransactions();
});

</script>
