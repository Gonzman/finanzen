<script setup lang="ts">
import ColorToggler from '../ColorToggler.vue';
import Sidebar from '../ui/sidebar/Sidebar.vue';
import SidebarProvider from '../ui/sidebar/SidebarProvider.vue';
import SidebarTrigger from '../ui/sidebar/SidebarTrigger.vue';

</script>

<div class="flex justify-end">
    <ColorToggler />
</div>

<template>
    <SidebarProvider>
        <AppSidebar />
        <main>
            <SidebarTrigger />
            <slot />
        </main>
    </SidebarProvider>
</template>