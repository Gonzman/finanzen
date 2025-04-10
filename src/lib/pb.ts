import { ref } from "vue";
import { TransactionAuthStateOptions, type MilestoneResponse, type TransactionAuthResponse, type TransactionResponse, type UsersRecord } from "./pocketbase-types";
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
        this.client.collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({expand: "createdby, transaction", sort: "-updated", filter: `transaction.ausschuss = "${ausschuss}"`}).then((result) => {
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
                filter: `transaction.ausschuss = "${ausschuss}" && state != "${TransactionAuthStateOptions.Autorisiert}" && state != "${TransactionAuthStateOptions.Fehlgeschlagen}"`
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
                filter: `state != "${TransactionAuthStateOptions.Fehlgeschlagen}" && state != "${TransactionAuthStateOptions.Autorisiert}"`
            });

            for (const item of result) {
                budget += item.expand?.transaction.amount ?? 0;
            }
        } catch (error) {
            console.error("Error fetching budget:", error);
        }
        return budget;
    }
}

export default pb.getInstance();

type ExpandTransaction = {
    createdby: UsersRecord,
    transaction: TransactionResponse,
}

type ExpandMilestones = {
    transaction: TransactionResponse[]
  }