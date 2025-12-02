<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ref } from 'vue';

const emit = defineEmits<{
    (e: 'create', name: string): void;
}>();

const open = ref(false);
const name = ref('');

function handleCreate() {
    if (!name.value.trim()) return;
    emit('create', name.value.trim());
    name.value = '';
    open.value = false;
}

function handleKeyEnter() {
    handleCreate();
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger asChild>
            <Button class="flex items-center gap-2">
                <span class="text-lg">+</span> Neuer Dienstplan
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>Neuen Dienstplan erstellen</DialogTitle>
                <DialogDescription>
                    Erstelle einen neuen Dienstplan, um deine Schichten zu organisieren.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="timetable-name">Name des Dienstplans</Label>
                    <Input id="timetable-name" v-model="name" placeholder="z.B. Wochenend-Veranstaltung"
                        @keyup.enter="handleKeyEnter" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <Button @click="handleCreate" :disabled="!name.trim()">Erstellen</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
