import { browser } from "$app/env";
import type { Session, User } from "@supabase/gotrue-js";
import { writable, type Subscriber } from "svelte/store";
import { supabaseClient } from "./db";

interface CustomUser {
  id: string;
  name: string;
  partnerId: string;
  partnerUsername: string;
  theme: 'dark' | 'valentine';
};

export const user = createUserStore();

function createUserStore()  {
  const { subscribe, set, update } = writable(getUserFromLocalStorage(), (set) => {
    supabaseClient.auth.onAuthStateChange((_, session) => {
      setUser(set, session);
    });
  });

  return {
    subscribe,
    setUser: (session: Session) => setUser(set, session),
    changeTheme: () => {
      update(user => {
        if (!user) return null;
        user.theme = user.theme === 'dark' ? 'valentine' : 'dark';
        setUserToLocalStorage(user);
        return user;
      })
    },
    setPartner: (partnerId: string, partnerUsername: string) => {
      update(user => {
        if (!user) return null;
        user.partnerId = partnerId;
        user.partnerUsername = partnerUsername
        setUserToLocalStorage(user);
        return user;
      })
    }
  }

  function setUser(set: Subscriber<CustomUser | null>, session: Session | null) {
    if (session === null || session.user === null) { 
      set(null);
      setUserToLocalStorage(null);
      return;
    }

    // TODO retrive these from DB maybe?
    const user = {
      id: session.user.id,
      partnerId: '',
      partnerUsername: '',
      theme: 'valentine' as 'dark' | 'valentine',
      name: session.user.email?.split('@')[0] || 'No name',
    }
    set(user);
    setUserToLocalStorage(user);
  }
}

function getUserFromLocalStorage(): CustomUser | null {
  if (!browser) return null;
  const localUser = localStorage.getItem('user');
  if (!localUser) return null;
  return JSON.parse(localUser);
}

function setUserToLocalStorage(user: CustomUser | null) {
  console.log(user);
  if (!browser) return;
  if (!user) localStorage.removeItem('user');
  else {
    localStorage.setItem('user', JSON.stringify(user));
  }
}
