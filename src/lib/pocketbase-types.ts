/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export enum Collections {
    Authorigins = '_authOrigins',
    Externalauths = '_externalAuths',
    Mfas = '_mfas',
    Otps = '_otps',
    Superusers = '_superusers',
    Ausschuss = 'ausschuss',
    Budget = 'budget',
    Milestone = 'milestone',
    OverviewTransaction = 'overview_transaction',
    Transaction = 'transaction',
    TransactionAuth = 'transactionAuth',
    Users = 'users',
}

// Alias types for improved usability
export type IsoDateString = string;
export type IsoAutoDateString = string & { readonly autodate: unique symbol };
export type RecordIdString = string;
export type FileNameString = string & { readonly filename: unique symbol };
export type HTMLString = string;

type ExpandType<T> = unknown extends T
    ? T extends unknown
        ? { expand?: unknown }
        : { expand: T }
    : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
    id: RecordIdString;
    collectionId: string;
    collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
    email: string;
    emailVisibility: boolean;
    username: string;
    verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AuthoriginsRecord = {
    collectionRef: string;
    created: IsoAutoDateString;
    fingerprint: string;
    id: string;
    recordRef: string;
    updated: IsoAutoDateString;
};

export type ExternalauthsRecord = {
    collectionRef: string;
    created: IsoAutoDateString;
    id: string;
    provider: string;
    providerId: string;
    recordRef: string;
    updated: IsoAutoDateString;
};

export type MfasRecord = {
    collectionRef: string;
    created: IsoAutoDateString;
    id: string;
    method: string;
    recordRef: string;
    updated: IsoAutoDateString;
};

export type OtpsRecord = {
    collectionRef: string;
    created: IsoAutoDateString;
    id: string;
    password: string;
    recordRef: string;
    sentTo?: string;
    updated: IsoAutoDateString;
};

export type SuperusersRecord = {
    created: IsoAutoDateString;
    email: string;
    emailVisibility?: boolean;
    id: string;
    password: string;
    tokenKey: string;
    updated: IsoAutoDateString;
    verified?: boolean;
};

export type AusschussRecord = {
    chair: RecordIdString;
    created: IsoAutoDateString;
    id: string;
    name: string;
    updated: IsoAutoDateString;
    users?: RecordIdString[];
};

export type BudgetRecord<Tbudget = unknown> = {
    budget?: null | Tbudget;
    id: string;
};

export type MilestoneRecord = {
    ausschuss: RecordIdString;
    created: IsoAutoDateString;
    createdby: RecordIdString;
    id: string;
    message?: string;
    title: string;
    updated: IsoAutoDateString;
};

export enum OverviewTransactionTypeOptions {
    'Ausgehend' = 'Ausgehend',
    'Eingehend' = 'Eingehend',
}

export enum OverviewTransactionAuthStateOptions {
    'Ausstehend' = 'Ausstehend',
    'In Bearbeitung' = 'In Bearbeitung',
    'Autorisiert' = 'Autorisiert',
    'Abgeschlossen' = 'Abgeschlossen',
    'Abgelehnt' = 'Abgelehnt',
}
export type OverviewTransactionRecord = {
    accepted?: boolean;
    acceptedby?: RecordIdString[];
    amount: number;
    auth_created: IsoAutoDateString;
    auth_id?: RecordIdString;
    auth_state?: OverviewTransactionAuthStateOptions;
    auth_updated: IsoAutoDateString;
    id: string;
    message?: string;
    title: string;
    transaction_created: IsoAutoDateString;
    transaction_id?: RecordIdString;
    transaction_updated: IsoAutoDateString;
    type: OverviewTransactionTypeOptions;
    milestone_name?: string;
    ausschuss_name: string;
};

export enum TransactionTypeOptions {
    'Ausgehend' = 'Ausgehend',
    'Eingehend' = 'Eingehend',
}
export type TransactionRecord = {
    amount: number;
    ausschuss: RecordIdString;
    created: IsoAutoDateString;
    createdby: RecordIdString;
    id: string;
    message?: string;
    milestone?: RecordIdString;
    recipe?: FileNameString[];
    title: string;
    type: TransactionTypeOptions;
    updated: IsoAutoDateString;
};

export enum TransactionAuthStateOptions {
    'Ausstehend' = 'Ausstehend',
    'In Bearbeitung' = 'In Bearbeitung',
    'Autorisiert' = 'Autorisiert',
    'Abgeschlossen' = 'Abgeschlossen',
    'Abgelehnt' = 'Abgelehnt',
}
export type TransactionAuthRecord = {
    accepted?: boolean;
    acceptedby?: RecordIdString[];
    created: IsoAutoDateString;
    id: string;
    state?: TransactionAuthStateOptions;
    transaction?: RecordIdString;
    updated: IsoAutoDateString;
};

export type UsersRecord = {
    avatar?: FileNameString;
    created: IsoAutoDateString;
    email: string;
    emailVisibility?: boolean;
    id: string;
    isPruefer?: boolean;
    name?: string;
    password: string;
    tokenKey: string;
    updated: IsoAutoDateString;
    verified?: boolean;
};

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> =
    Required<AuthoriginsRecord> & BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> =
    Required<ExternalauthsRecord> & BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> &
    BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> &
    BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> &
    AuthSystemFields<Texpand>;
export type AusschussResponse<Texpand = unknown> = Required<AusschussRecord> &
    BaseSystemFields<Texpand>;
export type BudgetResponse<Tbudget = unknown, Texpand = unknown> = Required<
    BudgetRecord<Tbudget>
> &
    BaseSystemFields<Texpand>;
export type MilestoneResponse<Texpand = unknown> = Required<MilestoneRecord> &
    BaseSystemFields<Texpand>;
export type OverviewTransactionResponse<Texpand = unknown> =
    Required<OverviewTransactionRecord> & BaseSystemFields<Texpand>;
export type TransactionResponse<Texpand = unknown> =
    Required<TransactionRecord> & BaseSystemFields<Texpand>;
export type TransactionAuthResponse<Texpand = unknown> =
    Required<TransactionAuthRecord> & BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> &
    AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
    _authOrigins: AuthoriginsRecord;
    _externalAuths: ExternalauthsRecord;
    _mfas: MfasRecord;
    _otps: OtpsRecord;
    _superusers: SuperusersRecord;
    ausschuss: AusschussRecord;
    budget: BudgetRecord;
    milestone: MilestoneRecord;
    overview_transaction: OverviewTransactionRecord;
    transaction: TransactionRecord;
    transactionAuth: TransactionAuthRecord;
    users: UsersRecord;
};

export type CollectionResponses = {
    _authOrigins: AuthoriginsResponse;
    _externalAuths: ExternalauthsResponse;
    _mfas: MfasResponse;
    _otps: OtpsResponse;
    _superusers: SuperusersResponse;
    ausschuss: AusschussResponse;
    budget: BudgetResponse;
    milestone: MilestoneResponse;
    overview_transaction: OverviewTransactionResponse;
    transaction: TransactionResponse;
    transactionAuth: TransactionAuthResponse;
    users: UsersResponse;
};

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
    {
        // Omit AutoDate fields
        [K in keyof T as Extract<T[K], IsoAutoDateString> extends never
            ? K
            : never]: T[K] extends infer U // Convert FileNameString to File
            ? U extends FileNameString | FileNameString[]
                ? U extends any[]
                    ? File[]
                    : File
                : U
            : never;
    },
    'id'
>;

// Create type for Auth collections
export type CreateAuth<T> = {
    id?: RecordIdString;
    email: string;
    emailVisibility?: boolean;
    password: string;
    passwordConfirm: string;
    verified?: boolean;
} & ProcessCreateAndUpdateFields<T>;

// Create type for Base collections
export type CreateBase<T> = {
    id?: RecordIdString;
} & ProcessCreateAndUpdateFields<T>;

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
    Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
    email?: string;
    emailVisibility?: boolean;
    oldPassword?: string;
    password?: string;
    passwordConfirm?: string;
    verified?: boolean;
};

// Update type for Base collections
export type UpdateBase<T> = Partial<
    Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>;

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
    CollectionResponses[T] extends AuthSystemFields
        ? CreateAuth<CollectionRecords[T]>
        : CreateBase<CollectionRecords[T]>;

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
    CollectionResponses[T] extends AuthSystemFields
        ? UpdateAuth<CollectionRecords[T]>
        : UpdateBase<CollectionRecords[T]>;

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
    collection<T extends keyof CollectionResponses>(
        idOrName: T,
    ): RecordService<CollectionResponses[T]>;
} & PocketBase;
