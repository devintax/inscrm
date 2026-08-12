-- Additive only. Existing ERPNext sync columns and triggers are not modified.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS gis_sync_status varchar(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS gis_crm_lead_id text,
  ADD COLUMN IF NOT EXISTS gis_sync_error text,
  ADD COLUMN IF NOT EXISTS gis_synced_at timestamptz;

UPDATE public.leads SET gis_sync_status = 'pending' WHERE gis_sync_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_gis_sync_status
  ON public.leads (gis_sync_status);
