/**
 * @module ol/renderer/webgl/VectorTileLayer
 */
import EventType from '../../events/EventType.js';
import {getIntersection} from '../../extent.js';
import {ShaderBuilder} from '../../render/webgl/ShaderBuilder.js';
import VectorStyleRenderer, {
  convertStyleToShaders,
} from '../../render/webgl/VectorStyleRenderer.js';
import {
  apply as applyTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
} from '../../transform.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';
import TileGeometry from '../../webgl/TileGeometry.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import WebGLBaseTileLayerRenderer, {
  Uniforms as BaseUniforms,
} from './TileLayerBase.js';

export const Uniforms = {
  ...BaseUniforms,
  TILE_MASK_TEXTURE: 'u_depthMask',
  TILE_ZOOM_LEVEL: 'u_tileZoomLevel',
};

export const Attributes = {
  POSITION: 'a_position',
};

/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').StyleShaders} StyleShaders
 */
/**
 * @typedef {import('../../style/flat.js').FlatStyleLike | Array<StyleShaders> | StyleShaders} LayerStyle
 */

/**
 * @typedef {Object} Options
 * @property {LayerStyle} style Flat vector style; also accepts shaders
 * @property {import('../../style/flat.js').StyleVariables} [variables] Style variables. Each variable must hold a literal value (not
 * an expression). These variables can be used as {@link import("../../expr/expression.js").ExpressionValue expressions} in the styles properties
 * using the `['var', 'varName']` operator.
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
        [Uniforms.PATTERN_ORIGIN_LOW]: [0, 0],
        [Uniforms.TILE_MASK_TEXTURE]: () => this.tileMaskTarget_.getTexture(),
      },
    });

    /**
     * @type {boolean}
     * @private
     */
    this.hitDetectionEnabled_ = !options.disableHitDetection;

    /**
     * @type {LayerStyle}
     * @private
     */
    this.style_ = null;

    /**
     * @type {import('../../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = options.variables || {};

    /**
     * @type {VectorStyleRenderer}
     * @private
     */
    this.styleRenderer_ = null;

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
     * @type {Array<number>}
     * @private
     */
    this.tmpCoords_ = [0, 0];

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
    this.style_ = options.style;
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
      builder.addUniform(Uniforms.TILE_MASK_TEXTURE, 'sampler2D');
      builder.addUniform(Uniforms.TILE_ZOOM_LEVEL, 'float');
    }

    const styleShaders = convertStyleToShaders(
      this.style_,
      this.styleVariables_,
    );
    for (const styleShader of styleShaders) {
      addBuilderParams(styleShader.builder);
    }

    this.styleRenderer_ = new VectorStyleRenderer(
      styleShaders,
      this.styleVariables_,
      this.helper,
      this.hitDetectionEnabled_,
    );
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
      .addUniform(Uniforms.TILE_ZOOM_LEVEL, 'float');
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
    const tileRep = new TileGeometry(options, this.styleRenderer_);
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
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @private
   */
  applyUniforms_(
    alpha,
    renderExtent,
    batchInvertTransform,
    tileZ,
    depth,
    frameState,
  ) {
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

    // Compute the pixel position of world origin [0,0] using float64 (CPU-side).
    // Dekker splitting encodes the value as two float32 components (hi + lo)
    // so the shader's double-float arithmetic can reconstruct full precision.
    this.tmpCoords_[0] = 0;
    this.tmpCoords_[1] = 0;
    applyTransform(this.currentFrameStateTransform_, this.tmpCoords_);
    const size = frameState.size;
    const pxOriginX = (1 + this.tmpCoords_[0]) * size[0] * 0.5;
    const pxOriginY = (1 + this.tmpCoords_[1]) * size[1] * 0.5;

    // Dekker splitting: decompose float64 into two float32 components (hi + lo)
    const hiX = Math.fround(pxOriginX);
    const loX = pxOriginX - hiX;
    const hiY = Math.fround(pxOriginY);
    const loY = pxOriginY - hiY;

    this.tmpCoords_[0] = hiX;
    this.tmpCoords_[1] = hiY;
    this.helper.setUniformFloatVec2(Uniforms.PATTERN_ORIGIN, this.tmpCoords_);
    this.helper.setUniformFloatVec2(Uniforms.PATTERN_ORIGIN_LOW, [loX, loY]);

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
    const buffers = tileRepresentation.buffers;
    if (!buffers) {
      return;
    }
    this.styleRenderer_.render(buffers, frameState, () => {
      this.applyUniforms_(
        alpha,
        gutterExtent,
        buffers.invertVerticesTransform,
        tileZ,
        depth,
        frameState,
      );
    });
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
