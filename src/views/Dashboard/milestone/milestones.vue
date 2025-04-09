<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import Input from '@/components/ui/input/Input.vue';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePocketBase } from '@/components/usePocketbase';
import pb from '@/lib/pb';
import type { MilestoneResponse, TransactionResponse } from '@/lib/pocketbase-types';
import { ref, watch } from 'vue';

const pocketbase = usePocketBase();

const props= defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});


const milestones = pb.getMilestone(props.committee.id)

const filteredMilestones = milestones;


const filter = ref('');

watch(filter, (newValue) => {
    if( newValue == '') {
      filteredMilestones.value = milestones.value;
      return;
    }

    filteredMilestones.value = milestones.value.filter((milestone) => {
        return milestone.title.toLowerCase().includes(newValue.toLowerCase()) || milestone.message.toLowerCase().includes(newValue.toLowerCase());
    });
});

</script>

<template>
    <Input class="max-w-[400px]" placeholder="Suche nach Meilensteinen" v-model="filter" />
    <Table>
    <TableCaption>Liste aller Meilensteine.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[100px]">
          Title
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Method</TableHead>
        <TableHead class="text-right">
          Amount
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in filteredMilestones" :key="invoice.id">
        <TableCell class="font-medium">
          {{ invoice.title }}
        </TableCell>
        <TableCell>1</TableCell>
        <TableCell>1</TableCell>
        <TableCell class="text-right">
            12
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>