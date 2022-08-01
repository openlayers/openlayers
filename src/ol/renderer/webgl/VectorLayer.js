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
  packColor,
} from './shaders.js';
import {buffer, createEmpty, equals, getWidth} from '../../extent.js';
import {create as createTransform} from '../../transform.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {listen, unlistenByKey} from '../../events.js';

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
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {ShaderProgram} [fill] Attributes and shaders for filling polygons.
 * @property {ShaderProgram} [stroke] Attributes and shaders for line strings and polygon strokes.
 * @property {ShaderProgram} [point] Attributes and shaders for points.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @param {Object<import("./shaders.js").DefaultAttributes,CustomAttributeCallback>} obj Lookup of attribute getters.
 * @return {Array<import("../../render/webgl/BatchRenderer").CustomAttribute>} An array of attribute descriptors.
 */
function toAttributesArray(obj) {
  return Object.keys(obj).map((key) => ({name: key, callback: obj[key]}));
}

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

    /**
     * @private
     */
    this.worker_ = createWebGLWorker();

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

  afterHelperCreated() {
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
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

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

    do {
      this.polygonRenderer_.render(
        this.batch_.polygonBatch,
        this.currentTransform_,
        frameState,
        world * worldWidth
      );
      this.lineStringRenderer_.render(
        this.batch_.lineStringBatch,
        this.currentTransform_,
        frameState,
        world * worldWidth
      );
      this.pointRenderer_.render(
        this.batch_.pointBatch,
        this.currentTransform_,
        frameState,
        world * worldWidth
      );
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

      this.polygonRenderer_.rebuild(
        this.batch_.polygonBatch,
        frameState,
        'Polygon',
        rebuildCb
      );
      this.lineStringRenderer_.rebuild(
        this.batch_.lineStringBatch,
        frameState,
        'LineString',
        rebuildCb
      );
      this.pointRenderer_.rebuild(
        this.batch_.pointBatch,
        frameState,
        'Point',
        rebuildCb
      );
      this.previousExtent_ = frameState.extent.slice();
    }

    this.helper.makeProjectionTransform(frameState, this.currentTransform_);
    this.helper.prepareDraw(frameState);

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
