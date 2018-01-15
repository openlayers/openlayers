/**
 * @module ol/renderer/webgl/VectorLayer
 */
import {getUid, inherits} from '../../index.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {buffer, containsExtent, createEmpty} from '../../extent.js';
import WebGLReplayGroup from '../../render/webgl/ReplayGroup.js';
import RendererType from '../Type.js';
import _ol_renderer_vector_ from '../vector.js';
import WebGLLayerRenderer from '../webgl/Layer.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} vectorLayer Vector layer.
 * @api
 */
const WebGLVectorLayerRenderer = function(mapRenderer, vectorLayer) {

  WebGLLayerRenderer.call(this, mapRenderer, vectorLayer);

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
   * @type {ol.Extent}
   */
  this.renderedExtent_ = createEmpty();

  /**
   * @private
   * @type {function(ol.Feature, ol.Feature): number|null}
   */
  this.renderedRenderOrder_ = null;

  /**
   * @private
   * @type {ol.render.webgl.ReplayGroup}
   */
  this.replayGroup_ = null;

  /**
   * The last layer state.
   * @private
   * @type {?ol.LayerState}
   */
  this.layerState_ = null;

};

inherits(WebGLVectorLayerRenderer, WebGLLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLVectorLayerRenderer['handles'] = function(type, layer) {
  return type === RendererType.WEBGL && layer.getType() === LayerType.VECTOR;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.VectorLayer} The layer renderer.
 */
WebGLVectorLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLVectorLayerRenderer(
    /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
    /** @type {ol.layer.Vector} */ (layer)
  );
};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.composeFrame = function(frameState, layerState, context) {
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

};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.disposeInternal = function() {
  const replayGroup = this.replayGroup_;
  if (replayGroup) {
    const context = this.mapRenderer.getContext();
    replayGroup.getDeleteResourcesFunction(context)();
    this.replayGroup_ = null;
  }
  WebGLLayerRenderer.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  if (!this.replayGroup_ || !this.layerState_) {
    return undefined;
  } else {
    const context = this.mapRenderer.getContext();
    const viewState = frameState.viewState;
    const layer = this.getLayer();
    const layerState = this.layerState_;
    /** @type {Object.<string, boolean>} */
    const features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate,
      context, viewState.center, viewState.resolution, viewState.rotation,
      frameState.size, frameState.pixelRatio, layerState.opacity,
      {},
      /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
      function(feature) {
        const key = getUid(feature).toString();
        if (!(key in features)) {
          features[key] = true;
          return callback.call(thisArg, feature, layer);
        }
      });
  }
};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
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
};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  const coordinate = _ol_transform_.apply(
    frameState.pixelToCoordinateTransform, pixel.slice());
  const hasFeature = this.hasFeatureAtCoordinate(coordinate, frameState);

  if (hasFeature) {
    return callback.call(thisArg, this.getLayer(), null);
  } else {
    return undefined;
  }
};


/**
 * Handle changes in image style state.
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
WebGLVectorLayerRenderer.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
WebGLVectorLayerRenderer.prototype.prepareFrame = function(frameState, layerState, context) {
  const vectorLayer = /** @type {ol.layer.Vector} */ (this.getLayer());
  const vectorSource = vectorLayer.getSource();

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
    vectorLayerRenderOrder = _ol_renderer_vector_.defaultOrder;
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
    _ol_renderer_vector_.getTolerance(resolution, pixelRatio),
    extent, vectorLayer.getRenderBuffer());
  vectorSource.loadFeatures(extent, resolution, projection);
  /**
   * @param {ol.Feature} feature Feature.
   * @this {ol.renderer.webgl.VectorLayer}
   */
  const renderFeature = function(feature) {
    let styles;
    let styleFunction = feature.getStyleFunction();
    if (styleFunction) {
      styles = styleFunction.call(feature, resolution);
    } else {
      styleFunction = vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
    }
    if (styles) {
      const dirty = this.renderFeature(
        feature, resolution, pixelRatio, styles, replayGroup);
      this.dirty_ = this.dirty_ || dirty;
    }
  };
  if (vectorLayerRenderOrder) {
    /** @type {Array.<ol.Feature>} */
    const features = [];
    vectorSource.forEachFeatureInExtent(extent,
      /**
         * @param {ol.Feature} feature Feature.
         */
      function(feature) {
        features.push(feature);
      }, this);
    features.sort(vectorLayerRenderOrder);
    features.forEach(renderFeature.bind(this));
  } else {
    vectorSource.forEachFeatureInExtent(extent, renderFeature, this);
  }
  replayGroup.finish(context);

  this.renderedResolution_ = resolution;
  this.renderedRevision_ = vectorLayerRevision;
  this.renderedRenderOrder_ = vectorLayerRenderOrder;
  this.renderedExtent_ = extent;
  this.replayGroup_ = replayGroup;

  return true;
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {(ol.style.Style|Array.<ol.style.Style>)} styles The style or array of
 *     styles.
 * @param {ol.render.webgl.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
WebGLVectorLayerRenderer.prototype.renderFeature = function(feature, resolution, pixelRatio, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  let loading = false;
  if (Array.isArray(styles)) {
    for (let i = styles.length - 1, ii = 0; i >= ii; --i) {
      loading = _ol_renderer_vector_.renderFeature(
        replayGroup, feature, styles[i],
        _ol_renderer_vector_.getSquaredTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = _ol_renderer_vector_.renderFeature(
      replayGroup, feature, styles,
      _ol_renderer_vector_.getSquaredTolerance(resolution, pixelRatio),
      this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
export default WebGLVectorLayerRenderer;
