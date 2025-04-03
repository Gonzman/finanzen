import PocketBase from 'pocketbase'

// Init the PocketBase instance with the correct URL.
// By setting this in a .env file you can easily switch between development and production environments
const client = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)

client.authStore.onChange(() => {
    // Save the auth store to local storage
    window.location.reload()
})

export const usePocketBase = () => client
//https://studioterabyte.nl/en/blog/pocketbase-vue-3
