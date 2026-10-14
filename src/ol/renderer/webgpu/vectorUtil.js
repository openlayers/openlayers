/**
 * @module ol/renderer/webgpu/vectorUtil
 */
import Disposable from '../../Disposable.js';
import {SYMBOL_STRIDE} from '../../render/webgpu/buffers.js';
import {comparePaint} from '../../render/webgpu/drawOrder.js';
import {GLYPH_INSTANCE_STRIDE} from '../../render/webgpu/glyphLayout.js';
import {fadeClock, LABEL_FADE_DURATION} from '../../render/webgpu/labelFade.js';
import {countMetric} from '../../webgpu/metrics.js';
import {
  localCoordinateToPixel,
  projectionMatrixFromFrame,
} from '../../webgpu/reproj.js';
import {
  GLYPH_SHADER,
  SYMBOL_SHADER,
  VECTOR_FILL_SHADER,
  VECTOR_FILL_WARPED_SHADER,
  VECTOR_STROKE_SHADER,
  VECTOR_STROKE_WARPED_SHADER,
  VECTOR_WARP_SHADER,
} from '../../webgpu/shaders.js';

export {SYMBOL_STRIDE};
export const FRAME_UNIFORM_SIZE = 112;

/** @type {GPUBlendState} */
const BLEND = {
  color: {
    srcFactor: 'one',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
  alpha: {
    srcFactor: 'one',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
};

/**
 * Scratch transform for folding a batch's grid into the view transform.
 * @type {import("../../transform.js").Transform}
 */
const localTransform = [1, 0, 0, 1, 0, 0];

/**
 * @classdesc
 * Everything one batch needs on the GPU: geometry in local grid units, its
 * style table, a uniform buffer for the grid-to-clip matrix, and the bind
 * groups tying them together.
 *
 * Geometry is uploaded once. A camera change only rewrites the 96-byte uniform
 * buffer, and the bind groups stay valid because every buffer they reference is
 * owned here.
 */
export class VectorGpuBuffers extends Disposable {
  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
   */
  constructor(helper, buffers) {
    super();

    /**
     * @type {import("../../render/webgpu/buffers.js").LocalGrid}
     */
    this.grid = buffers.grid;

    /**
     * @type {number}
     */
    this.fillIndexCount = buffers.fillIndices.length;

    /**
     * @type {number}
     */
    this.fillVertexCount = buffers.fillPositions.length / 2;

    /**
     * @type {number}
     */
    this.strokeIndexCount = buffers.strokeIndices.length;

    /**
     * @type {number}
     */
    this.strokeVertexCount = buffers.strokePositions.length / 2;

    /**
     * @private
     * @type {Array<GPUBuffer>}
     */
    this.owned_ = [];

    /**
     * @type {GPUBuffer|null}
     */
    this.fillPositionBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.fillStyleBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.fillIndexBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokePositionBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokeAttributeBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokeStyleBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokeIndexBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.styleBuffer = null;

    // Positions and stroke attributes are also read by the warp compute pass.
    const vertex =
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE;
    const index = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
    if (this.fillIndexCount) {
      this.fillPositionBuffer = this.create_(
        helper,
        buffers.fillPositions,
        vertex,
      );
      this.fillStyleBuffer = this.create_(helper, buffers.fillStyles, vertex);
      this.fillIndexBuffer = this.create_(helper, buffers.fillIndices, index);
    }
    if (this.strokeIndexCount) {
      this.strokePositionBuffer = this.create_(
        helper,
        buffers.strokePositions,
        vertex,
      );
      this.strokeAttributeBuffer = this.create_(
        helper,
        buffers.strokeAttributes,
        vertex,
      );
      this.strokeStyleBuffer = this.create_(
        helper,
        buffers.strokeStyles,
        vertex,
      );
      this.strokeIndexBuffer = this.create_(
        helper,
        buffers.strokeIndices,
        index,
      );
    }
    if (this.fillIndexCount || this.strokeIndexCount) {
      this.styleBuffer = this.create_(
        helper,
        buffers.styles,
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      );
    }

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.uniformBuffer_ =
      this.fillIndexCount || this.strokeIndexCount
        ? helper.getDevice().createBuffer({
            size: FRAME_UNIFORM_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          })
        : null;

    /**
     * @private
     * @type {Map<string, GPUBindGroup>}
     */
    this.bindGroups_ = new Map();

    /**
     * Positions have been warped into the view projection by the compute pass.
     * @type {boolean}
     */
    this.warped = false;

    /**
     * @type {GPUBuffer|null}
     */
    this.fillWarpedBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokeWarpedBuffer = null;

    /**
     * @type {GPUBuffer|null}
     */
    this.strokeWarpedAttributeBuffer = null;
  }

  /**
   * Project this batch's geometry into the view projection on the GPU.
   *
   * The heavy part, sampling proj4, already happened once when the grid was
   * built; this only interpolates it, and only when the grid changes.
   *
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {import("../../render/webgpu/warpGrid.js").WarpGrid} grid Warp grid.
   */
  applyWarp(helper, grid) {
    if (!grid.usable || !this.uniformBuffer_) {
      return;
    }
    const device = helper.getDevice();
    const storage =
      GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    const nodeBuffer = this.create_(
      helper,
      grid.nodes,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    // Two buffers, because WebGPU forbids binding one buffer as both readable
    // and writable storage in the same bind group.
    const dummyRead = this.create_(
      helper,
      new Float32Array(4),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    const dummyWrite = this.create_(
      helper,
      new Float32Array(4),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    const pipeline = helper.getComputePipeline(
      'vector-warp',
      /** @type {any} */ ({}),
    );
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();

    /**
     * @param {number} vertexCount Vertices to warp.
     * @param {GPUBuffer} positions Packed int16 grid positions.
     * @param {GPUBuffer|null} inAttributes Stroke normals and widths.
     * @param {boolean} strokeMode Also warp normals.
     * @return {{outPositions: GPUBuffer, outAttributes: GPUBuffer}} Outputs.
     */
    const dispatch = (vertexCount, positions, inAttributes, strokeMode) => {
      const outPositions = this.create_(
        helper,
        new Float32Array(vertexCount * 4),
        storage,
      );
      const outAttributes = strokeMode
        ? this.create_(helper, new Float32Array(vertexCount * 4), storage)
        : dummyWrite;
      const uniformData = new ArrayBuffer(32);
      new Uint32Array(uniformData, 0, 4).set([
        grid.cells,
        vertexCount,
        strokeMode ? 1 : 0,
        0,
      ]);
      new Float32Array(uniformData, 16, 4).set([
        grid.cellSize,
        grid.maxEdge,
        grid.unitsPerCell[0],
        grid.unitsPerCell[1],
      ]);
      const uniforms = this.create_(
        helper,
        new Uint8Array(uniformData),
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      );
      pass.setPipeline(pipeline);
      pass.setBindGroup(
        0,
        device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            {binding: 0, resource: {buffer: uniforms}},
            {binding: 1, resource: {buffer: nodeBuffer}},
            {binding: 2, resource: {buffer: positions}},
            {binding: 3, resource: {buffer: outPositions}},
            {binding: 4, resource: {buffer: inAttributes || dummyRead}},
            {binding: 5, resource: {buffer: outAttributes}},
          ],
        }),
      );
      pass.dispatchWorkgroups(Math.ceil(vertexCount / 64));
      return {outPositions, outAttributes};
    };

    if (this.fillIndexCount && this.fillPositionBuffer) {
      const result = dispatch(
        this.fillVertexCount,
        this.fillPositionBuffer,
        null,
        false,
      );
      this.fillWarpedBuffer = result.outPositions;
    }
    if (this.strokeIndexCount && this.strokePositionBuffer) {
      const result = dispatch(
        this.strokeVertexCount,
        this.strokePositionBuffer,
        this.strokeAttributeBuffer,
        true,
      );
      this.strokeWarpedBuffer = result.outPositions;
      this.strokeWarpedAttributeBuffer = result.outAttributes;
    }

    pass.end();
    device.queue.submit([encoder.finish()]);
    countMetric('warpPasses');

    // Warped positions are absolute target offsets from the grid origin, so
    // drawing them only needs a translation.
    this.grid = {
      originX: grid.origin[0],
      originY: grid.origin[1],
      scaleX: 1,
      scaleY: 1,
    };
    this.warped = true;
    this.bindGroups_.clear();
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {ArrayBufferView} data Data.
   * @param {number} usage Usage.
   * @return {GPUBuffer} Buffer.
   * @private
   */
  create_(helper, data, usage) {
    const buffer = helper.createBuffer(data, usage);
    this.owned_.push(buffer);
    return buffer;
  }

  /**
   * @return {boolean} There is something to draw.
   */
  hasGeometry() {
    return !!this.uniformBuffer_;
  }

  /**
   * Point the batch at the current camera. This is the only per-frame GPU work
   * for geometry that has not changed.
   *
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {Float32Array} data Scratch uniform data.
   * @param {Float32Array} projMat Scratch projection matrix.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {number} hitDetection Hit flag.
   * @param {number} [worldOffset] X offset in view coordinates.
   */
  writeUniforms(helper, data, projMat, frameState, hitDetection, worldOffset) {
    if (!this.uniformBuffer_) {
      return;
    }
    const grid = this.grid;
    localCoordinateToPixel(
      frameState.coordinateToPixelTransform,
      grid.originX + (worldOffset || 0),
      grid.originY,
      grid.scaleX,
      grid.scaleY,
      localTransform,
    );
    projectionMatrixFromFrame(frameState, localTransform, projMat);
    data.fill(0);
    data.set(projMat, 0);
    data[16] = -Infinity;
    data[17] = -Infinity;
    data[18] = Infinity;
    data[19] = Infinity;
    data[20] = frameState.size[0];
    data[21] = frameState.size[1];
    data[22] = frameState.layerStatesArray[frameState.layerIndex].opacity;
    data[23] = hitDetection;
    data[24] = fadeClock(frameState.time || 0);
    data[25] = LABEL_FADE_DURATION;
    data[26] = 1 / frameState.viewState.resolution;
    helper.writeBuffer(this.uniformBuffer_, data);
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {string} name Pipeline name.
   * @param {GPURenderPipeline} pipeline Pipeline.
   * @return {GPUBindGroup} Bind group.
   */
  getBindGroup(helper, name, pipeline) {
    const cached = this.bindGroups_.get(name);
    if (cached) {
      return cached;
    }
    countMetric('bindGroups');
    const bindGroup = helper.getDevice().createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {buffer: /** @type {GPUBuffer} */ (this.uniformBuffer_)},
        },
        {
          binding: 1,
          resource: {buffer: /** @type {GPUBuffer} */ (this.styleBuffer)},
        },
      ],
    });
    this.bindGroups_.set(name, bindGroup);
    return bindGroup;
  }

  /**
   * @override
   */
  disposeInternal() {
    for (const buffer of this.owned_) {
      buffer.destroy();
    }
    this.owned_.length = 0;
    this.uniformBuffer_?.destroy();
    this.uniformBuffer_ = null;
    this.bindGroups_.clear();
    this.fillPositionBuffer = null;
    this.fillStyleBuffer = null;
    this.fillIndexBuffer = null;
    this.strokePositionBuffer = null;
    this.strokeAttributeBuffer = null;
    this.strokeStyleBuffer = null;
    this.strokeIndexBuffer = null;
    this.styleBuffer = null;
    this.fillWarpedBuffer = null;
    this.strokeWarpedBuffer = null;
    this.strokeWarpedAttributeBuffer = null;
  }
}

/**
 * @classdesc
 * One uniform buffer plus the bind groups that reference it.
 *
 * `queue.writeBuffer` lands before the encoded pass runs, so draws that need
 * different matrices in one pass need one slot each. Slots persist across
 * frames, which lets their bind groups be cached too.
 */
export class FrameUniformSlot extends Disposable {
  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   */
  constructor(helper) {
    super();

    /**
     * @type {GPUBuffer}
     */
    this.buffer = helper.getDevice().createBuffer({
      size: FRAME_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    /**
     * @private
     * @type {Map<string, {bindGroup: GPUBindGroup, texture: GPUTexture|null}>}
     */
    this.bindGroups_ = new Map();
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {Float32Array} data Scratch uniform data.
   * @param {Float32Array} projMat Scratch projection matrix.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {number} hitDetection Hit flag.
   * @param {number} [worldOffset] X offset in view coordinates.
   * @param {number} [originX] Origin x already subtracted from label anchors.
   * @param {number} [originY] Origin y already subtracted from label anchors.
   */
  write(
    helper,
    data,
    projMat,
    frameState,
    hitDetection,
    worldOffset,
    originX,
    originY,
  ) {
    // Fold the origin in here, while the coordinates are still float64. Doing
    // the same subtraction in the shader shakes the label, because both the
    // anchor and the view translation are too large for float32.
    localCoordinateToPixel(
      frameState.coordinateToPixelTransform,
      (originX || 0) + (worldOffset || 0),
      originY || 0,
      1,
      1,
      localTransform,
    );
    projectionMatrixFromFrame(frameState, localTransform, projMat);
    data.fill(0);
    data.set(projMat, 0);
    data[16] = -Infinity;
    data[17] = -Infinity;
    data[18] = Infinity;
    data[19] = Infinity;
    data[20] = frameState.size[0];
    data[21] = frameState.size[1];
    data[22] = frameState.layerStatesArray[frameState.layerIndex].opacity;
    data[23] = hitDetection;
    data[24] = fadeClock(frameState.time || 0);
    data[25] = LABEL_FADE_DURATION;
    data[26] = 1 / frameState.viewState.resolution;
    helper.writeBuffer(this.buffer, data);
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {string} name Pipeline name.
   * @param {GPURenderPipeline} pipeline Pipeline.
   * @param {GPUTexture} [texture] Texture bound at binding 2, with a sampler at 1.
   * @return {GPUBindGroup} Bind group.
   */
  getBindGroup(helper, name, pipeline, texture) {
    const cached = this.bindGroups_.get(name);
    if (cached && cached.texture === (texture || null)) {
      return cached.bindGroup;
    }
    /** @type {Array<GPUBindGroupEntry>} */
    const entries = [{binding: 0, resource: {buffer: this.buffer}}];
    if (texture) {
      entries.push(
        {binding: 1, resource: helper.getLinearSampler()},
        {binding: 2, resource: texture.createView()},
      );
    }
    countMetric('bindGroups');
    const bindGroup = helper.getDevice().createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries,
    });
    this.bindGroups_.set(name, {bindGroup, texture: texture || null});
    return bindGroup;
  }

  /**
   * @override
   */
  disposeInternal() {
    this.bindGroups_.clear();
    this.buffer.destroy();
  }
}

/**
 * @param {number} worldOffset X offset in view coordinates.
 * @param {number} originX Label origin x.
 * @param {number} originY Label origin y.
 * @return {string} Key for a uniform slot.
 */
function uniformKey(worldOffset, originX, originY) {
  return `${worldOffset}/${originX}/${originY}`;
}

/**
 * @classdesc
 * A pool of {@link FrameUniformSlot}, one per distinct world offset and label
 * origin in a frame.
 *
 * Tiles that share a world offset still need separate matrices when their
 * anchors are stored relative to different origins.
 */
export class FrameUniformPool extends Disposable {
  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   */
  constructor(helper) {
    super();

    /**
     * @private
     */
    this.helper_ = helper;

    /**
     * @private
     * @type {Array<FrameUniformSlot>}
     */
    this.slots_ = [];

    /**
     * @private
     * @type {Float32Array}
     */
    this.data_ = new Float32Array(FRAME_UNIFORM_SIZE / 4);

    /**
     * @private
     * @type {Float32Array}
     */
    this.projMat_ = new Float32Array(16);

    /**
     * @private
     * @type {Map<string, FrameUniformSlot>}
     */
    this.byOffset_ = new Map();
  }

  /**
   * Forget which slots were handed out for the previous frame.
   */
  begin() {
    this.byOffset_.clear();
  }

  /**
   * A slot holding uniforms for one world offset and label origin, written at
   * most once per frame.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {number} [worldOffset] X offset in view coordinates.
   * @param {number} [hitDetection] Hit flag.
   * @param {number} [originX] Origin x already subtracted from label anchors.
   * @param {number} [originY] Origin y already subtracted from label anchors.
   * @return {FrameUniformSlot} Slot.
   */
  get(frameState, worldOffset = 0, hitDetection = 0, originX = 0, originY = 0) {
    const key = uniformKey(worldOffset, originX, originY);
    const existing = this.byOffset_.get(key);
    if (existing) {
      return existing;
    }
    const index = this.byOffset_.size;
    let slot = this.slots_[index];
    if (!slot) {
      slot = new FrameUniformSlot(this.helper_);
      this.slots_[index] = slot;
    }
    slot.write(
      this.helper_,
      this.data_,
      this.projMat_,
      frameState,
      hitDetection,
      worldOffset,
      originX,
      originY,
    );
    this.byOffset_.set(key, slot);
    return slot;
  }

  /**
   * @override
   */
  disposeInternal() {
    for (const slot of this.slots_) {
      slot.dispose();
    }
    this.slots_.length = 0;
    this.byOffset_.clear();
  }
}

/**
 * Projection uniforms for one label batch.
 *
 * Anchors are stored relative to the batch grid origin. Adding that origin in
 * this matrix, in float64, keeps the shader from cancelling two huge float32
 * terms. That cancellation is what shakes labels while zooming.
 *
 * @param {FrameUniformPool} pool Pool.
 * @param {import("../../Map.js").FrameState} frameState Frame.
 * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
 * @param {number} [worldOffset] X offset in view coordinates.
 * @return {FrameUniformSlot} Slot.
 */
export function labelUniforms(pool, frameState, buffers, worldOffset = 0) {
  const grid = buffers.grid;
  return pool.get(
    frameState,
    worldOffset,
    0,
    grid ? grid.originX : 0,
    grid ? grid.originY : 0,
  );
}

/**
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 */
export function createVectorPipelines(helper) {
  const format = helper.getFormat();
  const fillModule = helper.createShaderModule(VECTOR_FILL_SHADER);
  helper.getRenderPipeline('vector-fill', {
    layout: 'auto',
    vertex: {
      module: fillModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 0, offset: 0, format: 'sint16x2'}],
        },
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 1, offset: 0, format: 'uint32'}],
        },
      ],
    },
    fragment: {
      module: fillModule,
      entryPoint: 'fs_main',
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-list'},
  });

  const warpModule = helper.createShaderModule(VECTOR_WARP_SHADER);
  helper.getComputePipeline('vector-warp', {
    layout: 'auto',
    compute: {module: warpModule, entryPoint: 'main'},
  });

  const fillWarpedModule = helper.createShaderModule(VECTOR_FILL_WARPED_SHADER);
  helper.getRenderPipeline('vector-fill-warped', {
    layout: 'auto',
    vertex: {
      module: fillWarpedModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 16,
          attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}],
        },
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 1, offset: 0, format: 'uint32'}],
        },
      ],
    },
    fragment: {
      module: fillWarpedModule,
      entryPoint: 'fs_main',
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-list'},
  });

  const strokeWarpedModule = helper.createShaderModule(
    VECTOR_STROKE_WARPED_SHADER,
  );
  helper.getRenderPipeline('vector-stroke-warped', {
    layout: 'auto',
    vertex: {
      module: strokeWarpedModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 16,
          attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}],
        },
        {
          arrayStride: 16,
          attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}],
        },
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 2, offset: 0, format: 'uint32'}],
        },
      ],
    },
    fragment: {
      module: strokeWarpedModule,
      entryPoint: 'fs_main',
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-list'},
  });

  const strokeModule = helper.createShaderModule(VECTOR_STROKE_SHADER);
  helper.getRenderPipeline('vector-stroke', {
    layout: 'auto',
    vertex: {
      module: strokeModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 0, offset: 0, format: 'sint16x2'}],
        },
        {
          arrayStride: 16,
          attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}],
        },
        {
          arrayStride: 4,
          attributes: [{shaderLocation: 2, offset: 0, format: 'uint32'}],
        },
      ],
    },
    fragment: {
      module: strokeModule,
      entryPoint: 'fs_main',
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-list'},
  });

  const symbolModule = helper.createShaderModule(SYMBOL_SHADER);
  helper.getRenderPipeline('vector-symbol', {
    layout: 'auto',
    vertex: {
      module: symbolModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 8,
          stepMode: 'vertex',
          attributes: [{shaderLocation: 5, offset: 0, format: 'float32x2'}],
        },
        {
          arrayStride: SYMBOL_STRIDE * 4,
          stepMode: 'instance',
          attributes: [
            {shaderLocation: 0, offset: 0, format: 'float32x2'},
            {shaderLocation: 1, offset: 8, format: 'float32x2'},
            {shaderLocation: 2, offset: 16, format: 'float32x2'},
            {shaderLocation: 3, offset: 24, format: 'float32x4'},
            {shaderLocation: 4, offset: 40, format: 'float32x4'},
            {shaderLocation: 7, offset: 56, format: 'float32x4'},
            {shaderLocation: 8, offset: 72, format: 'float32x2'},
          ],
        },
        {
          arrayStride: 12,
          stepMode: 'instance',
          attributes: [{shaderLocation: 6, offset: 0, format: 'float32x3'}],
        },
      ],
    },
    fragment: {
      module: symbolModule,
      entryPoint: 'fs_main',
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-strip'},
  });

  const glyphModule = helper.createShaderModule(GLYPH_SHADER);
  /**
   * @param {string} fragmentEntryPoint Fragment entry point.
   * @return {GPURenderPipelineDescriptor} Pipeline descriptor.
   */
  const glyphPipeline = (fragmentEntryPoint) => ({
    layout: 'auto',
    vertex: {
      module: glyphModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 8,
          stepMode: 'vertex',
          attributes: [{shaderLocation: 8, offset: 0, format: 'float32x2'}],
        },
        {
          arrayStride: GLYPH_INSTANCE_STRIDE * 4,
          stepMode: 'instance',
          attributes: [
            {shaderLocation: 0, offset: 0, format: 'float32x2'},
            {shaderLocation: 1, offset: 8, format: 'float32x2'},
            {shaderLocation: 2, offset: 16, format: 'float32x2'},
            {shaderLocation: 3, offset: 24, format: 'float32x4'},
            {shaderLocation: 4, offset: 40, format: 'float32x4'},
            {shaderLocation: 5, offset: 56, format: 'float32x4'},
            {shaderLocation: 6, offset: 72, format: 'float32x4'},
            {shaderLocation: 7, offset: 88, format: 'float32'},
          ],
        },
        {
          arrayStride: 12,
          stepMode: 'instance',
          attributes: [{shaderLocation: 9, offset: 0, format: 'float32x3'}],
        },
      ],
    },
    fragment: {
      module: glyphModule,
      entryPoint: fragmentEntryPoint,
      targets: [{format, blend: BLEND}],
    },
    primitive: {topology: 'triangle-strip'},
  });
  helper.getRenderPipeline('vector-glyph-halo', glyphPipeline('fs_halo'));
  helper.getRenderPipeline('vector-glyph-fill', glyphPipeline('fs_fill'));
}

/**
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 * @param {VectorGpuBuffers} gpu Batch geometry.
 * @param {number} [start] First index.
 * @param {number} [count] Index count. The whole buffer when omitted.
 */
export function drawFills(helper, gpu, start = 0, count) {
  const indexCount = count === undefined ? gpu.fillIndexCount : count;
  if (!indexCount || !gpu.fillPositionBuffer || !gpu.fillIndexBuffer) {
    return;
  }
  const warped = gpu.warped && gpu.fillWarpedBuffer;
  const name = warped ? 'vector-fill-warped' : 'vector-fill';
  const pipeline = helper.getRenderPipeline(name, /** @type {any} */ ({}));
  const pass = helper.getRenderPass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, gpu.getBindGroup(helper, name, pipeline));
  pass.setVertexBuffer(
    0,
    warped ? gpu.fillWarpedBuffer : gpu.fillPositionBuffer,
  );
  pass.setVertexBuffer(1, gpu.fillStyleBuffer);
  pass.setIndexBuffer(gpu.fillIndexBuffer, 'uint32');
  countMetric('drawCalls');
  pass.drawIndexed(indexCount, 1, start);
}

/**
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 * @param {VectorGpuBuffers} gpu Batch geometry.
 * @param {number} [start] First index.
 * @param {number} [count] Index count. The whole buffer when omitted.
 */
export function drawStrokes(helper, gpu, start = 0, count) {
  const indexCount = count === undefined ? gpu.strokeIndexCount : count;
  if (!indexCount || !gpu.strokePositionBuffer || !gpu.strokeIndexBuffer) {
    return;
  }
  const warped = gpu.warped && gpu.strokeWarpedBuffer;
  const name = warped ? 'vector-stroke-warped' : 'vector-stroke';
  const pipeline = helper.getRenderPipeline(name, /** @type {any} */ ({}));
  const pass = helper.getRenderPass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, gpu.getBindGroup(helper, name, pipeline));
  pass.setVertexBuffer(
    0,
    warped ? gpu.strokeWarpedBuffer : gpu.strokePositionBuffer,
  );
  pass.setVertexBuffer(
    1,
    warped ? gpu.strokeWarpedAttributeBuffer : gpu.strokeAttributeBuffer,
  );
  pass.setVertexBuffer(2, gpu.strokeStyleBuffer);
  pass.setIndexBuffer(gpu.strokeIndexBuffer, 'uint32');
  countMetric('drawCalls');
  pass.drawIndexed(indexCount, 1, start);
}

/**
 * One batch's commands, drawn with that batch's grid and world offset.
 *
 * @typedef {Object} PaintBatch
 * @property {Array<import("../../render/webgpu/drawOrder.js").DrawCommand>} commands Commands.
 * @property {number} tileOrder Tile draw order.
 * @property {VectorGpuBuffers|null} gpu Geometry, or null for labels only.
 * @property {import("./LabelRenderer.js").default|null} labels Label renderer.
 * @property {FrameUniformSlot|null} slot Label uniforms.
 * @property {function(): void} prepare Writes this batch's geometry uniforms.
 * @property {boolean} [labelsOnly] Skip fills and strokes.
 */

/**
 * Draw every batch in one painter's order. Adjacent ranges that share a
 * pipeline and sit next to each other in the same batch become one draw.
 *
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 * @param {Array<PaintBatch>} batches Batches.
 * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @param {GPUBuffer|null} cornerBuffer Corner quad.
 */
export function paintBatches(helper, batches, atlas, cornerBuffer) {
  /** @type {Array<{batch: PaintBatch, command: import("../../render/webgpu/drawOrder.js").DrawCommand}>} */
  const items = [];
  for (let i = 0; i < batches.length; ++i) {
    const batch = batches[i];
    const commands = batch.commands || [];
    for (let c = 0; c < commands.length; ++c) {
      const command = commands[c];
      if (
        batch.labelsOnly &&
        (command.pipeline === 'fill' || command.pipeline === 'stroke')
      ) {
        continue;
      }
      items.push({batch, command});
    }
  }
  items.sort((a, b) =>
    comparePaint(a.command, a.batch.tileOrder, b.command, b.batch.tileOrder),
  );

  /** @type {PaintBatch|null} */
  let prepared = null;
  for (let i = 0; i < items.length;) {
    const first = items[i];
    let count = first.command.count;
    let j = i + 1;
    while (j < items.length) {
      const next = items[j];
      if (
        next.batch !== first.batch ||
        next.command.pipeline !== first.command.pipeline ||
        next.command.start !== first.command.start + count
      ) {
        break;
      }
      count += next.command.count;
      ++j;
    }
    if (first.batch !== prepared) {
      first.batch.prepare();
      prepared = first.batch;
    }
    const pipeline = first.command.pipeline;
    if (pipeline === 'fill' && first.batch.gpu) {
      drawFills(helper, first.batch.gpu, first.command.start, count);
    } else if (pipeline === 'stroke' && first.batch.gpu) {
      drawStrokes(helper, first.batch.gpu, first.command.start, count);
    } else if (
      (pipeline === 'symbol' || pipeline === 'glyph') &&
      first.batch.labels &&
      first.batch.slot &&
      cornerBuffer
    ) {
      first.batch.labels.drawInstances(
        helper,
        pipeline,
        first.command.start,
        count,
        first.batch.slot,
        atlas,
        cornerBuffer,
      );
    }
    i = j;
  }
}

/**
 * Identifies the inputs a declutter pass depends on, apart from where the view
 * has been panned to: which labels there are, and how the view scales and
 * rotates them. Translation is deliberately absent, because labels move with
 * the map and a pan alone does not invalidate a placement; the scheduler
 * handles that with a distance budget instead.
 *
 * @param {number} labelVersion Label set version.
 * @param {import("../../Map.js").FrameState} frameState Frame.
 * @return {string} Key.
 */
export function placementKey(labelVersion, frameState) {
  const transform = frameState.coordinateToPixelTransform;
  return (
    labelVersion +
    '/' +
    transform[0].toPrecision(7) +
    ',' +
    transform[1].toPrecision(7) +
    ',' +
    transform[2].toPrecision(7) +
    ',' +
    transform[3].toPrecision(7)
  );
}

/**
 * Extra CSS pixels around every declutter box so near-miss labels do not touch.
 * @type {number}
 */
export const LABEL_COLLISION_MARGIN = 2;
