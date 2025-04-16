<template>
     <Dialog>
    <DialogTrigger asChild>
    <Button variant="ghost" class="text-left w-fulls justify-start">
        Prüfen
    </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
        <DialogTitle>Prüfen</DialogTitle>
        <DialogDescription>
        Hier kann der Prüfstatus der Transaktion geändert werden.
        </DialogDescription>
    </DialogHeader>
    <div>
        <Select :defaultValue="id.state" class="w-full" v-model="state">
            <SelectTrigger>
                <SelectValue :value="id.state" :placeholder="id.state" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem 
                        v-for="option in TransactionAuthStateOptions" 
                        :key="option" 
                        :value="option" 
                        :selected="option === id.state"
                    >
                        {{ option }}
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>

        <div class="flex items-center space-x-2 pt-4">
            <p>Autoresieren? <Switch v-model="auth" /></p>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
            <DialogClose as-child>
                <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <DialogClose as-child>
                <Button
                    :disabled="state === id.state && auth === props.id.acceptedby.includes(useUser().userId)"
                    @click="pruefen"
                >
                    Bestätigen
                </Button>
            </DialogClose>
        </div>
    </div>
    </DialogContent>
</Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ref, type PropType } from 'vue';
import { TransactionAuthStateOptions, type TransactionAuthResponse } from '@/lib/pocketbase-types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePocketBase, useUser } from '@/components/usePocketbase';
import Switch from '@/components/ui/switch/Switch.vue';
const props = defineProps({
    id: {
        type: Object as PropType<TransactionAuthResponse>,
        required: true,
    },
});

const state = ref(props.id.state);
const auth = ref(props.id.acceptedby.includes(useUser().userId));


function pruefen(){

    let stateT = state.value;

    if (auth.value && state.value === TransactionAuthStateOptions['In Bearbeitung']) {
        stateT = TransactionAuthStateOptions['In Bearbeitung'];
    }

    if(!auth.value && state.value === TransactionAuthStateOptions['Autorisiert']){
        auth.value = true;
    }
    let data;
    if(auth.value){
        data = {
            id: props.id.id,
            state: stateT,
            "acceptedby+": useUser().userId,
        };
    }else{
        data = {
            id: props.id.id,
            state: stateT,
            "acceptedby-": useUser().userId,
        };
    }
    
    const pb = usePocketBase();

    pb.collection('transactionAuth').update(props.id.id, data)
        .then(() => {
            // Handle success
            console.log('Transaction updated successfully');
        })
        .catch((error) => {
            // Handle error
            console.error('Error updating transaction:', error);
        });


    
}
</script>