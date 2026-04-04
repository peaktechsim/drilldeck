export interface CreateSessionDto {
  createdBy?: number;
  drillOrder?: string;
}

export interface AddShooterDto {
  email: string;
  pin: string;
  position: number;
}

export interface SetDrillsDto {
  drillIds: number[];
}

export interface RecordEntryDto {
  sessionId: number;
  shooterId: number;
  drillId: number;
  timeEntered: string;
}
