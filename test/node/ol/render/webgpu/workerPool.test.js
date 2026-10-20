import {assert} from 'chai';

const workers = vi.hoisted(() => /** @type {Array<Object>} */ ([]));

vi.mock('../../../../../src/ol/worker/webgpuvector.js', () => ({
  create() {
    const worker = {
      messages: [],
      terminated: false,
      onmessage: null,
      onerror: null,
      onmessageerror: null,
      postMessage(message) {
        this.messages.push(message);
      },
      terminate() {
        this.terminated = true;
      },
    };
    workers.push(worker);
    return worker;
  },
}));

describe('ol/render/webgpu/workerPool', () => {
  beforeEach(() => {
    workers.length = 0;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects the requests of a failed worker and keeps using the others', async () => {
    const pool = await createPool();
    const failing = pool.build(createRequest());
    const surviving = pool.build(createRequest());
    const [first, second] = workers;
    assert.strictEqual(first.messages.length, 1);
    assert.strictEqual(second.messages.length, 1);

    first.onerror(new Event('error'));

    let error;
    try {
      await failing;
    } catch (err) {
      error = err;
    }
    assert.instanceOf(error, Error);
    assert.isTrue(first.terminated);

    second.onmessage({
      data: {id: second.messages[0].id, buffers: createReply()},
    });
    const geometry = await surviving;
    assert.instanceOf(geometry.fillIndices, Uint32Array);

    pool.build(createRequest());
    assert.strictEqual(first.messages.length, 1);
    assert.strictEqual(second.messages.length, 2);
  });

  it('leaves building to the main thread once every worker has failed', async () => {
    const pool = await createPool();
    const pending = pool.build(createRequest());
    const [first, second] = workers;

    first.onerror(new Event('error'));
    second.onmessageerror(new Event('messageerror'));

    assert.isFalse(pool.isSupported());
    assert.isNull(pool.build(createRequest()));
    assert.isTrue(second.terminated);
    let error;
    try {
      await pending;
    } catch (err) {
      error = err;
    }
    assert.instanceOf(error, Error);
  });
});

/**
 * `isSupported()` checks for a `Worker` constructor, which Node lacks.
 * @return {Promise<Object>} A fresh pool.
 */
async function createPool() {
  vi.stubGlobal('Worker', function () {});
  const {getWorkerPool} =
    await import('../../../../../src/ol/render/webgpu/workerPool.js');
  return getWorkerPool();
}

/**
 * @return {import("../../../../../src/ol/render/webgpu/geometryBuffers.js").GeometryRequest} Request.
 */
function createRequest() {
  return /** @type {any} */ ({
    jobs: [],
    coordinates: new Float64Array(2),
    styles: new Float32Array(1),
    gridExtent: [0, 0, 1, 1],
  });
}

/**
 * @return {Object} Transferred buffers, as a worker sends them back.
 */
function createReply() {
  return {
    fillPositions: new ArrayBuffer(0),
    fillStyles: new ArrayBuffer(0),
    fillIndices: new ArrayBuffer(0),
    fillExtrusions: new ArrayBuffer(0),
    strokePositions: new ArrayBuffer(0),
    strokeAttributes: new ArrayBuffer(0),
    strokeStyles: new ArrayBuffer(0),
    strokeIndices: new ArrayBuffer(0),
    styles: new ArrayBuffer(0),
    grid: null,
    ranges: [],
  };
}
