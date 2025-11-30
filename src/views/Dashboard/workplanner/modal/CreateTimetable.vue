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
                <span class="text-lg">+</span> New Timetable
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>Create New Timetable</DialogTitle>
                <DialogDescription>
                    Create a new timetable to organize your shifts.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="timetable-name">Timetable Name</Label>
                    <Input id="timetable-name" v-model="name" placeholder="e.g., Weekend Event"
                        @keyup.enter="handleKeyEnter" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button @click="handleCreate" :disabled="!name.trim()">Create</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
