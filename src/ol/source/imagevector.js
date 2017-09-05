import _ol_ from '../index';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_render_canvas_ReplayGroup_ from '../render/canvas/replaygroup';
import _ol_renderer_vector_ from '../renderer/vector';
import _ol_source_ImageCanvas_ from '../source/imagecanvas';
import _ol_style_Style_ from '../style/style';
import _ol_transform_ from '../transform';

/**
 * @classdesc
 * An image source whose images are canvas elements into which vector features
 * read from a vector source (`ol.source.Vector`) are drawn. An
 * `ol.source.ImageVector` object is to be used as the `source` of an image
 * layer (`ol.layer.Image`). Image layers are rotated, scaled, and translated,
 * as opposed to being re-rendered, during animations and interactions. So, like
 * any other image layer, an image layer configured with an
 * `ol.source.ImageVector` will exhibit this behaviour. This is in contrast to a
 * vector layer, where vector features are re-drawn during animations and
 * interactions.
 *
 * @constructor
 * @extends {ol.source.ImageCanvas}
 * @param {olx.source.ImageVectorOptions} options Options.
 * @api
 */
var _ol_source_ImageVector_ = function(options) {

  /**
   * @private
   * @type {ol.source.Vector}
   */
  this.source_ = options.source;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = _ol_transform_.create();

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.canvasContext_ = _ol_dom_.createCanvasContext2D();

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = [0, 0];

  /**
   * @private
   * @type {number}
   */
  this.renderBuffer_ = options.renderBuffer == undefined ? 100 : options.renderBuffer;

  /**
   * @private
   * @type {ol.render.canvas.ReplayGroup}
   */
  this.replayGroup_ = null;

  _ol_source_ImageCanvas_.call(this, {
    attributions: options.attributions,
    canvasFunction: this.canvasFunctionInternal_.bind(this),
    logo: options.logo,
    projection: options.projection,
    ratio: options.ratio,
    resolutions: options.resolutions,
    state: this.source_.getState()
  });

  /**
   * User provided style.
   * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction}
   * @private
   */
  this.style_ = null;

  /**
   * Style function for use within the library.
   * @type {ol.StyleFunction|undefined}
   * @private
   */
  this.styleFunction_ = undefined;

  this.setStyle(options.style);

  _ol_events_.listen(this.source_, _ol_events_EventType_.CHANGE,
      this.handleSourceChange_, this);

};

_ol_.inherits(_ol_source_ImageVector_, _ol_source_ImageCanvas_);


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Size} size Size.
 * @param {ol.proj.Projection} projection Projection;
 * @return {HTMLCanvasElement} Canvas element.
 * @private
 */
_ol_source_ImageVector_.prototype.canvasFunctionInternal_ = function(extent, resolution, pixelRatio, size, projection) {

  var replayGroup = new _ol_render_canvas_ReplayGroup_(
      _ol_renderer_vector_.getTolerance(resolution, pixelRatio), extent,
      resolution, pixelRatio, this.source_.getOverlaps(), this.renderBuffer_);

  this.source_.loadFeatures(extent, resolution, projection);

  var loading = false;
  this.source_.forEachFeatureInExtent(extent,
      /**
       * @param {ol.Feature} feature Feature.
       */
      function(feature) {
        loading = loading ||
            this.renderFeature_(feature, resolution, pixelRatio, replayGroup);
      }, this);
  replayGroup.finish();

  if (loading) {
    return null;
  }

  if (this.canvasSize_[0] != size[0] || this.canvasSize_[1] != size[1]) {
    this.canvasContext_.canvas.width = size[0];
    this.canvasContext_.canvas.height = size[1];
    this.canvasSize_[0] = size[0];
    this.canvasSize_[1] = size[1];
  } else {
    this.canvasContext_.clearRect(0, 0, size[0], size[1]);
  }

  var transform = this.getTransform_(_ol_extent_.getCenter(extent),
      resolution, pixelRatio, size);
  replayGroup.replay(this.canvasContext_, transform, 0, {});

  this.replayGroup_ = replayGroup;

  return this.canvasContext_.canvas;
};


/**
 * @inheritDoc
 */
_ol_source_ImageVector_.prototype.forEachFeatureAtCoordinate = function(
    coordinate, resolution, rotation, hitTolerance, skippedFeatureUids, callback) {
  if (!this.replayGroup_) {
    return undefined;
  } else {
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(
        coordinate, resolution, 0, hitTolerance, skippedFeatureUids,
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = _ol_.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback(feature);
          }
        });
  }
};


/**
 * Get a reference to the wrapped source.
 * @return {ol.source.Vector} Source.
 * @api
 */
_ol_source_ImageVector_.prototype.getSource = function() {
  return this.source_;
};


/**
 * Get the style for features.  This returns whatever was passed to the `style`
 * option at construction or to the `setStyle` method.
 * @return {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction}
 *     Layer style.
 * @api
 */
_ol_source_ImageVector_.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the style function.
 * @return {ol.StyleFunction|undefined} Layer style function.
 * @api
 */
_ol_source_ImageVector_.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Size} size Size.
 * @return {!ol.Transform} Transform.
 * @private
 */
_ol_source_ImageVector_.prototype.getTransform_ = function(center, resolution, pixelRatio, size) {
  var dx1 = size[0] / 2;
  var dy1 = size[1] / 2;
  var sx = pixelRatio / resolution;
  var sy = -sx;
  var dx2 = -center[0];
  var dy2 = -center[1];

  return _ol_transform_.compose(this.transform_, dx1, dy1, sx, sy, 0, dx2, dy2);
};


/**
 * Handle changes in image style state.
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
_ol_source_ImageVector_.prototype.handleImageChange_ = function(event) {
  this.changed();
};


/**
 * @private
 */
_ol_source_ImageVector_.prototype.handleSourceChange_ = function() {
  // setState will trigger a CHANGE event, so we always rely
  // change events by calling setState.
  this.setState(this.source_.getState());
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 * @private
 */
_ol_source_ImageVector_.prototype.renderFeature_ = function(feature, resolution, pixelRatio, replayGroup) {
  var styles;
  var styleFunction = feature.getStyleFunction();
  if (styleFunction) {
    styles = styleFunction.call(feature, resolution);
  } else if (this.styleFunction_) {
    styles = this.styleFunction_(feature, resolution);
  }
  if (!styles) {
    return false;
  }
  var i, ii, loading = false;
  if (!Array.isArray(styles)) {
    styles = [styles];
  }
  for (i = 0, ii = styles.length; i < ii; ++i) {
    loading = _ol_renderer_vector_.renderFeature(
        replayGroup, feature, styles[i],
        _ol_renderer_vector_.getSquaredTolerance(resolution, pixelRatio),
        this.handleImageChange_, this) || loading;
  }
  return loading;
};


/**
 * Set the style for features.  This can be a single style object, an array
 * of styles, or a function that takes a feature and resolution and returns
 * an array of styles. If it is `undefined` the default style is used. If
 * it is `null` the layer has no style (a `null` style), so only features
 * that have their own styles will be rendered in the layer. See
 * {@link ol.style} for information on the default style.
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 *     style Layer style.
 * @api
 */
_ol_source_ImageVector_.prototype.setStyle = function(style) {
  this.style_ = style !== undefined ? style : _ol_style_Style_.defaultFunction;
  this.styleFunction_ = !style ?
    undefined : _ol_style_Style_.createFunction(this.style_);
  this.changed();
};
export default _ol_source_ImageVector_;
