<script setup lang="ts">
import Separator from '@/components/ui/separator/Separator.vue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs/';
import TabsContent from '@/components/ui/tabs/TabsContent.vue';
import { type Team } from '@/components/dashboard/TeamSwitcher.vue';
import Milestones from './milestone/milestones.vue';
import Transcactions from './transcactions/transcactions.vue';
import Creator from './creator/creator.vue';
import { useUser } from '@/components/usePocketbase';
import Overview from './overview/overview.vue';

const props= defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const user = useUser();

</script>

<template>
    <div class="flex items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    </div>
    <Tabs default-value="overview" class="space-y-4 deep">
        <TabsList>
            <TabsTrigger value="overview"> Überblick </TabsTrigger>
            <TabsTrigger value="milestones"> Meilensteine </TabsTrigger>
            <TabsTrigger value="transactions"> Transaktionen </TabsTrigger>
            <Separator orientation="vertical" class="m-2" v-if="props.committee.chair == user.userId"/>
            <Creator v-if="props.committee.chair == user.userId" :committee="props.committee"/>
        </TabsList>
        <TabsContent value="overview">
            <Overview></Overview>
        </TabsContent>
        <TabsContent value="milestones">
            <Milestones :committee="props.committee" :key="props.committee.id"/>
        </TabsContent>
        <TabsContent value="transactions">
            <Transcactions :committee="props.committee" :key="props.committee.id"/>
        </TabsContent>
    </Tabs>
</template>