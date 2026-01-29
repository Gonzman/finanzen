import type { AusschussRecord, TypedPocketBase, UsersRecord } from '@/lib/pocketbase-types';
import PocketBase from 'pocketbase';
import { ref, type Ref } from 'vue';

const client = new PocketBase(import.meta.env.VITE_POCKETBASE_URL) as TypedPocketBase;

client.autoCancellation(false);

client.authStore.onChange(() => {
    window.location.reload();
    if (client.authStore.isValid) {
        User.getInstance();
    }
});

export const usePocketBase = () => client;

class User {
    private static instance: User;
    private static _isInitialized = ref(false);
    private id!: string;
    private name: string | null = null;
    private email!: string;
    private committe = ref<AusschussRecord[]>([]);
    private image: Ref<string | null> = ref(null);
    private pruefer!: boolean;
    private analyzer!: boolean;

    private constructor() {
        if (!client.authStore.record) {
            throw new Error('Auth store record is null');
        }
        client
            .collection('users')
            .getOne(client.authStore.record.id)
            .then((userData) => {
                const user = userData as UsersRecord;
                this.id = user.id;
                this.name = user.name ?? null;
                this.email = user.email;
                this.image.value = user.avatar ?? null;
                this.analyzer = user.analyzer;
                console.log('User image:', user.isPruefer);
                this.pruefer = user.isPruefer ?? false;
                console.log('User data:', user);
                User._isInitialized.value = true;
            })
            .catch((error) => {
                console.error('Error fetching user record:', error);
                throw error;
            });

        client
            .collection('ausschuss')
            .getList()
            .then((comitteData) => {
                (comitteData.items as AusschussRecord[]).forEach((comitte) => {
                    this.committe.value.push(comitte);
                });
            })
            .catch((error) => {
                console.error('Error fetching comitte data:', error);
                throw error;
            });
    }

    static getInstance(): User {
        if (!User.instance) {
            User.instance = new User();
        }
        return User.instance;
    }

    getShortName() {
        if (this.name) {
            // Regex to match "Test His" or "test.his"
            const regex = /([A-Za-z])[a-z]*(?:[.\s])([A-Za-z])[a-z]*/i;
            const match = this.name.match(regex);
            if (match) {
                return match[1].toUpperCase() + match[2].toUpperCase();
            } else {
                // If it doesn't match the pattern, return the full name or a default value
                return this.name || 'Unknown';
            }
        }
        return null;
    }

    getUserName() {
        if (this.name!.includes('.')) {
            const nameParts = this.name!.split('.');
            return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) + ' ' + nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else {
            return this.name;
        }
    }

    getUserEmail() {
        return this.email;
    }

    getCommitteList() {
        return this.committe;
    }

    getUserImage() {
        return this.image.value;
    }

    get userId() {
        return this.id;
    }

    logout() {
        client.authStore.clear();
    }

    isPruefer() {
        return this.pruefer;
    }

    isAnalyzer() {
        return this.analyzer;
    }

    static get isInitialized() {
        return User._isInitialized;
    }
}

function shortName(name: string) {
    // Regex to match "Test His" or "test.his"
    const regex = /([A-Za-z])[a-z]*(?:[.\s])([A-Za-z])[a-z]*/i;
    const match = name.match(regex);
    if (match) {
        return match[1].toUpperCase() + match[2].toUpperCase();
    } else {
        return name || 'Unknown';
    }
}

export { shortName, User };

export const useUser = () => {
    return User.getInstance();
};

//https://studioterabyte.nl/en/blog/pocketbase-vue-3
