export type Step = {
    title: string;
    description: string;
    status: StepStatus;
  };
export type StepStatus = 'pending' | 'current' | 'completed';