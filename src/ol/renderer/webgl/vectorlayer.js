import _ol_ from '../../index';
import _ol_LayerType_ from '../../layertype';
import _ol_ViewHint_ from '../../viewhint';
import _ol_extent_ from '../../extent';
import _ol_render_webgl_ReplayGroup_ from '../../render/webgl/replaygroup';
import _ol_renderer_Type_ from '../type';
import _ol_renderer_vector_ from '../vector';
import _ol_renderer_webgl_Layer_ from '../webgl/layer';
import _ol_transform_ from '../../transform';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} vectorLayer Vector layer.
 * @api
 */
var _ol_renderer_webgl_VectorLayer_ = function(mapRenderer, vectorLayer) {

  _ol_renderer_webgl_Layer_.call(this, mapRenderer, vectorLayer);

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
  this.renderedExtent_ = _ol_extent_.createEmpty();

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

_ol_.inherits(_ol_renderer_webgl_VectorLayer_, _ol_renderer_webgl_Layer_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_webgl_VectorLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.WEBGL && layer.getType() === _ol_LayerType_.VECTOR;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.VectorLayer} The layer renderer.
 */
_ol_renderer_webgl_VectorLayer_['create'] = function(mapRenderer, layer) {
  return new _ol_renderer_webgl_VectorLayer_(
      /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
      /** @type {ol.layer.Vector} */ (layer)
  );
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_VectorLayer_.prototype.composeFrame = function(frameState, layerState, context) {
  this.layerState_ = layerState;
  var viewState = frameState.viewState;
  var replayGroup = this.replayGroup_;
  var size = frameState.size;
  var pixelRatio = frameState.pixelRatio;
  var gl = this.mapRenderer.getGL();
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
_ol_renderer_webgl_VectorLayer_.prototype.disposeInternal = function() {
  var replayGroup = this.replayGroup_;
  if (replayGroup) {
    var context = this.mapRenderer.getContext();
    replayGroup.getDeleteResourcesFunction(context)();
    this.replayGroup_ = null;
  }
  _ol_renderer_webgl_Layer_.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_VectorLayer_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  if (!this.replayGroup_ || !this.layerState_) {
    return undefined;
  } else {
    var context = this.mapRenderer.getContext();
    var viewState = frameState.viewState;
    var layer = this.getLayer();
    var layerState = this.layerState_;
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate,
        context, viewState.center, viewState.resolution, viewState.rotation,
        frameState.size, frameState.pixelRatio, layerState.opacity,
        {},
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = _ol_.getUid(feature).toString();
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
_ol_renderer_webgl_VectorLayer_.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
  if (!this.replayGroup_ || !this.layerState_) {
    return false;
  } else {
    var context = this.mapRenderer.getContext();
    var viewState = frameState.viewState;
    var layerState = this.layerState_;
    return this.replayGroup_.hasFeatureAtCoordinate(coordinate,
        context, viewState.center, viewState.resolution, viewState.rotation,
        frameState.size, frameState.pixelRatio, layerState.opacity,
        frameState.skippedFeatureUids);
  }
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_VectorLayer_.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  var coordinate = _ol_transform_.apply(
      frameState.pixelToCoordinateTransform, pixel.slice());
  var hasFeature = this.hasFeatureAtCoordinate(coordinate, frameState);

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
_ol_renderer_webgl_VectorLayer_.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_VectorLayer_.prototype.prepareFrame = function(frameState, layerState, context) {

  var vectorLayer = /** @type {ol.layer.Vector} */ (this.getLayer());
  var vectorSource = vectorLayer.getSource();

  this.updateAttributions(
      frameState.attributions, vectorSource.getAttributions());
  this.updateLogos(frameState, vectorSource);

  var animating = frameState.viewHints[_ol_ViewHint_.ANIMATING];
  var interacting = frameState.viewHints[_ol_ViewHint_.INTERACTING];
  var updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
  var updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

  if (!this.dirty_ && (!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  var frameStateExtent = frameState.extent;
  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;
  var vectorLayerRevision = vectorLayer.getRevision();
  var vectorLayerRenderBuffer = vectorLayer.getRenderBuffer();
  var vectorLayerRenderOrder = vectorLayer.getRenderOrder();

  if (vectorLayerRenderOrder === undefined) {
    vectorLayerRenderOrder = _ol_renderer_vector_.defaultOrder;
  }

  var extent = _ol_extent_.buffer(frameStateExtent,
      vectorLayerRenderBuffer * resolution);

  if (!this.dirty_ &&
      this.renderedResolution_ == resolution &&
      this.renderedRevision_ == vectorLayerRevision &&
      this.renderedRenderOrder_ == vectorLayerRenderOrder &&
      _ol_extent_.containsExtent(this.renderedExtent_, extent)) {
    return true;
  }

  if (this.replayGroup_) {
    frameState.postRenderFunctions.push(
        this.replayGroup_.getDeleteResourcesFunction(context));
  }

  this.dirty_ = false;

  var replayGroup = new _ol_render_webgl_ReplayGroup_(
      _ol_renderer_vector_.getTolerance(resolution, pixelRatio),
      extent, vectorLayer.getRenderBuffer());
  vectorSource.loadFeatures(extent, resolution, projection);
  /**
   * @param {ol.Feature} feature Feature.
   * @this {ol.renderer.webgl.VectorLayer}
   */
  var renderFeature = function(feature) {
    var styles;
    var styleFunction = feature.getStyleFunction();
    if (styleFunction) {
      styles = styleFunction.call(feature, resolution);
    } else {
      styleFunction = vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
    }
    if (styles) {
      var dirty = this.renderFeature(
          feature, resolution, pixelRatio, styles, replayGroup);
      this.dirty_ = this.dirty_ || dirty;
    }
  };
  if (vectorLayerRenderOrder) {
    /** @type {Array.<ol.Feature>} */
    var features = [];
    vectorSource.forEachFeatureInExtent(extent,
        /**
         * @param {ol.Feature} feature Feature.
         */
        function(feature) {
          features.push(feature);
        }, this);
    features.sort(vectorLayerRenderOrder);
    features.forEach(renderFeature, this);
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
_ol_renderer_webgl_VectorLayer_.prototype.renderFeature = function(feature, resolution, pixelRatio, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var loading = false;
  if (Array.isArray(styles)) {
    for (var i = styles.length - 1, ii = 0; i >= ii; --i) {
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
export default _ol_renderer_webgl_VectorLayer_;
