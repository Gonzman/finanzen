import { ref } from "vue";
import type { MilestoneResponse, TransactionAuthResponse, TransactionResponse, UsersRecord } from "./pocketbase-types";
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
        usePocketBase().collection('transactionAuth').getFullList<TransactionAuthResponse<ExpandTransaction>>({expand: "createdby, transaction", sort: "-updated", filter: `transaction.ausschuss = "${ausschuss}"`}).then((result) => {
            this.transaction.value = result    
        });
        return this.transaction;
    }

    getMilestone(ausschuss: string) {
        usePocketBase().collection('milestone').getFullList<MilestoneResponse<ExpandMilestones>>({expand: "transaction", sort: "-updated", filter: `ausschuss = "${ausschuss}"`}).then((result) => {
            this.milestone.value = result    
        });
        return this.milestone;
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