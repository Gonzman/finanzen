<template>
  <div class="grid gap-10 px-10 grid-cols-[repeat(auto-fit,minmax(0,350px))] justify-center">
    
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ overAllBudget.toLocaleString()}} €</div>
        <p class="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ budget.toLocaleString() }} €</div>
        <p class="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import pb from '@/lib/pb';
import { onMounted, ref, watch } from 'vue';

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

fetchBudget(props.committee.id);
  fetchOverAllBudget();

</script>
