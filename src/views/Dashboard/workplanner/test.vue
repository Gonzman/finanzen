<template>
    <div class="h-full flex gap-4 p-4 bg-slate-50">
        <!-- Employee Sidebar -->
        <div class="w-64 bg-white rounded border shadow-sm p-4 flex flex-col gap-2">
            <h3 class="font-semibold mb-2">Employees</h3>
            <div class="flex gap-2 mb-4">
                <input v-model="newEmployee" placeholder="New Employee" class="p-1 border rounded flex-1 text-sm" />
                <button @click="addEmployee" class="px-3 py-1 rounded bg-blue-500 text-white text-sm">Add</button>
            </div>
            <div class="flex flex-col gap-2 flex-1 overflow-auto">
                <div v-for="employee in employees" :key="employee.id"
                    class="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded shadow cursor-move hover:shadow-lg transition-shadow"
                    draggable="true" @dragstart="startEmployeeDrag($event, employee)" @dragend="endEmployeeDrag">
                    <div class="font-medium">{{ employee.name }}</div>
                    <div class="text-xs opacity-90">Drag to schedule</div>
                </div>
            </div>
            <div class="mt-4 flex gap-2">
                <button @click="exportSchedule"
                    class="px-3 py-2 rounded bg-white border shadow-sm text-sm flex-1">Export</button>
                <label class="px-3 py-2 rounded bg-white border shadow-sm cursor-pointer text-sm flex-1 text-center">
                    Import
                    <input type="file" accept="application/json" class="hidden" @change="importSchedule" />
                </label>
            </div>
        </div>

        <!-- Schedule Grid -->
        <div class="flex-1 flex flex-col gap-2">
            <div class="overflow-auto border rounded bg-white flex-1">
                <div class="grid grid-cols-8 border-b bg-gray-100 sticky top-0">
                    <div class="p-2 border-r font-semibold">Employee</div>
                    <div v-for="day in days" :key="day" class="p-2 border-r text-center font-semibold">{{ day }}</div>
                </div>
                <div v-for="employee in employees" :key="employee.id" class="grid grid-cols-8 border-b">
                    <div class="p-2 border-r font-medium bg-gray-50">{{ employee.name }}</div>
                    <div v-for="day in days" :key="day" class="p-0 border-r relative h-20 bg-white transition-colors"
                        :class="{ 'bg-blue-50': isDragOverCell(employee.id, day) }"
                        @dragover.prevent="onDragOver($event, employee.id, day)"
                        @dragleave="onDragLeave(employee.id, day)" @drop="onDrop($event, employee.id, day)">
                        <div v-for="shift in getShifts(employee.id, day)" :key="shift.id"
                            class="absolute bg-blue-500 text-white text-xs rounded px-2 py-1 cursor-move hover:bg-blue-600 transition-colors shadow"
                            :style="shiftStyle(shift)" draggable="true" @dragstart.stop="startShiftDrag($event, shift)"
                            @dragend="endShiftDrag" @click="selectShift(shift)">
                            <div class="font-medium">{{ formatTime(shift.start) }} - {{ formatTime(shift.end) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-xs text-gray-600 bg-white p-3 rounded border">
                <strong>How to use:</strong> Drag employees from the sidebar to schedule cells to create shifts. Drag
                existing shifts to adjust times or reassign to different days/employees.
            </div>
        </div>

        <!-- Shift Details Sidebar (appears when shift is selected) -->
        <div v-if="selectedShift" class="w-64 bg-white rounded border shadow-sm p-4">
            <h3 class="font-semibold mb-4">Shift Details</h3>
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-sm text-gray-600">Start Time</label>
                    <input type="number" v-model.number="selectedShift.start" min="0" max="23"
                        class="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                    <label class="text-sm text-gray-600">End Time</label>
                    <input type="number" v-model.number="selectedShift.end" min="1" max="24"
                        class="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                    <label class="text-sm text-gray-600">Label (optional)</label>
                    <input type="text" v-model="selectedShift.label" class="w-full p-2 border rounded mt-1" />
                </div>
                <button @click="deleteShift" class="px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600">Delete
                    Shift</button>
                <button @click="selectedShift = null"
                    class="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const employees = reactive([
    { id: '1', name: 'Alice Johnson' },
    { id: '2', name: 'Bob Smith' },
    { id: '3', name: 'Carol White' }
]);
const shifts = reactive([]);
const selectedShift = ref(null);
const newEmployee = ref('');
const draggedEmployee = ref(null);
const draggedShift = ref(null);
const dragOverCell = ref(null);

function addEmployee() {
    if (!newEmployee.value) return;
    employees.push({ id: Date.now().toString(), name: newEmployee.value });
    newEmployee.value = '';
}

function getShifts(employeeId, day) {
    return shifts.filter(s => s.employeeId === employeeId && s.day === day);
}

function shiftStyle(shift) {
    const totalHours = 24;
    const widthPercent = ((shift.end - shift.start) / totalHours) * 100;
    const leftPercent = (shift.start / totalHours) * 100;
    return {
        left: leftPercent + '%',
        width: `calc(${widthPercent}% - 4px)`,
        top: '4px',
        height: 'calc(100% - 8px)',
    };
}

function formatTime(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function startEmployeeDrag(e, employee) {
    draggedEmployee.value = employee;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', employee.name);
}

function endEmployeeDrag() {
    draggedEmployee.value = null;
    dragOverCell.value = null;
}

function startShiftDrag(e, shift) {
    draggedShift.value = shift;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shift.id);
}

function endShiftDrag() {
    draggedShift.value = null;
    dragOverCell.value = null;
}

function onDragOver(e, employeeId, day) {
    e.preventDefault();
    dragOverCell.value = `${employeeId}-${day}`;
}

function onDragLeave(employeeId, day) {
    if (dragOverCell.value === `${employeeId}-${day}`) {
        dragOverCell.value = null;
    }
}

function isDragOverCell(employeeId, day) {
    return dragOverCell.value === `${employeeId}-${day}`;
}

function onDrop(e, employeeId, day) {
    e.preventDefault();
    dragOverCell.value = null;

    if (draggedEmployee.value) {
        // Create new shift from employee drag
        const newShift = {
            id: Date.now().toString(),
            employeeId: employeeId,
            day: day,
            start: 9,
            end: 17,
            label: draggedEmployee.value.name
        };
        shifts.push(newShift);
        draggedEmployee.value = null;
    } else if (draggedShift.value) {
        // Move existing shift
        draggedShift.value.employeeId = employeeId;
        draggedShift.value.day = day;
        draggedShift.value = null;
    }
}

function selectShift(shift) {
    selectedShift.value = shift;
}

function deleteShift() {
    if (!selectedShift.value) return;
    const index = shifts.findIndex(s => s.id === selectedShift.value.id);
    if (index !== -1) {
        shifts.splice(index, 1);
    }
    selectedShift.value = null;
}

function exportSchedule() {
    const data = JSON.stringify({ employees, shifts }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importSchedule(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const parsed = JSON.parse(ev.target.result);
            employees.splice(0, employees.length, ...parsed.employees);
            shifts.splice(0, shifts.length, ...parsed.shifts);
        } catch {
            alert('Invalid JSON');
        }
    };
    reader.readAsText(file);
}
</script>

<style scoped></style>
