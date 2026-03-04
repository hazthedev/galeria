// ============================================
// Analytics & Export Types
// ============================================

export interface IUsageMetrics {
  tenant_id: string;
  billing_period: string; // YYYY-MM format
  events_created: number;
  total_photos_uploaded: number;
  total_storage_gb: number;
  total_lucky_draws: number;
  api_calls: number;
}

export interface IUsageOverage {
  events: number;
  storage: number;
  api_calls: number;
}

export interface IBillingCalculation {
  estimated_cost: number;
  overage_charges: number;
  total_due: number;
}

export type ExportFormat = 'zip' | 'csv' | 'json' | 'pdf';

export type ExportQuality = 'thumbnail' | 'medium' | 'original';

export interface IExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  include_metadata: boolean;
  include_contributor_names: boolean;
  include_timestamps: boolean;
  include_reactions: boolean;
  watermark: boolean;
}

export interface IExportJob {
  id: string;
  event_id: string;
  requested_by: string;
  options: IExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: Date;
  created_at: Date;
  completed_at?: Date;
}

export type WebhookEvent =
  | 'photo.uploaded'
  | 'photo.moderated'
  | 'lucky_draw.completed'
  | 'event.created'
  | 'event.ended'
  | 'export.ready';

export interface IWebhook {
  id: string;
  tenant_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IWebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: Date;
  data: unknown;
  tenant_id: string;
}
