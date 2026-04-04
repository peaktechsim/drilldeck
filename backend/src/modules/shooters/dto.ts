export interface RegisterShooterDto {
  email: string;
  name: string;
  pin: string;
  rifle?: string | null;
  pistol?: string | null;
}

export interface VerifyPinDto {
  email: string;
  pin: string;
}

export interface UpdateShooterDto {
  name?: string;
  rifle?: string | null;
  pistol?: string | null;
}
