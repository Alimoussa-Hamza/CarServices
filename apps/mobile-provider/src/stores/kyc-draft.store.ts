import { create } from 'zustand';
import {
  EMPTY_KYC_DRAFT,
  type KycDraft,
  type KycFormulaKey,
} from '../lib/kyc-validation';

type KycDraftState = KycDraft & {
  patch: (partial: Partial<KycDraft>) => void;
  toggleFormula: (key: KycFormulaKey) => void;
  toggleDay: (day: number) => void;
  toggleTimeChip: (index: number) => void;
  reset: () => void;
};

export const useKycDraftStore = create<KycDraftState>((set) => ({
  ...EMPTY_KYC_DRAFT,
  patch: (partial) => set(partial),
  toggleFormula: (key) =>
    set((state) => ({
      formulas: state.formulas.includes(key)
        ? state.formulas.filter((item) => item !== key)
        : [...state.formulas, key],
    })),
  toggleDay: (day) =>
    set((state) => ({
      days: state.days.includes(day)
        ? state.days.filter((item) => item !== day)
        : [...state.days, day],
    })),
  toggleTimeChip: (index) =>
    set((state) => ({
      timeChipIndexes: state.timeChipIndexes.includes(index)
        ? state.timeChipIndexes.filter((item) => item !== index)
        : [...state.timeChipIndexes, index],
    })),
  reset: () => set({ ...EMPTY_KYC_DRAFT }),
}));
