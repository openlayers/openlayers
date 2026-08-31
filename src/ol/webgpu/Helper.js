/**
 * @module ol/webgpu/Helper
 */
import Disposable from '../Disposable.js';
import {assert} from '../asserts.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../vec/mat4.js';
import {
  addDeviceLostListener,
  getCurrentDevice,
  removeDeviceLostListener,
} from './Device.js';
import {countMetric} from './metrics.js';

/**
 * @typedef {Object} Options
 * @property {string} [canvasCacheKey] Cache key for sharing a canvas among consecutive WebGPU layers.
 */

/**
 * @typedef {Object} CanvasCacheItem
 * @property {HTMLCanvasElement} canvas Canvas.
 * @property {GPUCanvasContext} context Canvas context.
 * @property {number} users User count.
 * @property {number} frameIndex Last frame index.
 * @property {GPUCommandEncoder|null} encoder Pending encoder.
 * @property {GPUTextureView|null} colorView Current color view.
 * @property {GPUTexture|null} depthTexture Depth texture.
 * @property {boolean} cleared Whether this frame has been cleared.
 * @property {GPUTextureFormat} format Canvas format.
 */

/** @type {Object<string, CanvasCacheItem>} */
const canvasCache = {};

/**
 * @param {string} key Key.
 * @return {string} Shared key.
 */
function getSharedCanvasCacheKey(key) {
  return 'shared/' + key;
}

let uniqueCanvasCacheKeyCount = 0;

/**
 * @return {string} Unique key.
 */
function getUniqueCanvasCacheKey() {
  const key = 'unique/' + uniqueCanvasCacheKeyCount;
  uniqueCanvasCacheKeyCount += 1;
  return key;
}

/**
 * @param {string} key Cache key.
 * @param {GPUDevice} device Device.
 * @param {GPUTextureFormat} format Format.
 * @return {CanvasCacheItem} Cache item.
 */
function acquireCanvas(key, device, format) {
  let item = canvasCache[key];
  if (!item) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    const context = /** @type {GPUCanvasContext} */ (
      canvas.getContext('webgpu')
    );
    assert(context, 'Failed to create a WebGPU canvas context');
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    });
    item = {
      canvas,
      context,
      users: 0,
      frameIndex: -1,
      encoder: null,
      colorView: null,
      depthTexture: null,
      cleared: false,
      format,
    };
    canvasCache[key] = item;
  }
  item.users += 1;
  return item;
}

/**
 * @param {string} key Cache key.
 */
function releaseCanvas(key) {
  const item = canvasCache[key];
  if (!item) {
    return;
  }
  item.users -= 1;
  if (item.users > 0) {
    return;
  }
  if (item.depthTexture) {
    item.depthTexture.destroy();
  }
  item.canvas.width = 1;
  item.canvas.height = 1;
  delete canvasCache[key];
}

/**
 * @classdesc
 * Low-level WebGPU helpers: shared canvas, command encoding, pipelines, buffers.
 */
class WebGPUHelper extends Disposable {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();
    options = options || {};

    /**
     * @private
     * @type {string}
     */
    this.canvasCacheKey_ = options.canvasCacheKey
      ? getSharedCanvasCacheKey(options.canvasCacheKey)
      : getUniqueCanvasCacheKey();

    const handle = getCurrentDevice();
    assert(handle, 'WebGPU device is not ready');
    const deviceHandle = /** @type {import('./Device.js').DeviceHandle} */ (
      handle
    );

    /**
     * @private
     * @type {GPUDevice}
     */
    this.device_ = deviceHandle.device;

    /**
     * @private
     * @type {GPUTextureFormat}
     */
    this.format_ = deviceHandle.preferredFormat;

    /**
     * @private
     * @type {CanvasCacheItem}
     */
    this.cacheItem_ = acquireCanvas(
      this.canvasCacheKey_,
      this.device_,
      this.format_,
    );

    /**
     * @private
     * @type {boolean}
     */
    this.needsToBeRecreated_ = false;

    /**
     * @private
     */
    this.boundHandleLost_ = () => {
      this.needsToBeRecreated_ = true;
    };
    addDeviceLostListener(this.boundHandleLost_);

    /**
     * @private
     * @type {Map<string, GPURenderPipeline>}
     */
    this.pipelines_ = new Map();

    /**
     * @private
     * @type {Map<string, GPUComputePipeline>}
     */
    this.computePipelines_ = new Map();

    /**
     * @private
     * @type {GPUSampler}
     */
    this.linearSampler_ = this.device_.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    /**
     * @private
     * @type {GPUSampler}
     */
    this.nearestSampler_ = this.device_.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    /**
     * Unit quad (triangle strip): (0,0), (1,0), (0,1), (1,1)
     * @private
     * @type {GPUBuffer}
     */
    this.quadBuffer_ = this.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    );

    /**
     * @private
     * @type {GPURenderPassEncoder|null}
     */
    this.renderPass_ = null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = createMat4();
  }

  /**
   * @return {GPUDevice} Device.
   */
  getDevice() {
    return this.device_;
  }

  /**
   * @return {HTMLCanvasElement} Canvas.
   */
  getCanvas() {
    return this.cacheItem_.canvas;
  }

  /**
   * @return {GPUTextureFormat} Canvas format.
   */
  getFormat() {
    return this.format_;
  }

  /**
   * @return {GPUSampler} Linear sampler.
   */
  getLinearSampler() {
    return this.linearSampler_;
  }

  /**
   * @return {GPUSampler} Nearest sampler.
   */
  getNearestSampler() {
    return this.nearestSampler_;
  }

  /**
   * @param {string} canvasCacheKey Cache key.
   * @return {boolean} Matches.
   */
  canvasCacheKeyMatches(canvasCacheKey) {
    return this.canvasCacheKey_ === getSharedCanvasCacheKey(canvasCacheKey);
  }

  /**
   * @return {boolean} Helper should be recreated (device lost).
   */
  needsToBeRecreated() {
    return this.needsToBeRecreated_;
  }

  /**
   * @param {ArrayBuffer|ArrayBufferView} data Data.
   * @param {number} usage Usage flags.
   * @return {GPUBuffer} Buffer.
   */
  createBuffer(data, usage) {
    const bytes =
      data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    countMetric('gpuBufferCreates');
    countMetric('gpuBufferBytes', bytes);
    const buffer = this.device_.createBuffer({
      size: Math.max(4, (bytes + 3) & ~3),
      usage,
      mappedAtCreation: true,
    });
    const mapped = buffer.getMappedRange();
    const src =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    new Uint8Array(mapped).set(src);
    buffer.unmap();
    return buffer;
  }

  /**
   * @param {GPUBuffer} buffer Buffer.
   * @param {ArrayBufferView} data Data.
   */
  writeBuffer(buffer, data) {
    countMetric('gpuBufferWrites');
    this.device_.queue.writeBuffer(
      buffer,
      0,
      /** @type {BufferSource} */ (data),
    );
  }

  /**
   * @param {GPUCopyExternalImageSource} image Image.
   * @param {boolean} [interpolate] Linear filter.
   * @return {GPUTexture} Texture.
   */
  createTextureFromImage(image, interpolate = true) {
    const width =
      /** @type {HTMLImageElement} */ (image).naturalWidth ||
      /** @type {HTMLCanvasElement} */ (image).width;
    const height =
      /** @type {HTMLImageElement} */ (image).naturalHeight ||
      /** @type {HTMLCanvasElement} */ (image).height;
    const texture = this.device_.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device_.queue.copyExternalImageToTexture(
      {source: image},
      {texture, premultipliedAlpha: false},
      [width, height],
    );
    return texture;
  }

  /**
   * Upload unpremultiplied RGBA8 pixels (e.g. canvas getImageData).
   * @param {Uint8ClampedArray|Uint8Array} data Pixel data, width*height*4 bytes.
   * @param {number} width Width.
   * @param {number} height Height.
   * @return {GPUTexture} Texture.
   */
  createTextureFromRgba(data, width, height) {
    const texture = this.device_.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const unpadded = width * 4;
    const bytesPerRow = Math.ceil(unpadded / 256) * 256;
    let source = data;
    if (bytesPerRow !== unpadded) {
      const padded = new Uint8Array(bytesPerRow * height);
      for (let y = 0; y < height; ++y) {
        padded.set(
          data.subarray(y * unpadded, (y + 1) * unpadded),
          y * bytesPerRow,
        );
      }
      source = padded;
    }
    this.device_.queue.writeTexture(
      {texture},
      source,
      {bytesPerRow, rowsPerImage: height},
      {width, height},
    );
    return texture;
  }

  /**
   * @param {string} code WGSL.
   * @return {GPUShaderModule} Module.
   */
  createShaderModule(code) {
    return this.device_.createShaderModule({code});
  }

  /**
   * @param {string} key Cache key.
   * @param {GPURenderPipelineDescriptor} descriptor Descriptor.
   * @return {GPURenderPipeline} Pipeline.
   */
  getRenderPipeline(key, descriptor) {
    let pipeline = this.pipelines_.get(key);
    if (!pipeline) {
      pipeline = this.device_.createRenderPipeline(descriptor);
      this.pipelines_.set(key, pipeline);
    }
    return pipeline;
  }

  /**
   * @param {string} key Cache key.
   * @param {GPUComputePipelineDescriptor} descriptor Descriptor.
   * @return {GPUComputePipeline} Pipeline.
   */
  getComputePipeline(key, descriptor) {
    let pipeline = this.computePipelines_.get(key);
    if (!pipeline) {
      pipeline = this.device_.createComputePipeline(descriptor);
      this.computePipelines_.set(key, pipeline);
    }
    return pipeline;
  }

  /**
   * @return {GPUBuffer} Unit-quad vertex buffer.
   */
  getQuadBuffer() {
    return this.quadBuffer_;
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {boolean} [enableDepth] Depth testing.
   */
  prepareDraw(frameState, enableDepth) {
    const canvas = this.cacheItem_.canvas;
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;
    const width = Math.max(1, Math.round(size[0] * pixelRatio));
    const height = Math.max(1, Math.round(size[1] * pixelRatio));
    const item = this.cacheItem_;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = size[0] + 'px';
      canvas.style.height = size[1] + 'px';
      item.context.configure({
        device: this.device_,
        format: this.format_,
        alphaMode: 'premultiplied',
      });
      item.colorView = null;
      if (item.depthTexture) {
        item.depthTexture.destroy();
        item.depthTexture = null;
      }
    }

    if (item.frameIndex !== frameState.index) {
      item.frameIndex = frameState.index;
      item.encoder = this.device_.createCommandEncoder();
      item.colorView = item.context.getCurrentTexture().createView();
      item.cleared = false;
    } else if (!item.encoder) {
      // Additional pass this frame (shared canvas or declutter) after an
      // earlier submit. Reuse the current swap-chain texture.
      item.encoder = this.device_.createCommandEncoder();
      if (!item.colorView) {
        item.colorView = item.context.getCurrentTexture().createView();
      }
    }

    if (enableDepth && !item.depthTexture) {
      item.depthTexture = this.device_.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    } else if (
      enableDepth &&
      item.depthTexture &&
      (item.depthTexture.width !== canvas.width ||
        item.depthTexture.height !== canvas.height)
    ) {
      item.depthTexture.destroy();
      item.depthTexture = this.device_.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    const loadOp = /** @type {GPULoadOp} */ (item.cleared ? 'load' : 'clear');
    item.cleared = true;

    /** @type {GPURenderPassColorAttachment} */
    const colorAttachment = {
      view: /** @type {GPUTextureView} */ (item.colorView),
      loadOp,
      storeOp: 'store',
      clearValue: {r: 0, g: 0, b: 0, a: 0},
    };

    /** @type {GPURenderPassDescriptor} */
    const passDescriptor = {
      colorAttachments: [colorAttachment],
    };
    if (enableDepth && item.depthTexture) {
      passDescriptor.depthStencilAttachment = {
        view: item.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: loadOp,
        depthStoreOp: 'store',
      };
    }

    this.renderPass_ = /** @type {GPUCommandEncoder} */ (
      item.encoder
    ).beginRenderPass(passDescriptor);
  }

  /**
   * @return {GPURenderPassEncoder} Current render pass.
   */
  getRenderPass() {
    const pass = this.renderPass_;
    assert(pass, 'prepareDraw must be called first');
    return /** @type {GPURenderPassEncoder} */ (pass);
  }

  /**
   * @return {GPUCommandEncoder} Current encoder.
   */
  getEncoder() {
    const encoder = this.cacheItem_.encoder;
    assert(encoder, 'prepareDraw must be called first');
    return /** @type {GPUCommandEncoder} */ (encoder);
  }

  /**
   * Submit recorded commands immediately. The canvas current texture is
   * invalid after returning to the event loop (Map runs post-render work in
   * a timeout), so this cannot be deferred.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  finalizeDraw(frameState) {
    if (this.renderPass_) {
      this.renderPass_.end();
      this.renderPass_ = null;
    }
    const item = this.cacheItem_;
    if (!item.encoder) {
      return;
    }
    this.device_.queue.submit([item.encoder.finish()]);
    item.encoder = null;
  }

  /**
   * World-to-clip matrix from the frame (Y up, origin center).
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("../transform.js").Transform} worldToView World to view pixels.
   * @return {Array<number>} 4x4 matrix.
   */
  worldToClip(frameState, worldToView) {
    const size = frameState.size;
    const sx = 2 / size[0];
    const sy = -2 / size[1];
    const clip = [
      worldToView[0] * sx,
      worldToView[1] * sy,
      worldToView[2] * sx,
      worldToView[3] * sy,
      worldToView[4] * sx - 1,
      worldToView[5] * sy + 1,
    ];
    return mat4FromTransform(this.tmpMat4_, clip);
  }

  /**
   * @override
   */
  disposeInternal() {
    removeDeviceLostListener(this.boundHandleLost_);
    this.quadBuffer_.destroy();
    releaseCanvas(this.canvasCacheKey_);
  }
}

export default WebGPUHelper;
