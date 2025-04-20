import { ref } from "vue";
import { TransactionAuthStateOptions, TransactionTypeOptions, type AusschussRecord, type AusschussResponse, type MilestoneResponse, type TransactionAuthResponse, type TransactionResponse, type UsersRecord } from "./pocketbase-types";
import { usePocketBase } from "@/components/usePocketbase";

class pb {
    private transaction = ref<TransactionAuthResponse<ExpandTransaction>[]>([]);
    private milestone = ref<MilestoneResponse<ExpandMilestones>[]>([]);
    private client = usePocketBase();
    private static instance: pb;
    private constructor() {

    }

    public static getInstance() {
        if (!pb.instance) {
            pb.instance = new pb();
        }
        return pb.instance;
    }


    getTransaction(ausschuss: string) {
        this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({
            expand: "createdby, transaction",
            sort: "-updated", 
            filter: `transaction.ausschuss = "${ausschuss}"`
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
            const result = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `transaction.ausschuss = "${ausschuss}" && state != "${TransactionAuthStateOptions.Fehlgeschlagen}" && (transaction.type = "${TransactionTypeOptions.Eingehend}" && state = "${TransactionAuthStateOptions.Autorisiert}")`
            });

            for (const item of result) {
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
            const result = await this.client.collection("transactionAuth").getFullList<TransactionAuthResponse<ExpandTransaction>>({
                sort: "-updated",
                expand: "createdby, transaction",
                filter: `state != "${TransactionAuthStateOptions.Fehlgeschlagen}" && (transaction.type = "${TransactionTypeOptions.Eingehend}" && state = "${TransactionAuthStateOptions.Autorisiert}")`
            });

            for (const item of result) {
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
            console.log(e);
            if (e.action === 'delete') {
                this.transaction.value = this.transaction.value.filter((item) => item.id !== e.record.id);
            }else if (e.action === 'update') {
                const index = this.transaction.value.findIndex((item) => item.id === e.record.id);
                if (index !== -1) {
                    this.transaction.value[index] = e.record;
                }
            }
        }, {expand: "createdby, transaction"}).catch((error) => {
            console.error("Error subscribing to transactionAuth collection:", error);
        });

        this.client.collection('transaction').subscribe<TransactionResponse>('*', (e) => {
            console.log(e);
            if (e.action === 'delete') {

            } else if (e.action === 'update') {

            }
        });
    }

    stopSync() {
        this.client.collection('transactionAuth').unsubscribe('*');
        this.client.collection('transaction').unsubscribe('*');
    }
}

export default pb.getInstance();

type ExpandTransaction = {
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