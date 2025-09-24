<script setup lang="ts">
import { usePocketBase, User } from './components/usePocketbase';
import Dashboard from './views/Dashboard/Dashboard.vue';
import Login from './views/Login/Login.vue';

const pocketbase = usePocketBase();
</script>

<template>
    <div v-if="pocketbase.authStore.isValid && User.isInitialized">
        <Dashboard />
    </div>
    <Login v-else></Login>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
