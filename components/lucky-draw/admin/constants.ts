import type { AnimationStyle } from '@/lib/types';
import type { PrizeTierForm } from './types';

export const prizeTierOptions: Array<{ value: PrizeTierForm['tier']; label: string }> = [
  { value: 'first', label: 'First Prize' },
  { value: 'second', label: 'Second Prize' },
  { value: 'third', label: 'Third Prize' },
  { value: 'consolation', label: 'Consolation Prize' },
];

export const animationStyleOptions: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'slot', label: 'Slot Machine' },
];

export const defaultTierName: Record<PrizeTierForm['tier'], string> = {
  first: 'First Prize',
  second: 'Second Prize',
  third: 'Third Prize',
  consolation: 'Consolation Prize',
};
