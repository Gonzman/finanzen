<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePocketBase } from '@/components/usePocketbase';
import pb from '@/lib/pb';
import { onUnmounted, ref, watch } from 'vue';

const pocketbase = usePocketBase();

const props= defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const transaction = pb.getTransaction(props.committee.id)

const filteredTransaction = transaction

const filter = ref('');

watch(filter, (newValue) => {
    //filter milestones based on the filter value with out any fetch
    if (newValue == '') {
      filteredTransaction.value = transaction.value;
        return;
    }

    filteredTransaction.value = transaction.value.filter((transaction) => {
        return transaction.expand?.transaction.title.toLowerCase().includes(newValue.toLowerCase()) || transaction.expand?.transaction.type.toLowerCase().includes(newValue.toLowerCase());
    });
});

onUnmounted(() => {
    pocketbase.collection('transactionAuth').unsubscribe('*')
})

</script>

<template>
    <Input class="max-w-[400px]" placeholder="Suche nach Transaktionen" v-model="filter" />
    <Table>
    <TableCaption>Liste aller Transaktionen</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[100px]">Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Art</TableHead>
        <TableHead class="text-right">
          Betrag
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in filteredTransaction" :key="invoice.id">
        <TableCell class="font-medium"> {{ invoice.expand?.transaction.title }} </TableCell>
        <TableCell>{{ invoice.state }}</TableCell>
        <TableCell>{{ invoice.expand?.transaction.type }}</TableCell>
        <TableCell class="text-right"> {{ invoice.expand?.transaction.amount }} € </TableCell>
      </TableRow>
    </TableBody>
  </Table>  
</template>