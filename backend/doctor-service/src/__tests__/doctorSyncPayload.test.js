import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createDoctorSyncPayload } from '../services/doctorSyncPayload.js';

describe('createDoctorSyncPayload', () => {
  it('returns null when doctorId is missing', () => {
    const payload = createDoctorSyncPayload({});
    assert.equal(payload, null);
  });

  it('maps doctor record and identity fields correctly', () => {
    const doctorRecord = {
      doctorId: 'DOC-123',
      specialty: 'Cardiology',
      hospital: 'Central Hospital',
      location: 'Suite 402',
      profileImage: 'http://example.com/profile.jpg',
      isActive: true,
    };
    const identity = {
      name: 'Dr. Jane Doe',
      email: 'jane@example.com',
    };

    const payload = createDoctorSyncPayload(doctorRecord, identity);

    assert.equal(payload.doctorId, 'DOC-123');
    assert.equal(payload.name, 'Dr. Jane Doe');
    assert.equal(payload.email, 'jane@example.com');
    assert.equal(payload.specialization, 'Cardiology');
    assert.equal(payload.hospital, 'Central Hospital');
    assert.equal(payload.location, 'Suite 402');
    assert.equal(payload.profileImage, 'http://example.com/profile.jpg');
    assert.equal(payload.isActive, true);
  });
});
