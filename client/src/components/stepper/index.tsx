import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'completed' | 'current' | 'pending';

interface Step {
  title: string;
  description: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

export default function Stepper({ steps, className }: StepperProps) {
  return (
    <div className="fixed flex items-center justify-center min-h-[400px] bg-black/80 p-6 inset-0 z-30">
      <div
        className={cn(
          'w-full max-w-md mx-auto bg-[#252525] rounded-[20px] p-5',
          className
        )}
      >
        <h3 className="text-2xl font-semibold text-white mb-4">
          Creating your item
        </h3>
        <div className="relative">
          {steps.map((step, index) => (
            <div key={index} className="relative pb-8 last:pb-0">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-4 top-8 -ml-px h-full w-0.5 -translate-x-1/2 transition-all duration-500',
                    step.status === 'completed'
                      ? 'bg-gray-400 animate-line-progress'
                      : 'bg-gray-600'
                  )}
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-start group">
                {/* Step indicator */}
                <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0">
                  {step.status === 'completed' && (
                    <div className="bg-gray-800 rounded-full flex items-center justify-center h-8 w-8">
                      <Check
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  {step.status === 'current' && (
                    <div className="bg-gray-800 rounded-full flex items-center justify-center h-8 w-8">
                      <Loader2
                        className="h-4 w-4 text-gray-400 animate-spin"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="bg-gray-800 border-1 border-gray-600 rounded-full flex items-center justify-center h-8 w-8">
                      <span
                        className="h-2 w-2 bg-gray-600 rounded-full"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-200">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
