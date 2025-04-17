<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-fulls justify-start">
                Passwort zurücksetzen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Passwort zurücksetzen</DialogTitle>
                <DialogDescription>
                    Hier kann das Passwort zurückgesetzt werden.
                </DialogDescription>
            </DialogHeader>
            <div>
                <Input v-model="password" type="password" placeholder="Neues Passwort" class="w-full" />

                <Input v-model="passwordConfirm" type="password" placeholder="Neues Passwort bestätigen"
                    class="w-full" />

                <div class="flex justify-end space-x-2 pt-4">
                    <DialogClose as-child>
                        <Button variant="outline">Abbrechen</Button>
                    </DialogClose>
                    <DialogClose as-child>
                        <Button :disabled="password === '' || passwordConfirm === ''" @click="resetPassword">
                            Bestätigen
                        </Button>
                    </DialogClose>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ref, type PropType } from 'vue';
import { TransactionAuthStateOptions, type TransactionAuthResponse } from '@/lib/pocketbase-types';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import { Input } from '@/components/ui/input';

const password = ref('');
const passwordConfirm = ref('');
const pb = usePocketBase();
const user = useUser();


const checkPassword = () => {
    if (password.value !== passwordConfirm.value) {
        alert('Die Passwörter stimmen nicht überein');
        return false;
    }
    return true;
};
const resetPassword = async () => {
    if (!checkPassword()) {
        return;
    }
    try {
        await pb.collection('users').confirmPasswordReset(user.userId, password.value, passwordConfirm.value);
        alert('Passwort erfolgreich zurückgesetzt');
    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        alert('Fehler beim Zurücksetzen des Passworts');
    }
};
</script>