import {assert} from 'chai';
import {inject} from 'vitest';
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

  it('rejects when WebGPU is missing', async (context) => {
    if (WEBGPU) {
      context.skip();
    }
    let error;
    try {
      await requestDevice();
    } catch (err) {
      error = err;
    }
    assert.instanceOf(error, Error);
  });

  it('requests a shared device', async (context) => {
    // Headless browsers can expose navigator.gpu without providing an adapter.
    if (!WEBGPU || !(await navigator.gpu.requestAdapter())) {
      context.skip();
    }
    const handle = await requestDevice();
    assert.isOk(handle.device);
    assert.strictEqual(getCurrentDevice(), handle);
    const again = await requestDevice();
    assert.strictEqual(again.device, handle.device);
  });

  it('has a hardware adapter where one is required', async (context) => {
    if (!inject('requireWebGPU')) {
      context.skip();
    }
    const adapter = await navigator.gpu?.requestAdapter();
    assert.isOk(adapter, 'No WebGPU adapter');
    assert.isFalse(
      adapter.info.isFallbackAdapter,
      `Software WebGPU adapter: ${adapter.info.architecture}`,
    );
  });
});
