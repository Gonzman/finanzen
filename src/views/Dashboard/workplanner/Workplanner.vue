<template></template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});</script>
<style scoped></style>