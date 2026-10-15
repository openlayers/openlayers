/**
 * @module ol/renderer/webgpu/LabelRenderer
 */
import Disposable from '../../Disposable.js';
import {packGlyphInstances} from '../../render/webgpu/glyphLayout.js';
import {countMetric, endMetric, startMetric} from '../../webgpu/metrics.js';
import {ICON_STRIDE, SYMBOL_STRIDE} from './vectorUtil.js';

/**
 * @classdesc
 * Draws the symbols and text of one label set, normally a single vector tile.
 *
 * Instance data is uploaded once and then left alone. What a frame can change
 * cheaply is a transition triple per instance: start opacity, target opacity,
 * and transition start time. The shader interpolates it without per-frame
 * buffer uploads.
 *
 * Keeping this per tile means a tile entering the view uploads only its own
 * glyphs instead of forcing every visible label to be repacked.
 */
class LabelRenderer extends Disposable {
  constructor() {
    super();

    /**
     * @private
     * @type {import("../../render/webgpu/buffers.js").VectorBuffers|null}
     */
    this.buffers_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.symbolBuffer_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.symbolOpacityBuffer_ = null;

    /**
     * @private
     * @type {Float32Array}
     */
    this.symbolOpacity_ = new Float32Array(0);

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.iconBuffer_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.iconOpacityBuffer_ = null;

    /**
     * @private
     * @type {Float32Array}
     */
    this.iconOpacity_ = new Float32Array(0);

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.glyphBuffer_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.glyphOpacityBuffer_ = null;

    /**
     * @private
     * @type {Float32Array}
     */
    this.glyphOpacity_ = new Float32Array(0);

    /**
     * Prefix sum of glyphs with visible halos, for deciding whether a draw
     * range needs the halo pass without scanning it every frame.
     * @private
     * @type {Uint32Array}
     */
    this.glyphHaloPrefix_ = new Uint32Array(0);

    /**
     * @private
     * @type {number}
     */
    this.symbolCount_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.iconCount_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.glyphCount_ = 0;

    /**
     * Transition per label of this set, kept here so a tile that stays on screen
     * can tell that nothing about it changed even as the surrounding tile set
     * comes and goes.
     * @private
     * @type {Float32Array}
     */
    this.labelOpacity_ = new Float32Array(0);

    /**
     * Set when the uploaded opacities no longer match the wanted ones. A pan
     * that changes nothing about label visibility leaves this false, and the
     * per-frame label cost drops to the draw calls.
     * @private
     * @type {boolean}
     */
    this.opacityDirty_ = true;

    /**
     * Labels whose instance transitions differ from the GPU buffers.
     * @private
     * @type {Set<number>}
     */
    this.dirtyLabels_ = new Set();
  }

  /**
   * Upload a label set. Repeated calls with the same buffers do nothing.
   *
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Labels, glyphs, symbols.
   */
  setLabels(helper, buffers) {
    if (this.buffers_ === buffers) {
      return;
    }
    this.release_();
    this.buffers_ = buffers;
    this.symbolCount_ = buffers.symbolInstances.length / SYMBOL_STRIDE;
    this.iconCount_ = (buffers.iconInstances?.length || 0) / ICON_STRIDE;
    this.glyphCount_ = buffers.glyphs.length;
    this.labelOpacity_ = new Float32Array(buffers.labels.length * 3);
    this.opacityDirty_ = true;
    this.dirtyLabels_.clear();

    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    if (this.symbolCount_) {
      this.symbolBuffer_ = helper.createBuffer(buffers.symbolInstances, usage);
      this.symbolOpacity_ = new Float32Array(this.symbolCount_ * 3);
      this.symbolOpacityBuffer_ = helper.createBuffer(
        this.symbolOpacity_,
        usage,
      );
    }
    if (this.iconCount_) {
      this.iconBuffer_ = helper.createBuffer(buffers.iconInstances, usage);
      this.iconOpacity_ = new Float32Array(this.iconCount_ * 3);
      this.iconOpacityBuffer_ = helper.createBuffer(this.iconOpacity_, usage);
    }
    if (this.glyphCount_) {
      const start = startMetric();
      // Same origin as the symbol anchors and the geometry grid. The draw
      // matrix adds it back; packing the absolute coordinate here is what
      // makes labels shake at high zoom.
      const originX = buffers.grid ? buffers.grid.originX : 0;
      const originY = buffers.grid ? buffers.grid.originY : 0;
      this.glyphBuffer_ = helper.createBuffer(
        packGlyphInstances(buffers.glyphs, undefined, originX, originY),
        usage,
      );
      endMetric('packGlyphInstances', start);
      this.glyphOpacity_ = new Float32Array(this.glyphCount_ * 3);
      this.glyphOpacityBuffer_ = helper.createBuffer(this.glyphOpacity_, usage);
      this.glyphHaloPrefix_ = new Uint32Array(this.glyphCount_ + 1);
      for (let i = 0; i < this.glyphCount_; ++i) {
        this.glyphHaloPrefix_[i + 1] =
          this.glyphHaloPrefix_[i] + (buffers.glyphs[i].hasHalo ? 1 : 0);
      }
    }
  }

  /**
   * Mark the uploaded opacities stale, for example after a declutter pass.
   */
  setOpacityDirty() {
    this.opacityDirty_ = true;
    const count = this.labelOpacity_.length / 3;
    for (let i = 0; i < count; ++i) {
      this.dirtyLabels_.add(i);
    }
  }

  /**
   * Take this set's share of the committed transitions.
   *
   * @param {Float32Array} opacities Three floats per label for the whole label view.
   * @param {number} offset Index of this set's first label.
   * @return {boolean} Something changed since the last upload.
   */
  setOpacities(opacities, offset) {
    let changed = false;
    const sourceOffset = offset * 3;
    const count = this.labelOpacity_.length / 3;
    for (let labelIndex = 0; labelIndex < count; ++labelIndex) {
      const targetOffset = labelIndex * 3;
      let labelChanged = false;
      for (let component = 0; component < 3; ++component) {
        const index = targetOffset + component;
        const opacity = opacities[sourceOffset + index];
        if (this.labelOpacity_[index] !== opacity) {
          this.labelOpacity_[index] = opacity;
          labelChanged = true;
        }
      }
      if (labelChanged) {
        this.dirtyLabels_.add(labelIndex);
        changed = true;
      }
    }
    if (changed) {
      this.opacityDirty_ = true;
    }
    return changed;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @private
   */
  updateOpacity_(helper) {
    const buffers = this.buffers_;
    if (!buffers) {
      return;
    }
    let symbolMin = Infinity;
    let symbolMax = -1;
    let iconMin = Infinity;
    let iconMax = -1;
    let glyphMin = Infinity;
    let glyphMax = -1;
    for (const i of this.dirtyLabels_) {
      const transitionOffset = i * 3;
      const startOpacity = this.labelOpacity_[transitionOffset];
      const targetOpacity = this.labelOpacity_[transitionOffset + 1];
      const startTime = this.labelOpacity_[transitionOffset + 2];
      const label = buffers.labels[i];
      if (label.glyphCount) {
        const start = label.glyphStart || 0;
        for (let g = start; g < start + label.glyphCount; ++g) {
          const offset = g * 3;
          this.glyphOpacity_[offset] = startOpacity;
          this.glyphOpacity_[offset + 1] = targetOpacity;
          this.glyphOpacity_[offset + 2] = startTime;
        }
        glyphMin = Math.min(glyphMin, start);
        glyphMax = Math.max(glyphMax, start + label.glyphCount);
      }
      const symbolIndex = /** @type {number|undefined} */ (
        /** @type {any} */ (label).symbolIndex
      );
      if (symbolIndex !== undefined && symbolIndex < this.symbolCount_) {
        const offset = symbolIndex * 3;
        this.symbolOpacity_[offset] = startOpacity;
        this.symbolOpacity_[offset + 1] = targetOpacity;
        this.symbolOpacity_[offset + 2] = startTime;
        symbolMin = Math.min(symbolMin, symbolIndex);
        symbolMax = Math.max(symbolMax, symbolIndex + 1);
      }
      const iconIndex = label.iconIndex;
      if (iconIndex !== undefined && iconIndex < this.iconCount_) {
        const offset = iconIndex * 3;
        this.iconOpacity_[offset] = startOpacity;
        this.iconOpacity_[offset + 1] = targetOpacity;
        this.iconOpacity_[offset + 2] = startTime;
        iconMin = Math.min(iconMin, iconIndex);
        iconMax = Math.max(iconMax, iconIndex + 1);
      }
    }
    if (this.symbolOpacityBuffer_ && symbolMax > symbolMin) {
      helper.writeBuffer(
        this.symbolOpacityBuffer_,
        this.symbolOpacity_.subarray(symbolMin * 3, symbolMax * 3),
        symbolMin * 3 * 4,
      );
    }
    if (this.glyphOpacityBuffer_ && glyphMax > glyphMin) {
      helper.writeBuffer(
        this.glyphOpacityBuffer_,
        this.glyphOpacity_.subarray(glyphMin * 3, glyphMax * 3),
        glyphMin * 3 * 4,
      );
    }
    if (this.iconOpacityBuffer_ && iconMax > iconMin) {
      helper.writeBuffer(
        this.iconOpacityBuffer_,
        this.iconOpacity_.subarray(iconMin * 3, iconMax * 3),
        iconMin * 3 * 4,
      );
    }
    countMetric('dirtyOpacityLabels', this.dirtyLabels_.size);
    countMetric('opacityUploads');
    countMetric('transitionUploads');
    this.dirtyLabels_.clear();
    this.opacityDirty_ = false;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {import("./vectorUtil.js").FrameUniformSlot} slot Uniforms for this set's world.
   * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
   * @param {GPUBuffer} cornerBuffer Corner quad.
   * @param {import("../../webgpu/ImageAtlas.js").default} imageAtlas Image atlas.
   */
  draw(helper, slot, atlas, cornerBuffer, imageAtlas) {
    this.drawInstances(
      helper,
      'symbol',
      0,
      this.symbolCount_,
      slot,
      atlas,
      cornerBuffer,
      imageAtlas,
    );
    this.drawInstances(
      helper,
      'icon',
      0,
      this.iconCount_,
      slot,
      atlas,
      cornerBuffer,
      imageAtlas,
    );
    this.drawInstances(
      helper,
      'glyph',
      0,
      this.glyphCount_,
      slot,
      atlas,
      cornerBuffer,
      imageAtlas,
    );
  }

  /**
   * Draw one contiguous run of symbol or glyph instances. `firstInstance`
   * applies to the instance step, including the opacity buffer, so a z-index
   * can be a slice of the packed instances. A glyph run is split where the
   * font atlas page changes, so each draw samples one texture.
   *
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {'symbol'|'icon'|'glyph'} kind Instance kind.
   * @param {number} firstInstance First instance.
   * @param {number} instanceCount Instance count.
   * @param {import("./vectorUtil.js").FrameUniformSlot} slot Uniforms.
   * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
   * @param {GPUBuffer} cornerBuffer Corner quad.
   * @param {import("../../webgpu/ImageAtlas.js").default} [imageAtlas] Image atlas.
   * @param {GPURenderPassEncoder|GPURenderBundleEncoder} [encoder] Encoder.
   * @param {import("./vectorUtil.js").PaintEncoderState} [state] Encoder state shared by adjacent draws.
   */
  drawInstances(
    helper,
    kind,
    firstInstance,
    instanceCount,
    slot,
    atlas,
    cornerBuffer,
    imageAtlas,
    encoder,
    state,
  ) {
    if (!this.buffers_ || !instanceCount) {
      return;
    }
    this.prepareDraw(helper);
    if (kind === 'icon') {
      if (!this.iconCount_ || !this.iconBuffer_ || !imageAtlas) {
        return;
      }
      const pipeline = helper.getRenderPipeline(
        'vector-icon',
        /** @type {any} */ ({}),
      );
      const pass = encoder || helper.getRenderPass();
      this.setPipeline_(pass, pipeline, state);
      pass.setBindGroup(
        0,
        slot.getBindGroup(
          helper,
          'vector-icon',
          pipeline,
          imageAtlas.upload(helper),
        ),
      );
      pass.setVertexBuffer(0, cornerBuffer);
      pass.setVertexBuffer(1, this.iconBuffer_);
      pass.setVertexBuffer(2, this.iconOpacityBuffer_);
      countMetric('drawCalls');
      pass.draw(4, instanceCount, 0, firstInstance);
      return;
    }
    if (kind === 'symbol') {
      if (!this.symbolCount_ || !this.symbolBuffer_) {
        return;
      }
      const pipeline = helper.getRenderPipeline(
        'vector-symbol',
        /** @type {any} */ ({}),
      );
      const pass = encoder || helper.getRenderPass();
      this.setPipeline_(pass, pipeline, state);
      pass.setBindGroup(
        0,
        slot.getBindGroup(helper, 'vector-symbol', pipeline),
      );
      pass.setVertexBuffer(0, cornerBuffer);
      pass.setVertexBuffer(1, this.symbolBuffer_);
      pass.setVertexBuffer(2, this.symbolOpacityBuffer_);
      countMetric('drawCalls');
      pass.draw(4, instanceCount, 0, firstInstance);
      return;
    }
    if (!this.glyphCount_ || !this.glyphBuffer_ || !this.buffers_) {
      return;
    }
    const end = Math.min(firstInstance + instanceCount, this.glyphCount_);
    atlas.upload(helper);
    const glyphs = this.buffers_.glyphs;
    let start = firstInstance;
    while (start < end) {
      const page = glyphs[start].page || 0;
      let stop = start + 1;
      while (stop < end && (glyphs[stop].page || 0) === page) {
        ++stop;
      }
      const atlasTexture = atlas.getTexture(page);
      const count = stop - start;
      if (atlasTexture) {
        const hasHalo =
          this.glyphHaloPrefix_[stop] !== this.glyphHaloPrefix_[start];
        if (hasHalo) {
          this.drawGlyphPass_(
            helper,
            'vector-glyph-halo',
            start,
            count,
            slot,
            atlasTexture,
            cornerBuffer,
            encoder,
            state,
          );
        }
        this.drawGlyphPass_(
          helper,
          'vector-glyph-fill',
          start,
          count,
          slot,
          atlasTexture,
          cornerBuffer,
          encoder,
          state,
        );
      }
      start = stop;
    }
  }

  /**
   * Upload changed opacity transitions before direct or bundled draws.
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   */
  prepareDraw(helper) {
    if (this.opacityDirty_) {
      this.updateOpacity_(helper);
    }
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {'vector-glyph-halo'|'vector-glyph-fill'} name Pipeline name.
   * @param {number} firstInstance First instance.
   * @param {number} instanceCount Instance count.
   * @param {import("./vectorUtil.js").FrameUniformSlot} slot Uniforms.
   * @param {GPUTexture} atlasTexture Font atlas.
   * @param {GPUBuffer} cornerBuffer Corner quad.
   * @param {GPURenderPassEncoder|GPURenderBundleEncoder} [encoder] Encoder.
   * @param {import("./vectorUtil.js").PaintEncoderState} [state] Encoder state shared by adjacent draws.
   * @private
   */
  drawGlyphPass_(
    helper,
    name,
    firstInstance,
    instanceCount,
    slot,
    atlasTexture,
    cornerBuffer,
    encoder,
    state,
  ) {
    const pipeline = helper.getRenderPipeline(name, /** @type {any} */ ({}));
    const pass = encoder || helper.getRenderPass();
    this.setPipeline_(pass, pipeline, state);
    pass.setBindGroup(
      0,
      slot.getBindGroup(helper, name, pipeline, atlasTexture),
    );
    pass.setVertexBuffer(0, cornerBuffer);
    pass.setVertexBuffer(1, this.glyphBuffer_);
    pass.setVertexBuffer(2, this.glyphOpacityBuffer_);
    countMetric('drawCalls');
    pass.draw(4, instanceCount, 0, firstInstance);
  }

  /**
   * Bind a pipeline only when the preceding draw used a different one.
   * @param {GPURenderPassEncoder|GPURenderBundleEncoder} pass Encoder.
   * @param {GPURenderPipeline} pipeline Pipeline.
   * @param {import("./vectorUtil.js").PaintEncoderState} [state] Shared state.
   * @private
   */
  setPipeline_(pass, pipeline, state) {
    if (!state || state.pipeline !== pipeline) {
      pass.setPipeline(pipeline);
      if (state) {
        state.pipeline = pipeline;
      }
      countMetric('pipelineBindings');
      return;
    }
    countMetric('skippedPipelineBindings');
  }

  /**
   * @private
   */
  release_() {
    this.symbolBuffer_?.destroy();
    this.symbolOpacityBuffer_?.destroy();
    this.iconBuffer_?.destroy();
    this.iconOpacityBuffer_?.destroy();
    this.glyphBuffer_?.destroy();
    this.glyphOpacityBuffer_?.destroy();
    this.symbolBuffer_ = null;
    this.symbolOpacityBuffer_ = null;
    this.iconBuffer_ = null;
    this.iconOpacityBuffer_ = null;
    this.glyphBuffer_ = null;
    this.glyphOpacityBuffer_ = null;
    this.glyphHaloPrefix_ = new Uint32Array(0);
    this.symbolCount_ = 0;
    this.iconCount_ = 0;
    this.glyphCount_ = 0;
    this.labelOpacity_ = new Float32Array(0);
    this.buffers_ = null;
  }

  /**
   * Drop GPU buffers, for example when the device is replaced.
   */
  clear() {
    this.release_();
  }

  /**
   * @override
   */
  disposeInternal() {
    this.release_();
  }
}

export default LabelRenderer;
