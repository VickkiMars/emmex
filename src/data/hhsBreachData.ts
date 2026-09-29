import type { HealthcareBreachRecord } from '../types';
import rawRecords from './hhs_breach_records.json';

export const REAL_HHS_BREACH_DATASET: HealthcareBreachRecord[] = rawRecords as unknown as HealthcareBreachRecord[];
