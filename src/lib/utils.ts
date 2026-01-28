import { useUser } from '@/components/usePocketbase';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TransactionAuthResponse } from './pocketbase-types';
import type { ExpandTransaction } from './pb';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isUserChairOfCommittee(id: TransactionAuthResponse<ExpandTransaction>): boolean {
    if (!id.expand?.transaction?.ausschuss) return false;

    const committees = useUser().getCommitteList();
    const transactionCommittee = committees.value.find((committee) => committee.id === id.expand?.transaction.ausschuss);

    return transactionCommittee?.chair === useUser().userId;
}
