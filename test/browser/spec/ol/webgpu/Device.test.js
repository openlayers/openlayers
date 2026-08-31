import {assert} from 'chai';
import {WEBGPU} from '../../../../../src/ol/has.js';
import {
  getCurrentDevice,
  isWebGPUAvailable,
  requestDevice,
} from '../../../../../src/ol/webgpu/Device.js';

describe('ol/webgpu/Device', () => {
  it('reports availability from navigator.gpu', () => {
    assert.strictEqual(isWebGPUAvailable(), WEBGPU);
  });

  it('rejects when WebGPU is missing', async function () {
    if (WEBGPU) {
      this.skip();
    }
    let error;
    try {
      await requestDevice();
    } catch (err) {
      error = err;
    }
    assert.instanceOf(error, Error);
  });

  it('requests a shared device', async function () {
    if (!WEBGPU) {
      this.skip();
    }
    const handle = await requestDevice();
    assert.isOk(handle.device);
    assert.strictEqual(getCurrentDevice(), handle);
    const again = await requestDevice();
    assert.strictEqual(again.device, handle.device);
  });
});
