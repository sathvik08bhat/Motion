import { CalendarModule } from './calendar';
import { StudyModule } from './study';

export const AVAILABLE_MODULES = [
  CalendarModule,
  StudyModule
];

// Re-export type for convenience
export type { Module } from '../core/modules/registry';

