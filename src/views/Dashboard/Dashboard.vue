<script setup lang="ts">
import TeamSwitcher, { type Team } from '@/components/dashboard/TeamSwitcher.vue';
import UserNav from '@/components/dashboard/UserNav.vue';

import { ref, type Ref } from 'vue';
import Select from './Select.vue';

const committee: Ref<Team | null> = ref(null);
// Track the current tab to persist across committee changes
const currentTab = ref('overview');
</script>

<template>
    <div class="flex-col md:flex">
        <div class="border-b space-y-4 pl-4 fixed top-0 left-0 right-0 bg-white z-10">
            <div class="flex h-16 items-center px-4">
                <TeamSwitcher v-model="committee" />
                <div class="ml-auto flex items-center space-x-4">
                    <UserNav />
                </div>
            </div>
        </div>
        <div class="flex-1 space-y-4 p-8 pt-24">
            <Select v-if="committee && committee.id" :committee="committee" v-model:currentTab="currentTab"
                :key="committee.id" />
        </div>
        <div class="flex-1 space-y-4 p-8 pt-6">{{ committee?.id ?? "" }}</div>
    </div>
</template>
