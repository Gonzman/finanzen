<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import pb from '@/lib/pb';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Button from '@/components/ui/button/Button.vue';
import Edit from './modal/edit.vue';
import Delete from './modal/delete.vue';
import Pruefen from './modal/pruefen.vue';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

// Make `transaction` reactive
const transaction = pb.getTransaction(props.committee.id);

// Reactive filter input
const filter = ref('');

// Use a computed property for `filteredTransaction`
const filteredTransaction = computed(() => {
    if (!filter.value) {
        return transaction.value;
    }

    console.log(transaction.value);

    return transaction.value.filter((t) => {
        return (
            t.expand?.transaction.title.toLowerCase().includes(filter.value.toLowerCase()) ||
            t.expand?.transaction.type.toLowerCase().includes(filter.value.toLowerCase())
        );
    });
});

</script>

<template>
  <Input class="max-w-[400px]" placeholder="Suche nach Transaktionen" v-model="filter" />
    <Table>
      <TableCaption>Liste aller Transaktionen</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]">Name</TableHead>
          <TableHead class="w-[100px]">Gremium</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Art</TableHead>
          <TableHead>Meilenstein</TableHead>
          <TableHead class="text-right">Betrag</TableHead>
          <TableHead class="w-0 p-0"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="invoice in filteredTransaction">
          <TableCell class="font-medium">{{ invoice.expand?.transaction.title }}</TableCell>
          <TableCell>{{ invoice.expand?.ausschuss?.name ?? "/" }}</TableCell>
          <TableCell>{{ invoice.state }}</TableCell>
          <TableCell>{{ invoice.expand?.transaction.type }}</TableCell>
          <TableCell>{{ invoice.expand?.milestone?.title ?? "/" }}</TableCell>
          <TableCell class="text-right">{{ invoice.expand?.transaction.amount }} €</TableCell>
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
                  <Pruefen :id="invoice" v-if="useUser().isPruefer()"/>
                  <Edit :id="invoice.expand!.transaction" />
                  <Delete :id="invoice.expand!.transaction" />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Details anzeigen</DropdownMenuCheckboxItem>
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