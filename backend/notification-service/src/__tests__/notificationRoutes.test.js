process.env.INTERNAL_SERVICE_KEY = 'test-key';

const request = require('supertest');
const app = require('../app');

describe('Notification Service routes', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('service', 'notification-service');
  });

  it('returns ready status with proper body', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBeDefined();
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('ready');
  });

  it('rejects send-sms request without phoneNumber', async () => {
    const res = await request(app)
      .post('/api/notifications/send-sms')
      .set('x-internal-service-key', 'test-key')
      .send({ message: 'Hello' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('phoneNumber is required');
  });

  it('rejects logging without internal key', async () => {
    const res = await request(app)
      .post('/api/notifications/log')
      .send({ type: 'system', event: 'test', status: 'success' });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('success', false);
  });
});
