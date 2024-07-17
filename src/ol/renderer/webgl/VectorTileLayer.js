/**
 * @module ol/renderer/webgl/VectorTileLayer
 */
import EventType from '../../events/EventType.js';
import TileGeometry from '../../webgl/TileGeometry.js';
import VectorStyleRenderer from '../../render/webgl/VectorStyleRenderer.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLBaseTileLayerRenderer, {
  Uniforms as BaseUniforms,
} from './TileLayerBase.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';
import {AttributeType} from '../../webgl/Helper.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {ShaderBuilder} from '../../webgl/ShaderBuilder.js';
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
import {parseLiteralStyle} from '../../webgl/styleparser.js';

export const Uniforms = {
  ...BaseUniforms,
  TILE_MASK_TEXTURE: 'u_depthMask',
  TILE_ZOOM_LEVEL: 'u_tileZoomLevel',
};

export const Attributes = {
  POSITION: 'a_position',
};

/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').VectorStyle} VectorStyle
 */

/**
 * @typedef {Object} Options
 * @property {VectorStyle|Array<VectorStyle>} style Vector style as literal style or shaders; can also accept an array of styles
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
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
    super(tileLayer, {
      cacheSize: options.cacheSize,
      uniforms: {
        [Uniforms.PATTERN_ORIGIN]: [0, 0],
        [Uniforms.TILE_MASK_TEXTURE]: () => this.tileMaskTarget_.getTexture(),
      },
    });

    /**
     * @type {boolean}
     * @private
     */
    this.hitDetectionEnabled_ = !options.disableHitDetection;

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

    /**
     * @private
     */
    this.tmpTransform_ = createTransform();
    /**
     * @private
     */
    this.tmpMat4_ = createMat4();

    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    this.tileMaskTarget_ = null;

    /**
     * @private
     */
    this.tileMaskIndices_ = new WebGLArrayBuffer(
      ELEMENT_ARRAY_BUFFER,
      STATIC_DRAW,
    );
    this.tileMaskIndices_.fromArray([0, 1, 3, 1, 2, 3]);

    /**
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @private
     */
    this.tileMaskAttributes_ = [
      {
        name: Attributes.POSITION,
        size: 2,
        type: AttributeType.FLOAT,
      },
    ];

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.tileMaskProgram_;

    this.applyOptions_(options);
  }

  /**
   * @param {Options} options Options.
   * @override
   */
  reset(options) {
    super.reset(options);

    this.applyOptions_(options);
    if (this.helper) {
      this.createRenderers_();
      this.initTileMask_();
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
    function addBuilderParams(builder) {
      const exisitingDiscard = builder.getFragmentDiscardExpression();
      const discardFromMask = `texture2D(${Uniforms.TILE_MASK_TEXTURE}, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > ${Uniforms.TILE_ZOOM_LEVEL} + 0.5`;
      builder.setFragmentDiscardExpression(
        exisitingDiscard !== 'false'
          ? `(${exisitingDiscard}) || (${discardFromMask})`
          : discardFromMask,
      );
      builder.addUniform(`sampler2D ${Uniforms.TILE_MASK_TEXTURE}`);
      builder.addUniform(`float ${Uniforms.TILE_ZOOM_LEVEL}`);
    }

    this.styleRenderers_ = this.styles_.map((style) => {
      const isShaders = 'builder' in style;
      let shaders;
      if (!isShaders) {
        const parseResult = parseLiteralStyle(
          /** @type {import('../../style/webgl.js').WebGLStyle} */ (style),
        );
        addBuilderParams(parseResult.builder);
        shaders = {
          builder: parseResult.builder,
          attributes: parseResult.attributes,
          uniforms: parseResult.uniforms,
        };
      } else {
        addBuilderParams(
          /** @type {import('../../render/webgl/VectorStyleRenderer.js').StyleShaders} */ (
            style
          ).builder,
        );
        shaders = style;
      }
      return new VectorStyleRenderer(
        shaders,
        this.helper,
        this.hitDetectionEnabled_,
      );
    });
  }

  /**
   * @private
   */
  initTileMask_() {
    this.tileMaskTarget_ = new WebGLRenderTarget(this.helper);
    const builder = new ShaderBuilder()
      .setFillColorExpression(
        `vec4(${Uniforms.TILE_ZOOM_LEVEL} / 50., 0., 0., 1.)`,
      )
      .addUniform(`float ${Uniforms.TILE_ZOOM_LEVEL}`);
    this.tileMaskProgram_ = this.helper.getProgram(
      builder.getFillFragmentShader(),
      builder.getFillVertexShader(),
    );
    this.helper.flushBufferData(this.tileMaskIndices_);
  }

  /**
   * @override
   */
  afterHelperCreated() {
    this.createRenderers_();
    this.initTileMask_();
  }

  /**
   * @override
   */
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

  /**
   * @override
   */
  beforeTilesRender(frameState, tilesWithAlpha) {
    super.beforeTilesRender(frameState, true); // always consider that tiles need alpha blending
    this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_,
    );
  }

  /**
   * @override
   */
  beforeTilesMaskRender(frameState) {
    this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_,
    );
    const pixelRatio = frameState.pixelRatio;
    const size = frameState.size;
    this.tileMaskTarget_.setSize([size[0] * pixelRatio, size[1] * pixelRatio]);
    this.helper.prepareDrawToRenderTarget(
      frameState,
      this.tileMaskTarget_,
      true,
      true,
    );
    this.helper.useProgram(this.tileMaskProgram_, frameState);
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );
    makeInverseTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.SCREEN_TO_WORLD_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );
    return true;
  }

  /**
   * @override
   */
  renderTileMask(tileRepresentation, tileZ, extent, depth) {
    if (!tileRepresentation.ready) {
      return;
    }
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, extent);
    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, 1);
    this.helper.bindBuffer(
      /** @type {TileGeometry} */ (tileRepresentation).maskVertices,
    );
    this.helper.bindBuffer(this.tileMaskIndices_);
    this.helper.enableAttributes(this.tileMaskAttributes_);
    const renderCount = this.tileMaskIndices_.getSize();
    this.helper.drawElements(0, renderCount);
  }

  /**
   * @param {number} alpha Alpha value of the tile
   * @param {import("../../extent.js").Extent} renderExtent Which extent to restrict drawing to
   * @param {import("../../transform.js").Transform} batchInvertTransform Inverse of the transformation in which tile geometries are expressed
   * @param {number} tileZ Tile zoom level
   * @param {number} depth Depth of the tile
   * @private
   */
  applyUniforms_(alpha, renderExtent, batchInvertTransform, tileZ, depth) {
    // world to screen matrix
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    multiplyTransform(this.tmpTransform_, batchInvertTransform);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );

    // screen to world matrix
    makeInverseTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.SCREEN_TO_WORLD_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );

    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, alpha);
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, renderExtent);
  }

  /**
   * @override
   */
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
    alpha,
  ) {
    const gutterExtent = getIntersection(tileExtent, renderExtent, tileExtent);
    const tileZ = tileRepresentation.tile.getTileCoord()[0];
    for (let i = 0, ii = this.styleRenderers_.length; i < ii; i++) {
      const renderer = this.styleRenderers_[i];
      const buffers = tileRepresentation.buffers[i];
      renderer.render(buffers, frameState, () => {
        this.applyUniforms_(
          alpha,
          gutterExtent,
          buffers.invertVerticesTransform,
          tileZ,
          depth,
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
   * @override
   */
  disposeInternal() {
    super.disposeInternal();
  }
}

export default WebGLVectorTileLayerRenderer;
