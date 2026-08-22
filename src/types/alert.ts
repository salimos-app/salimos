export interface AlertType {
  id: string;
  label: string;
  icon: string;
  ttlMinutes: number;
  requiresValue?: boolean;
  valuePresets?: number[];
}

export interface DiscotecaAlert {
  id: string;
  typeId: string;
  value: number | null;
  count: number;
  firstReportedAt: number;
  lastReportedAt: number;
  expiresAt: number;
}
