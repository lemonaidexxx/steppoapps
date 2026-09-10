const catalog = require('../data/catalog.json');
function valid() {
  return {
    firstName: 'Test', lastName: 'Applicant', birthDate: '1990-01-01',
    sex: 'Prefer not to say', phone: '+63 917 000 0000', email: 'test@example.invalid',
    category: 'APO Member', ofwStatus: 'Former OFW', membershipNumber: 'TEST-123',
    country: 'Seabased OFW', occupation: 'Test occupation', region: 'National Capital Region',
    province: 'Metro Manila', city: 'Manila', address: 'Synthetic test address',
    goal: 'Find jobs in the Philippines.', offeringId: catalog[0].id,
    consent: true, consentVersion: 'STEP-2026-01'
  };
}
module.exports = {valid};
