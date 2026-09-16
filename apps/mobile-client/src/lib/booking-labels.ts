import type { DirtLevel, VehicleType } from '@carservice/shared-types';

export const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'citadine', label: 'Citadine' },
  { value: 'berline', label: 'Berline' },
  { value: 'suv', label: 'SUV / Break' },
  { value: 'utilitaire', label: 'Utilitaire' },
];

export const DIRT_OPTIONS: { value: DirtLevel; label: string }[] = [
  { value: 'light', label: 'Léger' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Fort' },
];
