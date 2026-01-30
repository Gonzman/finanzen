<template>
  <div class="grid gap-10 px-10 grid-cols-[repeat(auto-fit,minmax(0,350px))] justify-center">

    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Gesamt Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(overAllBudget) }}</div>
        <div class="mt-2 space-y-1 text-sm text-muted-foreground">
          <div class="flex justify-between">
            <span>Konto:</span>
            <span :class="budgetByAccount.konto < 0 ? 'text-red-500' : 'text-green-500'">{{
              formatCurrency(budgetByAccount.konto) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Bar:</span>
            <span :class="budgetByAccount.bar < 0 ? 'text-red-500' : 'text-green-500'">{{
              formatCurrency(budgetByAccount.bar) }}</span>
          </div>
        </div>
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
  <div v-if="useUser().isPruefer()"
    class="flex-1 overflow-x-auto overflow-y-hidden flex flex-row snap-x snap-mandatory">
    <div class="bg-white shrink-0 w-full h-full snap-start flex flex-col overflow-y-auto p-4">
      <NeedToBeChecked class="w-full flex flex-col" />
    </div>
    <div class="bg-white shrink-0 w-full h-full snap-start flex flex-col overflow-y-auto p-4">
      <Chart class="w-full flex flex-col" />
    </div>
  </div>
  <Chart v-else />
</template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import pb from '@/lib/pb';
import { formatCurrency } from '@/ts/format';
import { onMounted, ref } from 'vue';
import Chart from './chart.vue';
import { useUser } from '@/components/usePocketbase';
import NeedToBeChecked from './needToBeChecked.vue';

const props = defineProps({
  committee: {
    type: Object as () => Team,
    required: true,
  } as const,
});

const budget = ref(0);
const overAllBudget = ref(0);
const budgetByAccount = ref({ konto: 0, bar: 0 });

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

const fetchBudgetByAccount = () => {
  pb.overAllBudgetByAccount()
    .then((res) => {
      budgetByAccount.value = res;
    })
    .catch((err) => {
      console.error('Error fetching budget by account:', err);
    });
};



onMounted(() => {
  fetchBudget(props.committee.id);
  fetchOverAllBudget();
  fetchBudgetByAccount();
});

</script>
