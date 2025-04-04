<script setup lang="ts">
import Search from '@/components/dashboard/Search.vue';
import TeamSwitcher, { type Team } from '@/components/dashboard/TeamSwitcher.vue';
import UserNav from '@/components/dashboard/UserNav.vue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs/';
import TabsContent from '@/components/ui/tabs/TabsContent.vue';
import { ref, type Ref } from 'vue';

const committee: Ref<Team> = ref({
    chair: '',
    id: '',
    name: '',
    created: undefined,
    updated: undefined,
    users: undefined,
});

</script>

<template>
    <div class="hidden flex-col md:flex">
        <div class="border-b space-y-4 pl-4">
            <div class="flex h-16 items-center px-4">
                <TeamSwitcher v-model="committee" />
                <div class="ml-auto flex items-center space-x-4">
                    <Search />
                    <UserNav />
                </div>
            </div>
        </div>
        <div class="flex-1 space-y-4 p-8 pt-6">
            <div class="flex items-center justify-between space-y-2">
                <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <Tabs default-value="overview" class="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview"> Überblick </TabsTrigger>
                    <TabsTrigger value="milestones"> Meilensteine </TabsTrigger>
                    <TabsTrigger value="transactions">
                        Transaktionen
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    Hallo
                </TabsContent>
                <TabsContent value="milestones">
                    <p>Meilensteine</p>
                </TabsContent>
                <TabsContent value="transactions">
                    <p>Transaktionen</p>
                </TabsContent>
            </Tabs>
        </div>

        <div class="flex-1 space-y-4 p-8 pt-6">{{ committee.id }}</div>
    </div>
</template>
