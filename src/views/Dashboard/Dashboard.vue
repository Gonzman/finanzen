<script setup lang="ts">
import Search from '@/components/dashboard/Search.vue';
import TeamSwitcher, { type Team } from '@/components/dashboard/TeamSwitcher.vue';
import UserNav from '@/components/dashboard/UserNav.vue';

import { ref, type Ref } from 'vue';
import Select from './Select.vue';

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
            <Select :committee="committee"></Select>
        </div>

        <div class="flex-1 space-y-4 p-8 pt-6">{{ committee.id ?? "" }}</div>
    </div>
</template>
