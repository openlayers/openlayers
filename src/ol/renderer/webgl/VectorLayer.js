/**
 * @module ol/renderer/webgl/VectorLayer
 */
import BaseVector from '../../layer/BaseVector.js';
import LineStringBatchRenderer from '../../render/webgl/LineStringBatchRenderer.js';
import MixedGeometryBatch from '../../render/webgl/MixedGeometryBatch.js';
import PointBatchRenderer from '../../render/webgl/PointBatchRenderer.js';
import PolygonBatchRenderer from '../../render/webgl/PolygonBatchRenderer.js';
import VectorEventType from '../../source/VectorEventType.js';
import ViewHint from '../../ViewHint.js';
import WebGLLayerRenderer from './Layer.js';
import {DefaultUniform} from '../../webgl/Helper.js';
import {
  FILL_FRAGMENT_SHADER,
  FILL_VERTEX_SHADER,
  POINT_FRAGMENT_SHADER,
  POINT_VERTEX_SHADER,
  STROKE_FRAGMENT_SHADER,
  STROKE_VERTEX_SHADER,
} from './shaders.js';
import {buffer, createEmpty, equals, getWidth} from '../../extent.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {
  create as createTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
  translate as translateTransform,
} from '../../transform.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {listen, unlistenByKey} from '../../events.js';
import {packColor} from '../../webgl/styleparser.js';

export const Uniforms = {
  ...DefaultUniform,
  RENDER_EXTENT: 'u_renderExtent', // intersection of layer, source, and view extent
  GLOBAL_ALPHA: 'u_globalAlpha',
};

/**
 * @typedef {function(import("../../Feature").default):number|Array<number>} AttributeCallback A callback computing
 * the value of a custom attribute (different for each feature) to be passed on to the GPU.
 * Properties are available as 2nd arg for quicker access.
 */

/**
 * @typedef {Object} CustomShaderProgram An object containing custom shaders (vertex and fragment); uses attributes and uniforms
 * provided to the renderer
 * @property {string} vertexShader Vertex shader source.
 * @property {string} fragmentShader Fragment shader source.
 */

/**
 * @typedef {Object} DefaultShaderProgram An object containing attribute callbacks for the default shaders
 * @property {AttributeCallback} [color] Color value, encoded in a [number, number] array (use the {@link module:ol/webgl/styleparser~packColor} function)
 * @property {AttributeCallback} [width] Stroke width value
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {CustomShaderProgram|DefaultShaderProgram} [fill] Shaders for filling polygons.
 * @property {CustomShaderProgram|DefaultShaderProgram} [stroke] Shaders for line strings and polygon strokes.
 * @property {CustomShaderProgram|DefaultShaderProgram} [point] Shaders for points.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions.
 * @property {Array<import("../../render/webgl/BatchRenderer.js").CustomAttribute>} [attributes] Attribute definitions.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Experimental WebGL vector renderer. Supports polygons, lines and points:
 *  * Polygons are broken down into triangles
 *  * Lines are rendered as strips of quads
 *  * Points are rendered as quads
 *
 * You need to provide vertex and fragment shaders as well as custom attributes for each type of geometry. All shaders
 * can access the uniforms in the {@link module:ol/webgl/Helper~DefaultUniform} enum.
 * The vertex shaders can access the following attributes depending on the geometry type:
 *  * For polygons: {@link module:ol/render/webgl/PolygonBatchRenderer~Attributes}
 *  * For line strings: {@link module:ol/render/webgl/LineStringBatchRenderer~Attributes}
 *  * For points: {@link module:ol/render/webgl/PointBatchRenderer~Attributes}
 *
 * Please note that the fragment shaders output should have premultiplied alpha, otherwise visual anomalies may occur.
 *
 * Note: this uses {@link module:ol/webgl/Helper~WebGLHelper} internally.
 */
class WebGLVectorLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options} options Options.
   */
  constructor(layer, options) {
    const uniforms = options.uniforms || {};
    uniforms[Uniforms.RENDER_EXTENT] = [0, 0, 0, 0];
    uniforms[Uniforms.GLOBAL_ALPHA] = 1;

    super(layer, {
      uniforms: uniforms,
      postProcesses: options.postProcesses,
    });

    this.sourceRevision_ = -1;

    this.previousExtent_ = createEmpty();

    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentTransform_ = createTransform();

    this.tmpTransform_ = createTransform();
    this.tmpMat4_ = createMat4();

    /**
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentFrameStateTransform_ = createTransform();

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
     * @type {string}
     * @private
     */
    this.fillVertexShader_;

    /**
     * @type {string}
     * @private
     */
    this.fillFragmentShader_;

    /**
     * @type {string}
     * @private
     */
    this.strokeVertexShader_;

    /**
     * @type {string}
     * @private
     */
    this.strokeFragmentShader_;

    /**
     * @type {string}
     * @private
     */
    this.pointVertexShader_;

    /**
     * @type {string}
     * @private
     */
    this.pointFragmentShader_;

    /**
     * @type {Array<import('../../render/webgl/BatchRenderer.js').CustomAttribute>}
     * @private
     */
    this.fillAttributes_;

    /**
     * @type {Array<import('../../render/webgl/BatchRenderer.js').CustomAttribute>}
     * @private
     */
    this.strokeAttributes_;

    /**
     * @type {Array<import('../../render/webgl/BatchRenderer.js').CustomAttribute>}
     * @private
     */
    this.pointAttributes_;

    this.applyOptions_(options);

    /**
     * @private
     */
    this.batch_ = new MixedGeometryBatch();

    const source = this.getLayer().getSource();
    this.batch_.addFeatures(source.getFeatures());
    this.sourceListenKeys_ = [
      listen(
        source,
        VectorEventType.ADDFEATURE,
        this.handleSourceFeatureAdded_,
        this
      ),
      listen(
        source,
        VectorEventType.CHANGEFEATURE,
        this.handleSourceFeatureChanged_,
        this
      ),
      listen(
        source,
        VectorEventType.REMOVEFEATURE,
        this.handleSourceFeatureDelete_,
        this
      ),
      listen(
        source,
        VectorEventType.CLEAR,
        this.handleSourceFeatureClear_,
        this
      ),
    ];
  }

  /**
   * @param {Options} options Options.
   * @private
   */
  applyOptions_(options) {
    this.fillAttributes_ = [];
    this.strokeAttributes_ = [];
    this.pointAttributes_ = [];

    if (options.fill && 'vertexShader' in options.fill) {
      this.fillVertexShader_ = options.fill.vertexShader;
      this.fillFragmentShader_ = options.fill.fragmentShader;
    } else {
      this.fillVertexShader_ = FILL_VERTEX_SHADER;
      this.fillFragmentShader_ = FILL_FRAGMENT_SHADER;
      const colorCallback =
        options.fill && 'color' in options.fill
          ? options.fill.color
          : () => packColor('#ddd');
      this.fillAttributes_.push({
        name: 'color',
        size: 2,
        callback: colorCallback,
      });
    }

    if (options.stroke && 'vertexShader' in options.stroke) {
      this.strokeVertexShader_ = options.stroke.vertexShader;
      this.strokeFragmentShader_ = options.stroke.fragmentShader;
    } else {
      this.strokeVertexShader_ = STROKE_VERTEX_SHADER;
      this.strokeFragmentShader_ = STROKE_FRAGMENT_SHADER;
      const colorCallback =
        options.stroke && 'color' in options.stroke
          ? options.stroke.color
          : () => packColor('#eee');
      const widthCallback =
        options.stroke && 'width' in options.stroke
          ? options.stroke.width
          : () => 1.5;
      this.strokeAttributes_.push(
        {
          name: 'color',
          size: 2,
          callback: colorCallback,
        },
        {
          name: 'width',
          callback: widthCallback,
        }
      );
    }

    if (options.point && 'vertexShader' in options.point) {
      this.pointVertexShader_ = options.point.vertexShader;
      this.pointFragmentShader_ = options.point.fragmentShader;
    } else {
      this.pointVertexShader_ = POINT_VERTEX_SHADER;
      this.pointFragmentShader_ = POINT_FRAGMENT_SHADER;
      const colorCallback =
        options.point && 'color' in options.point
          ? options.point.color
          : () => packColor('#eee');
      this.pointAttributes_.push({
        name: 'color',
        size: 2,
        callback: colorCallback,
      });
    }

    if (options.attributes) {
      this.fillAttributes_ = this.fillAttributes_.concat(options.attributes);
      this.strokeAttributes_ = this.strokeAttributes_.concat(
        options.attributes
      );
      this.pointAttributes_ = this.pointAttributes_.concat(options.attributes);
    }
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

  reset(options) {
    this.applyOptions_(options);
    if (this.helper) {
      this.createRenderers_();
    }
    super.reset(options);
  }

  afterHelperCreated() {
    this.createRenderers_();
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureAdded_(event) {
    const feature = event.feature;
    this.batch_.addFeature(feature);
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureChanged_(event) {
    const feature = event.feature;
    this.batch_.changeFeature(feature);
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureDelete_(event) {
    const feature = event.feature;
    this.batch_.removeFeature(feature);
  }

  /**
   * @private
   */
  handleSourceFeatureClear_() {
    this.batch_.clear();
  }

  /**
   * @param {import("../../transform.js").Transform} batchInvertTransform Inverse of the transformation in which geometries are expressed
   * @private
   */
  applyUniforms_(batchInvertTransform) {
    // world to screen matrix
    setFromTransform(this.tmpTransform_, this.currentFrameStateTransform_);
    multiplyTransform(this.tmpTransform_, batchInvertTransform);
    this.helper.setUniformMatrixValue(
      Uniforms.PROJECTION_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_)
    );
  }

  /**
   * Render the layer.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    this.helper.prepareDraw(frameState);
    this.currentFrameStateTransform_ = this.helper.makeProjectionTransform(
      frameState,
      this.currentFrameStateTransform_
    );

    const layer = this.getLayer();
    const vectorSource = layer.getSource();
    const projection = frameState.viewState.projection;
    const multiWorld = vectorSource.getWrapX() && projection.canWrapX();
    const projectionExtent = projection.getExtent();
    const extent = frameState.extent;
    const worldWidth = multiWorld ? getWidth(projectionExtent) : null;
    const endWorld = multiWorld
      ? Math.ceil((extent[2] - projectionExtent[2]) / worldWidth) + 1
      : 1;
    let world = multiWorld
      ? Math.floor((extent[0] - projectionExtent[0]) / worldWidth)
      : 0;

    translateTransform(this.tmpTransform_, world * worldWidth, 0);
    do {
      this.polygonRenderer_.preRender(this.batch_.polygonBatch, frameState);
      this.applyUniforms_(
        this.batch_.polygonBatch.invertVerticesBufferTransform
      );
      this.polygonRenderer_.render(this.batch_.polygonBatch);

      this.lineStringRenderer_.preRender(
        this.batch_.lineStringBatch,
        frameState
      );
      this.applyUniforms_(
        this.batch_.lineStringBatch.invertVerticesBufferTransform
      );
      this.lineStringRenderer_.render(this.batch_.lineStringBatch);

      this.pointRenderer_.preRender(this.batch_.pointBatch, frameState);
      this.applyUniforms_(this.batch_.pointBatch.invertVerticesBufferTransform);
      this.pointRenderer_.render(this.batch_.pointBatch);

      translateTransform(this.currentFrameStateTransform_, worldWidth, 0);
    } while (++world < endWorld);

    this.helper.finalizeDraw(frameState);

    const canvas = this.helper.getCanvas();
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = String(opacity);
    }

    this.postRender(gl, frameState);
    return canvas;
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrameInternal(frameState) {
    const layer = this.getLayer();
    const vectorSource = layer.getSource();
    const viewState = frameState.viewState;
    const viewNotMoving =
      !frameState.viewHints[ViewHint.ANIMATING] &&
      !frameState.viewHints[ViewHint.INTERACTING];
    const extentChanged = !equals(this.previousExtent_, frameState.extent);
    const sourceChanged = this.sourceRevision_ < vectorSource.getRevision();

    if (sourceChanged) {
      this.sourceRevision_ = vectorSource.getRevision();
    }

    if (viewNotMoving && (extentChanged || sourceChanged)) {
      const projection = viewState.projection;
      const resolution = viewState.resolution;

      const renderBuffer =
        layer instanceof BaseVector ? layer.getRenderBuffer() : 0;
      const extent = buffer(frameState.extent, renderBuffer * resolution);
      vectorSource.loadFeatures(extent, resolution, projection);

      this.ready = false;
      let remaining = 3;
      const rebuildCb = () => {
        remaining--;
        this.ready = remaining <= 0;
        this.getLayer().changed();
      };

      const transform = this.helper.makeProjectionTransform(
        frameState,
        createTransform()
      );

      this.polygonRenderer_.rebuild(
        this.batch_.polygonBatch,
        transform,
        'Polygon',
        rebuildCb
      );
      this.lineStringRenderer_.rebuild(
        this.batch_.lineStringBatch,
        transform,
        'LineString',
        rebuildCb
      );
      this.pointRenderer_.rebuild(
        this.batch_.pointBatch,
        transform,
        'Point',
        rebuildCb
      );
      this.previousExtent_ = frameState.extent.slice();
    }

    return true;
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
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
    return undefined;
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.worker_.terminate();
    this.layer_ = null;
    this.sourceListenKeys_.forEach(function (key) {
      unlistenByKey(key);
    });
    this.sourceListenKeys_ = null;
    super.disposeInternal();
  }
}

export default WebGLVectorLayerRenderer;
