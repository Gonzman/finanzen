<template>
    <div class="h-full flex flex-col gap-4 p-4">
        <!-- Header with Add Timetable button -->
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Work Planner</h2>
            <button @click="showTimetableDialog = true"
                class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2">
                <span class="text-lg">+</span> New Timetable
            </button>
        </div>

        <!-- Timetables List -->
        <div v-if="timetables.length === 0" class="flex-1 flex items-center justify-center">
            <div class="text-center text-gray-500">
                <p class="text-lg mb-2">No timetables yet</p>
                <p class="text-sm">Click "New Timetable" to create your first schedule</p>
            </div>
        </div>

        <div v-else class="flex-1 overflow-auto flex flex-col gap-6">
            <div v-for="timetable in timetables" :key="timetable.id"
                class="bg-white rounded-lg border shadow-sm overflow-hidden">
                <!-- Timetable Header -->
                <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <div>
                        <h3 class="font-semibold text-lg">{{ timetable.name }}</h3>
                        <p class="text-sm text-gray-500">{{ timetable.shifts.length }} shift(s)</p>
                    </div>
                    <div class="flex gap-2">
                        <button @click="openAddShiftDialog(timetable)"
                            class="px-3 py-1.5 rounded bg-green-500 text-white text-sm hover:bg-green-600">
                            + Add Shift
                        </button>
                        <button @click="deleteTimetable(timetable.id)"
                            class="px-3 py-1.5 rounded bg-red-500 text-white text-sm hover:bg-red-600">
                            Delete
                        </button>
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
                                            :style="positioned.style" @click="editShift(timetable, positioned.shift)">
                                            <div class="font-semibold truncate">{{ positioned.shift.purpose }}</div>
                                            <div class="opacity-90">{{ positioned.shift.startTime }} - {{
                                                positioned.shift.endTime }}</div>
                                            <div v-if="positioned.shift.people.length > 0"
                                                class="mt-1 flex flex-wrap gap-1">
                                                <span v-for="(person, idx) in positioned.shift.people.slice(0, 3)"
                                                    :key="idx" class="bg-white/20 px-1 rounded text-[10px]">
                                                    {{ person }}
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
                    <p>No shifts added yet. Click "Add Shift" to create one.</p>
                </div>
            </div>
        </div>

        <!-- New Timetable Dialog -->
        <div v-if="showTimetableDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            @click.self="showTimetableDialog = false">
            <div class="bg-white rounded-lg shadow-xl p-6 w-96">
                <h3 class="text-lg font-semibold mb-4">Create New Timetable</h3>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-sm text-gray-600 block mb-1">Timetable Name</label>
                        <input v-model="newTimetableName" type="text" placeholder="e.g., Weekend Event"
                            class="w-full p-2 border rounded" @keyup.enter="createTimetable" />
                    </div>
                    <div class="flex gap-2 justify-end">
                        <button @click="showTimetableDialog = false"
                            class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                        <button @click="createTimetable"
                            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">Create</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Shift Dialog -->
        <div v-if="showShiftDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            @click.self="closeShiftDialog">
            <div class="bg-white rounded-lg shadow-xl p-6 w-[450px] max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-4">{{ editingShift ? 'Edit Shift' : 'Add Shift' }}</h3>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-sm text-gray-600 block mb-1">Date</label>
                        <input v-model="shiftForm.date" type="date" class="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600 block mb-1">Purpose</label>
                        <input v-model="shiftForm.purpose" type="text" placeholder="e.g., Bar Service, Door Security"
                            class="w-full p-2 border rounded" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">Start Time</label>
                            <input v-model="shiftForm.startTime" type="time" class="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">End Time</label>
                            <input v-model="shiftForm.endTime" type="time" class="w-full p-2 border rounded" />
                        </div>
                    </div>
                    <div>
                        <label class="text-sm text-gray-600 block mb-1">People</label>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span v-for="(person, index) in shiftForm.people" :key="index"
                                class="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {{ person }}
                                <button @click="shiftForm.people.splice(index, 1)"
                                    class="text-blue-400 hover:text-red-500">&times;</button>
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <input v-model="newPersonInput" type="text" placeholder="Add person..."
                                class="flex-1 p-2 border rounded" @keyup.enter="addPersonToForm" />
                            <button @click="addPersonToForm"
                                class="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Add</button>
                        </div>
                    </div>
                    <div class="flex gap-2 justify-between pt-2">
                        <button v-if="editingShift" @click="deleteCurrentShift"
                            class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">Delete</button>
                        <div class="flex gap-2 ml-auto">
                            <button @click="closeShiftDialog"
                                class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button @click="saveShift"
                                class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">
                                {{ editingShift ? 'Save' : 'Add' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import { ref, reactive } from 'vue';

interface Shift {
    id: string;
    date: string;
    purpose: string;
    startTime: string;
    endTime: string;
    people: string[];
}

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

const timetables = reactive<Timetable[]>([]);
const showTimetableDialog = ref(false);
const showShiftDialog = ref(false);
const newTimetableName = ref('');
const newPersonInput = ref('');
const currentTimetable = ref<Timetable | null>(null);
const editingShift = ref<Shift | null>(null);

const shiftForm = reactive({
    date: '',
    purpose: '',
    startTime: '09:00',
    endTime: '17:00',
    people: [] as string[],
});

function getUniqueDates(timetable: Timetable): string[] {
    const dates = [...new Set(timetable.shifts.map(s => s.date))];
    return dates.sort();
}

function getDayName(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

function getDayNumber(dateStr: string): number {
    return new Date(dateStr).getDate();
}

function getMonthYear(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
}

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
    // Handle overnight shifts
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
}

function getShiftHeight(shift: Shift): number {
    const durationMinutes = getShiftDurationMinutes(shift);
    // Scale: 1 hour = 40px, minimum 60px
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
    // Handle overnight shifts
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
    // Generate a hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to HSL with good saturation and lightness for visibility
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
}

function getPositionedShifts(timetable: Timetable, date: string): PositionedShift[] {
    const shifts = getShiftsForDate(timetable, date);
    if (shifts.length === 0) return [];

    // Find the earliest start time for this day
    const minStart = Math.min(...shifts.map(s => timeToMinutes(s.startTime)));
    const PIXELS_PER_HOUR = 40;

    // Assign columns to shifts based on overlaps
    const columns: Shift[][] = [];

    for (const shift of shifts) {
        let placed = false;
        for (let col = 0; col < columns.length; col++) {
            // Check if this shift overlaps with any shift in this column
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

    // Create positioned shifts
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

function createTimetable() {
    if (!newTimetableName.value.trim()) return;
    timetables.push({
        id: Date.now().toString(),
        name: newTimetableName.value.trim(),
        shifts: [],
    });
    newTimetableName.value = '';
    showTimetableDialog.value = false;
}

function deleteTimetable(id: string) {
    const index = timetables.findIndex(t => t.id === id);
    if (index !== -1) {
        timetables.splice(index, 1);
    }
}

function openAddShiftDialog(timetable: Timetable) {
    currentTimetable.value = timetable;
    editingShift.value = null;
    shiftForm.date = new Date().toISOString().split('T')[0];
    shiftForm.purpose = '';
    shiftForm.startTime = '09:00';
    shiftForm.endTime = '17:00';
    shiftForm.people = [];
    showShiftDialog.value = true;
}

function editShift(timetable: Timetable, shift: Shift) {
    currentTimetable.value = timetable;
    editingShift.value = shift;
    shiftForm.date = shift.date;
    shiftForm.purpose = shift.purpose;
    shiftForm.startTime = shift.startTime;
    shiftForm.endTime = shift.endTime;
    shiftForm.people = [...shift.people];
    showShiftDialog.value = true;
}

function closeShiftDialog() {
    showShiftDialog.value = false;
    currentTimetable.value = null;
    editingShift.value = null;
    newPersonInput.value = '';
}

function addPersonToForm() {
    if (!newPersonInput.value.trim()) return;
    shiftForm.people.push(newPersonInput.value.trim());
    newPersonInput.value = '';
}

function saveShift() {
    if (!currentTimetable.value || !shiftForm.date || !shiftForm.purpose.trim()) return;

    if (editingShift.value) {
        // Update existing shift
        editingShift.value.date = shiftForm.date;
        editingShift.value.purpose = shiftForm.purpose.trim();
        editingShift.value.startTime = shiftForm.startTime;
        editingShift.value.endTime = shiftForm.endTime;
        editingShift.value.people = [...shiftForm.people];
    } else {
        // Add new shift
        currentTimetable.value.shifts.push({
            id: Date.now().toString(),
            date: shiftForm.date,
            purpose: shiftForm.purpose.trim(),
            startTime: shiftForm.startTime,
            endTime: shiftForm.endTime,
            people: [...shiftForm.people],
        });
    }

    closeShiftDialog();
}

function deleteCurrentShift() {
    if (!currentTimetable.value || !editingShift.value) return;
    const index = currentTimetable.value.shifts.findIndex(s => s.id === editingShift.value!.id);
    if (index !== -1) {
        currentTimetable.value.shifts.splice(index, 1);
    }
    closeShiftDialog();
}
</script>

<style scoped></style>