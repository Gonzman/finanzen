<template>
    <div class="h-full flex flex-col gap-4 p-4">
        <!-- Header mit Dienstplan erstellen Button -->
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Dienstplaner</h2>
            <div>
                <CreateTimetable :committee-id="props.committee.id" @create="createTimetable" />
                <AnalyzeTimeTable v-if="useUser().isAnalyzer()" :timetables="timetables" />
            </div>
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

        <div v-else class="flex-1 overflow-x-auto overflow-y-hidden flex flex-row snap-x snap-mandatory">
            <div v-for="timetable in timetables" :key="timetable.id"
                class="bg-white border-r shadow-sm shrink-0 w-full h-full snap-start flex flex-col overflow-y-auto">
                <!-- Timetable Header -->
                <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <div>
                        <h3 class="font-semibold text-lg">{{ timetable.name }}</h3>
                        <p class="text-sm text-gray-500">{{ timetable.expand?.shift_via_timetable?.length ?? 0 }}
                            Schicht(en)
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="default" size="sm" @click="openAddShiftDialog(timetable)">
                            + Schicht hinzufügen
                        </Button>

                        <Button variant="default" size="sm" @click="() => exportTimetable(timetable)">export</Button>

                        <RenameTimetable :timetable-id="timetable.id" :timetable-name="timetable.name"
                            :committee-id="props.committee.id" :current-editors="timetable.editors || []"
                            @rename="renameTimetable" @update-editors="updateTimetableEditors" />
                        <DeleteTimetable :timetable-id="timetable.id" :timetable-name="timetable.name"
                            @delete="deleteTimetable" />
                    </div>
                </div>

                <!-- Calendar Table - Only dates with shifts -->
                <div v-if="getUniqueDates(timetable).length > 0" class="overflow-auto flex-1">
                    <table class="w-full border-collapse h-full">
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
                                        <div v-for="(positioned, index) in getPositionedShifts(timetable, date)"
                                            :key="positioned.shift.id"
                                            class="absolute text-white rounded p-2 text-xs cursor-pointer hover:brightness-110 transition-all overflow-hidden"
                                            :style="positioned.style"
                                            @click="openEditShiftDialog(timetable, positioned.shift)">
                                            <div class="flex items-start justify-between gap-1 mb-1">
                                                <div class="font-semibold truncate">{{ positioned.shift.purpose }}</div>
                                                <div
                                                    class="bg-white/30 px-1.5 py-0.5 rounded font-bold text-[10px] flex-shrink-0">
                                                    {{ String.fromCharCode(65 + index) }}
                                                </div>
                                            </div>
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
                <div v-else class="p-8 text-center text-gray-500 flex-1 flex items-center justify-center">
                    <p>Noch keine Schichten vorhanden. Klicke auf "Schicht hinzufügen" um eine zu erstellen.</p>
                </div>
            </div>
        </div>

        <!-- Shift Dialog -->
        <ShiftDialog v-model:open="showShiftDialog" :shift="editingShift" :committee-id="props.committee.id"
            :date-anchor="dateAnchor" @save="handleSaveShift" @update="handleUpdateShift" @delete="handleDeleteShift" />
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
import RenameTimetable from './modal/RenameTimetable.vue';
import ShiftDialog from './modal/ShiftDialog.vue';
import type { ExpandShift, ExpandTimeTable } from '@/lib/pb';
import AnalyzeTimeTable from './modal/AnalyzeTimeTable.vue';
import createExcel from './modal/CreateExcel';

const props = defineProps({
    committee: {
        type: Object as () => Team,
        required: true,
    } as const,
});

const client = usePocketBase();
const user = useUser();

const timetables = ref<TimetableResponse<ExpandTimeTable>[]>([]);
const isLoading = ref(false);
const showShiftDialog = ref(false);
const currentTimetable = ref<TimetableResponse<ExpandTimeTable> | null>(null);
const editingShift = ref<ShiftResponse<ExpandShift> | null>(null);
const dateAnchor = ref<string>('');
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
        timetables.value = await client.collection('timetable').getFullList<TimetableResponse<ExpandTimeTable>>({
            filter: `ausschuss = "${props.committee.id}"`,
            expand: 'shift_via_timetable, shift_via_timetable.createdby, shift_via_timetable.people',
            sort: '-created',
        });
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
function getUniqueDates(timetable: TimetableResponse<ExpandTimeTable>): string[] {
    if (!timetable.expand?.shift_via_timetable) return [];
    const dates = [...new Set(timetable.expand.shift_via_timetable.map(s => s.date))];
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
function getShiftsForDate(timetable: TimetableResponse<ExpandTimeTable>, date: string): ShiftResponse<ExpandShift>[] {
    if (!timetable.expand?.shift_via_timetable) return [];
    return timetable.expand.shift_via_timetable
        .filter(s => s.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getShiftDurationMinutes(shift: ShiftResponse<ExpandShift>): number {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
}

function getShiftHeight(shift: ShiftResponse<ExpandShift>): number {
    const durationMinutes = getShiftDurationMinutes(shift);
    return Math.max(60, (durationMinutes / 60) * 40);
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function shiftsOverlap(a: ShiftResponse<ExpandShift>, b: ShiftResponse<ExpandShift>): boolean {
    let aStart = timeToMinutes(a.startTime);
    let aEnd = timeToMinutes(a.endTime);
    let bStart = timeToMinutes(b.startTime);
    let bEnd = timeToMinutes(b.endTime);
    if (aEnd <= aStart) aEnd += 24 * 60;
    if (bEnd <= bStart) bEnd += 24 * 60;
    return aStart < bEnd && bStart < aEnd;
}

interface PositionedShift {
    shift: ShiftResponse<ExpandShift>;
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

function getGlobalTimeRange(timetable: TimetableResponse<ExpandTimeTable>): { minStart: number; maxEnd: number } {
    const allShifts = timetable.expand?.shift_via_timetable || [];
    if (allShifts.length === 0) return { minStart: 0, maxEnd: 24 * 60 };

    const minStart = Math.min(...allShifts.map(s => timeToMinutes(s.startTime)));
    let maxEnd = Math.max(...allShifts.map(s => {
        let endMinutes = timeToMinutes(s.endTime);
        const startMinutes = timeToMinutes(s.startTime);
        if (endMinutes <= startMinutes) endMinutes += 24 * 60;
        return endMinutes;
    }));

    return { minStart, maxEnd };
}

function getPositionedShifts(timetable: TimetableResponse<ExpandTimeTable>, date: string): PositionedShift[] {
    const shifts = getShiftsForDate(timetable, date);
    if (shifts.length === 0) return [];

    const { minStart } = getGlobalTimeRange(timetable);
    const PIXELS_PER_HOUR = 40;

    const columns: ShiftResponse<ExpandShift>[][] = [];

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

function getDayContainerHeight(timetable: TimetableResponse<ExpandTimeTable>, date: string): string {
    const allShifts = timetable.expand?.shift_via_timetable || [];
    if (allShifts.length === 0) return '120px';

    const PIXELS_PER_HOUR = 40;
    const { minStart } = getGlobalTimeRange(timetable);

    let maxBottom = 0;
    for (const shift of allShifts) {
        const startMinutes = timeToMinutes(shift.startTime);
        const top = ((startMinutes - minStart) / 60) * PIXELS_PER_HOUR;
        const height = getShiftHeight(shift);
        maxBottom = Math.max(maxBottom, top + height);
    }

    return `${Math.max(120, maxBottom + 8)}px`;
}

// Timetable operations
function createTimetable(timetable: TimetableResponse<ExpandTimeTable>) {
    timetables.value.push(timetable);
}

function deleteTimetable(id: string) {
    const index = timetables.value.findIndex(t => t.id === id);
    if (index !== -1) {
        timetables.value.splice(index, 1);
    }
}

function renameTimetable(id: string, name: string) {
    const index = timetables.value.findIndex(t => t.id === id);
    if (index !== -1) {
        timetables.value[index].name = name;
    }
}

function updateTimetableEditors(id: string, editors: string[]) {
    const index = timetables.value.findIndex(t => t.id === id);
    if (index !== -1) {
        timetables.value[index].editors = editors;
    }
}

// Shift dialog operations
function openAddShiftDialog(timetable: TimetableResponse<ExpandTimeTable>) {
    currentTimetable.value = timetable;
    editingShift.value = null;
    // Use the last date from the timetable as anchor, or empty string (which will default to today)
    const dates = getUniqueDates(timetable);
    if (dates.length > 0) {
        // Extract just the date part (YYYY-MM-DD) in case the date includes timestamp
        const lastDate = dates[dates.length - 1];
        dateAnchor.value = lastDate.includes(' ') ? lastDate.split(' ')[0] : lastDate;
    } else {
        dateAnchor.value = '';
    }
    showShiftDialog.value = true;
}

function openEditShiftDialog(timetable: TimetableResponse<ExpandTimeTable>, shift: ShiftResponse<ExpandShift>) {
    currentTimetable.value = timetable;
    editingShift.value = shift;
    // Extract just the date part (YYYY-MM-DD) in case the date includes timestamp
    dateAnchor.value = shift.date.includes(' ') ? shift.date.split(' ')[0] : shift.date;
    showShiftDialog.value = true;
}

async function handleSaveShift(shiftData: { date: string; purpose: string; startTime: string; endTime: string; people: string[], extern: boolean }) {
    if (!currentTimetable.value) return;
    try {
        let newShift = await client.collection('shift').create({
            timetable: currentTimetable.value.id,
            date: shiftData.date,
            purpose: shiftData.purpose,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            people: shiftData.people,
            extern: shiftData.extern,
            createdby: useUser().userId
        }) as ShiftResponse<ExpandShift>

        newShift.expand = {} as ExpandShift;
        newShift.expand.createdby = await client.collection("users").getOne(user.userId)
        newShift.expand.people = []

        if (!currentTimetable.value.expand) {
            currentTimetable.value.expand = { shift_via_timetable: [] } as ExpandTimeTable;
        }
        if (!currentTimetable.value.expand.shift_via_timetable) {
            currentTimetable.value.expand.shift_via_timetable = [];
        }
        currentTimetable.value.expand.shift_via_timetable.push(newShift);
    } catch (error) {
        console.error('Error creating shift:', error);
    }
}

async function handleUpdateShift(updatedShift: ShiftResponse<ExpandShift>) {
    if (!currentTimetable.value) return;
    if (currentTimetable.value.expand?.shift_via_timetable) {
        const index = currentTimetable.value.expand.shift_via_timetable.findIndex(s => s.id === updatedShift.id);
        if (index !== -1) {
            currentTimetable.value.expand.shift_via_timetable[index] = updatedShift;
        }
    }
}

async function handleDeleteShift(shiftId: string) {
    if (!currentTimetable.value) return;
    if (currentTimetable.value.expand?.shift_via_timetable) {
        const index = currentTimetable.value.expand.shift_via_timetable.findIndex(s => s.id === shiftId);
        if (index !== -1) {
            currentTimetable.value.expand.shift_via_timetable.splice(index, 1);
        }
    }
}

async function exportTimetable(timetable: TimetableResponse<ExpandTimeTable>) {
    if (!timetable) return;
    const blob = await createExcel(timetable, peopleMap.value);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timetable.name}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

}
</script>

<style scoped></style>