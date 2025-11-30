<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ref, reactive, watch, type PropType } from 'vue';

export interface Shift {
    id: string;
    date: string;
    purpose: string;
    startTime: string;
    endTime: string;
    people: string[];
}

const props = defineProps({
    open: {
        type: Boolean,
        required: true,
    },
    shift: {
        type: Object as PropType<Shift | null>,
        default: null,
    },
});

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'save', shift: Omit<Shift, 'id'>): void;
    (e: 'update', shift: Shift): void;
    (e: 'delete', shiftId: string): void;
}>();

const form = reactive({
    date: '',
    purpose: '',
    startTime: '09:00',
    endTime: '17:00',
    people: [] as string[],
});

const newPersonInput = ref('');

const isEditing = ref(false);

watch(
    () => props.open,
    (newOpen) => {
        if (newOpen) {
            if (props.shift) {
                // Editing existing shift
                isEditing.value = true;
                form.date = props.shift.date;
                form.purpose = props.shift.purpose;
                form.startTime = props.shift.startTime;
                form.endTime = props.shift.endTime;
                form.people = [...props.shift.people];
            } else {
                // Adding new shift
                isEditing.value = false;
                form.date = new Date().toISOString().split('T')[0];
                form.purpose = '';
                form.startTime = '09:00';
                form.endTime = '17:00';
                form.people = [];
            }
            newPersonInput.value = '';
        }
    }
);

function closeDialog() {
    emit('update:open', false);
}

function addPerson() {
    if (!newPersonInput.value.trim()) return;
    form.people.push(newPersonInput.value.trim());
    newPersonInput.value = '';
}

function removePerson(index: number) {
    form.people.splice(index, 1);
}

function handleSave() {
    if (!form.date || !form.purpose.trim()) return;

    if (isEditing.value && props.shift) {
        emit('update', {
            id: props.shift.id,
            date: form.date,
            purpose: form.purpose.trim(),
            startTime: form.startTime,
            endTime: form.endTime,
            people: [...form.people],
        });
    } else {
        emit('save', {
            date: form.date,
            purpose: form.purpose.trim(),
            startTime: form.startTime,
            endTime: form.endTime,
            people: [...form.people],
        });
    }
    closeDialog();
}

function handleDelete() {
    if (props.shift) {
        emit('delete', props.shift.id);
        closeDialog();
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="sm:max-w-[450px]">
            <DialogHeader>
                <DialogTitle>{{ isEditing ? 'Edit Shift' : 'Add Shift' }}</DialogTitle>
                <DialogDescription>
                    {{ isEditing ? 'Update the shift details.' : 'Add a new shift to the timetable.' }}
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="shift-date">Date</Label>
                    <Input id="shift-date" v-model="form.date" type="date" />
                </div>
                <div class="grid gap-2">
                    <Label for="shift-purpose">Purpose</Label>
                    <Input id="shift-purpose" v-model="form.purpose" placeholder="e.g., Bar Service, Door Security" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="shift-start">Start Time</Label>
                        <Input id="shift-start" v-model="form.startTime" type="time" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="shift-end">End Time</Label>
                        <Input id="shift-end" v-model="form.endTime" type="time" />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label>People</Label>
                    <div class="flex flex-wrap gap-2 mb-2">
                        <span v-for="(person, index) in form.people" :key="index"
                            class="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {{ person }}
                            <button @click="removePerson(index)" class="text-blue-400 hover:text-red-500">
                                &times;
                            </button>
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <Input v-model="newPersonInput" placeholder="Add person..." @keyup.enter="addPerson" />
                        <Button variant="outline" @click="addPerson">Add</Button>
                    </div>
                </div>
            </div>
            <DialogFooter class="flex justify-between">
                <Button v-if="isEditing" variant="destructive" @click="handleDelete">
                    Delete
                </Button>
                <div class="flex gap-2 ml-auto">
                    <Button variant="outline" @click="closeDialog">Cancel</Button>
                    <Button @click="handleSave" :disabled="!form.date || !form.purpose.trim()">
                        {{ isEditing ? 'Save' : 'Add' }}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
