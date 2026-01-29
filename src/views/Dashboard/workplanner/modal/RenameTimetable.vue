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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ref, watch } from 'vue';
import { usePocketBase } from '@/components/usePocketbase';
import { type AusschussResponse, type UsersResponse } from '@/lib/pocketbase-types';
import type { ExpandAusschuss } from '@/lib/pb';

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
    committeeId: {
        type: String,
        required: true,
    },
    currentEditors: {
        type: Array as () => string[],
        default: () => [],
    },
});

const emit = defineEmits<{
    (e: 'rename', id: string, name: string): void;
    (e: 'updateEditors', id: string, editors: string[]): void;
}>();

const open = ref(false);
const name = ref('');
const selectedEditors = ref<string[]>([]);
const committeeUsers = ref<UsersResponse[]>([]);
const isLoadingUsers = ref(false);

watch(open, async (newOpen) => {
    if (newOpen) {
        name.value = props.timetableName;
        selectedEditors.value = [...props.currentEditors];
        await fetchCommitteeUsers();
    }
});

async function fetchCommitteeUsers() {
    isLoadingUsers.value = true;
    try {
        const committee = await client.collection('ausschuss').getOne<AusschussResponse<ExpandAusschuss>>(props.committeeId, {
            expand: 'users',
        });

        if (committee.expand?.users) {
            committeeUsers.value = Array.isArray(committee.expand.users)
                ? committee.expand.users
                : [committee.expand.users];
        } else {
            committeeUsers.value = [];
        }
    } catch (error) {
        console.error('Error fetching committee users:', error);
        committeeUsers.value = [];
    } finally {
        isLoadingUsers.value = false;
    }
}

function toggleEditor(userId: string) {
    const index = selectedEditors.value.indexOf(userId);
    if (index > -1) {
        selectedEditors.value.splice(index, 1);
    } else {
        selectedEditors.value.push(userId);
    }
}

async function handleSave() {
    if (!name.value.trim()) return;
    try {
        await client.collection('timetable').update(props.timetableId, {
            name: name.value.trim(),
            editors: selectedEditors.value
        });
        emit('rename', props.timetableId, name.value.trim());
        emit('updateEditors', props.timetableId, selectedEditors.value);
        open.value = false;
    } catch (error) {
        console.error('Error updating timetable:', error);
    }
}

function handleKeyEnter() {
    handleSave();
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger asChild>
            <Button variant="outline" size="sm">Bearbeiten</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Dienstplan bearbeiten</DialogTitle>
                <DialogDescription>
                    Bearbeite den Namen und die Berechtigungen für "{{ timetableName }}".
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="timetable-name">Name des Dienstplans</Label>
                    <Input id="timetable-name" v-model="name" placeholder="z.B. Wochenend-Veranstaltung"
                        @keyup.enter="handleKeyEnter" />
                </div>

                <Separator />

                <div class="grid gap-2">
                    <Label>Bearbeiter verwalten</Label>
                    <p class="text-sm text-muted-foreground">
                        Wähle Nutzer aus, die diesen Dienstplan bearbeiten dürfen.
                    </p>
                    <div v-if="isLoadingUsers" class="flex items-center justify-center py-4">
                        <p class="text-sm text-gray-500">Lade Nutzer...</p>
                    </div>
                    <div v-else-if="committeeUsers.length === 0" class="flex items-center justify-center py-4">
                        <p class="text-sm text-gray-500">Keine Nutzer im Ausschuss gefunden</p>
                    </div>
                    <div v-else class="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                        <div v-for="user in committeeUsers" :key="user.id"
                            class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox :id="`user-${user.id}`" :checked="selectedEditors.includes(user.id)"
                                @update:checked="() => toggleEditor(user.id)" />
                            <Label :for="`user-${user.id}`" class="flex-1 cursor-pointer font-normal">
                                {{ user.name || user.email }}
                            </Label>
                        </div>
                    </div>
                    <div v-if="!isLoadingUsers" class="text-xs text-gray-500">
                        {{ selectedEditors.length }} Bearbeiter ausgewählt
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <Button @click="handleSave" :disabled="!name.trim() || isLoadingUsers">Speichern</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style lang="css" scoped></style>