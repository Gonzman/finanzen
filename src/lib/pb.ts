import { ref } from "vue";
import { TransactionAuthStateOptions, type AusschussResponse, type MilestoneResponse, type TransactionAuthResponse, type TransactionResponse, type UsersRecord } from "./pocketbase-types";
import { usePocketBase } from "@/components/usePocketbase";

class pb {
    private transaction = ref<TransactionAuthResponse<ExpandTransaction>[]>([]);
    private milestone = ref<MilestoneResponse<ExpandMilestones>[]>([]);
    private client = usePocketBase();
    private static instance: pb;
    private constructor() {
        this.startSync();
    }

    public static getInstance() {
        if (!pb.instance) {
            pb.instance = new pb();
        }
        return pb.instance;
    }

    // Get the current ausschuss filter from the transaction data if available
    private getCurrentAusschuss(): string | null {
        if (this.transaction.value.length > 0 && this.transaction.value[0].expand?.transaction?.ausschuss) {
            return this.transaction.value[0].expand.transaction.ausschuss;
        }
        return null;
    }

    // Refresh transactions with the current filter
    refreshTransactions(ausschuss?: string) {
        // If we have a current filter (ausschuss), use it
        const currentAusschuss = ausschuss || this.getCurrentAusschuss();
        
        if (currentAusschuss) {
            return this.getTransaction(currentAusschuss);
        } else {
            // If no specific ausschuss, fetch all transactions
            return this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
                expand: "createdby, transaction",
                sort: "-updated"
            }).then((result) => {
                this.transaction.value = result;
                return this.transaction;
            });
        }
    }
    
    // Refresh milestones with the current filter
    refreshMilestones(ausschuss?: string) {
        // If we have a current filter (ausschuss), use it
        const currentAusschuss = ausschuss || this.getCurrentAusschuss();
        
        if (currentAusschuss) {
            return this.getMilestone(currentAusschuss);
        } else {
            // If no specific ausschuss, fetch all milestones
            return this.client.collection('milestone').getFullList<MilestoneResponse<ExpandMilestones>>({
                expand: "transaction",
                sort: "-updated"
            }).then((result) => {
                this.milestone.value = result;
                return this.milestone;
            });
        }
    }

    getTransaction(ausschuss: string) {
        this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
            expand: "createdby, transaction ",
            sort: "-updated", 
            filter: `transaction.ausschuss = "${ausschuss}"`
        }).then((result) => {
            this.transaction.value = result    
        });
        return this.transaction;
    }

    // New method to get transactions for a specific milestone
    getMilestoneTransactions(milestoneId: string) {
        this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
            expand: "createdby, transaction",
            sort: "-updated", 
            filter: `transaction.milestone = "${milestoneId}"`
        }).then((result) => {
            this.transaction.value = result    
        });
        return this.transaction;
    }

    getMilestone(ausschuss: string) {
        this.client.collection('milestone').getFullList<MilestoneResponse<ExpandMilestones>>({expand: "transaction", sort: "-updated", filter: `ausschuss = "${ausschuss}"`}).then((result) => {
            this.milestone.value = result    
        });
        return this.milestone;
    }

    async getBudget(ausschuss: string): Promise<number> {
        let budget = 0;
        try {
            // Get all authorized transactions
            const authorizedResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `transaction.ausschuss = "${ausschuss}" && state != "${TransactionAuthStateOptions.Fehlgeschlagen}" && state = "${TransactionAuthStateOptions.Autorisiert}"`
            });

            // Simply add all authorized transaction amounts (they already have the correct sign)
            for (const item of authorizedResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
            
            // Get all "In Bearbeitung" transactions
            const inProgressResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `transaction.ausschuss = "${ausschuss}" && state = "${TransactionAuthStateOptions["In Bearbeitung"]}"`
            });

            // Add all "In Bearbeitung" transaction amounts (they already have the correct sign)
            for (const item of inProgressResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
        } catch (error) {
            console.error("Error fetching budget:", error);
        }
        return budget;
    }

    async overAllBudget(): Promise<number> {
        let budget = 0;
        try {
            // Get all authorized transactions
            const authorizedResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `state != "${TransactionAuthStateOptions.Fehlgeschlagen}" && state = "${TransactionAuthStateOptions.Autorisiert}"`
            });

            // Simply add all authorized transaction amounts (they already have the correct sign)
            for (const item of authorizedResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
            
            // Get all "In Bearbeitung" transactions
            const inProgressResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `state = "${TransactionAuthStateOptions["In Bearbeitung"]}"`
            });

            // Add all "In Bearbeitung" transaction amounts (they already have the correct sign)
            for (const item of inProgressResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
        } catch (error) {
            console.error("Error fetching budget:", error);
        }
        return budget;
    }

    startSync() {
        if (!this.client.authStore.isValid) {
            console.error("User is not authenticated");
            return;
        }

       this.client.collection('transactionAuth').subscribe<TransactionAuthResponse<ExpandTransaction>>('*', (e) => {
            console.log('Transaction Auth update:', e);
            if (e.action === 'delete') {
                this.transaction.value = this.transaction.value.filter((item) => item.id !== e.record.id);
            } else if (e.action === 'update') {
                const index = this.transaction.value.findIndex((item) => item.id === e.record.id);
                if (index !== -1) {
                    // Update the record with the new data directly from subscription
                    this.transaction.value[index] = e.record;
                } else {
                    // If the record matches our current filter (if any), add it
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.expand?.transaction?.ausschuss === currentAusschuss)) {
                        this.transaction.value.push(e.record);
                    }
                }
            } else if (e.action === 'create') {
                // Check if the transaction already exists in our array
                const exists = this.transaction.value.some(item => item.id === e.record.id);
                
                // Only add if it doesn't already exist and matches our current filter (if any)
                if (!exists) {
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.expand?.transaction?.ausschuss === currentAusschuss)) {
                        this.transaction.value.push(e.record);
                        // Sort the array to maintain the ordering
                        this.transaction.value.sort((a, b) => 
                            new Date(b.updated).getTime() - new Date(a.updated).getTime()
                        );
                    }
                }
            }
        }, {expand: "createdby, transaction"}).catch((error) => {
            console.error("Error subscribing to transactionAuth collection:", error);
        });

        this.client.collection('transaction').subscribe<TransactionResponse>('*', (e) => {
            console.log('Transaction update:', e);
            if (e.action === 'delete') {
                // Remove any transactionAuth records that reference this transaction
                // This is more efficient than refetching everything
                this.transaction.value = this.transaction.value.filter(
                    item => item.expand?.transaction?.id !== e.record.id
                );
            } else if (e.action === 'update') {
                // Update transaction data in any transactionAuth records that reference it
                for (let i = 0; i < this.transaction.value.length; i++) {
                    if (this.transaction.value[i].expand?.transaction?.id === e.record.id) {
                        // Update the transaction data directly
                        if (this.transaction.value[i].expand) {
                            this.transaction.value[i].expand!.transaction = e.record;
                        }
                    }
                }
            }
            // No need to handle 'create' for base transaction as it doesn't appear in lists until
            // a transactionAuth record references it
        });
        
        this.client.collection('milestone').subscribe<MilestoneResponse<ExpandMilestones>>('*', (e) => {
            console.log('Milestone update:', e);
            if (e.action === 'delete') {
                this.milestone.value = this.milestone.value.filter((item) => item.id !== e.record.id);
            } else if (e.action === 'update') {
                const index = this.milestone.value.findIndex((item) => item.id === e.record.id);
                if (index !== -1) {
                    this.milestone.value[index] = e.record;
                } else {
                    // If the record matches our current filter (if any), add it
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.ausschuss === currentAusschuss)) {
                        this.milestone.value.push(e.record);
                    }
                }
            } else if (e.action === 'create') {
                // Check if the milestone already exists in our array
                const exists = this.milestone.value.some(item => item.id === e.record.id);
                
                // Only add if it doesn't already exist and matches our current filter (if any)
                if (!exists) {
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.ausschuss === currentAusschuss)) {
                        this.milestone.value.push(e.record);
                        // Sort the array to maintain the ordering
                        this.milestone.value.sort((a, b) => 
                            new Date(b.updated).getTime() - new Date(a.updated).getTime()
                        );
                    }
                }
            }
        }, {expand: "transaction"}).catch((error) => {
            console.error("Error subscribing to milestone collection:", error);
        });
    }

    stopSync() {
        this.client.collection('transactionAuth').unsubscribe('*');
        this.client.collection('transaction').unsubscribe('*');
        this.client.collection('milestone').unsubscribe('*');
    }
}

export default pb.getInstance();

export type ExpandTransaction = {
    createdby: UsersRecord,
    transaction: TransactionResponse,
    milestone: MilestoneResponse,
}

type ExpandTransactionCommittee = {
    ausschuss: AusschussResponse,
} 

type ExpandMilestones = {
    transaction: TransactionResponse[]
  }