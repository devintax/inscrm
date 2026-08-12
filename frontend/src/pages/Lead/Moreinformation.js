/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Card, Chip, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import Palette from '../../theme/palette';

const present = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replaceAll('_', ' ');
};

const date = (value, withTime = false) => {
  if (!value || !dayjs(value).isValid()) return '—';
  return dayjs(value).format(withTime ? 'MM/DD/YYYY h:mm A' : 'MM/DD/YYYY');
};

const Field = ({ label, value }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Box sx={{ borderBottom: `1px dashed ${Palette.grey[400]}`, py: 1.5, minHeight: 70 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body1" sx={{ textTransform: 'capitalize', overflowWrap: 'anywhere' }}>
        {present(value)}
      </Typography>
    </Box>
  </Grid>
);

const Section = ({ title, children }) => (
  <Grid item xs={12}>
    <Typography variant="h5" sx={{ mt: 2, mb: 0.5 }}>{title}</Typography>
    <Grid container spacing={2}>{children}</Grid>
  </Grid>
);

const Moreinformation = ({ data = {} }) => {
  const agent = data.assigned_agent;
  const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
  const violations = Array.isArray(data.violations) ? data.violations : [];
  const source = data.externalData || {};

  return (
    <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <Box p={3}>
        <Grid container spacing={3}>
          <Section title="Lead & Source">
            <Field label="Lead Source" value={data.leadSource} />
            <Field label="Lead Status" value={data.leadStatus} />
            <Field label="Assigned Agent" value={agent ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim() : 'Unassigned'} />
            <Field label="Source Lead ID" value={data.externalSourceId} />
            <Field label="Original Inquiry Date" value={date(data.dateOfInquiry || data.sourceCreatedAt, true)} />
            <Field label="Referral Source" value={data.referralSource} />
          </Section>

          <Section title="Contact & Address">
            <Field label="Home Phone" value={data.phoneHome} />
            <Field label="Cell / Work Phone" value={data.phoneCellWork} />
            <Field label="City" value={data.city} />
            <Field label="State" value={data.state} />
            <Field label="ZIP Code" value={data.zip} />
            <Field label="Driver's License" value={data.driversLicense} />
          </Section>

          <Section title="Household & Driver Details">
            <Field label="Marital Status" value={data.maritalStatus} />
            <Field label="Housing Status" value={data.housingStatus} />
            <Field label="Licensed Over 3 Years" value={data.licensedOver3Years} />
            <Field label="Drivers in Household" value={data.driversInHousehold} />
            <Field label="Driver 2 Name" value={`${data.driver2?.firstName || ''} ${data.driver2?.lastName || ''}`.trim()} />
            <Field label="Driver 2 Date of Birth" value={date(data.driver2?.dateOfBirth)} />
            <Field label="Driver 2 License" value={data.driver2?.driversLicense} />
            <Field label="Driver 2 Excluded" value={data.driver2?.excluded} />
            <Field label="Defensive Driving" value={data.driver2?.defensiveDriving} />
          </Section>

          <Section title="Insurance & Coverage">
            <Field label="Currently Insured" value={data.hasCurrentInsurance} />
            <Field label="Current Insurance Company" value={data.currentInsuranceCompany} />
            <Field label="Coverage Type" value={data.coverageType} />
            <Field label="Requested Coverage Start" value={date(data.coverageStartDate)} />
            <Field label="Has Lien Holder" value={data.hasLienHolder} />
            <Field label="Lien Holder Name" value={data.lienHolderName} />
            <Field label="Notes / Requested Features" value={data.specificPolicyFeatures} />
          </Section>

          <Section title="Vehicles">
            {vehicles.length ? vehicles.map((vehicle, index) => (
              <Grid item xs={12} key={`${vehicle.vin || 'vehicle'}-${index}`}>
                <Box sx={{ p: 2, border: `1px solid ${Palette.grey[300]}`, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>Vehicle {index + 1}</Typography>
                  <Grid container spacing={2}>
                    <Field label="Year" value={vehicle.year} />
                    <Field label="Make" value={vehicle.make} />
                    <Field label="Model" value={vehicle.model} />
                    <Field label="VIN" value={vehicle.vin} />
                    <Field label="Body Type" value={vehicle.bodyType} />
                  </Grid>
                </Box>
              </Grid>
            )) : <Field label="Vehicle Information" value="Not provided" />}
          </Section>

          <Section title="Accidents, Violations & Tickets">
            <Field label="Incidents in Past 3 Years" value={data.hasViolations} />
            {violations.length ? violations.map((item, index) => (
              <React.Fragment key={`${item.type || 'incident'}-${index}`}>
                <Field label={`Incident ${index + 1} Type`} value={item.type} />
                <Field label={`Incident ${index + 1} Date`} value={date(item.date)} />
              </React.Fragment>
            )) : <Field label="Incident Details" value="None provided" />}
          </Section>

          <Section title="Consent & Source Record">
            <Field label="Consent Granted" value={data.consent?.granted} />
            <Field label="Consent Timestamp" value={date(data.consent?.timestamp, true)} />
            <Field label="Consent Text" value={data.consent?.text} />
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Capture Path</Typography>
              <Chip label={source.source || data.leadSource || 'CRM'} size="small" />
            </Grid>
          </Section>
        </Grid>
      </Box>
    </Card>
  );
};

export default Moreinformation;
