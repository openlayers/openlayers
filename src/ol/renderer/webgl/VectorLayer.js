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
import {
  DEFAULT_LINESTRING_FRAGMENT,
  DEFAULT_LINESTRING_VERTEX,
  DEFAULT_POINT_FRAGMENT,
  DEFAULT_POINT_VERTEX,
  DEFAULT_POLYGON_FRAGMENT,
  DEFAULT_POLYGON_VERTEX,
  DefaultAttributes,
  packColor,
} from './shaders.js';
import {DefaultUniform} from '../../webgl/Helper.js';
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
 * @property {Object<string,CustomAttributeCallback>} attributes Custom attributes made available in the vertex shader.
 * Keys are the names of the attributes which are then accessible in the vertex shader using the `a_` prefix, e.g.: `a_opacity`.
 * Default shaders rely on the attributes in {@link module:ol/render/webgl/shaders~DefaultAttributes}.
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {ShaderProgram} [polygonShader] Vertex shaders for polygons; using default shader if unspecified
 * @property {ShaderProgram} [lineStringShader] Vertex shaders for line strings; using default shader if unspecified
 * @property {ShaderProgram} [pointShader] Vertex shaders for points; using default shader if unspecified
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions.
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

    const polygonAttributesWithDefault = {
      [DefaultAttributes.COLOR]: function () {
        return packColor('#ddd');
      },
      [DefaultAttributes.OPACITY]: function () {
        return 1;
      },
      ...(options.polygonShader && options.polygonShader.attributes),
    };
    const lineAttributesWithDefault = {
      [DefaultAttributes.COLOR]: function () {
        return packColor('#eee');
      },
      [DefaultAttributes.OPACITY]: function () {
        return 1;
      },
      [DefaultAttributes.WIDTH]: function () {
        return 1.5;
      },
      ...(options.lineStringShader && options.lineStringShader.attributes),
    };
    const pointAttributesWithDefault = {
      [DefaultAttributes.COLOR]: function () {
        return packColor('#eee');
      },
      [DefaultAttributes.OPACITY]: function () {
        return 1;
      },
      ...(options.pointShader && options.pointShader.attributes),
    };
    function toAttributesArray(obj) {
      return Object.keys(obj).map((key) => ({name: key, callback: obj[key]}));
    }

    this.polygonVertexShader_ =
      (options.polygonShader && options.polygonShader.vertexShader) ||
      DEFAULT_POLYGON_VERTEX;
    this.polygonFragmentShader_ =
      (options.polygonShader && options.polygonShader.fragmentShader) ||
      DEFAULT_POLYGON_FRAGMENT;
    this.polygonAttributes_ = toAttributesArray(polygonAttributesWithDefault);

    this.lineStringVertexShader_ =
      (options.lineStringShader && options.lineStringShader.vertexShader) ||
      DEFAULT_LINESTRING_VERTEX;
    this.lineStringFragmentShader_ =
      (options.lineStringShader && options.lineStringShader.fragmentShader) ||
      DEFAULT_LINESTRING_FRAGMENT;
    this.lineStringAttributes_ = toAttributesArray(lineAttributesWithDefault);

    this.pointVertexShader_ =
      (options.pointShader && options.pointShader.vertexShader) ||
      DEFAULT_POINT_VERTEX;
    this.pointFragmentShader_ =
      (options.pointShader && options.pointShader.fragmentShader) ||
      DEFAULT_POINT_FRAGMENT;
    this.pointAttributes_ = toAttributesArray(pointAttributesWithDefault);

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
      this.polygonVertexShader_,
      this.polygonFragmentShader_,
      this.polygonAttributes_
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
      this.lineStringVertexShader_,
      this.lineStringFragmentShader_,
      this.lineStringAttributes_
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
