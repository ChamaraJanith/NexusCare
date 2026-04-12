import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { retryAsync } from '../services/retryHelper.js';

describe('retryAsync', () => {
  it('resolves immediately when the function succeeds', async () => {
    let called = 0;
    const result = await retryAsync(async () => {
      called += 1;
      return 'ok';
    }, { retries: 3, initialDelayMs: 1 });

    assert.equal(result, 'ok');
    assert.equal(called, 1);
  });

  it('retries on failure and eventually resolves', async () => {
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

  it('throws after exhausting retries', async () => {
    let attempts = 0;

    await assert.rejects(
      async () => {
        await retryAsync(
          async () => {
            attempts += 1;
            throw new Error('still failing');
          },
          { retries: 2, initialDelayMs: 1 }
        );
      },
      { message: 'still failing' }
    );

    assert.equal(attempts, 2);
  });
});
