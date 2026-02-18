/**
 * Tipos relacionados a Targets e Target Queue
 */

export interface TargetQueueRow {
  id: string;
  ig_account_id: string;
  username: string;
  status: "pending" | "injected" | "processing" | "processed" | "failed" | "skipped";
  source: string | null;
  priority: number | null;
  created_at: string;
  processed_at: string | null;
  device_id: string | null;
  details: Record<string, unknown> | null;
}

export interface TargetQueueStats {
  pending: number;
  total: number;
  failed: number;
  processed?: number;
  skipped?: number;
  injected?: number;
}

export interface RealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new?: TargetQueueRow;
  old?: { id: string };
}
