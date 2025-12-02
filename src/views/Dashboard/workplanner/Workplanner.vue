<template>
    <div class="h-full flex flex-col gap-4 p-4">
        <!-- Header mit Dienstplan erstellen Button -->
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Dienstplaner</h2>
            <CreateTimetable @create="createTimetable" />
        </div>

        <!-- Ladezustand -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div class="text-center text-gray-500">
                <p class="text-lg">Dienstpläne werden geladen...</p>
            </div>
        </div>

        <!-- Dienstplan-Liste -->
        <div v-else-if="timetables.length === 0" class="flex-1 flex items-center justify-center">
            <div class="text-center text-gray-500">
                <p class="text-lg mb-2">Noch keine Dienstpläne vorhanden</p>
                <p class="text-sm">Klicke auf "Neuer Dienstplan" um deinen ersten Plan zu erstellen</p>
            </div>
        </div>

        <div v-else class="flex-1 overflow-auto flex flex-col gap-6">
            <div v-for="timetable in timetables" :key="timetable.id"
                class="bg-white rounded-lg border shadow-sm overflow-hidden">
                <!-- Timetable Header -->
                <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <div>
                        <h3 class="font-semibold text-lg">{{ timetable.name }}</h3>
                        <p class="text-sm text-gray-500">{{ timetable.shifts.length }} Schicht(en)</p>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="default" size="sm" @click="openAddShiftDialog(timetable)">
                            + Schicht hinzufügen
                        </Button>
                        <DeleteTimetable :timetable-id="timetable.id" :timetable-name="timetable.name"
                            @delete="deleteTimetable" />
                    </div>
                </div>

                <!-- Calendar Table - Only dates with shifts -->
                <div v-if="getUniqueDates(timetable).length > 0" class="overflow-x-auto">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-100">
                                <th v-for="date in getUniqueDates(timetable)" :key="date"
                                    class="border-r last:border-r-0 p-3 text-center min-w-[150px]"
                                    :class="{ 'bg-blue-50': isToday(date) }">
                                    <div class="text-xs text-gray-500 uppercase">{{ getDayName(date) }}</div>
                                    <div class="text-lg font-semibold" :class="{ 'text-blue-600': isToday(date) }">
                                        {{ getDayNumber(date) }}
                                    </div>
                                    <div class="text-xs text-gray-400">{{ getMonthYear(date) }}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td v-for="date in getUniqueDates(timetable)" :key="date"
                                    class="border-r last:border-r-0 border-t p-2 align-top"
                                    :class="{ 'bg-blue-50/30': isToday(date) }">
                                    <div class="relative min-w-[150px]"
                                        :style="{ height: getDayContainerHeight(timetable, date) }">
                                        <!-- Shifts for this day -->
                                        <div v-for="positioned in getPositionedShifts(timetable, date)"
                                            :key="positioned.shift.id"
                                            class="absolute text-white rounded p-2 text-xs cursor-pointer hover:brightness-110 transition-all overflow-hidden"
                                            :style="positioned.style"
                                            @click="openEditShiftDialog(timetable, positioned.shift)">
                                            <div class="font-semibold truncate">{{ positioned.shift.purpose }}</div>
                                            <div class="opacity-90">{{ positioned.shift.startTime }} - {{
                                                positioned.shift.endTime }}</div>
                                            <div v-if="positioned.shift.people.length > 0"
                                                class="mt-1 flex flex-wrap gap-1">
                                                <span v-for="(person, idx) in positioned.shift.people.slice(0, 3)"
                                                    :key="idx" class="bg-white/20 px-1 rounded text-[10px]">
                                                    {{ getPersonName(person) }}
                                                </span>
                                                <span v-if="positioned.shift.people.length > 3"
                                                    class="bg-white/20 px-1 rounded text-[10px]">
                                                    +{{ positioned.shift.people.length - 3 }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-8 text-center text-gray-500">
                    <p>Noch keine Schichten vorhanden. Klicke auf "Schicht hinzufügen" um eine zu erstellen.</p>
                </div>
            </div>
        </div>

        <!-- Shift Dialog -->
        <ShiftDialog v-model:open="showShiftDialog" :shift="editingShift" :committee-id="props.committee.id"
            @save="handleSaveShift" @update="handleUpdateShift" @delete="handleDeleteShift" />
    </div>
</template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { Button } from '@/components/ui/button';
import { ref, onMounted, watch } from 'vue';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import type { TimetableResponse, ShiftResponse, PeopleResponse } from '@/lib/pocketbase-types';
import CreateTimetable from './modal/CreateTimetable.vue';
import DeleteTimetable from './modal/DeleteTimetable.vue';
import ShiftDialog, { type Shift } from './modal/ShiftDialog.vue';

interface Timetable {
    id: string;
    name: string;
    shifts: Shift[];
}

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const client = usePocketBase();
const user = useUser();

const timetables = ref<Timetable[]>([]);
const isLoading = ref(false);
const showShiftDialog = ref(false);
const currentTimetable = ref<Timetable | null>(null);
const editingShift = ref<Shift | null>(null);
const peopleMap = ref<Map<string, string>>(new Map());

// Fetch all people and create a lookup map
async function fetchPeople() {
    try {
        const records = await client.collection('people').getFullList<PeopleResponse>({
            sort: 'name',
        });
        peopleMap.value = new Map(records.map(p => [p.id, p.name]));
    } catch (error) {
        console.error('Error fetching people:', error);
    }
}

// Get person name by ID
function getPersonName(personId: string): string {
    return peopleMap.value.get(personId) || personId;
}

// Fetch timetables and shifts from PocketBase
async function fetchTimetables() {
    isLoading.value = true;
    try {
        const timetableRecords = await client.collection('timetable').getFullList<TimetableResponse>({
            filter: `ausschuss = "${props.committee.id}"`,
            sort: '-created',
        });

        const result: Timetable[] = [];

        for (const tt of timetableRecords) {
            const shiftRecords = await client.collection('shift').getFullList<ShiftResponse>({
                filter: `timetable = "${tt.id}"`,
                sort: 'date,startTime',
            });

            const shifts: Shift[] = shiftRecords.map(s => ({
                id: s.id,
                date: s.date.split(' ')[0], // Extract date part from ISO string
                purpose: s.purpose,
                startTime: s.startTime,
                endTime: s.endTime,
                people: (s.people as string[]) || [],
            }));

            result.push({
                id: tt.id,
                name: tt.name,
                shifts,
            });
        }

        timetables.value = result;
    } catch (error) {
        console.error('Error fetching timetables:', error);
    } finally {
        isLoading.value = false;
    }
}

// Watch for committee changes and refetch
watch(() => props.committee.id, () => {
    fetchTimetables();
});

onMounted(() => {
    fetchPeople();
    fetchTimetables();
});

// Date helper functions
function getUniqueDates(timetable: Timetable): string[] {
    const dates = [...new Set(timetable.shifts.map(s => s.date))];
    return dates.sort();
}

function getDayName(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short' });
}

function getDayNumber(dateStr: string): number {
    return new Date(dateStr).getDate();
}

function getMonthYear(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
}

// Shift positioning functions
function getShiftsForDate(timetable: Timetable, date: string): Shift[] {
    return timetable.shifts
        .filter(s => s.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getShiftDurationMinutes(shift: Shift): number {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
}

function getShiftHeight(shift: Shift): number {
    const durationMinutes = getShiftDurationMinutes(shift);
    return Math.max(60, (durationMinutes / 60) * 40);
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function shiftsOverlap(a: Shift, b: Shift): boolean {
    let aStart = timeToMinutes(a.startTime);
    let aEnd = timeToMinutes(a.endTime);
    let bStart = timeToMinutes(b.startTime);
    let bEnd = timeToMinutes(b.endTime);
    if (aEnd <= aStart) aEnd += 24 * 60;
    if (bEnd <= bStart) bEnd += 24 * 60;
    return aStart < bEnd && bStart < aEnd;
}

interface PositionedShift {
    shift: Shift;
    style: {
        top: string;
        left: string;
        width: string;
        height: string;
        backgroundColor: string;
    };
}

function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
}

function getPositionedShifts(timetable: Timetable, date: string): PositionedShift[] {
    const shifts = getShiftsForDate(timetable, date);
    if (shifts.length === 0) return [];

    const minStart = Math.min(...shifts.map(s => timeToMinutes(s.startTime)));
    const PIXELS_PER_HOUR = 40;

    const columns: Shift[][] = [];

    for (const shift of shifts) {
        let placed = false;
        for (let col = 0; col < columns.length; col++) {
            const overlapsInColumn = columns[col].some(s => shiftsOverlap(s, shift));
            if (!overlapsInColumn) {
                columns[col].push(shift);
                placed = true;
                break;
            }
        }
        if (!placed) {
            columns.push([shift]);
        }
    }

    const result: PositionedShift[] = [];
    const totalColumns = columns.length;
    const columnWidth = totalColumns > 1 ? (100 - (totalColumns - 1) * 2) / totalColumns : 100;

    for (let col = 0; col < columns.length; col++) {
        for (const shift of columns[col]) {
            const startMinutes = timeToMinutes(shift.startTime);
            const top = ((startMinutes - minStart) / 60) * PIXELS_PER_HOUR;
            const height = getShiftHeight(shift);
            const left = col * (columnWidth + 2);

            result.push({
                shift,
                style: {
                    top: `${top}px`,
                    left: `${left}%`,
                    width: `${columnWidth}%`,
                    height: `${height}px`,
                    backgroundColor: stringToColor(shift.purpose),
                },
            });
        }
    }

    return result;
}

function getDayContainerHeight(timetable: Timetable, date: string): string {
    const shifts = getShiftsForDate(timetable, date);
    if (shifts.length === 0) return '120px';

    const PIXELS_PER_HOUR = 40;
    const minStart = Math.min(...shifts.map(s => timeToMinutes(s.startTime)));

    let maxBottom = 0;
    for (const shift of shifts) {
        const startMinutes = timeToMinutes(shift.startTime);
        const top = ((startMinutes - minStart) / 60) * PIXELS_PER_HOUR;
        const height = getShiftHeight(shift);
        maxBottom = Math.max(maxBottom, top + height);
    }

    return `${Math.max(120, maxBottom + 8)}px`;
}

// Timetable operations
async function createTimetable(name: string) {
    try {
        const newTimetable = await client.collection('timetable').create({
            name,
            ausschuss: props.committee.id,
            createdby: user.userId,
        });

        timetables.value.push({
            id: newTimetable.id,
            name: newTimetable.name,
            shifts: [],
        });
    } catch (error) {
        console.error('Error creating timetable:', error);
    }
}

async function deleteTimetable(id: string) {
    try {
        await client.collection('timetable').delete(id);
        const index = timetables.value.findIndex(t => t.id === id);
        if (index !== -1) {
            timetables.value.splice(index, 1);
        }
    } catch (error) {
        console.error('Error deleting timetable:', error);
    }
}

// Shift dialog operations
function openAddShiftDialog(timetable: Timetable) {
    currentTimetable.value = timetable;
    editingShift.value = null;
    showShiftDialog.value = true;
}

function openEditShiftDialog(timetable: Timetable, shift: Shift) {
    currentTimetable.value = timetable;
    editingShift.value = shift;
    showShiftDialog.value = true;
}

async function handleSaveShift(shiftData: Omit<Shift, 'id'>) {
    if (!currentTimetable.value) return;
    try {
        const newShift = await client.collection('shift').create({
            timetable: currentTimetable.value.id,
            date: shiftData.date,
            purpose: shiftData.purpose,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            people: shiftData.people,
        });

        currentTimetable.value.shifts.push({
            id: newShift.id,
            date: newShift.date.split(' ')[0],
            purpose: newShift.purpose,
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            people: (newShift.people as string[]) || [],
        });
    } catch (error) {
        console.error('Error creating shift:', error);
    }
}

async function handleUpdateShift(shift: Shift) {
    if (!currentTimetable.value) return;
    try {
        await client.collection('shift').update(shift.id, {
            date: shift.date,
            purpose: shift.purpose,
            startTime: shift.startTime,
            endTime: shift.endTime,
            people: shift.people,
        });

        const index = currentTimetable.value.shifts.findIndex(s => s.id === shift.id);
        if (index !== -1) {
            currentTimetable.value.shifts[index] = shift;
        }
    } catch (error) {
        console.error('Error updating shift:', error);
    }
}

async function handleDeleteShift(shiftId: string) {
    if (!currentTimetable.value) return;
    try {
        await client.collection('shift').delete(shiftId);
        const index = currentTimetable.value.shifts.findIndex(s => s.id === shiftId);
        if (index !== -1) {
            currentTimetable.value.shifts.splice(index, 1);
        }
    } catch (error) {
        console.error('Error deleting shift:', error);
    }
}
</script>

<style scoped></style>