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
import { ref, watch } from 'vue';
import { usePocketBase } from '@/components/usePocketbase';

const client = usePocketBase();

const props = defineProps({
    timetableName: {
        type: String,
        required: true,
    },
    timetableId: {
        type: String,
        required: true,
    },
});

const emit = defineEmits<{
    (e: 'rename', id: string, name: string): void;
}>();

const open = ref(false);
const name = ref('');

watch(open, (newOpen) => {
    if (newOpen) {
        name.value = props.timetableName;
    }
});

async function handleRename() {
    if (!name.value.trim()) return;
    try {
        await client.collection('timetable').update(props.timetableId, { name: name.value.trim() });
        emit('rename', props.timetableId, name.value.trim());
        open.value = false;
    } catch (error) {
        console.error('Error renaming timetable:', error);
    }
}

function handleKeyEnter() {
    handleRename();
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger asChild>
            <Button variant="outline" size="sm">Umbenennen</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>Dienstplan umbenennen</DialogTitle>
                <DialogDescription>
                    Gib einen neuen Namen für "{{ timetableName }}" ein.
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
                <Button @click="handleRename" :disabled="!name.trim()">Umbenennen</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style lang="css" scoped></style>