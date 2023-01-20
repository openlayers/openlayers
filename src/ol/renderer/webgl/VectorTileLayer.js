/**
 * @module ol/renderer/webgl/VectorTileLayer
 */
import EventType from '../../events/EventType.js';
import LineStringBatchRenderer from '../../render/webgl/LineStringBatchRenderer.js';
import PointBatchRenderer from '../../render/webgl/PointBatchRenderer.js';
import PolygonBatchRenderer from '../../render/webgl/PolygonBatchRenderer.js';
import TileGeometry from '../../webgl/TileGeometry.js';
import WebGLBaseTileLayerRenderer, {Uniforms} from './TileLayerBase.js';
import {
  FILL_FRAGMENT_SHADER,
  FILL_VERTEX_SHADER,
  POINT_FRAGMENT_SHADER,
  POINT_VERTEX_SHADER,
  STROKE_FRAGMENT_SHADER,
  STROKE_VERTEX_SHADER,
  packColor,
} from './shaders.js';
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
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {getIntersection} from '../../extent.js';

/**
 * @param {Object<import("./shaders.js").DefaultAttributes,CustomAttributeCallback>} obj Lookup of attribute getters.
 * @return {Array<import("../../render/webgl/BatchRenderer").CustomAttribute>} An array of attribute descriptors.
 */
function toAttributesArray(obj) {
  return Object.keys(obj).map((key) => ({name: key, callback: obj[key]}));
}

/**
 * @typedef {function(import("../../Feature").default, Object<string, *>):number} CustomAttributeCallback A callback computing
 * the value of a custom attribute (different for each feature) to be passed on to the GPU.
 * Properties are available as 2nd arg for quicker access.
 */

/**
 * @typedef {Object} ShaderProgram An object containing both shaders (vertex and fragment) as well as the required attributes
 * @property {string} [vertexShader] Vertex shader source (using the default one if unspecified).
 * @property {string} [fragmentShader] Fragment shader source (using the default one if unspecified).
 * @property {Object<import("./shaders.js").DefaultAttributes,CustomAttributeCallback>} attributes Custom attributes made available in the vertex shader.
 * Keys are the names of the attributes which are then accessible in the vertex shader using the `a_` prefix, e.g.: `a_opacity`.
 * Default shaders rely on the attributes in {@link module:ol/render/webgl/shaders~DefaultAttributes}.
 */

/**
 * @typedef {Object} Options
 * @property {ShaderProgram} [fill] Attributes and shaders for filling polygons.
 * @property {ShaderProgram} [stroke] Attributes and shaders for line strings and polygon strokes.
 * @property {ShaderProgram} [point] Attributes and shaders for points.
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
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
     * @private
     */
    this.worker_ = createWebGLWorker();

    /**
     * @type {PolygonBatchRenderer}
     * @private
     */
    this.polygonRenderer_ = null;
    /**
     * @type {PointBatchRenderer}
     * @private
     */
    this.pointRenderer_ = null;
    /**
     * @type {LineStringBatchRenderer}
     * @private
     */
    this.lineStringRenderer_ = null;

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
    const fillAttributes = {
      color: function () {
        return packColor('#ddd');
      },
      opacity: function () {
        return 1;
      },
      ...(options.fill && options.fill.attributes),
    };

    const strokeAttributes = {
      color: function () {
        return packColor('#eee');
      },
      opacity: function () {
        return 1;
      },
      width: function () {
        return 1.5;
      },
      ...(options.stroke && options.stroke.attributes),
    };

    const pointAttributes = {
      color: function () {
        return packColor('#eee');
      },
      opacity: function () {
        return 1;
      },
      ...(options.point && options.point.attributes),
    };

    this.fillVertexShader_ =
      (options.fill && options.fill.vertexShader) || FILL_VERTEX_SHADER;
    this.fillFragmentShader_ =
      (options.fill && options.fill.fragmentShader) || FILL_FRAGMENT_SHADER;
    this.fillAttributes_ = toAttributesArray(fillAttributes);

    this.strokeVertexShader_ =
      (options.stroke && options.stroke.vertexShader) || STROKE_VERTEX_SHADER;
    this.strokeFragmentShader_ =
      (options.stroke && options.stroke.fragmentShader) ||
      STROKE_FRAGMENT_SHADER;
    this.strokeAttributes_ = toAttributesArray(strokeAttributes);

    this.pointVertexShader_ =
      (options.point && options.point.vertexShader) || POINT_VERTEX_SHADER;
    this.pointFragmentShader_ =
      (options.point && options.point.fragmentShader) || POINT_FRAGMENT_SHADER;
    this.pointAttributes_ = toAttributesArray(pointAttributes);
  }

  /**
   * @private
   */
  createRenderers_() {
    this.polygonRenderer_ = new PolygonBatchRenderer(
      this.helper,
      this.worker_,
      this.fillVertexShader_,
      this.fillFragmentShader_,
      this.fillAttributes_
    );
    this.pointRenderer_ = new PointBatchRenderer(
      this.helper,
      this.worker_,
      this.pointVertexShader_,
      this.pointFragmentShader_,
      this.pointAttributes_
    );
    this.lineStringRenderer_ = new LineStringBatchRenderer(
      this.helper,
      this.worker_,
      this.strokeVertexShader_,
      this.strokeFragmentShader_,
      this.strokeAttributes_
    );
  }

  afterHelperCreated() {
    this.createRenderers_();
  }

  createTileRepresentation(options) {
    const tileRep = new TileGeometry(
      options,
      this.polygonRenderer_,
      this.lineStringRenderer_,
      this.pointRenderer_
    );
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

    this.polygonRenderer_.preRender(
      tileRepresentation.batch.polygonBatch,
      this.frameState
    );
    this.applyUniforms_(
      alpha,
      gutterExtent,
      tileRepresentation.batch.polygonBatch.invertVerticesBufferTransform
    );
    this.polygonRenderer_.render(tileRepresentation.batch.polygonBatch);

    this.lineStringRenderer_.preRender(
      tileRepresentation.batch.lineStringBatch,
      this.frameState
    );
    this.applyUniforms_(
      alpha,
      gutterExtent,
      tileRepresentation.batch.lineStringBatch.invertVerticesBufferTransform
    );
    this.lineStringRenderer_.render(tileRepresentation.batch.lineStringBatch);

    this.pointRenderer_.preRender(
      tileRepresentation.batch.pointBatch,
      this.frameState
    );
    this.applyUniforms_(
      alpha,
      gutterExtent,
      tileRepresentation.batch.pointBatch.invertVerticesBufferTransform
    );
    this.pointRenderer_.render(tileRepresentation.batch.pointBatch);
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
    this.worker_.terminate();
    super.disposeInternal();
  }
}

export default WebGLVectorTileLayerRenderer;
