<template>
    <div class="grid gap-10 px-10 grid-cols-[repeat(auto-fit,minmax(0,350px))] justify-center">
      <Card class="w-full">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">$45,231.89</div>
          <p class="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
  
      <Card class="w-full">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">$45,231.89</div>
          <p class="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  </script>
  