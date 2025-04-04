<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePocketBase } from '@/components/usePocketbase';
import type {TransactionAuthResponse, TransactionResponse, UsersRecord } from '@/lib/pocketbase-types';
import { c } from 'node_modules/vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P';
import { onUnmounted, ref, Suspense, watch } from 'vue';

const pocketbase = usePocketBase();

const props= defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const milestones = ref<TransactionAuthResponse<Expand>[]>([]);


type Expand = {
    createdby: UsersRecord,
    transaction: TransactionResponse,
}


pocketbase.collection('transactionAuth').getFullList<TransactionAuthResponse<Expand>>({expand: "createdby, transaction", sort: "-updated", filter: `transaction.ausschuss = "${props.committee.id}"`}).then((result) => {
    milestones.value = result    
});
const subscribe = async () => {
    await pocketbase.collection('transactionAuth').subscribe<TransactionAuthResponse<Expand>>("*", (e) => {
        console.log("12",e);
        if(e.record.expand?.transaction.ausschuss !== props.committee.id) return;
        if (e.action === 'create') {
            milestones.value.unshift(e.record);
        } else if (e.action === 'update') {
            const index = milestones.value.findIndex((item) => item.id === e.record.id);
            if (index !== -1) {
                milestones.value[index] = e.record;
            }
        } else if (e.action === 'delete') {
            const index = milestones.value.findIndex((item) => item.id === e.record.id);
            if (index !== -1) {
                milestones.value.splice(index, 1);
            }
        }
    });
}

subscribe();
const filter = ref('');

watch(filter, (newValue) => {
    //filter milestones based on the filter value with out any fetch
    milestones.value = milestones.value.filter((milestone) => {
        return milestone.expand?.transaction.title.toLowerCase().includes(newValue.toLowerCase()) || milestone.expand?.transaction.type.toLowerCase().includes(newValue.toLowerCase())
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
      <TableRow v-for="invoice in milestones" :key="invoice.id">
        <TableCell class="font-medium"> {{ invoice.expand?.transaction.title }} </TableCell>
        <TableCell>{{ invoice.state }}</TableCell>
        <TableCell>{{ invoice.expand?.transaction.type }}</TableCell>
        <TableCell class="text-right"> {{ invoice.expand?.transaction.amount }} € </TableCell>
      </TableRow>
    </TableBody>
  </Table>  
</template>