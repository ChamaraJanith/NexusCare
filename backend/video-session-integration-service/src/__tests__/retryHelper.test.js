const assert = require('node:assert');
const { describe, it } = require('node:test');
const { retryAsync } = require('../services/retryHelper');

describe('retryAsync', () => {
  it('resolves successfully after a transient failure', async () => {
    let attempts = 0;
    const result = await retryAsync(
      async () => {
        attempts += 1;
        if (attempts < 2) {
          throw new Error('temporary failure');
        }
        return 'ok';
      },
      { retries: 3, initialDelayMs: 1 }
    );

    assert.equal(result, 'ok');
    assert.equal(attempts, 2);
  });

  it('fails after all retry attempts are exhausted', async () => {
    let attempts = 0;

    await assert.rejects(
      async () => {
        await retryAsync(
          async () => {
            attempts += 1;
            throw new Error('fatal');
          },
          { retries: 2, initialDelayMs: 1 }
        );
      },
      { message: 'fatal' }
    );

    assert.equal(attempts, 2);
  });
});
