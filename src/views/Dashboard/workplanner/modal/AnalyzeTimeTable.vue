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
import { ref, computed } from 'vue';
import { usePocketBase } from '@/components/usePocketbase';
import type { TimetableResponse } from '@/lib/pocketbase-types';
import type { ExpandTimeTable } from '@/lib/pb';

const client = usePocketBase();

const prop = defineProps<{ timetables: TimetableResponse<ExpandTimeTable>[] }>();

const emit = defineEmits<{
    (e: 'rename', id: string, name: string): void;
}>();

const open = ref(false);
const name = ref('');

// Calculate shift duration in hours
const calculateShiftDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;

    return (endInMinutes - startInMinutes) / 60;
};

// Analyze which person did the most shifts
const personShiftStats = computed(() => {
    const shiftCounts = new Map<string, { name: string; count: number; totalHours: number; shifts: any[] }>();

    prop.timetables.forEach((timetable) => {
        const shifts = timetable.expand?.shift_via_timetable || [];

        shifts.forEach((shift) => {
            const people = shift.expand?.people || [];
            const duration = calculateShiftDuration(shift.startTime, shift.endTime);

            people.forEach((person) => {
                if (!shiftCounts.has(person.id)) {
                    shiftCounts.set(person.id, {
                        name: person.name,
                        count: 0,
                        totalHours: 0,
                        shifts: []
                    });
                }

                const stats = shiftCounts.get(person.id)!;
                stats.count++;
                stats.totalHours += duration;
                stats.shifts.push({
                    date: shift.date,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    duration: duration,
                    purpose: shift.purpose
                });
            });
        });
    });

    // Convert to array and sort by count (descending)
    return Array.from(shiftCounts.values())
        .sort((a, b) => b.count - a.count);
});

const totalShifts = computed(() => {
    return prop.timetables.reduce((total, timetable) => {
        return total + (timetable.expand?.shift_via_timetable?.length || 0);
    }, 0);
});

</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger asChild>
            <Button variant="outline" size="sm">Analysieren</Button>
        </DialogTrigger>
        <DialogContent size="7xl">
            <DialogHeader>
                <DialogTitle>Schichtanalyse</DialogTitle>
                <DialogDescription>
                    Übersicht über die Schichtverteilung nach Personen
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="mb-4">
                    <p class="text-sm text-muted-foreground">
                        Gesamt Schichten: <strong>{{ totalShifts }}</strong>
                    </p>
                </div>

                <div v-if="personShiftStats.length > 0" class="space-y-4">
                    <div class="rounded-lg border">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b bg-muted/50">
                                        <th class="px-4 py-3 text-left text-sm font-medium">Rang</th>
                                        <th class="px-4 py-3 text-left text-sm font-medium">Person</th>
                                        <th class="px-4 py-3 text-right text-sm font-medium">Anzahl Schichten</th>
                                        <th class="px-4 py-3 text-right text-sm font-medium">Gesamt Stunden</th>
                                        <th class="px-4 py-3 text-right text-sm font-medium">Ø Stunden/Schicht</th>
                                        <th class="px-4 py-3 text-right text-sm font-medium">Prozent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(person, index) in personShiftStats" :key="person.name"
                                        class="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                        :class="{ 'bg-yellow-50 dark:bg-yellow-950/20': index === 0 }">
                                        <td class="px-4 py-3 text-sm">
                                            <span v-if="index === 0"
                                                class="font-bold text-yellow-600 dark:text-yellow-400">🏆 {{ index + 1
                                                }}</span>
                                            <span v-else-if="index === 1" class="font-semibold text-gray-500">🥈 {{
                                                index + 1 }}</span>
                                            <span v-else-if="index === 2"
                                                class="font-semibold text-orange-600 dark:text-orange-400">🥉 {{ index +
                                                1 }}</span>
                                            <span v-else class="text-muted-foreground">{{ index + 1 }}</span>
                                        </td>
                                        <td class="px-4 py-3 text-sm font-medium">
                                            {{ person.name }}
                                        </td>
                                        <td class="px-4 py-3 text-right text-sm font-semibold">
                                            {{ person.count }}
                                        </td>
                                        <td class="px-4 py-3 text-right text-sm font-semibold">
                                            {{ person.totalHours.toFixed(1) }}h
                                        </td>
                                        <td class="px-4 py-3 text-right text-sm text-muted-foreground">
                                            {{ (person.totalHours / person.count).toFixed(1) }}h
                                        </td>
                                        <td class="px-4 py-3 text-right text-sm text-muted-foreground">
                                            {{ ((person.count / totalShifts) * 100).toFixed(1) }}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Top Performer Highlight -->
                    <div v-if="personShiftStats[0]"
                        class="rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4">
                        <h3 class="font-semibold text-lg mb-2">🏆 Top Performer</h3>
                        <p class="text-sm">
                            <strong>{{ personShiftStats[0].name }}</strong> hat die meisten Schichten übernommen mit
                            <strong>{{ personShiftStats[0].count }} Schichten</strong>
                            ({{ ((personShiftStats[0].count / totalShifts) * 100).toFixed(1) }}% aller Schichten)
                            und insgesamt <strong>{{ personShiftStats[0].totalHours.toFixed(1) }} Stunden</strong>
                            gearbeitet.
                        </p>
                    </div>
                </div>

                <div v-else class="text-center py-8 text-muted-foreground">
                    Keine Schichtdaten vorhanden
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Schließen</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style lang="css" scoped></style>