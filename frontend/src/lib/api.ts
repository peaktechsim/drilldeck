export const SHOOTER_STORAGE_KEY = "drilldeck_shooter";

export type Shooter = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  rifle: string | null;
  pistol: string | null;
  createdAt?: string;
};

export type ShooterSummary = Pick<Shooter, "id" | "email" | "name">;

export type Drill = {
  id: number;
  name: string;
  description: string;
  timeStandard: string;
  targetZones: string[];
  createdBy: number | null;
  createdAt: string;
};

export type TrainingSession = {
  id: number;
  createdBy: number;
  drillOrder: string;
  startedAt: string;
  completedAt: string | null;
};

export type SessionShooter = {
  id: number;
  sessionId: number;
  shooterId: number;
  position: number;
};

export type SessionDrill = {
  id: number;
  sessionId: number;
  position: number;
  drillId: number;
};

export type SessionEntry = {
  id: number;
  sessionId: number;
  shooterId: number;
  drillId: number;
  timeEntered: string;
  pass: boolean;
  createdAt: string;
};

export type SessionDetails = {
  session: TrainingSession;
  shooters: SessionShooter[];
  drills: SessionDrill[];
  entries: SessionEntry[];
};

export type CurrentStreak = {
  type: "pass" | "fail" | null;
  count: number;
};

export type DrillAnalysis = {
  drillId: number;
  drillName: string;
  timeStandard: number;
  stats: {
    personalBest: number | null;
    average: number | null;
    passRate: number;
    totalAttempts: number;
    currentStreak: CurrentStreak;
  };
  entries: Array<{
    id: number;
    sessionId: number;
    shooterId: number;
    drillId: number;
    timeEntered: number;
    pass: boolean;
    createdAt: string;
    sessionStartedAt: string;
  }>;
};

export type ShooterAnalysis = {
  shooterId: number;
  drills: DrillAnalysis[];
};

export type RegisterShooterInput = {
  email: string;
  name: string;
  pin: string;
  rifle?: string | null;
  pistol?: string | null;
};

export type UpdateShooterInput = {
  name?: string;
  rifle?: string | null;
  pistol?: string | null;
};

export type VerifyPinInput = {
  email: string;
  pin: string;
};

export type CreateDrillInput = {
  name: string;
  description: string;
  timeStandard: string;
  targetZones: string[];
};

export type UpdateDrillInput = Partial<CreateDrillInput>;

export type CreateSessionInput = {
  createdBy?: number;
  drillOrder?: string;
};

export type AddShooterToSessionInput = {
  email: string;
  pin: string;
  position: number;
};

export type SetSessionDrillsInput = {
  drillIds: number[];
};

export type RecordEntryInput = {
  shooterId: number;
  drillId: number;
  timeEntered: string;
};

function getStoredShooter(): Shooter | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SHOOTER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Shooter;
  } catch {
    window.sessionStorage.removeItem(SHOOTER_STORAGE_KEY);
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const shooter = getStoredShooter();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (shooter) {
    headers.set("x-shooter-id", String(shooter.id));
    headers.set("x-shooter-admin", String(shooter.isAdmin));
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText || "Request failed";

    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  register: (input: RegisterShooterInput) =>
    request<Shooter>("/api/shooters", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listShooters: () => request<ShooterSummary[]>("/api/shooters"),

  getShooter: (id: number) => request<Shooter>(`/api/shooters/${id}`),

  updateShooter: (id: number, input: UpdateShooterInput) =>
    request<Shooter>(`/api/shooters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  verifyPin: (input: VerifyPinInput) =>
    request<Shooter>("/api/shooters/verify-pin", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  createDrill: (input: CreateDrillInput) =>
    request<Drill>("/api/drills", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listDrills: () => request<Drill[]>("/api/drills"),

  createSession: (input: CreateSessionInput = {}) =>
    request<TrainingSession>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getSession: (id: number) => request<SessionDetails>(`/api/sessions/${id}`),

  addSessionShooter: (sessionId: number, input: AddShooterToSessionInput) =>
    request<SessionShooter>(`/api/sessions/${sessionId}/shooters`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  setSessionDrills: (sessionId: number, input: SetSessionDrillsInput) =>
    request<SessionDrill[]>(`/api/sessions/${sessionId}/drills`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  recordSessionEntry: (sessionId: number, input: RecordEntryInput) =>
    request<SessionEntry>(`/api/sessions/${sessionId}/entries`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  completeSession: (sessionId: number) =>
    request<TrainingSession>(`/api/sessions/${sessionId}/complete`, {
      method: "PATCH",
    }),

  getShooterAnalysis: (shooterId: number, drillIds: number[] = []) => {
    const query = drillIds.length > 0 ? `?drills=${drillIds.join(",")}` : "";
    return request<ShooterAnalysis>(`/api/analysis/shooter/${shooterId}${query}`);
  },
};
