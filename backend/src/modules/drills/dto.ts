export interface CreateDrillDto {
  name: string;
  description: string;
  timeStandard: string;
  distance?: string;
  targetZones: string[];
  weapons?: string[];
  createdBy?: number;
}

export interface UpdateDrillDto {
  name?: string;
  description?: string;
  timeStandard?: string;
  distance?: string;
  targetZones?: string[];
  weapons?: string[];
}
