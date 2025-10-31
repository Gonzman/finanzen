/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Ausschuss = "ausschuss",
	Budget = "budget",
	Milestone = "milestone",
	Transaction = "transaction",
	TransactionAuth = "transactionAuth",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type AusschussRecord = {
	chair: RecordIdString
	created?: IsoDateString
	id: string
	name: string
	updated?: IsoDateString
	users?: RecordIdString[]
}

export type BudgetRecord<Tbudget = unknown> = {
	budget?: null | Tbudget
	id: string
}

export type MilestoneRecord = {
	ausschuss: RecordIdString
	created?: IsoDateString
	createdby: RecordIdString
	id: string
	message?: string
	title: string
	updated?: IsoDateString
}

export enum TransactionTypeOptions {
	"Ausgehend" = "Ausgehend",
	"Eingehend" = "Eingehend",
}
export type TransactionRecord = {
	amount: number
	ausschuss: RecordIdString
	created?: IsoDateString
	createdby: RecordIdString
	id: string
	message?: string
	milestone?: RecordIdString
	recipe?: string[]
	title: string
	type: TransactionTypeOptions
	updated?: IsoDateString
}

export enum TransactionAuthStateOptions {
	"Ausstehend" = "Ausstehend",
	"In Bearbeitung" = "In Bearbeitung",
	"Autorisiert" = "Autorisiert",
	"Abgeschlossen" = "Abgeschlossen",
	"Abgelehnt" = "Abgelehnt",
}
export type TransactionAuthRecord = {
	accepted?: boolean
	acceptedby?: RecordIdString[]
	created?: IsoDateString
	id: string
	state?: TransactionAuthStateOptions
	transaction?: RecordIdString
	updated?: IsoDateString
}

export type UsersRecord = {
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	isPruefer?: boolean
	isVerifed?: boolean
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AusschussResponse<Texpand = unknown> = Required<AusschussRecord> & BaseSystemFields<Texpand>
export type BudgetResponse<Tbudget = unknown, Texpand = unknown> = Required<BudgetRecord<Tbudget>> & BaseSystemFields<Texpand>
export type MilestoneResponse<Texpand = unknown> = Required<MilestoneRecord> & BaseSystemFields<Texpand>
export type TransactionResponse<Texpand = unknown> = Required<TransactionRecord> & BaseSystemFields<Texpand>
export type TransactionAuthResponse<Texpand = unknown> = Required<TransactionAuthRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	ausschuss: AusschussRecord
	budget: BudgetRecord
	milestone: MilestoneRecord
	transaction: TransactionRecord
	transactionAuth: TransactionAuthRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	ausschuss: AusschussResponse
	budget: BudgetResponse
	milestone: MilestoneResponse
	transaction: TransactionResponse
	transactionAuth: TransactionAuthResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'ausschuss'): RecordService<AusschussResponse>
	collection(idOrName: 'budget'): RecordService<BudgetResponse>
	collection(idOrName: 'milestone'): RecordService<MilestoneResponse>
	collection(idOrName: 'transaction'): RecordService<TransactionResponse>
	collection(idOrName: 'transactionAuth'): RecordService<TransactionAuthResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
