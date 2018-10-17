/**
 * @module ol/renderer/webgl/VectorLayer
 */
import {getUid} from '../../util.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {buffer, containsExtent, createEmpty} from '../../extent.js';
import WebGLReplayGroup from '../../render/webgl/ReplayGroup.js';
import {defaultOrder as defaultRenderOrder, getTolerance as getRenderTolerance, getSquaredTolerance as getSquaredRenderTolerance, renderFeature} from '../vector.js';
import WebGLLayerRenderer from '../webgl/Layer.js';
import {apply as applyTransform} from '../../transform.js';


/**
 * @classdesc
 * WebGL renderer for vector layers.
 * @api
 */
class WebGLVectorLayerRenderer extends WebGLLayerRenderer {

  /**
   * @param {import("./Map.js").default} mapRenderer Map renderer.
   * @param {import("../../layer/Vector.js").default} vectorLayer Vector layer.
   */
  constructor(mapRenderer, vectorLayer) {

    super(mapRenderer, vectorLayer);

    /**
     * @private
     * @type {boolean}
     */
    this.dirty_ = false;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.renderedResolution_ = NaN;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.renderedExtent_ = createEmpty();

    /**
     * @private
     * @type {function(import("../../Feature.js").default, import("../../Feature.js").default): number|null}
     */
    this.renderedRenderOrder_ = null;

    /**
     * @private
     * @type {import("../../render/webgl/ReplayGroup.js").default}
     */
    this.replayGroup_ = null;

    /**
     * The last layer state.
     * @private
     * @type {?import("../../layer/Layer.js").State}
     */
    this.layerState_ = null;

  }

  /**
   * @inheritDoc
   */
  composeFrame(frameState, layerState, context) {
    this.layerState_ = layerState;
    const viewState = frameState.viewState;
    const replayGroup = this.replayGroup_;
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;
    const gl = this.mapRenderer.getGL();
    if (replayGroup && !replayGroup.isEmpty()) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, size[0] * pixelRatio, size[1] * pixelRatio);
      replayGroup.replay(context,
        viewState.center, viewState.resolution, viewState.rotation,
        size, pixelRatio, layerState.opacity,
        layerState.managed ? frameState.skippedFeatureUids : {});
      gl.disable(gl.SCISSOR_TEST);
    }

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    const replayGroup = this.replayGroup_;
    if (replayGroup) {
      const context = this.mapRenderer.getContext();
      replayGroup.getDeleteResourcesFunction(context)();
      this.replayGroup_ = null;
    }
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    if (!this.replayGroup_ || !this.layerState_) {
      return undefined;
    } else {
      const context = this.mapRenderer.getContext();
      const viewState = frameState.viewState;
      const layer = this.getLayer();
      const layerState = this.layerState_;
      /** @type {!Object<string, boolean>} */
      const features = {};
      return this.replayGroup_.forEachFeatureAtCoordinate(coordinate,
        context, viewState.center, viewState.resolution, viewState.rotation,
        frameState.size, frameState.pixelRatio, layerState.opacity,
        {},
        /**
         * @param {import("../../Feature.js").FeatureLike} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          const key = getUid(feature);
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
    }
  }

  /**
   * @inheritDoc
   */
  hasFeatureAtCoordinate(coordinate, frameState) {
    if (!this.replayGroup_ || !this.layerState_) {
      return false;
    } else {
      const context = this.mapRenderer.getContext();
      const viewState = frameState.viewState;
      const layerState = this.layerState_;
      return this.replayGroup_.hasFeatureAtCoordinate(coordinate,
        context, viewState.center, viewState.resolution, viewState.rotation,
        frameState.size, frameState.pixelRatio, layerState.opacity,
        frameState.skippedFeatureUids);
    }
  }

  /**
   * @inheritDoc
   */
  forEachLayerAtPixel(pixel, frameState, callback, thisArg) {
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform, pixel.slice());
    const hasFeature = this.hasFeatureAtCoordinate(coordinate, frameState);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  }

  /**
   * Handle changes in image style state.
   * @param {import("../../events/Event.js").default} event Image style change event.
   * @private
   */
  handleStyleImageChange_(event) {
    this.renderIfReadyAndVisible();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState, context) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = /** @type {import("../../source/Vector.js").default} */ (vectorLayer.getSource());

    const animating = frameState.viewHints[ViewHint.ANIMATING];
    const interacting = frameState.viewHints[ViewHint.INTERACTING];
    const updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
    const updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

    if (!this.dirty_ && (!updateWhileAnimating && animating) ||
        (!updateWhileInteracting && interacting)) {
      return true;
    }

    const frameStateExtent = frameState.extent;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const resolution = viewState.resolution;
    const pixelRatio = frameState.pixelRatio;
    const vectorLayerRevision = vectorLayer.getRevision();
    const vectorLayerRenderBuffer = vectorLayer.getRenderBuffer();
    let vectorLayerRenderOrder = vectorLayer.getRenderOrder();

    if (vectorLayerRenderOrder === undefined) {
      vectorLayerRenderOrder = defaultRenderOrder;
    }

    const extent = buffer(frameStateExtent,
      vectorLayerRenderBuffer * resolution);

    if (!this.dirty_ &&
        this.renderedResolution_ == resolution &&
        this.renderedRevision_ == vectorLayerRevision &&
        this.renderedRenderOrder_ == vectorLayerRenderOrder &&
        containsExtent(this.renderedExtent_, extent)) {
      return true;
    }

    if (this.replayGroup_) {
      frameState.postRenderFunctions.push(
        this.replayGroup_.getDeleteResourcesFunction(context));
    }

    this.dirty_ = false;

    const replayGroup = new WebGLReplayGroup(
      getRenderTolerance(resolution, pixelRatio),
      extent, vectorLayer.getRenderBuffer());
    vectorSource.loadFeatures(extent, resolution, projection);
    /**
     * @param {import("../../Feature.js").default} feature Feature.
     * @this {WebGLVectorLayerRenderer}
     */
    const render = function(feature) {
      let styles;
      const styleFunction = feature.getStyleFunction() || vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(
          feature, resolution, pixelRatio, styles, replayGroup);
        this.dirty_ = this.dirty_ || dirty;
      }
    }.bind(this);
    if (vectorLayerRenderOrder) {
      /** @type {Array<import("../../Feature.js").default>} */
      const features = [];
      vectorSource.forEachFeatureInExtent(extent,
        /**
         * @param {import("../../Feature.js").default} feature Feature.
         */
        function(feature) {
          features.push(feature);
        });
      features.sort(vectorLayerRenderOrder);
      features.forEach(render.bind(this));
    } else {
      vectorSource.forEachFeatureInExtent(extent, render);
    }
    replayGroup.finish(context);

    this.renderedResolution_ = resolution;
    this.renderedRevision_ = vectorLayerRevision;
    this.renderedRenderOrder_ = vectorLayerRenderOrder;
    this.renderedExtent_ = extent;
    this.replayGroup_ = replayGroup;

    return true;
  }

  /**
   * @param {import("../../Feature.js").default} feature Feature.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of
   *     styles.
   * @param {import("../../render/webgl/ReplayGroup.js").default} replayGroup Replay group.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(feature, resolution, pixelRatio, styles, replayGroup) {
    if (!styles) {
      return false;
    }
    let loading = false;
    if (Array.isArray(styles)) {
      for (let i = styles.length - 1, ii = 0; i >= ii; --i) {
        loading = renderFeature(
          replayGroup, feature, styles[i],
          getSquaredRenderTolerance(resolution, pixelRatio),
          this.handleStyleImageChange_, this) || loading;
      }
    } else {
      loading = renderFeature(
        replayGroup, feature, styles,
        getSquaredRenderTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this) || loading;
    }
    return loading;
  }
}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLVectorLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.VECTOR;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {WebGLVectorLayerRenderer} The layer renderer.
 */
WebGLVectorLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLVectorLayerRenderer(
    /** @type {import("./Map.js").default} */ (mapRenderer),
    /** @type {import("../../layer/Vector.js").default} */ (layer)
  );
};


export default WebGLVectorLayerRenderer;
