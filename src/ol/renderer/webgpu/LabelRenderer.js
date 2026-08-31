/**
 * @module ol/renderer/webgpu/LabelRenderer
 */
import Disposable from '../../Disposable.js';
import {packGlyphInstances} from '../../render/webgpu/glyphLayout.js';
import {countMetric, endMetric, startMetric} from '../../webgpu/metrics.js';
import {SYMBOL_STRIDE} from './vectorUtil.js';

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
     * @private
     * @type {number}
     */
    this.symbolCount_ = 0;

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
    this.glyphCount_ = buffers.glyphs.length;
    this.labelOpacity_ = new Float32Array(buffers.labels.length * 3);
    this.opacityDirty_ = true;

    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    if (this.symbolCount_) {
      this.symbolBuffer_ = helper.createBuffer(buffers.symbolInstances, usage);
      this.symbolOpacity_ = new Float32Array(this.symbolCount_ * 3);
      this.symbolOpacityBuffer_ = helper.createBuffer(
        this.symbolOpacity_,
        usage,
      );
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
    }
  }

  /**
   * Mark the uploaded opacities stale, for example after a declutter pass.
   */
  setOpacityDirty() {
    this.opacityDirty_ = true;
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
    for (let i = 0; i < this.labelOpacity_.length; ++i) {
      const opacity = opacities[sourceOffset + i];
      if (this.labelOpacity_[i] !== opacity) {
        this.labelOpacity_[i] = opacity;
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
    this.symbolOpacity_?.fill(0);
    this.glyphOpacity_?.fill(0);
    for (let i = 0; i < buffers.labels.length; ++i) {
      const transitionOffset = i * 3;
      const startOpacity = this.labelOpacity_[transitionOffset];
      const targetOpacity = this.labelOpacity_[transitionOffset + 1];
      if (!startOpacity && !targetOpacity) {
        continue;
      }
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
      }
      const symbolIndex = /** @type {number|undefined} */ (
        /** @type {any} */ (label).symbolIndex
      );
      if (symbolIndex !== undefined && symbolIndex < this.symbolCount_) {
        const offset = symbolIndex * 3;
        this.symbolOpacity_[offset] = startOpacity;
        this.symbolOpacity_[offset + 1] = targetOpacity;
        this.symbolOpacity_[offset + 2] = startTime;
      }
    }
    if (this.symbolOpacityBuffer_) {
      helper.writeBuffer(this.symbolOpacityBuffer_, this.symbolOpacity_);
    }
    if (this.glyphOpacityBuffer_) {
      helper.writeBuffer(this.glyphOpacityBuffer_, this.glyphOpacity_);
    }
    countMetric('opacityUploads');
    countMetric('transitionUploads');
    this.opacityDirty_ = false;
  }

  /**
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {import("./vectorUtil.js").FrameUniformSlot} slot Uniforms for this set's world.
   * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
   * @param {GPUBuffer} cornerBuffer Corner quad.
   */
  draw(helper, slot, atlas, cornerBuffer) {
    this.drawInstances(
      helper,
      'symbol',
      0,
      this.symbolCount_,
      slot,
      atlas,
      cornerBuffer,
    );
    this.drawInstances(
      helper,
      'glyph',
      0,
      this.glyphCount_,
      slot,
      atlas,
      cornerBuffer,
    );
  }

  /**
   * Draw one contiguous run of symbol or glyph instances. `firstInstance`
   * applies to the instance step, including the opacity buffer, so a z-index
   * can be a slice of the packed instances.
   *
   * @param {import("../../webgpu/Helper.js").default} helper Helper.
   * @param {'symbol'|'glyph'} kind Instance kind.
   * @param {number} firstInstance First instance.
   * @param {number} instanceCount Instance count.
   * @param {import("./vectorUtil.js").FrameUniformSlot} slot Uniforms.
   * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
   * @param {GPUBuffer} cornerBuffer Corner quad.
   */
  drawInstances(
    helper,
    kind,
    firstInstance,
    instanceCount,
    slot,
    atlas,
    cornerBuffer,
  ) {
    if (!this.buffers_ || !instanceCount) {
      return;
    }
    if (this.opacityDirty_) {
      this.updateOpacity_(helper);
    }
    if (kind === 'symbol') {
      if (!this.symbolCount_ || !this.symbolBuffer_) {
        return;
      }
      const pipeline = helper.getRenderPipeline(
        'vector-symbol',
        /** @type {any} */ ({}),
      );
      const pass = helper.getRenderPass();
      pass.setPipeline(pipeline);
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
    if (!this.glyphCount_ || !this.glyphBuffer_) {
      return;
    }
    const atlasTexture = atlas.upload(helper);
    const pipeline = helper.getRenderPipeline(
      'vector-glyph',
      /** @type {any} */ ({}),
    );
    const pass = helper.getRenderPass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(
      0,
      slot.getBindGroup(helper, 'vector-glyph', pipeline, atlasTexture),
    );
    pass.setVertexBuffer(0, cornerBuffer);
    pass.setVertexBuffer(1, this.glyphBuffer_);
    pass.setVertexBuffer(2, this.glyphOpacityBuffer_);
    countMetric('drawCalls');
    pass.draw(4, instanceCount, 0, firstInstance);
  }

  /**
   * @private
   */
  release_() {
    this.symbolBuffer_?.destroy();
    this.symbolOpacityBuffer_?.destroy();
    this.glyphBuffer_?.destroy();
    this.glyphOpacityBuffer_?.destroy();
    this.symbolBuffer_ = null;
    this.symbolOpacityBuffer_ = null;
    this.glyphBuffer_ = null;
    this.glyphOpacityBuffer_ = null;
    this.symbolCount_ = 0;
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
