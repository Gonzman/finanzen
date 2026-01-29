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
import { usePocketBase, useUser } from '@/components/usePocketbase';
import type { PeopleResponse, ShiftResponse } from '@/lib/pocketbase-types';
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { type ExpandShift } from '@/lib/pb';

const props = defineProps({
    open: {
        type: Boolean,
        required: true,
    },
    shift: {
        type: Object as PropType<ShiftResponse<ExpandShift> | null>,
        default: null,
    },
    committeeId: {
        type: String,
        default: '',
    },
});

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'save', shift: ShiftResponse<ExpandShift>): void;
    (e: 'update', shift: ShiftResponse<ExpandShift>): void;
    (e: 'delete', shiftId: string): void;
}>();

const client = usePocketBase();
const user = useUser();

const form = reactive({
    date: '',
    purpose: '',
    startTime: '09:00',
    endTime: '17:00',
    people: [] as string[],
    extern: false
});

const isEditing = ref(false);
const peopleList = ref<PeopleResponse[]>([]);
const isLoadingPeople = ref(false);
const peoplePopoverOpen = ref(false);
const searchQuery = ref('');
const peopleNames = ref<Record<string, string>>({});

// Fetch people from PocketBase
async function fetchPeople() {
    isLoadingPeople.value = true;
    try {
        const records = await client.collection('people').getFullList<PeopleResponse>({
            sort: 'name',
        });
        peopleList.value = records;
        // Cache all names for quick lookup
        records.forEach(p => {
            peopleNames.value[p.id] = p.name;
        });
    } catch (error) {
        console.error('Error fetching people:', error);
    } finally {
        isLoadingPeople.value = false;
    }
}

// Get person name by ID (sync version for template)
function getPersonName(personId: string): string {
    return peopleNames.value[personId] || 'Laden...';
}

// Fetch person name and cache it
async function fetchPersonName(personId: string) {
    if (peopleNames.value[personId]) return;

    const person = peopleList.value.find(p => p.id === personId);
    if (person) {
        peopleNames.value[personId] = person.name;
    } else {
        try {
            const person = await usePocketBase().collection('people').getOne<PeopleResponse>(personId);
            peopleNames.value[personId] = person.name;
        } catch (error) {
            console.error('Error fetching person:', error);
            peopleNames.value[personId] = 'Unbekannt';
        }
    }
}

// Toggle person selection
function togglePerson(personId: string) {
    const index = form.people.indexOf(personId);
    if (index === -1) {
        form.people.push(personId);
        // Immediately cache name from peopleList if available
        const person = peopleList.value.find(p => p.id === personId);
        if (person) {
            peopleNames.value[personId] = person.name;
        } else {
            fetchPersonName(personId);
        }
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
    if (!name) return;

    // If name already exists, just select that person
    const existingPerson = peopleList.value.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingPerson) {
        if (!form.people.includes(existingPerson.id)) {
            form.people.push(existingPerson.id);
            peopleNames.value[existingPerson.id] = existingPerson.name;
        }
        searchQuery.value = '';
        return;
    }

    try {
        const data: { name: string; ausschuss?: string } = { name };
        if (props.committeeId) {
            data.ausschuss = props.committeeId;
        }

        const newPerson = await client.collection('people').create(data);

        // Add to local list
        peopleList.value.push(newPerson as PeopleResponse);
        // Select the new person
        form.people.push(newPerson.id);
        // Cache the name
        peopleNames.value[newPerson.id] = name;
        // Clear search but keep popover open so user can continue adding
        searchQuery.value = '';
    } catch (error) {
        console.error('Error creating person:', error);
    }
}

// Handle Enter key to add person
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && searchQuery.value.trim()) {
        event.preventDefault();
        createAndAddPerson();
    }
}

watch(
    () => props.open,
    (newOpen) => {
        if (newOpen) {
            fetchPeople();
            if (props.shift) {
                // Editing existing shift
                console.log(props.shift.date);
                isEditing.value = true;
                // Parse date from "2006-01-02 15:04:05.000Z" format to "YYYY-MM-DD"
                form.date = props.shift.date.split(' ')[0];
                form.purpose = props.shift.purpose;
                form.startTime = props.shift.startTime;
                form.endTime = props.shift.endTime;
                form.people = props.shift.people ? [...props.shift.people] : [];
                form.extern = props.shift.extern
                // Fetch names for existing people
                if (props.shift.people) {
                    props.shift.people.forEach(fetchPersonName);
                }
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

function closeDialog() {
    emit('update:open', false);
}

async function handleSave() {
    if (!form.date || !form.purpose.trim()) return;

    try {
        if (isEditing.value && props.shift) {
            // Update existing shift
            const updatedShift = await client.collection('shift').update(props.shift.id, {
                date: form.date,
                purpose: form.purpose.trim(),
                startTime: form.startTime,
                endTime: form.endTime,
                people: [...form.people],
                extern: form.extern
            }) as ShiftResponse<ExpandShift>;

            updatedShift.expand = {} as ExpandShift;
            updatedShift.expand.createdby = await client.collection('users').getOne(user.userId);

            if (form.people && form.people.length > 0) {
                const peopleFilter = form.people.map(id => `id = "${id}"`).join(' || ');
                updatedShift.expand.people = await client.collection('people').getFullList({ filter: peopleFilter });
            } else {
                updatedShift.expand.people = [];
            }

            emit('update', updatedShift);
        } else {
            // Create new shift - need timetableId from parent
            // Since we don't have timetableId here, we still need parent to handle creation
            // But we'll prepare the full shift object
            emit('save', {
                date: form.date,
                purpose: form.purpose.trim(),
                startTime: form.startTime,
                endTime: form.endTime,
                people: [...form.people],
                extern: form.extern
            } as any);
        }
        closeDialog();
    } catch (error) {
        console.error('Error saving shift:', error);
    }
}

async function handleDelete() {
    if (props.shift) {
        try {
            await client.collection('shift').delete(props.shift.id);
            emit('delete', props.shift.id);
            closeDialog();
        } catch (error) {
            console.error('Error deleting shift:', error);
        }
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="sm:max-w-[450px]">
            <DialogHeader>
                <DialogTitle>{{ isEditing ? 'Schicht bearbeiten' : 'Schicht hinzufügen' }}</DialogTitle>
                <DialogDescription>
                    {{ isEditing ? 'Aktualisiere die Schichtdetails.' : 'Füge eine neue Schicht zum Dienstplan hinzu.'
                    }}
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="shift-date">Datum</Label>
                    <Input id="shift-date" v-model="form.date" type="date" />
                </div>
                <div class="grid gap-2">
                    <Label for="shift-purpose">Aufgabe</Label>
                    <Input id="shift-purpose" v-model="form.purpose" placeholder="z.B. Bardienst, Türdienst" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="shift-start">Startzeit</Label>
                        <Input id="shift-start" v-model="form.startTime" type="time" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="shift-end">Endzeit</Label>
                        <Input id="shift-end" v-model="form.endTime" type="time" />
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div class="flex items-center gap-2">
                        <Label for="extern">Ist die Schicht außerhalb der regulären Schulzeit?</Label>
                        <input id="extern" type="checkbox" v-model="form.extern" class="w-4 h-4" />
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label>Personen</Label>
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
                                    Personen auswählen...
                                </span>
                                <span v-else>
                                    {{ form.people.length }} ausgewählt
                                </span>
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-full p-0" align="start">
                            <Command @keydown="handleKeydown">
                                <CommandInput v-model="searchQuery" placeholder="Name eingeben und Enter drücken..." />
                                <CommandEmpty v-if="isLoadingPeople">Laden...</CommandEmpty>
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem v-for="person in peopleList" :key="person.id" :value="person.name"
                                            @select="togglePerson(person.id)">
                                            <Check :class="cn(
                                                'mr-2 h-4 w-4',
                                                isPersonSelected(person.id) ? 'opacity-100' : 'opacity-0'
                                            )" />
                                            {{ person.name }}
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
                    Löschen
                </Button>
                <div class="flex gap-2 ml-auto">
                    <Button variant="outline" @click="closeDialog">Abbrechen</Button>
                    <Button @click="handleSave" :disabled="!form.date || !form.purpose.trim()">
                        {{ isEditing ? 'Speichern' : 'Hinzufügen' }}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
