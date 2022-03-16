/**
 * @module ol/renderer/webgl/VectorLayer
 */
import BaseVector from '../../layer/BaseVector.js';
import GeometryType from '../../geom/GeometryType.js';
import LineStringBatchRenderer from '../../render/webgl/LineStringBatchRenderer.js';
import MixedGeometryBatch from '../../render/webgl/MixedGeometryBatch.js';
import PointBatchRenderer from '../../render/webgl/PointBatchRenderer.js';
import PolygonBatchRenderer from '../../render/webgl/PolygonBatchRenderer.js';
import VectorEventType from '../../source/VectorEventType.js';
import ViewHint from '../../ViewHint.js';
import WebGLLayerRenderer from './Layer.js';
import {DefaultUniform} from '../../webgl/Helper.js';
import {buffer, createEmpty, equals} from '../../extent.js';
import {create as createTransform} from '../../transform.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {listen, unlistenByKey} from '../../events.js';

/**
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(import("../../Feature").default, Object<string, *>):number} callback This callback computes the numerical value of the
 * attribute for a given feature (properties are available as 2nd arg for quicker access).
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {Array<CustomAttribute>} [attributes] These attributes will be read from the features in the source
 * and then passed to the GPU. The `name` property of each attribute will serve as its identifier:
 *  * In the vertex shader as an `attribute` by prefixing it with `a_`
 *  * In the fragment shader as a `varying` by prefixing it with `v_`
 * Please note that these can only be numerical values.
 * @property {string} polygonVertexShader Vertex shader source, mandatory.
 * @property {string} polygonFragmentShader Fragment shader source, mandatory.
 * @property {string} lineStringVertexShader Vertex shader source, mandatory.
 * @property {string} lineStringFragmentShader Fragment shader source, mandatory.
 * @property {string} pointVertexShader Vertex shader source, mandatory.
 * @property {string} pointFragmentShader Fragment shader source, mandatory.
 * @property {string} [hitVertexShader] Vertex shader source for hit detection rendering.
 * @property {string} [hitFragmentShader] Fragment shader source for hit detection rendering.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * Please note that `u_texture` is reserved for the main texture slot.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Experimental WebGL vector renderer. Supports polygons and lines.
 *
 * You need to provide vertex and fragment shaders for rendering. This can be done using
 * {@link module:ol/webgl/ShaderBuilder} utilities.
 *
 * To include variable attributes in the shaders, you need to declare them using the `attributes` property of
 * the options object like so:
 * ```js
 * new WebGLPointsLayerRenderer(layer, {
 *   attributes: [
 *     {
 *       name: 'size',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *     {
 *       name: 'weight',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *   ],
 *   vertexShader:
 *     // shader using attribute a_weight and a_size
 *   fragmentShader:
 *     // shader using varying v_weight and v_size
 * ```
 *
 * To enable hit detection, you must as well provide dedicated shaders using the `hitVertexShader`
 * and `hitFragmentShader` properties. These shall expect the `a_hitColor` attribute to contain
 * the final color that will have to be output for hit detection to work.
 *
 * The following uniform is used for the main texture: `u_texture`.
 *
 * Please note that the main shader output should have premultiplied alpha, otherwise visual anomalies may occur.
 *
 * Polygons are broken down into triangles using the @mapbox/earcut package.
 * Lines are rendered into strips of quads.
 *
 *
 * This uses {@link module:ol/webgl/Helper~WebGLHelper} internally.
 *
 * @api
 */
class WebGLVectorLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options} options Options.
   */
  constructor(layer, options) {
    const uniforms = options.uniforms || {};
    const projectionMatrixTransform = createTransform();
    uniforms[DefaultUniform.PROJECTION_MATRIX] = projectionMatrixTransform;

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
    this.currentTransform_ = projectionMatrixTransform;

    this.polygonVertexShader_ = options.polygonVertexShader;
    this.polygonFragmentShader_ = options.polygonFragmentShader;
    this.pointVertexShader_ = options.pointVertexShader;
    this.pointFragmentShader_ = options.pointFragmentShader;
    this.lineStringVertexShader_ = options.lineStringVertexShader;
    this.lineStringFragmentShader_ = options.lineStringFragmentShader;
    this.attributes_ = options.attributes;

    this.worker_ = createWebGLWorker();

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

  afterHelperCreated() {
    this.polygonRenderer_ = new PolygonBatchRenderer(
      this.helper,
      this.worker_,
      this.polygonVertexShader_,
      this.polygonFragmentShader_,
      this.attributes_ || []
    );
    this.pointRenderer_ = new PointBatchRenderer(
      this.helper,
      this.worker_,
      this.pointVertexShader_,
      this.pointFragmentShader_,
      this.attributes_ || []
    );
    this.lineStringRenderer_ = new LineStringBatchRenderer(
      this.helper,
      this.worker_,
      this.lineStringVertexShader_,
      this.lineStringFragmentShader_,
      this.attributes_ || []
    );
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
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);
    this.polygonRenderer_.render(
      this.batch_.polygonBatch,
      this.currentTransform_,
      frameState
    );
    this.lineStringRenderer_.render(
      this.batch_.lineStringBatch,
      this.currentTransform_,
      frameState
    );
    this.pointRenderer_.render(
      this.batch_.pointBatch,
      this.currentTransform_,
      frameState
    );
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
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
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

      this.polygonRenderer_.rebuild(
        this.batch_.polygonBatch,
        frameState,
        GeometryType.POLYGON
      );
      this.lineStringRenderer_.rebuild(
        this.batch_.lineStringBatch,
        frameState,
        GeometryType.LINE_STRING
      );
      this.pointRenderer_.rebuild(
        this.batch_.pointBatch,
        frameState,
        GeometryType.POINT
      );
      this.previousExtent_ = frameState.extent.slice();
    }

    this.helper.makeProjectionTransform(frameState, this.currentTransform_);
    this.helper.prepareDraw(frameState);

    return true;
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
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
