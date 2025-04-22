/**
 * @module ol/renderer/webgl/VectorLayer
 */
import ViewHint from '../../ViewHint.js';
import {assert} from '../../asserts.js';
import {listen, unlistenByKey} from '../../events.js';
import {buffer, createEmpty, equals} from '../../extent.js';
import BaseVector from '../../layer/BaseVector.js';
import {
  getTransformFromProjections,
  getUserProjection,
  toUserExtent,
  toUserResolution,
} from '../../proj.js';
import MixedGeometryBatch from '../../render/webgl/MixedGeometryBatch.js';
import VectorStyleRenderer from '../../render/webgl/VectorStyleRenderer.js';
import {colorDecodeId} from '../../render/webgl/encodeUtil.js';
import {breakDownFlatStyle} from '../../render/webgl/style.js';
import VectorEventType from '../../source/VectorEventType.js';
import {
  apply as applyTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
  translate as translateTransform,
} from '../../transform.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {DefaultUniform} from '../../webgl/Helper.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';
import WebGLLayerRenderer from './Layer.js';
import {getWorldParameters} from './worldUtil.js';

export const Uniforms = {
  ...DefaultUniform,
  RENDER_EXTENT: 'u_renderExtent', // intersection of layer, source, and view extent
  PATTERN_ORIGIN: 'u_patternOrigin',
  GLOBAL_ALPHA: 'u_globalAlpha',
};

/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').AsShaders} StyleAsShaders
 */
/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').AsRule} StyleAsRule
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {import('../../style/flat.js').FlatStyleLike | Array<StyleAsShaders> | StyleAsShaders} style Flat vector style; also accepts shaders
 * @property {Object<string, number|Array<number>|string|boolean>} variables Style variables
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Experimental WebGL vector renderer. Supports polygons, lines and points:
 *  Polygons are broken down into triangles
 *  Lines are rendered as strips of quads
 *  Points are rendered as quads
 *
 * You need to provide vertex and fragment shaders as well as custom attributes for each type of geometry. All shaders
 * can access the uniforms in the {@link module:ol/webgl/Helper~DefaultUniform} enum.
 * The vertex shaders can access the following attributes depending on the geometry type:
 *  For polygons: {@link module:ol/render/webgl/PolygonBatchRenderer~Attributes}
 *  For line strings: {@link module:ol/render/webgl/LineStringBatchRenderer~Attributes}
 *  For points: {@link module:ol/render/webgl/PointBatchRenderer~Attributes}
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
    const uniforms = {
      [Uniforms.RENDER_EXTENT]: [0, 0, 0, 0],
      [Uniforms.PATTERN_ORIGIN]: [0, 0],
      [Uniforms.GLOBAL_ALPHA]: 1,
    };

    super(layer, {
      uniforms: uniforms,
      postProcesses: options.postProcesses,
    });

    /**
     * @type {boolean}
     * @private
     */
    this.hitDetectionEnabled_ = !options.disableHitDetection;

    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    this.hitRenderTarget_;

    /**
     * @private
     */
    this.sourceRevision_ = -1;

    /**
     * @private
     */
    this.previousExtent_ = createEmpty();

    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentTransform_ = createTransform();

    /**
     * @private
     */
    this.tmpCoords_ = [0, 0];
    /**
     * @private
     */
    this.tmpTransform_ = createTransform();
    /**
     * @private
     */
    this.tmpMat4_ = createMat4();

    /**
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentFrameStateTransform_ = createTransform();

    /**
     * @type {import('../../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = {};

    /**
     * @type {Array<StyleAsRule | StyleAsShaders>}
     * @private
     */
    this.styles_ = [];

    /**
     * @type {Array<VectorStyleRenderer>}
     * @private
     */
    this.styleRenderers_ = [];

    /**
     * @type {Array<import('../../render/webgl/VectorStyleRenderer.js').WebGLBuffers>}
     * @private
     */
    this.buffers_ = [];

    this.applyOptions_(options);

    /**
     * @private
     */
    this.batch_ = new MixedGeometryBatch();

    /**
     * @private
     * @type {boolean}
     */
    this.initialFeaturesAdded_ = false;

    /**
     * @private
     * @type {Array<import("../../events.js").EventsKey|null>}
     */
    this.sourceListenKeys_ = null;
  }

  /**
   * @private
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  addInitialFeatures_(frameState) {
    const source = this.getLayer().getSource();
    const userProjection = getUserProjection();
    let projectionTransform;
    if (userProjection) {
      projectionTransform = getTransformFromProjections(
        userProjection,
        frameState.viewState.projection,
      );
    }
    this.batch_.addFeatures(source.getFeatures(), projectionTransform);
    this.sourceListenKeys_ = [
      listen(
        source,
        VectorEventType.ADDFEATURE,
        this.handleSourceFeatureAdded_.bind(this, projectionTransform),
      ),
      listen(
        source,
        VectorEventType.CHANGEFEATURE,
        this.handleSourceFeatureChanged_,
        this,
      ),
      listen(
        source,
        VectorEventType.REMOVEFEATURE,
        this.handleSourceFeatureDelete_,
        this,
      ),
      listen(
        source,
        VectorEventType.CLEAR,
        this.handleSourceFeatureClear_,
        this,
      ),
    ];
  }

  /**
   * @param {Options} options Options.
   * @private
   */
  applyOptions_(options) {
    this.styleVariables_ = options.variables;
    this.styles_ = breakDownFlatStyle(options.style);
  }

  /**
   * @private
   */
  createRenderers_() {
    this.buffers_ = [];
    this.styleRenderers_ = this.styles_.map(
      (style) =>
        new VectorStyleRenderer(
          style,
          this.styleVariables_,
          this.helper,
          this.hitDetectionEnabled_,
          'filter' in style ? style.filter : null,
        ),
    );
  }

  /**
   * @override
   */
  reset(options) {
    this.applyOptions_(options);
    if (this.helper) {
      this.createRenderers_();
    }
    super.reset(options);
  }

  /**
   * @override
   */
  afterHelperCreated() {
    if (this.styleRenderers_.length) {
      // To reuse buffers
      this.styleRenderers_.forEach((renderer, i) =>
        renderer.setHelper(this.helper, this.buffers_[i]),
      );
    } else {
      this.createRenderers_();
    }

    if (this.hitDetectionEnabled_) {
      this.hitRenderTarget_ = new WebGLRenderTarget(this.helper);
    }
  }

  /**
   * @param {import("../../proj.js").TransformFunction} projectionTransform Transform function.
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureAdded_(projectionTransform, event) {
    const feature = event.feature;
    this.batch_.addFeature(feature, projectionTransform);
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
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );

    // screen to world matrix
    makeInverseTransform(this.tmpTransform_, this.tmpTransform_);
    this.helper.setUniformMatrixValue(
      Uniforms.SCREEN_TO_WORLD_MATRIX,
      mat4FromTransform(this.tmpMat4_, this.tmpTransform_),
    );

    // pattern origin should always be [0, 0] in world coordinates
    this.tmpCoords_[0] = 0;
    this.tmpCoords_[1] = 0;
    makeInverseTransform(this.tmpTransform_, batchInvertTransform);
    applyTransform(this.tmpTransform_, this.tmpCoords_);
    this.helper.setUniformFloatVec2(Uniforms.PATTERN_ORIGIN, this.tmpCoords_);
  }

  /**
   * Render the layer.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   * @override
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const [startWorld, endWorld, worldWidth] = getWorldParameters(
      frameState,
      this.getLayer(),
    );

    // draw the normal canvas
    this.helper.prepareDraw(frameState);
    this.renderWorlds(frameState, false, startWorld, endWorld, worldWidth);
    this.helper.finalizeDraw(
      frameState,
      this.dispatchPreComposeEvent,
      this.dispatchPostComposeEvent,
    );

    const canvas = this.helper.getCanvas();

    if (this.hitDetectionEnabled_) {
      this.renderWorlds(frameState, true, startWorld, endWorld, worldWidth);
      this.hitRenderTarget_.clearCachedData();
    }

    this.postRender(gl, frameState);

    return canvas;
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @override
   */
  prepareFrameInternal(frameState) {
    if (!this.initialFeaturesAdded_) {
      this.addInitialFeatures_(frameState);
      this.initialFeaturesAdded_ = true;
    }

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

      const userProjection = getUserProjection();
      if (userProjection) {
        vectorSource.loadFeatures(
          toUserExtent(extent, userProjection),
          toUserResolution(resolution, projection),
          userProjection,
        );
      } else {
        vectorSource.loadFeatures(extent, resolution, projection);
      }

      this.ready = false;

      const transform = this.helper.makeProjectionTransform(
        frameState,
        createTransform(),
      );

      const generatePromises = this.styleRenderers_.map((renderer, i) =>
        renderer.generateBuffers(this.batch_, transform).then((buffers) => {
          if (this.buffers_[i]) {
            this.disposeBuffers(this.buffers_[i]);
          }
          this.buffers_[i] = buffers;
        }),
      );
      Promise.all(generatePromises).then(() => {
        this.ready = true;
        this.getLayer().changed();
      });

      this.previousExtent_ = frameState.extent.slice();
    }

    return true;
  }

  /**
   * Render the world, either to the main framebuffer or to the hit framebuffer
   * @param {import("../../Map.js").FrameState} frameState current frame state
   * @param {boolean} forHitDetection whether the rendering is for hit detection
   * @param {number} startWorld the world to render in the first iteration
   * @param {number} endWorld the last world to render
   * @param {number} worldWidth the width of the worlds being rendered
   */
  renderWorlds(frameState, forHitDetection, startWorld, endWorld, worldWidth) {
    let world = startWorld;

    if (forHitDetection) {
      this.hitRenderTarget_.setSize([
        Math.floor(frameState.size[0] / 2),
        Math.floor(frameState.size[1] / 2),
      ]);
      this.helper.prepareDrawToRenderTarget(
        frameState,
        this.hitRenderTarget_,
        true,
      );
    }

    do {
      this.helper.makeProjectionTransform(
        frameState,
        this.currentFrameStateTransform_,
      );
      translateTransform(
        this.currentFrameStateTransform_,
        world * worldWidth,
        0,
      );
      for (let i = 0, ii = this.styleRenderers_.length; i < ii; i++) {
        const renderer = this.styleRenderers_[i];
        const buffers = this.buffers_[i];
        if (!buffers) {
          continue;
        }
        renderer.render(buffers, frameState, () => {
          this.applyUniforms_(buffers.invertVerticesTransform);
          this.helper.applyHitDetectionUniform(forHitDetection);
        });
      }
    } while (++world < endWorld);
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
   * @return {T|undefined} Callback result.
   * @template T
   * @override
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches,
  ) {
    assert(
      this.hitDetectionEnabled_,
      '`forEachFeatureAtCoordinate` cannot be used on a WebGL layer if the hit detection logic has been disabled using the `disableHitDetection: true` option.',
    );
    if (!this.styleRenderers_.length || !this.hitDetectionEnabled_) {
      return undefined;
    }

    const pixel = applyTransform(
      frameState.coordinateToPixelTransform,
      coordinate.slice(),
    );

    const data = this.hitRenderTarget_.readPixel(pixel[0] / 2, pixel[1] / 2);
    const color = [data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255];
    const ref = colorDecodeId(color);
    const feature = this.batch_.getFeatureFromRef(ref);
    if (feature) {
      return callback(feature, this.getLayer(), null);
    }
    return undefined;
  }

  /**
   * Will release a set of Webgl buffers
   * @param {import('../../render/webgl/VectorStyleRenderer.js').WebGLBuffers} buffers Buffers
   */
  disposeBuffers(buffers) {
    /**
     * @param {Array<import('../../webgl/Buffer.js').default>} typeBuffers Buffers
     */
    const disposeBuffersOfType = (typeBuffers) => {
      for (const buffer of typeBuffers) {
        if (buffer) {
          this.helper.deleteBuffer(buffer);
        }
      }
    };
    if (buffers.pointBuffers) {
      disposeBuffersOfType(buffers.pointBuffers);
    }
    if (buffers.lineStringBuffers) {
      disposeBuffersOfType(buffers.lineStringBuffers);
    }
    if (buffers.polygonBuffers) {
      disposeBuffersOfType(buffers.polygonBuffers);
    }
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.buffers_.forEach((buffers) => {
      if (buffers) {
        this.disposeBuffers(buffers);
      }
    });
    if (this.sourceListenKeys_) {
      this.sourceListenKeys_.forEach(function (key) {
        unlistenByKey(key);
      });
      this.sourceListenKeys_ = null;
    }
    super.disposeInternal();
  }

  renderDeclutter() {}
}

export default WebGLVectorLayerRenderer;
