export type * from './auth';
export type * from './navigation';
export type * from './ui';

export interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
    created_at?: string;
}

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
};
