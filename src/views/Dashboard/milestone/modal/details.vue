<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, type PropType, computed } from 'vue';
import type { Team } from '@/components/dashboard/TeamSwitcher.vue';
import type { MilestoneResponse, TransactionAuthResponse, TransactionResponse } from '@/lib/pocketbase-types';
import TransactionStateIcon from '@/components/dashboard/TransactionStateIcon.vue';
import { TransactionAuthStateOptions } from '@/lib/pocketbase-types';
import MilestoneTransactionStats from '@/components/dashboard/MilestoneTransactionStats.vue';
import AddTransaction from './addTransaction.vue';
import pb, { type ExpandTransaction } from '@/lib/pb';

const props = defineProps({
    milestone: {
        type: Object as PropType<MilestoneResponse>,
        required: true,
    },
    committee: {
        type: Object as PropType<Team>,
        required: true,
    },
});

const transactions = pb.getMilestoneTransactions(props.milestone.id);
const isLoading = ref(false);

const refreshTransactions = async () => {
    isLoading.value = true;
    try {
        pb.getMilestoneTransactions(props.milestone.id);
    } catch (error) {
        console.error('Error refreshing transactions:', error);
    } finally {
        isLoading.value = false;
    }
};

const transactionObjects = computed((): TransactionAuthResponse<ExpandTransaction>[] => {
    return transactions.value.filter((t): t is TransactionAuthResponse<ExpandTransaction> =>
        t.expand?.transaction !== undefined);
});

// Calculate total amount for the milestone
const totalAmount = computed((): { konto: number; bar: number } => {
    return transactions.value.reduce(
        (total: { konto: number; bar: number }, transaction: TransactionAuthResponse<ExpandTransaction>) => {
            return {
                konto: total.konto + (transaction.expand?.transaction?.amount || 0),
                bar: total.bar + (transaction.expand?.transaction?.amount_bar || 0)
            };
        },
        { konto: 0, bar: 0 }
    );
});

// Calculate sum of incoming (positive) values
const incomingAmount = computed((): { konto: number; bar: number } => {
    return transactions.value.reduce(
        (total: { konto: number; bar: number }, transaction: TransactionAuthResponse<ExpandTransaction>) => {
            const amount = transaction.expand?.transaction?.amount || 0;
            const amountBar = transaction.expand?.transaction?.amount_bar || 0;
            return {
                konto: total.konto + (amount > 0 ? amount : 0),
                bar: total.bar + (amountBar > 0 ? amountBar : 0)
            };
        },
        { konto: 0, bar: 0 }
    );
});

// Calculate sum of outgoing (negative) values
const outgoingAmount = computed((): { konto: number; bar: number } => {
    return transactions.value.reduce(
        (total: { konto: number; bar: number }, transaction: TransactionAuthResponse<ExpandTransaction>) => {
            const amount = transaction.expand?.transaction?.amount || 0;
            const amountBar = transaction.expand?.transaction?.amount_bar || 0;
            return {
                konto: total.konto + (amount < 0 ? amount : 0),
                bar: total.bar + (amountBar < 0 ? amountBar : 0)
            };
        },
        { konto: 0, bar: 0 }
    );
});

</script>

<template>
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" class="text-left w-full justify-start">
                Details anzeigen
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[700px]">
            <DialogHeader>
                <DialogTitle>{{ props.milestone.title }}</DialogTitle>
                <DialogDescription v-if="props.milestone.message">
                    {{ props.milestone.message }}
                </DialogDescription>
            </DialogHeader>

            <div class="py-4">
                <!-- Milestone Stats -->
                <div class="mb-4 p-4 bg-muted rounded-md">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <div class="text-sm text-muted-foreground">Erstellt am</div>
                            <div class="font-medium">{{ new Date(props.milestone.created).toLocaleDateString() }}</div>
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">Anzahl Transaktionen</div>
                            <div class="font-medium">{{ transactions.length }}</div>
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">Summe Konto</div>
                            <div class="font-medium" :class="totalAmount.konto < 0 ? 'text-red-500' : 'text-green-500'">
                                {{ totalAmount.konto.toFixed(2) }} €
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">Summe Bar</div>
                            <div class="font-medium" :class="totalAmount.bar < 0 ? 'text-red-500' : 'text-green-500'">
                                {{ totalAmount.bar.toFixed(2) }} €
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">Einnahmen</div>
                            <div class="font-medium text-green-500">
                                {{ (incomingAmount.konto + incomingAmount.bar).toFixed(2) }} €
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">Ausgaben</div>
                            <div class="font-medium text-red-500">
                                {{ (outgoingAmount.konto + outgoingAmount.bar).toFixed(2) }} €
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="text-sm text-muted-foreground mb-1">Status</div>
                        <MilestoneTransactionStats :milestoneId="props.milestone.id"
                            :transactions="transactionObjects.map(t => t.expand!.transaction)" />
                    </div>
                </div>

                <!-- Transactions Table -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-medium">Transaktionen</h3>
                        <AddTransaction :milestone="props.milestone" :committee="props.committee"
                            @transaction-added="refreshTransactions" />
                    </div>

                    <div v-if="isLoading" class="py-4 text-center">
                        Lade Transaktionen...
                    </div>
                    <div v-else-if="transactions.length > 0">
                        <div class="border rounded-md">
                            <div class="grid grid-cols-[1fr_auto_auto] bg-muted py-2 px-3 text-sm font-medium">
                                <div>Details</div>
                                <div class="text-right">Betrag</div>
                            </div>
                            <ScrollArea class="h-[300px]">
                                <div class="divide-y">
                                    <div v-for="transaction in transactions" :key="transaction.id" class="p-3">
                                        <div class="grid grid-cols-[1fr_auto_auto] items-center mb-2">
                                            <div>
                                                <div class="font-medium">{{ transaction.expand?.transaction?.title ||
                                                    'Unbenannt' }}</div>
                                                <div class="text-xs text-muted-foreground">{{ new
                                                    Date(transaction.created).toLocaleString() }}</div>
                                            </div>
                                            <div class="px-4 text-center">
                                                <div class="flex items-center gap-1 justify-center">
                                                    <TransactionStateIcon
                                                        :state="transaction.state || TransactionAuthStateOptions.Ausstehend"
                                                        :size="14" />
                                                    <span class="text-sm">
                                                        {{ transaction.state || TransactionAuthStateOptions.Ausstehend
                                                        }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div v-if="transaction.expand?.transaction" class="text-right font-medium">
                                                <div
                                                    :class="(transaction.expand.transaction.amount || 0) < 0 ? 'text-red-500' : 'text-green-500'">
                                                    K: {{ (transaction.expand.transaction.amount || 0).toFixed(2) }} €
                                                </div>
                                                <div
                                                    :class="(transaction.expand.transaction.amount_bar || 0) < 0 ? 'text-red-500' : 'text-green-500'">
                                                    B: {{ (transaction.expand.transaction.amount_bar || 0).toFixed(2) }}
                                                    €
                                                </div>
                                                <div class="text-xs text-muted-foreground">{{
                                                    transaction.expand.transaction.type }}</div>
                                            </div>
                                        </div>
                                        <div v-if="transaction.expand?.transaction?.message"
                                            class="mt-1 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                                            {{ transaction.expand.transaction.message }}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    <div v-else class="py-4 text-center text-muted-foreground border rounded-md">
                        Keine Transaktionen für diesen Meilenstein.
                    </div>
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