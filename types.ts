export enum View {
  CREATION = 'CREATION',
  DIRECTORY = 'DIRECTORY',
}

export enum GenerationStatusEnum {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface GenerationState {
  status: GenerationStatusEnum;
  plan: string[];
  currentPlanStep: number;
  files: Map<string, string>;
  error: string | null;
  completionMessage: string;
}

export interface PrestaModule {
  id: string;
  name: string;
  description: string;
  generationState: GenerationState;
}