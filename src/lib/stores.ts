import { writable } from "svelte/store";

export const clientState = writable({
  userId: '',
  userUsername: '',
  partnerId: '',
  partnerUsername: '',
})
