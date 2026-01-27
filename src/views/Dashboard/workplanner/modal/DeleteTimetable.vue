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
import { ref } from 'vue';
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
    (e: 'delete', id: string): void;
}>();

const open = ref(false);

async function handleDelete() {
    try {
        const shifts = await client.collection('shift').getFullList({ filter: `timetable = "${props.timetableId}"` });
        await client.collection('timetable').delete(props.timetableId);
        for (const shift of shifts) {
            await client.collection('shift').delete(shift.id);
        }
        emit('delete', props.timetableId);
        open.value = false;
    } catch (error) {
        console.error('Error deleting timetable:', error);
    }
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger asChild>
            <Button variant="destructive" size="sm">Löschen</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>Dienstplan löschen</DialogTitle>
                <DialogDescription>
                    Bist du sicher, dass du "{{ timetableName }}" löschen möchtest? Diese Aktion kann nicht
                    rückgängig gemacht werden und alle Schichten werden entfernt.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <Button variant="destructive" @click="handleDelete">Löschen</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
