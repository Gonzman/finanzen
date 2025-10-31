import { TransactionTypeOptions } from '@/lib/pocketbase-types';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

const formatTransaction = (amount: number, type: string) => {
    const isIncoming = type === TransactionTypeOptions.Eingehend;
    const formattedAmount = formatCurrency(amount);

    const shortDisplay = isIncoming ? `+${amount}€` : `-${amount}€`;

    return {
        shortDisplay,
        formattedAmount,
        bgColor: isIncoming ? 'bg-green-100' : 'bg-red-100',
        textColor: isIncoming ? 'text-green-700' : 'text-red-700',
        isIncoming,
    };
};

export { formatCurrency, formatTransaction };
