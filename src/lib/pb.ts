import { ref } from "vue";
import { Collections, TransactionAuthStateOptions, TransactionTypeOptions, type AusschussResponse, type CollectionRecords, type MilestoneResponse, type TransactionAuthResponse, type TransactionResponse, type UsersResponse } from "./pocketbase-types";
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

    private getCurrentAusschuss(): string | null {
        if (this.transaction.value.length > 0 && this.transaction.value[0].expand?.transaction?.ausschuss) {
            return this.transaction.value[0].expand.transaction.ausschuss;
        }
        return null;
    }

    refreshTransactions(ausschuss?: string) {
        const currentAusschuss = ausschuss || this.getCurrentAusschuss();
        
        if (currentAusschuss) {
            return this.getTransaction(currentAusschuss);
        } else {
            return this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
                expand: "transaction, transaction.createdby",
                sort: "-updated"
            }).then((result) => {
                this.transaction.value = result;
                return this.transaction;
            });
        }
    }
    
    refreshMilestones(ausschuss?: string) {
        const currentAusschuss = ausschuss || this.getCurrentAusschuss();
        
        if (currentAusschuss) {
            return this.getMilestone(currentAusschuss);
        } else {
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
            expand: "transaction, transaction.createdby, transaction.milestone",
            sort: "-updated", 
            filter: `transaction.ausschuss = "${ausschuss}"`
        }).then((result) => {
            this.transaction.value = result    
        });
        return this.transaction;
    }

    getMilestoneTransactions(milestoneId: string) {
        this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
            expand: "transaction, transaction.createdby",
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
            const authorizedResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "transaction, transaction.createdby",
                filter: `transaction.ausschuss = "${ausschuss}" && state != "${TransactionAuthStateOptions.Abgelehnt}" && state = "${TransactionAuthStateOptions.Autorisiert}"`
            });

            for (const item of authorizedResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
            
            const inProgressResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "transaction, transaction.createdby",
                filter: `transaction.ausschuss = "${ausschuss}" && state = "${TransactionAuthStateOptions["In Bearbeitung"]}" && type = "${TransactionTypeOptions.Ausgehend}"`
            });

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
            const authorizedResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "transaction, transaction.createdby",
                filter: `state != "${TransactionAuthStateOptions.Abgelehnt}" && state = "${TransactionAuthStateOptions.Autorisiert}"`
            });

            for (const item of authorizedResult) {
                budget += item.expand?.transaction.amount ?? 0;
            }
            
            const inProgressResult = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "transaction, transaction.createdby",
                filter: `state = "${TransactionAuthStateOptions["In Bearbeitung"]} && type = "${TransactionTypeOptions.Ausgehend}""`
            });

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
                    this.transaction.value[index] = e.record;
                } else {
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.expand?.transaction?.ausschuss === currentAusschuss)) {
                        this.transaction.value.push(e.record);
                    }
                }
            } else if (e.action === 'create') {
                const exists = this.transaction.value.some(item => item.id === e.record.id);
                
                if (!exists) {
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.expand?.transaction?.ausschuss === currentAusschuss)) {
                        this.transaction.value.push(e.record);
                        this.transaction.value.sort((a, b) => 
                            new Date(b.updated).getTime() - new Date(a.updated).getTime()
                        );
                    }
                }
            }
        }, {expand: "transaction.createdby, transaction, transaction.milestone"}).catch((error) => {
            console.error("Error subscribing to transactionAuth collection:", error);
        });

        this.client.collection('transaction').subscribe<TransactionResponse>('*', (e) => {
            console.log('Transaction update:', e);
            if (e.action === 'delete') {
                this.transaction.value = this.transaction.value.filter(
                    item => item.expand?.transaction?.id !== e.record.id
                );
            } else if (e.action === 'update') {
                for (let i = 0; i < this.transaction.value.length; i++) {
                    if (this.transaction.value[i].expand?.transaction?.id === e.record.id) {
                        if (this.transaction.value[i].expand) {
                            this.transaction.value[i].expand!.transaction = e.record as TransactionResponse<ExpandTransactionMilestone>;
                        }
                    }
                }
            }
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
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.ausschuss === currentAusschuss)) {
                        this.milestone.value.push(e.record);
                    }
                }
            } else if (e.action === 'create') {
                const exists = this.milestone.value.some(item => item.id === e.record.id);
                
                if (!exists) {
                    const currentAusschuss = this.getCurrentAusschuss();
                    if (!currentAusschuss || (e.record.ausschuss === currentAusschuss)) {
                        this.milestone.value.push(e.record);
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
    async getFileFromUrl(record: TransactionResponse<unknown>, file:string) {
        const token = await usePocketBase().files.getToken();
        return window.open(usePocketBase().files.getURL(record, file, {token: token}), '_blank');
    }
}

export default pb.getInstance();

export type ExpandTransaction = {
    transaction: TransactionResponse<ExpandTransactionMilestone>,
}

export type ExpandTransactionMilestone = {
    milestone: MilestoneResponse,
    createdby: UsersResponse,
}


type ExpandTransactionCommittee = {
    ausschuss: AusschussResponse,
} 

type ExpandMilestones = {
    transaction: TransactionResponse[]
  }