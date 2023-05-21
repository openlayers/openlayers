/**
 * @module ol/renderer/webgl/VectorTileLayer
 */
import EventType from '../../events/EventType.js';
import TileGeometry from '../../webgl/TileGeometry.js';
import VectorStyleRenderer from '../../render/webgl/VectorStyleRenderer.js';
import WebGLBaseTileLayerRenderer, {Uniforms} from './TileLayerBase.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
} from '../../transform.js';
import {getIntersection} from '../../extent.js';

/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').VectorStyle} VectorStyle
 */

/**
 * @typedef {Object} Options
 * @property {VectorStyle|Array<VectorStyle>} style Vector style as literal style or shaders; can also accept an array of styles
 * @property {number} [cacheSize=512] The vector tile cache size.
 */

/**
 * @typedef {import("../../layer/BaseTile.js").default} LayerType
 */

/**
 * @classdesc
 * WebGL renderer for vector tile layers. Experimental.
 * @extends {WebGLBaseTileLayerRenderer<LayerType>}
 */
class WebGLVectorTileLayerRenderer extends WebGLBaseTileLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} options Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer, options);

    /**
     * @type {Array<VectorStyle>}
     * @private
     */
    this.styles_ = [];

    /**
     * @type {Array<VectorStyleRenderer>}
     * @private
     */
    this.styleRenderers_ = [];

    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentFrameStateTransform_ = createTransform();

    this.tmpTransform_ = createTransform();
    this.tmpMat4_ = createMat4();

    this.applyOptions_(options);
  }

  /**
   * @param {Options} options Options.
   */
  reset(options) {
    super.reset(options);

    this.applyOptions_(options);
    if (this.helper) {
      this.createRenderers_();
    }
  }

  /**
   * @param {Options} options Options.
   * @private
   */
  applyOptions_(options) {
    this.styles_ = Array.isArray(options.style)
      ? options.style
      : [options.style];
  }

  /**
   * @private
   */
  createRenderers_() {
    this.styleRenderers_ = this.styles_.map(
      (style) => new VectorStyleRenderer(style, this.helper)
    );
  }

  afterHelperCreated() {
    this.createRenderers_();
  }

  createTileRepresentation(options) {
    const tileRep = new TileGeometry(options, this.styleRenderers_);
    // redraw the layer when the tile is ready
    const listener = () => {
      if (tileRep.ready) {
        this.getLayer().changed();
        tileRep.removeEventListener(EventType.CHANGE, listener);
      }
    };
    tileRep.addEventListener(EventType.CHANGE, listener);
    return tileRep;
  }

  beforeTilesRender(frameState, tilesWithAlpha) {
    super.beforeTilesRender(frameState, true); // always consider that tiles need alpha blending
    this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_
    );
  }

  /**
   * @param {number} alpha Alpha value of the tile
   * @param {import("../../extent.js").Extent} renderExtent Which extent to restrict drawing to
   * @param {import("../../transform.js").Transform} batchInvertTransform Inverse of the transformation in which tile geometries are expressed
   * @private
   */
  applyUniforms_(alpha, renderExtent, batchInvertTransform) {
    // world to screen matrix
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    multiplyTransform(this.tmpTransform_, batchInvertTransform);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_)
    );

    // screen to world matrix
    makeInverseTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.SCREEN_TO_WORLD_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_)
    );

    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, alpha);
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, renderExtent);
  }

  renderTile(
    tileRepresentation,
    tileTransform,
    frameState,
    renderExtent,
    tileResolution,
    tileSize,
    tileOrigin,
    tileExtent,
    depth,
    gutter,
    alpha
  ) {
    const gutterExtent = getIntersection(tileExtent, renderExtent, tileExtent);

    for (let i = 0, ii = this.styleRenderers_.length; i < ii; i++) {
      const renderer = this.styleRenderers_[i];
      const buffers = tileRepresentation.buffers[i];
      if (!buffers) {
        continue;
      }
      renderer.render(buffers, frameState, () => {
        this.applyUniforms_(
          alpha,
          gutterExtent,
          buffers.invertVerticesTransform
        );
      });
    }
  }

  /**
   * Render declutter items for this layer
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  renderDeclutter(frameState) {}

  /**
   * Clean up.
   */
  disposeInternal() {
    super.disposeInternal();
  }
}

export default WebGLVectorTileLayerRenderer;
