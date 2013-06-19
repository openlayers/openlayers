// FIXME works for View2D only

goog.provide('ol.control.OverviewMap');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('ol.Map');
goog.require('ol.Object');
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
ol.control.OVERVIEWMAP_MIN_RATIO = 0.25;



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

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });

  /**
   * @type {ol.Map} The overview map itself
   * @private
   */
  this.ovmap_ = new ol.Map({
    controls: [],
    target: element
  });

  /**
   * @type {number}
   * @private
   */
  this.maxRatio_ = options.maxRatio || ol.control.OVERVIEWMAP_MAX_RATIO;

  /**
   * @type {number}
   * @private
   */
  this.minRatio_ = options.minRatio || ol.control.OVERVIEWMAP_MIN_RATIO;

  // FIXME - check if layers in options, otherwise we add the map layers later
  // ...
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

    this.ovmap_.updateSize();
    this.resetExtent_();
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
  var map = this.getMap();
  var mapViewExtent = map.getView().calculateExtent(map.getSize());
  var ovmapViewExtent = this.ovmap_.getView().calculateExtent(
      this.ovmap_.getSize());
  if (!ol.extent.containsExtent(ovmapViewExtent, mapViewExtent)) {
    this.resetExtent_();
  }
};


/**
 * Called on main map view resolution change. If the main extent size
 * (width or height is less than the size of the overview
 * extent times minRatio or is greater than the size of the overview
 * extent times maxRatio, reset the overview map.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.OverviewMap.prototype.handleResolutionChanged_ = function(event) {
  var map = this.getMap();
  var view = map.getView();
  var mapViewExtent = view.calculateExtent(map.getSize());
  var mapViewExtentWidth = ol.extent.getWidth(mapViewExtent);
  var mapViewExtentHeight = ol.extent.getHeight(mapViewExtent);

  var ovview = this.ovmap_.getView();
  var ovmapViewExtent = ovview.calculateExtent(this.ovmap_.getSize());
  var ovmapViewExtentWidth = ol.extent.getWidth(ovmapViewExtent);
  var ovmapViewExtentHeight = ol.extent.getHeight(ovmapViewExtent);

  if (ovmapViewExtentWidth < mapViewExtentWidth / this.minRatio_ ||
      ovmapViewExtentHeight < mapViewExtentHeight / this.minRatio_ ||
      ovmapViewExtentWidth > mapViewExtentWidth / this.maxRatio_ ||
      ovmapViewExtentHeight > mapViewExtentHeight / this.maxRatio_) {
    this.resetExtent_();
  }
};


/**
 * Reset the overview map extent to the map extent with a ratio.
 * @private
 */
ol.control.OverviewMap.prototype.resetExtent_ = function() {
  var map = this.getMap();
  var extent = map.getView().calculateExtent(map.getSize());
  // FIXME - set ratio as property
  ol.extent.scaleFromCenter(extent, 1.5);
  this.ovmap_.getView().fitExtent(extent, this.ovmap_.getSize());
};
