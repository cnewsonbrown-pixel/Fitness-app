'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface StudioData {
  studioName: string;
  slug: string;
  timezone: string;
  country: string;
}

export type PlanTier = 'BASE' | 'MID' | 'PREMIUM';

interface SignupState {
  currentStep: 1 | 2 | 3;
  account: AccountData | null;
  studio: StudioData | null;
  plan: PlanTier | null;
  setAccount: (data: AccountData) => void;
  setStudio: (data: StudioData) => void;
  setPlan: (tier: PlanTier) => void;
  setStep: (step: 1 | 2 | 3) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      currentStep: 1,
      account: null,
      studio: null,
      plan: null,
      setAccount: (data) => set({ account: data, currentStep: 2 }),
      setStudio: (data) => set({ studio: data, currentStep: 3 }),
      setPlan: (tier) => set({ plan: tier }),
      setStep: (step) => set({ currentStep: step }),
      reset: () => set({ currentStep: 1, account: null, studio: null, plan: null }),
    }),
    {
      name: 'fitstudio-signup',
    }
  )
);
