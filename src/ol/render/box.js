// FIXME add rotation

goog.provide('ol.render.Box');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('ol.geom.Polygon');
goog.require('ol.render.EventType');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.style.Style} style Style.
 */
ol.render.Box = function(style) {

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.postComposeListenerKey_ = null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.startCoordinate_ = null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.endCoordinate_ = null;

  /**
   * @private
   * @type {ol.geom.Polygon}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = style;

};
goog.inherits(ol.render.Box, goog.Disposable);


/**
 * @private
 * @return {ol.geom.Polygon} Geometry.
 */
ol.render.Box.prototype.createGeometry_ = function() {
  goog.asserts.assert(!goog.isNull(this.startCoordinate_));
  goog.asserts.assert(!goog.isNull(this.endCoordinate_));
  var startCoordinate = this.startCoordinate_;
  var endCoordinate = this.endCoordinate_;
  var coordinates = [
    [
      startCoordinate,
      [startCoordinate[0], endCoordinate[1]],
      endCoordinate,
      [endCoordinate[0], startCoordinate[1]]
    ]
  ];
  return new ol.geom.Polygon(coordinates);
};


/**
 * @inheritDoc
 */
ol.render.Box.prototype.disposeInternal = function() {
  this.setMap(null);
};


/**
 * @param {ol.render.Event} event Event.
 * @private
 */
ol.render.Box.prototype.handleMapPostCompose_ = function(event) {
  this.geometry_ = this.createGeometry_();
  var style = this.style_;
  goog.asserts.assert(!goog.isNull(style));
  var render = event.getRender();
  render.setFillStrokeStyle(style.getFill(), style.getStroke());
  render.drawPolygonGeometry(this.geometry_, null);
};


/**
 * @return {ol.geom.Polygon} Geometry.
 */
ol.render.Box.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * @private
 */
ol.render.Box.prototype.requestMapRenderFrame_ = function() {
  if (!goog.isNull(this.map_) &&
      !goog.isNull(this.startCoordinate_) &&
      !goog.isNull(this.endCoordinate_)) {
    this.map_.requestRenderFrame();
  }
};


/**
 * @param {ol.Map} map Map.
 */
ol.render.Box.prototype.setMap = function(map) {
  if (!goog.isNull(this.postComposeListenerKey_)) {
    goog.events.unlistenByKey(this.postComposeListenerKey_);
    this.postComposeListenerKey_ = null;
    this.map_.requestRenderFrame();
    this.map_ = null;
  }
  this.map_ = map;
  if (!goog.isNull(this.map_)) {
    this.postComposeListenerKey_ = goog.events.listen(
        map, ol.render.EventType.POSTCOMPOSE, this.handleMapPostCompose_, false,
        this);
    this.requestMapRenderFrame_();
  }
};


/**
 * @param {ol.Coordinate} startCoordinate Start coordinate.
 * @param {ol.Coordinate} endCoordinate End coordinate.
 */
ol.render.Box.prototype.setCoordinates =
    function(startCoordinate, endCoordinate) {
  this.startCoordinate_ = startCoordinate;
  this.endCoordinate_ = endCoordinate;
  this.requestMapRenderFrame_();
};
