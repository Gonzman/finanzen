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
import { onMounted, onUnmounted, watch } from 'vue';
import pb from '@/lib/pb';
import Workplanner from './workplanner/Workplanner.vue';
const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    },
    currentTab: {
        type: String,
        default: 'overview',
    },
} as const);

const emit = defineEmits(['update:currentTab']);

const user = useUser();

// Helper functions for localStorage
const saveCurrentTabToStorage = (tab: string) => {
    localStorage.setItem('currentTab', tab);
};

const loadCurrentTabFromStorage = (): string => {
    try {
        const savedTab = localStorage.getItem('currentTab');
        if (savedTab) {
            // Validate that the saved tab is one of the valid tabs
            const validTabs = ['overview', 'transactions', 'milestones', 'workplanner'];
            return validTabs.includes(savedTab) ? savedTab : 'overview';
        }
    } catch (error) {
        console.error('Error loading current tab from localStorage:', error);
        localStorage.removeItem('currentTab');
    }
    return 'overview';
};

// Load saved tab on component mount and emit if different from default
onMounted(() => {
    pb.startSync();

    const savedTab = loadCurrentTabFromStorage();
    if (savedTab !== props.currentTab) {
        emit('update:currentTab', savedTab);
    }
});

// Watch for tab changes and save to localStorage
watch(() => props.currentTab, (newTab) => {
    saveCurrentTabToStorage(newTab);
});

onUnmounted(() => {
    pb.stopSync()
});

</script>

<template>
    <div class="flex items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    </div>
    <Tabs :model-value="props.currentTab" @update:model-value="(value) => emit('update:currentTab', value)"
        class="space-y-4 deep">
        <TabsList>
            <TabsTrigger value="overview"> Überblick </TabsTrigger>
            <TabsTrigger value="transactions"> Transaktionen </TabsTrigger>
            <TabsTrigger value="workplanner"> Arbeitsplaner </TabsTrigger>
            <TabsTrigger value="milestones"> Meilensteine </TabsTrigger>

            <Separator orientation="vertical" class="m-2" v-if="props.committee.chair == user.userId" />
            <Creator v-if="props.committee.users?.includes(user.userId)" :committee="props.committee" />
        </TabsList>
        <TabsContent value="overview">
            <Overview :committee="props.committee" :key="props.committee.id"></Overview>
        </TabsContent>
        <TabsContent value="milestones">
            <Milestones :committee="props.committee" :key="props.committee.id" />
        </TabsContent>
        <TabsContent value="transactions">
            <Transcactions :committee="props.committee" :key="props.committee.id" />
        </TabsContent>
        <TabsContent value="workplanner">
            <Workplanner :committee="props.committee" :key="props.committee.id" />
        </TabsContent>
    </Tabs>
</template>