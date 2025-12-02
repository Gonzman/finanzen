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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ref, reactive, watch, type PropType } from 'vue';
import { usePocketBase } from '@/components/usePocketbase';
import type { PeopleResponse } from '@/lib/pocketbase-types';
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import { cn } from '@/lib/utils';

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
    committeeId: {
        type: String,
        default: '',
    },
});

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'save', shift: Omit<Shift, 'id'>): void;
    (e: 'update', shift: Shift): void;
    (e: 'delete', shiftId: string): void;
}>();

const client = usePocketBase();

const form = reactive({
    date: '',
    purpose: '',
    startTime: '09:00',
    endTime: '17:00',
    people: [] as string[],
});

const isEditing = ref(false);
const peopleList = ref<PeopleResponse[]>([]);
const isLoadingPeople = ref(false);
const peoplePopoverOpen = ref(false);
const searchQuery = ref('');

// Fetch people from PocketBase
async function fetchPeople() {
    if (!props.committeeId) return;
    isLoadingPeople.value = true;
    try {
        const records = await client.collection('people').getFullList<PeopleResponse>({
            filter: `ausschuss = "${props.committeeId}"`,
            sort: 'name',
        });
        peopleList.value = records;
    } catch (error) {
        console.error('Error fetching people:', error);
    } finally {
        isLoadingPeople.value = false;
    }
}

// Get person name by ID
function getPersonName(personId: string): string {
    const person = peopleList.value.find(p => p.id === personId);
    return person?.name || personId;
}

// Toggle person selection
function togglePerson(personId: string) {
    const index = form.people.indexOf(personId);
    if (index === -1) {
        form.people.push(personId);
    } else {
        form.people.splice(index, 1);
    }
}

// Check if person is selected
function isPersonSelected(personId: string): boolean {
    return form.people.includes(personId);
}

// Remove person by ID
function removePerson(personId: string) {
    const index = form.people.indexOf(personId);
    if (index !== -1) {
        form.people.splice(index, 1);
    }
}

// Create a new person and add to the list
async function createAndAddPerson() {
    const name = searchQuery.value.trim();
    if (!name || !props.committeeId) return;
    
    try {
        const newPerson = await client.collection('people').create({
            name,
            ausschuss: props.committeeId,
        });
        
        // Add to local list
        peopleList.value.push(newPerson as PeopleResponse);
        // Select the new person
        form.people.push(newPerson.id);
        // Clear search
        searchQuery.value = '';
    } catch (error) {
        console.error('Error creating person:', error);
    }
}

// Check if the search query matches any existing person
function hasExactMatch(): boolean {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return true;
    return peopleList.value.some(p => p.name.toLowerCase() === query);
}

watch(
    () => props.open,
    (newOpen) => {
        if (newOpen) {
            fetchPeople();
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
        }
    }
);

// Re-fetch people when committeeId changes
watch(() => props.committeeId, () => {
    if (props.open) {
        fetchPeople();
    }
});

function closeDialog() {
    emit('update:open', false);
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
                        <span v-for="personId in form.people" :key="personId"
                            class="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {{ getPersonName(personId) }}
                            <button @click="removePerson(personId)" class="text-blue-400 hover:text-red-500">
                                &times;
                            </button>
                        </span>
                    </div>
                    <Popover v-model:open="peoplePopoverOpen">
                        <PopoverTrigger as-child>
                            <Button variant="outline" role="combobox" class="w-full justify-between">
                                <span v-if="form.people.length === 0" class="text-muted-foreground">
                                    Select people...
                                </span>
                                <span v-else>
                                    {{ form.people.length }} selected
                                </span>
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-full p-0" align="start">
                            <Command>
                                <CommandInput v-model="searchQuery" placeholder="Search or add people..." />
                                <CommandEmpty v-if="isLoadingPeople">Loading...</CommandEmpty>
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem
                                            v-for="person in peopleList"
                                            :key="person.id"
                                            :value="person.name"
                                            @select="togglePerson(person.id)"
                                        >
                                            <Check
                                                :class="cn(
                                                    'mr-2 h-4 w-4',
                                                    isPersonSelected(person.id) ? 'opacity-100' : 'opacity-0'
                                                )"
                                            />
                                            {{ person.name }}
                                        </CommandItem>
                                        <!-- Add new person option -->
                                        <CommandItem
                                            v-if="searchQuery.trim() && !hasExactMatch()"
                                            :value="`create-${searchQuery}`"
                                            @select="createAndAddPerson"
                                            class="text-blue-600"
                                        >
                                            <span class="mr-2">+</span>
                                            Add "{{ searchQuery.trim() }}"
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
