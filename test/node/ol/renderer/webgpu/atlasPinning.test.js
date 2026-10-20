import {assert} from 'chai';
import {atlasPinningBatches} from '../../../../../src/ol/renderer/webgpu/vectorUtil.js';

describe('atlasPinningBatches', () => {
  const batch = (key) => ({key});

  it('keeps the current generation once it is cached', () => {
    const oldBatch = batch('3/1/2/tile/1/100@1');
    const current = batch('3/1/2/tile/1/100@2');
    const pinned = atlasPinningBatches([oldBatch, current], 2);
    assert.deepEqual(pinned, [current]);
  });

  it('keeps the newest cached generation until a replacement exists', () => {
    const older = batch('3/1/2/tile/1/100@1');
    const newer = batch('3/1/2/tile/1/100@2');
    const pinned = atlasPinningBatches([newer, older], 4);
    assert.deepEqual(pinned, [newer]);
  });

  it('pins each cache identity separately', () => {
    const ready = batch('3/1/2/a/1/100@2');
    const stale = batch('3/1/2/a/1/100@1');
    const waiting = batch('source/9/3/0/0/0/1/0/100@1');
    const pinned = atlasPinningBatches([stale, waiting, ready], 2);
    assert.deepEqual(pinned, [ready, waiting]);
  });
});
