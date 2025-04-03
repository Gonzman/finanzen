<script setup lang="ts">
import Dashboard from './components/Dashboard/Dashboard.vue';
import Login from './components/Login/Login.vue';
import { usePocketBase } from './components/usePocketbase';


const pocketbase = usePocketBase()
</script>

<template>

  <div v-if="pocketbase.authStore.isValid">
    <Dashboard></Dashboard>
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
