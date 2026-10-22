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
/**
 * @typedef {Object} Options
 * @property {string} [canvasCacheKey] Cache key for sharing a canvas among consecutive WebGPU layers.
 */

/**
 * A region of the canvas, in device pixels from its top left corner.
 *
 * @typedef {Object} HitRect
 * @property {number} x Left.
 * @property {number} y Top.
 * @property {number} width Width.
 * @property {number} height Height.
 */

/**
 * @typedef {Object} CanvasCacheItem
 * @property {HTMLCanvasElement} canvas Canvas.
 * @property {GPUCanvasContext} context Canvas context.
 * @property {GPUDevice} device Device the context is configured for.
 * @property {number} users User count.
 * @property {number} frameIndex Last frame index.
 * @property {GPUCommandEncoder|null} encoder Pending encoder.
 * @property {GPUTextureView|null} colorView Current color view.
 * @property {GPUTexture|null} depthTexture Depth texture.
 * @property {boolean} cleared Whether this frame's color target has been cleared.
 * @property {boolean} depthCleared Whether this frame's depth target has been cleared.
 * @property {GPUTextureFormat} format Canvas format.
 */

/** @type {Object<string, CanvasCacheItem>} */
const canvasCache = {};

/**
 * `GPUMapMode.READ`.
 * @type {number}
 */
const MAP_MODE_READ = 1;

/**
 * One triangle covering the canvas, every fragment all ones; the blend state
 * of the pipeline decides what that does to the target.
 */
const BACKGROUND_SHADER = `
@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let xy = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  return vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
}

@fragment
fn fs() -> @location(0) vec4f {
  return vec4f(1.0);
}
`;

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
 * Shares a canvas among the helpers that use the same key. Helpers replacing
 * ones whose device was lost can find the canvas still held by layers that have
 * not been recreated yet, so a canvas configured for another device is
 * reconfigured for the new one, and its per-frame state is dropped.
 * @param {string} key Cache key.
 * @param {GPUDevice} device Device.
 * @param {GPUTextureFormat} format Format.
 * @return {CanvasCacheItem} Cache item.
 */
function acquireCanvas(key, device, format) {
  let item = canvasCache[key];
  if (item && item.device !== device) {
    item.context.configure({device, format, alphaMode: 'premultiplied'});
    item.device = device;
    item.format = format;
    item.depthTexture?.destroy();
    item.depthTexture = null;
    item.encoder = null;
    item.colorView = null;
    item.frameIndex = -1;
  }
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
      device,
      users: 0,
      frameIndex: -1,
      encoder: null,
      colorView: null,
      depthTexture: null,
      cleared: false,
      depthCleared: false,
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
     * The target of hit passes. It is shared by every layer using this helper.
     * @private
     * @type {GPUTexture|null}
     */
    this.hitTexture_ = null;

    /**
     * @private
     * @type {GPUCommandEncoder|null}
     */
    this.hitEncoder_ = null;

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
   * @param {number} [bufferOffset] Destination offset in bytes.
   */
  writeBuffer(buffer, data, bufferOffset = 0) {
    this.device_.queue.writeBuffer(
      buffer,
      bufferOffset,
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
   * Copy an unpremultiplied rectangle of an external image into an existing texture.
   * @param {GPUTexture} texture Destination.
   * @param {GPUCopyExternalImageSource} image Source.
   * @param {number} x Left column.
   * @param {number} y Top row.
   * @param {number} width Width.
   * @param {number} height Height.
   */
  copyTextureRegion(texture, image, x, y, width, height) {
    if (width <= 0 || height <= 0) {
      return;
    }
    this.device_.queue.copyExternalImageToTexture(
      {source: image, origin: {x, y}},
      {texture, origin: {x, y}, premultipliedAlpha: false},
      [width, height],
    );
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
   * @param {Array<number>} [clearColor] Premultiplied RGBA 0-1 for the frame
   * clear. Transparent black when omitted. Once the frame's color target has
   * been cleared, it is composited over what earlier layers drew instead.
   * Depth clears on the first depth pass of the frame, including when an
   * earlier pass already loaded the color target.
   */
  prepareDraw(frameState, enableDepth, clearColor) {
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
        item.depthCleared = false;
      }
    }

    if (item.frameIndex !== frameState.index) {
      item.frameIndex = frameState.index;
      item.encoder = this.device_.createCommandEncoder();
      item.colorView = item.context.getCurrentTexture().createView();
      item.cleared = false;
      item.depthCleared = false;
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
      item.depthCleared = false;
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
      item.depthCleared = false;
    }

    const loadOp = /** @type {GPULoadOp} */ (item.cleared ? 'load' : 'clear');
    item.cleared = true;
    if (loadOp === 'load' && clearColor) {
      this.drawBackground_(clearColor);
    }
    const depthLoadOp = /** @type {GPULoadOp} */ (
      item.depthCleared ? 'load' : 'clear'
    );
    if (enableDepth) {
      item.depthCleared = true;
    }

    /** @type {GPURenderPassColorAttachment} */
    const colorAttachment = {
      view: /** @type {GPUTextureView} */ (item.colorView),
      loadOp,
      storeOp: 'store',
      clearValue: clearColor
        ? {
            r: clearColor[0],
            g: clearColor[1],
            b: clearColor[2],
            a: clearColor[3] === undefined ? 1 : clearColor[3],
          }
        : {r: 0, g: 0, b: 0, a: 0},
    };

    /** @type {GPURenderPassDescriptor} */
    const passDescriptor = {
      colorAttachments: [colorAttachment],
    };
    if (enableDepth && item.depthTexture) {
      passDescriptor.depthStencilAttachment = {
        view: item.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp,
        depthStoreOp: 'store',
      };
    }

    this.renderPass_ = /** @type {GPUCommandEncoder} */ (
      item.encoder
    ).beginRenderPass(passDescriptor);
  }

  /**
   * Composite a premultiplied color over the whole canvas, in a pass of its
   * own before the layer's. The color travels as the blend constant, so the
   * pipelines need no buffers: one draw scales what is below by the color's
   * transparency, the next adds the color.
   *
   * @param {Array<number>} color Premultiplied RGBA 0-1.
   * @private
   */
  drawBackground_(color) {
    const alpha = color[3] === undefined ? 1 : color[3];
    if (!(alpha > 0)) {
      return;
    }
    const item = this.cacheItem_;
    const pass = /** @type {GPUCommandEncoder} */ (
      item.encoder
    ).beginRenderPass({
      colorAttachments: [
        {
          view: /** @type {GPUTextureView} */ (item.colorView),
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(this.getBackgroundPipeline_('zero', 'one-minus-constant'));
    pass.setBlendConstant({r: alpha, g: alpha, b: alpha, a: alpha});
    pass.draw(3);
    pass.setPipeline(this.getBackgroundPipeline_('constant', 'one'));
    pass.setBlendConstant({r: color[0], g: color[1], b: color[2], a: alpha});
    pass.draw(3);
    pass.end();
  }

  /**
   * @param {GPUBlendFactor} srcFactor Factor for the fragment, which is all ones.
   * @param {GPUBlendFactor} dstFactor Factor for what is already drawn.
   * @return {GPURenderPipeline} Pipeline drawing one triangle over the canvas.
   * @private
   */
  getBackgroundPipeline_(srcFactor, dstFactor) {
    const key = 'background/' + srcFactor + '/' + dstFactor;
    const cached = this.pipelines_.get(key);
    if (cached) {
      return cached;
    }
    const module = this.createShaderModule(BACKGROUND_SHADER);
    const component = {srcFactor, dstFactor, operation: 'add'};
    return this.getRenderPipeline(key, {
      layout: 'auto',
      vertex: {module, entryPoint: 'vs'},
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [
          {
            format: this.format_,
            blend: {
              color: /** @type {GPUBlendComponent} */ (component),
              alpha: /** @type {GPUBlendComponent} */ (component),
            },
          },
        ],
      },
      primitive: {topology: 'triangle-list'},
    });
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
   * Start a pass that draws to an offscreen texture instead of the canvas, so
   * that what is drawn can be read back with {@link WebGPUHelper#finishHitPass}.
   * Anything drawn is limited to `rect`, and the rest of the texture is left
   * transparent black. The texture has the size and format of the canvas, so
   * the render bundles recorded for a frame can be executed in it. It is
   * allocated here, the first time it is needed.
   *
   * @param {HitRect} rect Region to draw, in canvas pixels.
   */
  beginHitPass(rect) {
    const canvas = this.cacheItem_.canvas;
    let texture = this.hitTexture_;
    if (
      !texture ||
      texture.width !== canvas.width ||
      texture.height !== canvas.height
    ) {
      texture?.destroy();
      texture = this.device_.createTexture({
        size: [canvas.width, canvas.height],
        format: this.format_,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      this.hitTexture_ = texture;
    }
    this.hitEncoder_ = this.device_.createCommandEncoder();
    const pass = this.hitEncoder_.beginRenderPass({
      colorAttachments: [
        {
          view: texture.createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: {r: 0, g: 0, b: 0, a: 0},
        },
      ],
    });
    pass.setScissorRect(rect.x, rect.y, rect.width, rect.height);
    this.renderPass_ = pass;
  }

  /**
   * Finish the pass started by {@link WebGPUHelper#beginHitPass}, and read back
   * the pixels of its region. Rejects when the device is lost while waiting.
   *
   * @param {HitRect} rect Region passed to `beginHitPass`.
   * @return {Promise<Uint8Array>} The region's pixels, row after row, as
   * red, green, blue and alpha bytes whatever the canvas format is.
   */
  async finishHitPass(rect) {
    const pass = /** @type {GPURenderPassEncoder} */ (this.renderPass_);
    const encoder = /** @type {GPUCommandEncoder} */ (this.hitEncoder_);
    const texture = /** @type {GPUTexture} */ (this.hitTexture_);
    assert(pass && encoder && texture, 'beginHitPass must be called first');
    pass.end();
    this.renderPass_ = null;
    this.hitEncoder_ = null;
    const bytesPerRow = Math.ceil((rect.width * 4) / 256) * 256;
    const buffer = this.device_.createBuffer({
      size: bytesPerRow * rect.height,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    try {
      encoder.copyTextureToBuffer(
        {texture, origin: {x: rect.x, y: rect.y}},
        {buffer, bytesPerRow},
        {width: rect.width, height: rect.height},
      );
      this.device_.queue.submit([encoder.finish()]);
      await buffer.mapAsync(MAP_MODE_READ);
      const mapped = new Uint8Array(buffer.getMappedRange());
      const pixels = new Uint8Array(rect.width * rect.height * 4);
      const swap = this.format_.startsWith('bgra');
      for (let row = 0; row < rect.height; ++row) {
        const from = row * bytesPerRow;
        const to = row * rect.width * 4;
        pixels.set(mapped.subarray(from, from + rect.width * 4), to);
      }
      if (swap) {
        for (let i = 0; i < pixels.length; i += 4) {
          const blue = pixels[i];
          pixels[i] = pixels[i + 2];
          pixels[i + 2] = blue;
        }
      }
      return pixels;
    } finally {
      buffer.destroy();
    }
  }

  /**
   * Free what hit passes allocated. A later pass allocates it again.
   */
  releaseHitResources() {
    this.hitTexture_?.destroy();
    this.hitTexture_ = null;
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
    this.releaseHitResources();
    this.quadBuffer_.destroy();
    releaseCanvas(this.canvasCacheKey_);
  }
}

export default WebGPUHelper;
