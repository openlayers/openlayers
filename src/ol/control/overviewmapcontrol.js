// FIXME works for View2D only

goog.provide('ol.control.OverviewMap');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.Object');
goog.require('ol.Overlay');
goog.require('ol.View2DProperty');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.extent');


/**
 * @define {number} Maximum width and/or height extent ratio that determines
 * when the overview map should be zoomed out.
 */
ol.control.OVERVIEWMAP_MAX_RATIO = 0.75;


/**
 * @define {number} Minimum width and/or height extent ratio that determines
 * when the overview map should be zoomed in.
 */
ol.control.OVERVIEWMAP_MIN_RATIO = 0.1;



/**
 * Create a new control with a map acting as an overview map for an other
 * defined map.
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.OverviewMapOptions=} opt_options OverviewMap options.
 */
ol.control.OverviewMap = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ?
      options.className : 'ol-overviewmap';

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses);

  var box = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-overviewmap-box');

  /**
   * @type {ol.Map}
   * @private
   */
  this.ovmap_ = new ol.Map({
    controls: [],
    interactions: new ol.Collection(),
    target: element
  });
  var ovmap = this.ovmap_;

  /**
   * @type {ol.Overlay}
   * @private
   */
  this.boxOverlay_ = new ol.Overlay({
    map: this.ovmap_,
    position: [0, 0],
    element: box
  });


  /**
   * @type {number}
   * @private
   */
  this.maxRatio_ = goog.isDefAndNotNull(options.maxRatio) ?
      options.maxRatio : ol.control.OVERVIEWMAP_MAX_RATIO;

  /**
   * @type {number}
   * @private
   */
  this.minRatio_ = goog.isDefAndNotNull(options.minRatio) ?
      options.minRatio : ol.control.OVERVIEWMAP_MIN_RATIO;

  if (goog.isDefAndNotNull(options.layers)) {
    options.layers.forEach(
        /**
       * @param {ol.layer.Layer} layer Layer.
       */
        function(layer) {
          ovmap.addLayer(layer);
        }, this);
  }

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });
};
goog.inherits(ol.control.OverviewMap, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.OverviewMap.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    if (this.ovmap_.getLayers().getLength() == 0) {
      if (map.getLayers().getLength() > 0) {
        this.ovmap_.bindTo('layers', map);
      }
    }

    var view = map.getView();

    goog.events.listen(
        view, ol.Object.getChangeEventType(ol.View2DProperty.CENTER),
        this.handleCenterChanged_, false, this);

    goog.events.listen(
        view, ol.Object.getChangeEventType(ol.View2DProperty.RESOLUTION),
        this.handleResolutionChanged_, false, this);

    goog.events.listen(
        map, ol.Object.getChangeEventType(ol.MapProperty.SIZE),
        this.handleSizeChanged_, false, this);

    this.ovmap_.updateSize();
    this.resetExtent_();
    this.updateBox_();
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
/**
 * Called on main map view center change. If the overview map extent doesn't
 * contain the main map view extent, reset the overview extent.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.OverviewMap.prototype.handleCenterChanged_ = function(event) {
  this.validateExtent_();
  this.updateBox_();
};


/**
 * Called on main map view resolution change.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.OverviewMap.prototype.handleResolutionChanged_ = function(event) {
  this.validateExtent_();
  this.updateBox_();
};


/**
 * Called on main map size change.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.OverviewMap.prototype.handleSizeChanged_ = function(event) {
  this.validateExtent_();
  this.updateBox_();
};


/**
 * Reset the overview map extent if the box size (width or
 * height) is less than the size of the overview map size times minRatio
 * or is greater than the size of the overview size times maxRatio.
 * @private
 */
ol.control.OverviewMap.prototype.validateExtent_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;
  var extent = map.getView().calculateExtent(map.getSize());
  var ovextent = ovmap.getView().calculateExtent(ovmap.getSize());

  var topLeftPixel =
      ovmap.getPixelFromCoordinate(ol.extent.getTopLeft(extent));
  var bottomRightPixel =
      ovmap.getPixelFromCoordinate(ol.extent.getBottomRight(extent));
  var boxSize = new goog.math.Size(
      Math.abs(topLeftPixel[0] - bottomRightPixel[0]),
      Math.abs(topLeftPixel[1] - bottomRightPixel[1]));

  var ovmapSize = ovmap.getSize();
  var ovmapWidth = ovmapSize[0];
  var ovmapHeight = ovmapSize[1];

  if (boxSize.width < ovmapWidth * this.minRatio_ ||
      boxSize.height < ovmapHeight * this.minRatio_ ||
      boxSize.width > ovmapWidth * this.maxRatio_ ||
      boxSize.height > ovmapHeight * this.maxRatio_) {
    this.resetExtent_();
  } else if (!ol.extent.containsExtent(ovextent, extent)) {
    this.recenter_();
  }
};


/**
 * Reset the overview map extent to half calculated min and max ratio times
 * the extent of the main map.
 * @private
 */
ol.control.OverviewMap.prototype.resetExtent_ = function() {
  if (this.maxRatio_ == 0 || this.minRatio_ == 0) {
    return;
  }

  var map = this.getMap();
  var ovmap = this.ovmap_;
  var extent = map.getView().calculateExtent(map.getSize());

  // get how many times the current map overview could hold different
  // box sizes using the min and max ratio, pick the step in the middle used
  // to calculate the extent from the main map to set it to the overview map,
  var steps = Math.log(this.maxRatio_ / this.minRatio_) / Math.LN2;
  var ratio = 1 / (Math.pow(2, steps / 2) * this.minRatio_);
  ol.extent.scaleFromCenter(extent, ratio);
  ovmap.getView().fitExtent(extent, ovmap.getSize());
};


/**
 * Set the center of the overview map to the map center without changing its
 * resolution.
 * @private
 */
ol.control.OverviewMap.prototype.recenter_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;
  ovmap.getView().setCenter(map.getView().getCenter());
};


/**
 * Update the box using the main map extent
 * @private
 */
ol.control.OverviewMap.prototype.updateBox_ = function() {
  var map = this.getMap();
  var ovmap = this.ovmap_;
  var overlay = this.boxOverlay_;
  var box = this.boxOverlay_.getElement();
  var extent = map.getView().calculateExtent(map.getSize());

  // set position using bottom left coordinates
  var bottomLeft = ol.extent.getBottomLeft(extent);
  overlay.setPosition(bottomLeft);

  // set box size using top left and bottom right pixels
  if (goog.isDefAndNotNull(box)) {
    var topLeftPixel =
        ovmap.getPixelFromCoordinate(ol.extent.getTopLeft(extent));
    var bottomRightPixel =
        ovmap.getPixelFromCoordinate(ol.extent.getBottomRight(extent));
    goog.style.setBorderBoxSize(box, new goog.math.Size(
        Math.abs(topLeftPixel[0] - bottomRightPixel[0]),
        Math.abs(topLeftPixel[1] - bottomRightPixel[1])));
  }

};
