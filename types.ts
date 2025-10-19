// FIX: Wrapped JSZip declaration in `declare global` to make it a true global type
// that is accessible from other modules, resolving reference errors.
declare global {
  const JSZip: any;
}

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