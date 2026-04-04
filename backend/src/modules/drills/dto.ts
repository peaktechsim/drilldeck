export interface CreateDrillDto {
  name: string;
  description: string;
  timeStandard: string;
  targetZones: string[];
  createdBy?: number;
}

export interface UpdateDrillDto {
  name?: string;
  description?: string;
  timeStandard?: string;
  targetZones?: string[];
}
