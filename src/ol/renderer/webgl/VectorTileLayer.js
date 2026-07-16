/**
 * @module ol/renderer/webgl/VectorTileLayer
 */
import EventType from '../../events/EventType.js';
import {ShaderBuilder} from '../../render/webgl/ShaderBuilder.js';
import {
  createPostProcessDefinition,
  hasTextStyle,
  TextUniforms,
} from '../../render/webgl/textUtil.js';
import VectorStyleRenderer, {
  convertStyleToShaders,
  toFlatStyleLike,
} from '../../render/webgl/VectorStyleRenderer.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
} from '../../transform.js';
import {fromTransform as mat4FromTransform} from '../../vec/mat4.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';
import TileGeometry from '../../webgl/TileGeometry.js';
import WebGLBaseTileLayerRenderer, {
  Uniforms as BaseUniforms,
} from './TileLayerBase.js';
import {applyVectorUniforms, VectorUniforms} from './vectorUtil.js';

export const Uniforms = {
  ...BaseUniforms,
  ...VectorUniforms,
  ...TextUniforms,
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
 * @property {Array<import("./Layer.js").PostProcessesOptions>} [postProcesses] Post-processes definitions
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
        [Uniforms.TILE_MASK_TEXTURE]: () => this.tileMaskTarget_.getTexture(),
        [Uniforms.ONE]: 1,
      },
      postProcesses: options.postProcesses ?? [],
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
     * @private
     */
    this.hasText_ = false;

    /**
     * @type {import('../../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = {};

    /**
     * @type {VectorStyleRenderer}
     * @private
     */
    this.styleRenderer_ = null;

    /**
     * Transform that projects from world to viewport [-1,1]
     * @private
     */
    this.currentFrameStateTransform_ = createTransform();

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

    /**
     * @private
     */
    this.layerRevision_ = -1;

    /**
     * @private
     */
    this.skipNextTextRender_ = false;

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
    this.styleVariables_ = options.variables;
    this.style_ = options.style;

    // add text rendering post process if needed
    const flatStyle = toFlatStyleLike(this.style_);
    const newHasText = !!flatStyle && hasTextStyle(flatStyle);

    if (newHasText && !this.hasText_) {
      // add the text overlay post-process
      this.setPostProcesses([
        createPostProcessDefinition(
          () => this.styleRenderer_.getTextOverlayCanvas(),
          () => this.styleRenderer_.getTextOverlayFrameState(),
        ),
        ...this.getPostProcesses(),
      ]);
    } else if (!newHasText && this.hasText_) {
      // remove the text overlay post-process (always in first place)
      this.setPostProcesses(this.getPostProcesses().slice(1));
    }

    this.hasText_ = newHasText;
  }

  /**
   * @private
   */
  createRenderers_() {
    function addBuilderParams(builder) {
      const exisitingDiscard = builder.getFragmentDiscardExpression();
      const discardFromMask = `texture2D(${Uniforms.TILE_MASK_TEXTURE}, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > ${Uniforms.TILE_ZOOM_LEVEL} + 0.5`;
      builder.setFragmentDiscardExpression(
        exisitingDiscard !== null
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

    const layerChanged = this.layerRevision_ < this.getLayer().getRevision();
    this.layerRevision_ = this.getLayer().getRevision();

    if (layerChanged) {
      this.skipNextTextRender_ = false;
    }

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
    return true;
  }

  /**
   * @override
   */
  beforeFinalize(frameState) {
    if (this.hasText_) {
      this.styleRenderer_.finalizeTextRender(frameState).then(() => {
        if (this.skipNextTextRender_) {
          this.skipNextTextRender_ = false;
          return;
        }
        // asking for a new render of the layer because the text overlay is now ready to be drawn;
        // next time this happens we should skip this logic otherwise the layer enters an infinite render loop
        this.skipNextTextRender_ = true;
        this.layerRevision_++; // anticipating the layer revision after `layer.changed()`
        this.getLayer().changed();
      });
    }
  }

  /**
   * @override
   */
  renderTileMask(tileRepresentation, tileZ, extent, depth) {
    if (!tileRepresentation.ready) {
      return;
    }
    const geomTile = /** @type {TileGeometry} */ (tileRepresentation);
    const invertTransform = geomTile.buffers.invertVerticesTransform;
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    multiplyTransform(this.tmpTransform_, invertTransform);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );
    makeInverseTransform(this.tmpTransform_, this.tmpTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.INVERT_PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, 1);
    this.applyRenderExtentUniform(
      extent,
      makeInverseTransform(this.tmpTransform_, invertTransform),
    );
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
   * @param {import("../../Map.js").FrameState} frameState Frame state
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
    applyVectorUniforms(
      this.helper,
      this.currentFrameStateTransform_,
      batchInvertTransform,
      frameState,
    );

    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, alpha);
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.applyRenderExtentUniform(
      renderExtent,
      makeInverseTransform(this.tmpTransform_, batchInvertTransform),
    );
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
    const tileZ = tileRepresentation.tile.getTileCoord()[0];
    const buffers = tileRepresentation.buffers;
    if (!buffers) {
      return;
    }
    this.styleRenderer_.render(buffers, frameState, () => {
      this.applyUniforms_(
        alpha,
        tileExtent,
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
    this.styleRenderer_?.dispose();
    super.disposeInternal();
  }
}

export default WebGLVectorTileLayerRenderer;
