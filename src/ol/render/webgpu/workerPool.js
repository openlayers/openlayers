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
 * @typedef {Object} PendingRequest
 * @property {function(import("./geometryBuffers.js").GeometryBuffers): void} resolve Resolve.
 * @property {function(Error): void} reject Reject.
 */

/**
 * @classdesc
 * Round-robin pool of geometry workers.
 */
class WorkerPool {
  constructor() {
    /**
     * @private
     * @type {Array<{worker: Worker, load: number}>}
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
        const worker = createWorker();
        const entry = {worker, load: 0};
        worker.onmessage = (event) => {
          --entry.load;
          const data = event.data;
          const request = this.pending_.get(data.id);
          if (!request) {
            return;
          }
          this.pending_.delete(data.id);
          const buffers = data.buffers;
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
        };
        worker.onerror = () => {
          --entry.load;
          this.failed_ = true;
        };
        this.workers_.push(entry);
      }
    } catch {
      // Fall back to building on the main thread.
      this.failed_ = true;
      this.workers_.length = 0;
    }
  }

  /**
   * Tessellate off the main thread.
   *
   * `projectToTarget` cannot be cloned, so requests that still need per-vertex
   * reprojection are rejected and the caller builds them itself.
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
    ++target.load;
    const promise = new Promise((resolve, reject) => {
      this.pending_.set(id, {resolve, reject});
    });
    const coordinates = request.coordinates;
    const styles = request.styles;
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
    return promise;
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
