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
import {AttributeType, HIT_FIXED_PIXEL_RATIO} from '../../webgl/Helper.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {ShaderBuilder} from '../../webgl/ShaderBuilder.js';
import {
  apply as applyTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
} from '../../transform.js';
import {colorDecodeId} from '../../render/webgl/utils.js';
import {containsCoordinate, getIntersection} from '../../extent.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
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
 * The maximum number of levels that can be encoded in the tile mask.
 */
const TILE_MASK_MAX_LEVELS = 50.0;

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
     * @type {Array<any>}
     * @private
     */
    this.renderedTiles_ = [];

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

    this.tmpTransform_ = createTransform();
    this.tmpMat4_ = createMat4();

    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    this.tileMaskTarget_ = null;

    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    this.hitRenderTarget_ = null;

    /**
     * @private
     */
    this.tileMaskIndices_ = new WebGLArrayBuffer(
      ELEMENT_ARRAY_BUFFER,
      STATIC_DRAW
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
     */
    this.tileMaskProgram_;

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
      this.initTileMask_();
      if (this.hitDetectionEnabled_) {
        this.hitRenderTarget_ = new WebGLRenderTarget(this.helper);
      }
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
      const discardFromMask = `texture2D(${
        Uniforms.TILE_MASK_TEXTURE
      }, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * ${TILE_MASK_MAX_LEVELS.toFixed(
        1
      )} > ${Uniforms.TILE_ZOOM_LEVEL} + 0.5`;
      builder.setFragmentDiscardExpression(
        exisitingDiscard !== 'false'
          ? `(${exisitingDiscard}) || (${discardFromMask})`
          : discardFromMask
      );
      builder.addUniform(`sampler2D ${Uniforms.TILE_MASK_TEXTURE}`);
      builder.addUniform(`float ${Uniforms.TILE_ZOOM_LEVEL}`);
    }

    this.styleRenderers_ = this.styles_.map((style) => {
      const isShaders = 'builder' in style;
      let shaders;
      if (!isShaders) {
        const parseResult = parseLiteralStyle(
          /** @type {import('../../style/webgl.js').WebGLStyle} */ (style)
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
          ).builder
        );
        shaders = style;
      }
      return new VectorStyleRenderer(
        shaders,
        this.helper,
        this.hitDetectionEnabled_
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
        `vec4(${Uniforms.TILE_ZOOM_LEVEL} / ${TILE_MASK_MAX_LEVELS.toFixed(
          1
        )}, 0., 0., 1.)`
      )
      .addUniform(`float ${Uniforms.TILE_ZOOM_LEVEL}`);
    this.tileMaskProgram_ = this.helper.getProgram(
      builder.getFillFragmentShader(),
      builder.getFillVertexShader()
    );
    this.helper.flushBufferData(this.tileMaskIndices_);
  }

  afterHelperCreated() {
    this.createRenderers_();
    this.initTileMask_();
    if (this.hitDetectionEnabled_) {
      this.hitRenderTarget_ = new WebGLRenderTarget(this.helper);
    }
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

  beforeTilesRender(frameState, tilesWithAlpha, forHitDetection) {
    super.beforeTilesRender(frameState, true); // always consider that tiles need alpha blending
    this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_
    );

    if (forHitDetection) {
      this.renderedTiles_.length = 0;
      this.hitRenderTarget_.setSize([
        Math.floor(frameState.size[0] / 2),
        Math.floor(frameState.size[1] / 2),
      ]);
      this.helper.prepareDrawToRenderTarget(
        frameState,
        this.hitRenderTarget_,
        true
      );
    }
  }

  beforeTilesMaskRender(frameState) {
    this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_
    );
    const pixelRatio = frameState.pixelRatio;
    const size = frameState.size;
    this.tileMaskTarget_.setSize([size[0] * pixelRatio, size[1] * pixelRatio]);
    this.helper.prepareDrawToRenderTarget(
      frameState,
      this.tileMaskTarget_,
      true,
      true
    );
    this.helper.useProgram(this.tileMaskProgram_, frameState);
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_)
    );
    makeInverseTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.SCREEN_TO_WORLD_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_)
    );
    return true;
  }

  renderTileMask(tileRepresentation, tileZ, extent, depth) {
    if (!tileRepresentation.ready) {
      return;
    }
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, extent);
    this.helper.setUniformFloatValue(Uniforms.GLOBAL_ALPHA, 1);
    this.helper.bindBuffer(
      /** @type {TileGeometry} */ (tileRepresentation).maskVertices
    );
    this.helper.bindBuffer(this.tileMaskIndices_);
    this.helper.enableAttributes(this.tileMaskAttributes_);
    const renderCount = this.tileMaskIndices_.getSize();
    this.helper.drawElements(0, renderCount);
    this.tileMaskTarget_.clearCachedData();
  }

  /**
   * @param {number} alpha Alpha value of the tile
   * @param {import("../../extent.js").Extent} renderExtent Which extent to restrict drawing to
   * @param {import("../../transform.js").Transform} batchInvertTransform Inverse of the transformation in which tile geometries are expressed
   * @param {number} tileZ Tile zoom level
   * @param {number} depth Depth of the tile
   * @param {boolean} forHitDetection Rendering hit detection
   * @private
   */
  applyUniforms_(
    alpha,
    renderExtent,
    batchInvertTransform,
    tileZ,
    depth,
    forHitDetection
  ) {
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
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
    this.helper.setUniformFloatValue(Uniforms.TILE_ZOOM_LEVEL, tileZ);
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, renderExtent);
    this.helper.applyHitDetectionUniform(forHitDetection);
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
    alpha,
    forHitDetection
  ) {
    const gutterExtent = getIntersection(tileExtent, renderExtent, tileExtent);
    const tileZ = tileRepresentation.tile.getTileCoord()[0];
    if (forHitDetection) {
      this.renderedTiles_.push({
        tileZ: tileZ,
        tileGeometry: tileRepresentation,
        renderExtent: renderExtent,
        tileExtent: tileExtent,
      });
    }
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
          forHitDetection
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

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels [this is ignored at the moment].
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance [this is ignored at the moment].
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches
  ) {
    const pixel = applyTransform(
      frameState.coordinateToPixelTransform,
      coordinate.slice()
    );

    // Retrieve the z value of the tile actually rendered at this pixel from the mask.
    const zData = this.tileMaskTarget_.readPixel(
      pixel[0] * frameState.pixelRatio,
      pixel[1] * frameState.pixelRatio
    );

    if (zData[3] !== 255) {
      // the color value is only valid when alpha is 255.
      return;
    }

    // Due to shader precision, this value may be approximative, so we round it
    const approximateTileZ = (zData[0] * TILE_MASK_MAX_LEVELS) / 255;
    const tileZ = Math.round(approximateTileZ);
    for (const t of this.renderedTiles_) {
      if (t.tileZ !== tileZ || !containsCoordinate(t.tileExtent, coordinate)) {
        // It is not the tile used to render this pixel
        continue;
      }

      // The hit render target is using a smaller size
      const hitData = this.hitRenderTarget_.readPixel(
        pixel[0] * HIT_FIXED_PIXEL_RATIO,
        pixel[1] * HIT_FIXED_PIXEL_RATIO
      );
      const hitColor = [
        hitData[0] / 255,
        hitData[1] / 255,
        hitData[2] / 255,
        hitData[3] / 255,
      ];
      // It is assumed that there is no approximation with this color
      const ref = colorDecodeId(hitColor);
      if (!ref) {
        return;
      }
      const feature = t.tileGeometry.getFeatureFromRef(ref);
      if (feature) {
        return callback(feature, this.getLayer(), null);
      }
    }
    return;
  }
}

export default WebGLVectorTileLayerRenderer;
