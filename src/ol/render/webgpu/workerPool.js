/**
 * @module ol/render/webgpu/workerPool
 */
import {create as createWorker} from '../../worker/webgpuvector.js';

/**
 * Workers are only worth their startup cost when there is real work to spread
 * out, so the pool stays small and is created on first use.
 * @type {number}
 */
const POOL_SIZE = 2;

/**
 * @typedef {Object} PoolWorker
 * @property {Worker} worker Worker.
 * @property {number} load Requests sent to the worker and not yet settled.
 */

/**
 * @typedef {Object} PendingRequest
 * @property {function(import("./geometryBuffers.js").GeometryBuffers): void} resolve Resolve.
 * @property {function(Error): void} reject Reject.
 * @property {PoolWorker} worker Worker the request was sent to.
 */

/**
 * @classdesc
 * Pool of geometry workers. Each request goes to the least loaded worker.
 *
 * Every request settles. A worker that reports an error, or whose reply cannot
 * be read, is terminated, and the requests it still had are rejected so their
 * callers can try again. Failed workers are not replaced: once none is left,
 * `build()` returns null and callers tessellate on the main thread, where an
 * error that would crash any worker surfaces as an exception instead of
 * restarting workers in a loop.
 */
class WorkerPool {
  constructor() {
    /**
     * @private
     * @type {Array<PoolWorker>}
     */
    this.workers_ = [];

    /**
     * @private
     * @type {Map<number, PendingRequest>}
     */
    this.pending_ = new Map();

    /**
     * @private
     * @type {number}
     */
    this.nextId_ = 1;

    /**
     * @private
     * @type {boolean}
     */
    this.failed_ = false;
  }

  /**
   * @return {boolean} Workers can be used here.
   */
  isSupported() {
    return !this.failed_ && typeof Worker !== 'undefined';
  }

  /**
   * @private
   */
  start_() {
    if (this.workers_.length || this.failed_) {
      return;
    }
    try {
      for (let i = 0; i < POOL_SIZE; ++i) {
        const entry = {worker: createWorker(), load: 0};
        entry.worker.onmessage = (event) => this.handleMessage_(event.data);
        entry.worker.onerror = () => this.failWorker_(entry);
        entry.worker.onmessageerror = () => this.failWorker_(entry);
        this.workers_.push(entry);
      }
    } catch {
      // Fall back to building on the main thread.
      for (const entry of this.workers_) {
        entry.worker.terminate();
      }
      this.workers_.length = 0;
      this.failed_ = true;
    }
  }

  /**
   * @param {{id: number, buffers: Object}} data Reply from a worker.
   * @private
   */
  handleMessage_(data) {
    const request = this.pending_.get(data.id);
    if (!request) {
      return;
    }
    this.pending_.delete(data.id);
    --request.worker.load;
    const buffers = /** @type {any} */ (data.buffers);
    request.resolve({
      fillPositions: new Int16Array(buffers.fillPositions),
      fillStyles: new Uint32Array(buffers.fillStyles),
      fillIndices: new Uint32Array(buffers.fillIndices),
      strokePositions: new Int16Array(buffers.strokePositions),
      strokeAttributes: new Float32Array(buffers.strokeAttributes),
      strokeStyles: new Uint32Array(buffers.strokeStyles),
      strokeIndices: new Uint32Array(buffers.strokeIndices),
      styles: new Float32Array(buffers.styles),
      grid: buffers.grid,
      ranges: buffers.ranges || [],
    });
  }

  /**
   * Terminates a worker and rejects every request it has not answered.
   * @param {PoolWorker} entry Worker.
   * @private
   */
  failWorker_(entry) {
    const index = this.workers_.indexOf(entry);
    if (index === -1) {
      return;
    }
    this.workers_.splice(index, 1);
    entry.worker.terminate();
    if (!this.workers_.length) {
      this.failed_ = true;
    }
    const error = new Error('Geometry worker failed');
    for (const [id, request] of this.pending_) {
      if (request.worker === entry) {
        this.pending_.delete(id);
        request.reject(error);
      }
    }
  }

  /**
   * Tessellate off the main thread.
   *
   * `projectToTarget` cannot be cloned, so requests that still need per-vertex
   * reprojection are rejected and the caller builds them itself. The returned
   * promise rejects if the worker fails; the request's coordinate and style
   * arrays have been transferred by then, so the caller has to build them
   * again.
   *
   * @param {import("./geometryBuffers.js").GeometryRequest} request Request.
   * @return {Promise<import("./geometryBuffers.js").GeometryBuffers>|null} Result, or null when unavailable.
   */
  build(request) {
    if (request.projectToTarget) {
      return null;
    }
    this.start_();
    if (!this.workers_.length) {
      return null;
    }
    let target = this.workers_[0];
    for (const entry of this.workers_) {
      if (entry.load < target.load) {
        target = entry;
      }
    }
    const id = this.nextId_++;
    const coordinates = request.coordinates;
    const styles = request.styles;
    try {
      target.worker.postMessage(
        {
          id,
          request: {
            jobs: request.jobs,
            coordinates: coordinates.buffer,
            styles: styles.buffer,
            gridExtent: request.gridExtent,
            clipExtent: request.clipExtent,
            maxSegmentLength: request.maxSegmentLength,
            maxSpanX: request.maxSpanX,
            worldWidth: request.worldWidth,
            warpGrid: request.warpGrid,
            warpExtent: request.warpExtent,
            maxTargetError: request.maxTargetError,
            maxTargetEdge: request.maxTargetEdge,
          },
        },
        [coordinates.buffer, styles.buffer],
      );
    } catch {
      // Nothing is transferred when the message cannot be cloned, so the
      // caller can still build it on the main thread.
      return null;
    }
    ++target.load;
    return new Promise((resolve, reject) => {
      this.pending_.set(id, {resolve, reject, worker: target});
    });
  }
}

/**
 * @type {WorkerPool|null}
 */
let pool = null;

/**
 * @return {WorkerPool} The shared pool.
 */
export function getWorkerPool() {
  if (!pool) {
    pool = new WorkerPool();
  }
  return pool;
}
