<script setup lang="ts">
import { usePocketBase } from '@/components/usePocketbase'
import { ref } from 'vue'
import Button from '../ui/button/Button.vue'
import CardContent from '../ui/card/CardContent.vue'
import CardHeader from '../ui/card/CardHeader.vue'
import CardTitle from '../ui/card/CardTitle.vue'
import Input from '../ui/input/Input.vue'

const pb = usePocketBase()
const email = ref('')
const password = ref('')
</script>

<template>
    <div class="login flex justify-center items-center h-screen">
        <div class="w-full max-w-md rounded-xs">
            <CardHeader class="mb-4">
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                <form @submit.prevent="pb.collection('users').authWithPassword(email, password)">
                    <div class="mb-4">
                        <Input v-model="email" type="email" placeholder="Email" required />
                    </div>
                    <div class="mb-4">
                        <Input v-model="password" type="password" placeholder="Password" required />
                    </div>
                    <Button type="submit" class="w-full">Login</Button>
                </form>
            </CardContent>
        </div>
    </div>
</template>