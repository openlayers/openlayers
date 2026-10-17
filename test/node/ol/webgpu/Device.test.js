import {assert} from 'chai';

describe('ol/webgpu/Device', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retries after a failed request', async () => {
    const gpu = installGpu([null, createAdapter()]);
    const {getCurrentDevice, requestDevice} = await importDevice();

    let error;
    try {
      await requestDevice();
    } catch (err) {
      error = err;
    }
    assert.instanceOf(error, Error);
    assert.isNull(getCurrentDevice());

    const handle = await requestDevice();
    assert.strictEqual(getCurrentDevice(), handle);
    assert.strictEqual(gpu.requestAdapter.mock.calls.length, 2);
  });

  it('acquires a new device after the current one is lost', async () => {
    installGpu([createAdapter(), createAdapter()]);
    const {addDeviceLostListener, getCurrentDevice, requestDevice} =
      await importDevice();
    const first = await requestDevice();
    const lost = new Promise((resolve) => addDeviceLostListener(resolve));

    first.device.destroy();
    await lost;
    assert.isNull(getCurrentDevice());

    const second = await requestDevice();
    assert.notStrictEqual(second.device, first.device);
    assert.strictEqual(getCurrentDevice(), second);
  });

  describe('with a WebGPU layer renderer', () => {
    it('requests the device again on the next frame after a failure', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const gpu = installGpu([null, null, createAdapter()]);
      const {layer, renderer, getCurrentDevice} = await createRenderer();

      assert.isFalse(renderer.prepareFrame({}));
      await settle();
      assert.isFalse(renderer.prepareFrame({}));
      await settle();
      const revision = layer.getRevision();
      assert.isFalse(renderer.prepareFrame({}));
      await settle();

      assert.strictEqual(gpu.requestAdapter.mock.calls.length, 3);
      assert.isOk(getCurrentDevice());
      assert.isAbove(layer.getRevision(), revision);
      assert.strictEqual(warn.mock.calls.length, 1);
    });

    it('renders again and requests a new device after device loss', async () => {
      const gpu = installGpu([createAdapter(), createAdapter()]);
      const {layer, renderer, getCurrentDevice, addDeviceLostListener} =
        await createRenderer();
      renderer.prepareFrame({});
      await settle();
      const first = getCurrentDevice();
      const revision = layer.getRevision();
      const lost = new Promise((resolve) => addDeviceLostListener(resolve));

      first.device.destroy();
      await lost;
      assert.isAbove(layer.getRevision(), revision);

      assert.isFalse(renderer.prepareFrame({}));
      await settle();
      assert.strictEqual(gpu.requestAdapter.mock.calls.length, 2);
      assert.notStrictEqual(getCurrentDevice().device, first.device);
    });
  });
});

/**
 * Makes `navigator.gpu` hand out the given adapters, one per request. A null
 * entry is a request that finds no adapter.
 * @param {Array<Object|null>} adapters Adapters.
 * @return {Object} The fake `navigator.gpu`.
 */
function installGpu(adapters) {
  const gpu = {
    requestAdapter: vi.fn(async () => adapters.shift() ?? null),
    getPreferredCanvasFormat: () => 'bgra8unorm',
  };
  vi.stubGlobal('navigator', {userAgent: '', gpu});
  return gpu;
}

/**
 * @return {Object} An adapter whose device is lost when it is destroyed.
 */
function createAdapter() {
  return {
    async requestDevice() {
      let markLost;
      const lost = new Promise((resolve) => {
        markLost = resolve;
      });
      return {
        lost,
        destroy() {
          markLost({reason: 'destroyed'});
        },
      };
    },
  };
}

/**
 * The WebGPU capability is read once, when `ol/has` is imported, so the
 * modules are imported again after `navigator.gpu` has been stubbed.
 * @return {Promise<Object>} The device module.
 */
async function importDevice() {
  vi.resetModules();
  return import('../../../../src/ol/webgpu/Device.js');
}

/**
 * @return {Promise<Object>} A renderer for a layer with a source, and the
 * device module it uses.
 */
async function createRenderer() {
  const device = await importDevice();
  const {default: Layer} = await import('../../../../src/ol/layer/Layer.js');
  const {default: Source} = await import('../../../../src/ol/source/Source.js');
  const {default: WebGPULayerRenderer} =
    await import('../../../../src/ol/renderer/webgpu/Layer.js');
  const layer = new Layer({source: new Source({})});
  const renderer = new WebGPULayerRenderer(layer);
  return {layer, renderer, ...device};
}

/**
 * @return {Promise<void>} Resolves once pending promise callbacks have run.
 */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
