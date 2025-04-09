<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePocketBase } from '@/components/usePocketbase';
import type {TransactionAuthResponse, TransactionResponse, UsersRecord } from '@/lib/pocketbase-types';
import { onUnmounted, ref, watch } from 'vue';

const pocketbase = usePocketBase();

const props= defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const transaction = ref<TransactionAuthResponse<Expand>[]>([]);

const filteredTransaction = ref<TransactionAuthResponse<Expand>[]>([]);

  filteredTransaction.value = transaction.value;

type Expand = {
    createdby: UsersRecord,
    transaction: TransactionResponse,
}


pocketbase.collection('transactionAuth').getFullList<TransactionAuthResponse<Expand>>({expand: "createdby, transaction", sort: "-updated", filter: `transaction.ausschuss = "${props.committee.id}"`}).then((result) => {
    transaction.value = result    
});
const subscribe = async () => {
    await pocketbase.collection('transactionAuth').subscribe<TransactionAuthResponse<Expand>>("*", (e) => {
        console.log("12",e);
        if(e.record.expand?.transaction.ausschuss !== props.committee.id) return;
        if (e.action === 'create') {
          transaction.value.unshift(e.record);
        } else if (e.action === 'update') {
            const index = transaction.value.findIndex((item) => item.id === e.record.id);
            if (index !== -1) {
              transaction.value[index] = e.record;
            }
        } else if (e.action === 'delete') {
            const index = transaction.value.findIndex((item) => item.id === e.record.id);
            if (index !== -1) {
              transaction.value.splice(index, 1);
            }
        }
    });
}

subscribe();
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