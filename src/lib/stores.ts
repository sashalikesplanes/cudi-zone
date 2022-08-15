import { writable } from "svelte/store";

export const clientState = writable({
  partnerId: '',
  partnerUsername: '',
})
