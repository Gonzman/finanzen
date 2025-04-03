<script setup lang="ts">
import Search from '@/components/dashboard/Search.vue';
import TeamSwitcher from '@/components/dashboard/TeamSwitcher.vue';
import UserNav from '@/components/dashboard/UserNav.vue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs/';

</script>

<template>
  <div class="hidden flex-col md:flex">
    <div class="border-b space-y-4 pl-4">
      <div class="flex h-16 items-center px-4 ">
        <TeamSwitcher />
        <div class="ml-auto flex items-center space-x-4">
          <Search />
          <UserNav />
        </div>
      </div>
    </div>
    <div class="flex-1 space-y-4 p-8 pt-6">
      <div class="flex items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">
          Dashboard
        </h2>
      </div>
      <Tabs default-value="overview" class="space-y-4">
            <TabsList>
            <TabsTrigger value="overview">
                Überblick
            </TabsTrigger>
            <TabsTrigger value="milestones">
                Meilensteine
            </TabsTrigger>
            <TabsTrigger value="transactions">
                Transaktionen
            </TabsTrigger>
            </TabsList>
        </Tabs>
    </div>

    <div class="flex-1 space-y-4 p-8 pt-6">
        12
    </div>
  </div>
</template>
