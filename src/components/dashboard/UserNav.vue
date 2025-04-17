<script setup lang="ts">
import Avatar from '../ui/avatar/Avatar.vue';
import AvatarFallback from '../ui/avatar/AvatarFallback.vue';
import AvatarImage from '../ui/avatar/AvatarImage.vue';
import Button from '../ui/button/Button.vue';
import DropdownMenu from '../ui/dropdown-menu/DropdownMenu.vue';
import DropdownMenuContent from '../ui/dropdown-menu/DropdownMenuContent.vue';
import DropdownMenuItem from '../ui/dropdown-menu/DropdownMenuItem.vue';
import DropdownMenuLabel from '../ui/dropdown-menu/DropdownMenuLabel.vue';
import DropdownMenuSeparator from '../ui/dropdown-menu/DropdownMenuSeparator.vue';
import DropdownMenuTrigger from '../ui/dropdown-menu/DropdownMenuTrigger.vue';
import { useUser } from '../usePocketbase';
const user = useUser();
//      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                    <AvatarImage
                        :src="user.getUserImage() ?? ''"
                        alt="@shadcn"
                    />
                    <AvatarFallback>{{ user.getShortName() }}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel class="font-normal flex">
                <div class="flex flex-col space-y-1">
                    <p class="text-sm font-medium leading-none">
                        {{ user.getUserName() }}
                    </p>
                    <p class="text-xs leading-none text-muted-foreground">
                        {{ user.getUserEmail() }}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="user.logout()">
                Log out
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
