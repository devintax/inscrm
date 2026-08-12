import { z } from 'zod';
import Lead from '../model/Lead';
import User from '../model/User';
import LeadSyncLog from '../model/LeadSyncLog';

const optionalString = z.union([z.string(), z.number()]).nullish().transform((v) => v == null ? undefined : String(v).trim()).optional();
const optionalDate = z.union([z.string(), z.date()]).nullish().transform((v) => v ? new Date(v) : undefined).refine((v) => !v || !Number.isNaN(v.getTime()), 'Invalid date').optional();
const optionalBoolean = z.union([z.boolean(), z.string(), z.number()]).nullish().transform((v) => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  return ['true', '1', 'yes', 'y'].includes(String(v).toLowerCase());
}).optional();

const payloadSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  full_name: optionalString, first_name: optionalString, last_name: optionalString,
  email: z.string().trim().email(), phone: optionalString, phone_home: optionalString, phone_cell_work: optionalString,
  source: z.string().trim().min(1), created_at: optionalDate, date_of_inquiry: optionalDate,
  gender: optionalString, date_of_birth: optionalDate, drivers_license: optionalString,
  address: optionalString, city: optionalString, state: optionalString, zip: optionalString,
  marital_status: optionalString, housing_status: optionalString, licensed_over_3yrs: optionalBoolean,
  drivers_in_household: z.coerce.number().int().nonnegative().nullish(),
  driver2_first_name: optionalString, driver2_last_name: optionalString, driver2_date_of_birth: optionalDate,
  driver2_drivers_license: optionalString, driver2_excluded: optionalBoolean, driver2_defensive_driving: optionalString,
  vehicle_make: optionalString, vehicle_model: optionalString, vehicle_year: z.coerce.number().int().nullish(), vin_number: optionalString,
  coverage_type: optionalString, has_current_insurance: optionalBoolean, coverage_start_date: optionalDate,
  current_insurance_company: optionalString, has_lien_holder: optionalBoolean, lien_holder_name: optionalString,
  veh1_year: z.coerce.number().int().nullish(), veh1_make: optionalString, veh1_model: optionalString, veh1_vin: optionalString, veh1_body_type: optionalString,
  veh2_year: z.coerce.number().int().nullish(), veh2_make: optionalString, veh2_model: optionalString, veh2_vin: optionalString, veh2_body_type: optionalString,
  veh3_year: z.coerce.number().int().nullish(), veh3_make: optionalString, veh3_model: optionalString, veh3_vin: optionalString, veh3_body_type: optionalString,
  has_violations: optionalBoolean,
  violation_1_type: optionalString, violation_1_date: optionalDate, violation_2_type: optionalString, violation_2_date: optionalDate,
  violation_3_type: optionalString, violation_3_date: optionalDate, referral_source: optionalString, notes: optionalString,
  consent_granted: optionalBoolean, consent_timestamp: optionalDate, consent_text: optionalString,
}).passthrough().refine((v) => v.created_at || v.date_of_inquiry, { message: 'created_at or date_of_inquiry is required', path: ['created_at'] });

export const normalizePhone = (value) => {
  if (!value) return undefined;
  let digits = String(value).replace(/^'+/, '').replace(/\D/g, '');
  if (digits.length === 10) digits = `1${digits}`;
  return digits.length === 11 && digits.startsWith('1') ? `+${digits}` : undefined;
};

const splitName = (payload) => {
  if (payload.first_name || payload.last_name) return [payload.first_name || 'Unknown', payload.last_name || 'Unknown'];
  const pieces = (payload.full_name || 'Unknown Unknown').trim().split(/\s+/);
  return [pieces.shift() || 'Unknown', pieces.join(' ') || 'Unknown'];
};

const vehicle = (year, make, model, vin, bodyType) =>
  [year, make, model, vin, bodyType].some(Boolean) ? { year, make, model, vin, bodyType } : null;

const mapPayload = (p, createdBy, req) => {
  const [firstName, lastName] = splitName(p);
  const primaryPhone = normalizePhone(p.phone) || normalizePhone(p.phone_cell_work) || normalizePhone(p.phone_home);
  const vehicles = [
    vehicle(p.veh1_year || p.vehicle_year, p.veh1_make || p.vehicle_make, p.veh1_model || p.vehicle_model, p.veh1_vin || p.vin_number, p.veh1_body_type),
    vehicle(p.veh2_year, p.veh2_make, p.veh2_model, p.veh2_vin, p.veh2_body_type),
    vehicle(p.veh3_year, p.veh3_make, p.veh3_model, p.veh3_vin, p.veh3_body_type),
  ].filter(Boolean);
  const violations = [1, 2, 3].map((n) => ({ type: p[`violation_${n}_type`], date: p[`violation_${n}_date`] })).filter((v) => v.type || v.date);
  return {
    title: 'Web Lead', firstName, lastName, fullName: p.full_name, dateOfBirth: p.date_of_birth?.toISOString() || '',
    gender: p.gender || 'unspecified', phoneNumber: primaryPhone, emailAddress: p.email.toLowerCase(), address: p.address || '',
    leadSource: p.source, leadStatus: 'New', createdBy, externalSourceId: p.id == null ? undefined : String(p.id),
    sourceCreatedAt: p.created_at || p.date_of_inquiry, createdOn: p.created_at || p.date_of_inquiry,
    driversLicense: p.drivers_license, phoneHome: normalizePhone(p.phone_home), phoneCellWork: normalizePhone(p.phone_cell_work),
    city: p.city, state: p.state?.toUpperCase(), zip: p.zip, maritalStatus: p.marital_status?.toLowerCase(), housingStatus: p.housing_status?.toLowerCase(),
    licensedOver3Years: p.licensed_over_3yrs, driversInHousehold: p.drivers_in_household,
    driver2: { firstName: p.driver2_first_name, lastName: p.driver2_last_name, dateOfBirth: p.driver2_date_of_birth,
      driversLicense: p.driver2_drivers_license, excluded: p.driver2_excluded, defensiveDriving: p.driver2_defensive_driving?.toLowerCase() },
    hasCurrentInsurance: p.has_current_insurance, currentInsuranceCompany: p.current_insurance_company,
    coverageType: p.coverage_type?.toLowerCase().replace(/\s+/g, '_'), coverageStartDate: p.coverage_start_date,
    hasLienHolder: p.has_lien_holder, lienHolderName: p.lien_holder_name, vehicles, hasViolations: p.has_violations, violations,
    referralSource: p.referral_source, dateOfInquiry: p.date_of_inquiry, specificPolicyFeatures: p.notes,
    consent: { granted: p.consent_granted, timestamp: p.consent_timestamp, text: p.consent_text, ipAddress: req.ip }, externalData: p,
  };
};

const updateInsforgeTracking = async (sourceId, values) => {
  const baseUrl = process.env.INSFORGE_BASE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey || sourceId == null) return;

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/api/database/admin/tables/leads/records/${encodeURIComponent(sourceId)}?pkColumn=id`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
  );
  if (!response.ok) throw new Error(`InsForge tracking callback failed with HTTP ${response.status}`);
};

export const ingest = async (req, res) => {
  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) {
    await updateInsforgeTracking(req.body?.id, {
      gis_sync_status: 'failed', gis_sync_error: JSON.stringify(parsed.error.flatten().fieldErrors).slice(0, 2000),
    }).catch((error) => console.error('Unable to record InsForge validation failure:', error));
    return res.status(400).json({ error: 'Validation failed', fields: parsed.error.flatten().fieldErrors });
  }
  const p = parsed.data;
  const phones = [p.phone, p.phone_home, p.phone_cell_work].map(normalizePhone).filter(Boolean);
  if (!phones.length) {
    const fields = { phone: ['At least one valid US phone is required'] };
    await updateInsforgeTracking(p.id, {
      gis_sync_status: 'failed', gis_sync_error: JSON.stringify(fields),
    }).catch((error) => console.error('Unable to record InsForge phone validation failure:', error));
    return res.status(400).json({ error: 'Validation failed', fields });
  }

  try {
    const systemUser = await User.findOne({ role: 'admin', deleted: false }).sort({ createdOn: 1 });
    if (!systemUser) throw new Error('No active administrator exists for external lead ownership');
    const cutoff = new Date(Date.now() - Number(process.env.LEAD_DEDUPE_HOURS || 48) * 3600000);
    const contactMatch = { $or: [
      { emailAddress: p.email.toLowerCase() }, { phoneNumber: { $in: phones } },
      { phoneHome: { $in: phones } }, { phoneCellWork: { $in: phones } },
    ] };
    const externalId = p.id == null ? undefined : String(p.id);
    const duplicate = await Lead.findOne({ deleted: false, $or: [
      ...(externalId ? [{ externalSourceId: externalId, leadSource: p.source }] : []),
      { $and: [{ createdOn: { $gte: cutoff } }, contactMatch] },
    ] });
    const mapped = mapPayload(p, systemUser._id, req);
    let lead;
    let outcome;
    if (duplicate) {
      const merged = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null && value !== ''));
      lead = await Lead.findByIdAndUpdate(duplicate._id, { $set: { ...merged, modifiedOn: new Date() }, $push: {
        duplicateSubmissions: { receivedAt: new Date(), source: p.source, externalSourceId: p.id == null ? undefined : String(p.id) },
      } }, { new: true });
      outcome = 'duplicate';
    } else {
      lead = await Lead.create(mapped);
      outcome = 'created';
    }
    await LeadSyncLog.create({ source: p.source, externalSourceId: p.id == null ? undefined : String(p.id), leadId: lead._id, outcome });
    await updateInsforgeTracking(p.id, {
      gis_sync_status: 'synced', gis_crm_lead_id: String(lead._id),
      gis_sync_error: null, gis_synced_at: new Date().toISOString(),
    });
    return res.status(outcome === 'created' ? 201 : 200).json({ status: outcome, leadId: String(lead._id) });
  } catch (error) {
    console.error('External lead ingest failed:', error);
    await LeadSyncLog.create({ source: p.source, externalSourceId: p.id == null ? undefined : String(p.id), outcome: 'failed', error: error.message }).catch(() => {});
    return res.status(500).json({ error: 'Lead ingest failed' });
  }
};
