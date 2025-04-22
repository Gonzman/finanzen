<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import CardContent from '@/components/ui/card/CardContent.vue';
import CardHeader from '@/components/ui/card/CardHeader.vue';
import CardTitle from '@/components/ui/card/CardTitle.vue';
import Input from '@/components/ui/input/Input.vue';
import { usePocketBase } from '@/components/usePocketbase';
import { ref } from 'vue';

const pb = usePocketBase();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
    errorMessage.value = '';
    isLoading.value = true;
    
    try {
        await pb.collection('users').authWithPassword(email.value, password.value);
        // Login erfolgreich, PocketBase wird die Weiterleitung übernehmen
    } catch (error) {
        errorMessage.value = 'Ungültige E-Mail oder Passwort.';
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="login flex justify-center items-center h-screen">
        <div class="w-full max-w-md rounded-xs">
            <CardHeader class="mb-4">
                <CardTitle>Anmelden</CardTitle>
            </CardHeader>
            <CardContent>
                <form @submit.prevent="handleLogin">
                    <div v-if="errorMessage" class="mb-4 p-3 rounded text-red-500 bg-red-50 text-sm text-center">
                        {{ errorMessage }}
                    </div>
                    <div class="mb-4">
                        <Input
                            v-model="email"
                            type="email"
                            placeholder="E-Mail"
                            required
                        />
                    </div>
                    <div class="mb-4">
                        <Input
                            v-model="password"
                            type="password"
                            placeholder="Passwort"
                            required
                        />
                    </div>
                    <Button type="submit" class="w-full" :disabled="isLoading">
                        {{ isLoading ? 'Anmelden...' : 'Anmelden' }}
                    </Button>
                </form>
            </CardContent>
        </div>
    </div>
</template>
