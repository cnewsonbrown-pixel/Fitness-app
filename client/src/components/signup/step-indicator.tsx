'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { number: 1, label: 'Your account' },
  { number: 2, label: 'Studio details' },
  { number: 3, label: 'Choose plan' },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isDone = currentStep > step.number;
        const isCurrent = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <p
                className={cn(
                  'text-xs font-medium mt-1.5 whitespace-nowrap',
                  isCurrent ? 'text-brand-700' : isDone ? 'text-slate-700' : 'text-slate-400'
                )}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 sm:w-24 mb-4 mx-2 transition-all',
                  currentStep > step.number ? 'bg-brand-600' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
