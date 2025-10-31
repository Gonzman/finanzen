<script setup lang="ts">
import { cn } from '@/lib/utils';
import { ref, watch } from 'vue';
import { CaretSortIcon, CheckIcon } from '@radix-icons/vue';

import Dialog from '../ui/dialog/Dialog.vue';
import Popover from '../ui/popover/Popover.vue';
import PopoverTrigger from '../ui/popover/PopoverTrigger.vue';
import Button from '../ui/button/Button.vue';
import Avatar from '../ui/avatar/Avatar.vue';
import AvatarImage from '../ui/avatar/AvatarImage.vue';
import AvatarFallback from '../ui/avatar/AvatarFallback.vue';
import PopoverContent from '../ui/popover/PopoverContent.vue';
import Command from '../ui/command/Command.vue';
import CommandList from '../ui/command/CommandList.vue';
import CommandInput from '../ui/command/CommandInput.vue';
import CommandEmpty from '../ui/command/CommandEmpty.vue';
import CommandGroup from '../ui/command/CommandGroup.vue';
import CommandItem from '../ui/command/CommandItem.vue';

import { useUser } from '../usePocketbase';

const user = useUser();

// Ensure commiteList has a fallback value
const commiteList = user.getCommitteList();
console.log('commiteList', commiteList);

// Use ref for groups.teams
const groups = ref({
    label: 'Gremien',
    teams: commiteList.value ?? [], // Fallback to an empty array
});

const selectedTeam = defineModel({
    default: null as Team | null,
});

export type Team = (typeof groups.value.teams)[number];

// Initialize selectedTeam with a fallback
const open = ref(false);
const showNewTeamDialog = ref(false);

// Helper functions for localStorage
const saveSelectedTeamToStorage = (team: Team | null) => {
    if (team) {
        localStorage.setItem('selectedTeam', JSON.stringify(team));
    } else {
        localStorage.removeItem('selectedTeam');
    }
};

const loadSelectedTeamFromStorage = (): Team | null => {
    try {
        const savedTeam = localStorage.getItem('selectedTeam');
        if (savedTeam) {
            const parsedTeam = JSON.parse(savedTeam);
            // Verify that the saved team still exists in the current teams list
            const teamExists = groups.value.teams.find(team => team.id === parsedTeam.id);
            return teamExists || null;
        }
    } catch (error) {
        console.error('Error loading selected team from localStorage:', error);
        localStorage.removeItem('selectedTeam');
    }
    return null;
};

// Watch for changes in selectedTeam and save to localStorage
watch(selectedTeam, (newTeam) => {
    saveSelectedTeamToStorage(newTeam);
}, { deep: true });

const intervall = setInterval(() => {
    // First try to load from localStorage
    if (selectedTeam.value === null) {
        const savedTeam = loadSelectedTeamFromStorage();
        if (savedTeam) {
            selectedTeam.value = savedTeam;
        } else if (groups.value.teams.length > 0) {
            // Only set default if no saved team and teams are available
            selectedTeam.value = groups.value.teams[0] || null;
        }
    }

    if (selectedTeam.value !== null) {
        clearInterval(intervall);
    }
}, 100);



</script>

<template>
    <Dialog v-model:open="showNewTeamDialog">
        <Popover v-model:open="open">
            <PopoverTrigger as-child>
                <Button variant="outline" role="combobox" aria-expanded="open" aria-label="Select a team"
                    :class="cn('w-[200px] justify-between', $attrs.class ?? '')">
                    <template v-if="selectedTeam">
                        <Avatar class="mr-2 h-5 w-5">
                            <AvatarImage :src="`https://avatar.vercel.sh/${selectedTeam.id}.png`"
                                :alt="selectedTeam.name ?? 'wait'" />
                            <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                        {{ selectedTeam.name ?? 'Select a team' }}
                    </template>
                    <template v-else>
                        <span>Gremium auswählen</span>
                    </template>
                    <CaretSortIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Nach Grämien suchen" />
                        <CommandEmpty>Gremium nicht gefunden.</CommandEmpty>
                        <CommandGroup :heading="groups.label">
                            <CommandItem v-for="team in groups.teams" :key="team.id" :value="team" class="text-sm"
                                @select="
                                    () => {
                                        selectedTeam = team; // Correctly update the ref's value
                                        open = false; // Close the popover immediately
                                    }
                                ">
                                <Avatar class="mr-2 h-5 w-5">
                                    <AvatarImage :src="`https://avatar.vercel.sh/${team.id}.png`" :alt="team.name"
                                        :class="selectedTeam?.id === team.id
                                            ? ''
                                            : 'grayscale'
                                            " />
                                    <AvatarFallback>SC</AvatarFallback>
                                </Avatar>
                                {{ team.name }}
                                <CheckIcon :class="cn(
                                    'ml-auto h-4 w-4',
                                    selectedTeam?.id === team.id
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                )
                                    " />
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </Dialog>
</template>
