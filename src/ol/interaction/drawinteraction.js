goog.provide('ol.interaction.Draw');
goog.provide('ol.interaction.DrawMode');

goog.require('goog.asserts');

goog.require('ol.Coordinate');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');



/**
 * Interaction that allows drawing geometries.
 * @param {ol.interaction.DrawOptions} options Options.
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Draw = function(options) {
  goog.base(this);

  /**
   * Target layer for drawn features.
   * @type {ol.layer.Vector}
   * @private
   */
  this.layer_ = options.layer;

  /**
   * Temporary sketch layer.
   * @type {ol.layer.Vector}
   * @private
   */
  this.sketchLayer_ = null;

  /**
   * Pixel distance for snapping.
   * @type {number}
   * @private
   */
  this.snapTolerance_ = 15;

  /**
   * Draw mode.
   * @type {ol.interaction.DrawMode}
   * @private
   */
  this.mode_ = options.mode;

  /**
   * Start coordinate for the feature.
   * @type {ol.Coordinate}
   * @private
   */
  this.startCoordinate_ = null;

  /**
   * Sketch feature.
   * @type {ol.Feature}
   * @private
   */
  this.sketchFeature_ = null;

};
goog.inherits(ol.interaction.Draw, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.Draw.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  if (!goog.isNull(oldMap)) {
    oldMap.removeLayer(this.sketchLayer_);
  }

  if (!goog.isNull(map)) {
    if (goog.isNull(this.sketchLayer_)) {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null}),
        style: this.layer_.getStyle()
      });
      layer.setTemporary(true);
      this.sketchLayer_ = layer;
    }
    map.addLayer(this.sketchLayer_);
  } else {
    // removing from a map, clean up
    this.sketchLayer_ = null;
    this.startCoordinate_ = null;
    this.sketchFeature_ = null;
  }

  goog.base(this, 'setMap', map);
};


/**
 * @inheritDoc
 */
ol.interaction.Draw.prototype.handleMapBrowserEvent = function(event) {
  var map = event.map;
  if (!map.isDef()) {
    return true;
  }
  var pass = true;
  if (event.type === ol.MapBrowserEvent.EventType.CLICK) {
    pass = this.handleClick_(event);
  } else if (event.type === ol.MapBrowserEvent.EventType.MOUSEMOVE) {
    pass = this.handleMove_(event);
  }
  return pass;
};


/**
 * Handle click events.
 * @param {ol.MapBrowserEvent} event A click event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
ol.interaction.Draw.prototype.handleClick_ = function(event) {
  if (goog.isNull(this.startCoordinate_)) {
    this.startDrawing_(event);
  } else if (this.mode_ === ol.interaction.DrawMode.POINT ||
      this.atStart_(event)) {
    this.finishDrawing_(event);
  } else {
    this.addToDrawing_(event);
  }
  return false;
};


/**
 * Handle mousemove events.
 * @param {ol.MapBrowserEvent} event A mousemove event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
ol.interaction.Draw.prototype.handleMove_ = function(event) {
  if (this.mode_ === ol.interaction.DrawMode.POINT &&
      goog.isNull(this.startCoordinate_)) {
    this.startDrawing_(event);
  } else if (!goog.isNull(this.startCoordinate_)) {
    this.modifyDrawing_(event);
  }
  return true;
};


/**
 * Determine if an event is within the snapping tolerance of the start coord.
 * @param {ol.MapBrowserEvent} event Event.
 * @return {boolean} The event is within the snapping tolerance of the start.
 * @private
 */
ol.interaction.Draw.prototype.atStart_ = function(event) {
  var map = event.map;
  var startPixel = map.getPixelFromCoordinate(this.startCoordinate_);
  var pixel = event.getPixel();
  var dx = pixel[0] - startPixel[0];
  var dy = pixel[1] - startPixel[1];
  return Math.sqrt(dx * dx + dy * dy) <= this.snapTolerance_;
};


/**
 * Start the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.startDrawing_ = function(event) {
  var start = event.getCoordinate();
  this.startCoordinate_ = start;
  var feature = new ol.Feature();
  feature.setRenderIntent(ol.layer.VectorLayerRenderIntent.SELECTED);
  var geometry;
  if (this.mode_ === ol.interaction.DrawMode.POINT) {
    geometry = new ol.geom.Point(start.slice());
  } else if (this.mode_ === ol.interaction.DrawMode.LINESTRING) {
    geometry = new ol.geom.LineString([start.slice(), start.slice()]);
  } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
    geometry = new ol.geom.Polygon([[start.slice(), start.slice()]]);
  }
  goog.asserts.assert(goog.isDef(geometry));
  feature.setGeometry(geometry);
  this.sketchFeature_ = feature;
  this.sketchLayer_.addFeatures([feature]);
};


/**
 * Modify the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.modifyDrawing_ = function(event) {
  var coordinate = event.getCoordinate();
  var geometry = this.sketchFeature_.getGeometry();
  var coordinates, last;
  if (this.mode_ === ol.interaction.DrawMode.POINT) {
    last = geometry.getCoordinates();
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    geometry.setCoordinates(last);
  } else if (this.mode_ === ol.interaction.DrawMode.LINESTRING) {
    coordinates = geometry.getCoordinates();
    last = coordinates[coordinates.length - 1];
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    geometry.setCoordinates(coordinates);
  } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
    var ring = geometry.getRings()[0];
    coordinates = ring.getCoordinates();
    last = coordinates[coordinates.length - 1];
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    ring.setCoordinates(coordinates);
  }
};


/**
 * Add a new coordinate to the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.addToDrawing_ = function(event) {
  var coordinate = event.getCoordinate();
  var geometry = this.sketchFeature_.getGeometry();
  var coordinates, last;
  if (this.mode_ === ol.interaction.DrawMode.LINESTRING) {
    coordinates = geometry.getCoordinates();
    coordinates.push(coordinate.slice());
    geometry.setCoordinates(coordinates);
  } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
    var ring = geometry.getRings()[0];
    coordinates = ring.getCoordinates();
    coordinates.push(coordinate.slice());
    ring.setCoordinates(coordinates);
  }
};


/**
 * Finish the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.finishDrawing_ = function(event) {
  this.startCoordinate_ = null;
  var feature = this.sketchFeature_;
  this.sketchLayer_.removeFeatures([feature]);
  feature.setRenderIntent(ol.layer.VectorLayerRenderIntent.DEFAULT);
  this.layer_.addFeatures([feature]);
};


/**
 * Set the drawing mode.
 * @param {ol.interaction.DrawMode} mode Draw mode ('point', 'linestring', or
 *     'polygon').
 */
ol.interaction.Draw.prototype.setMode = function(mode) {
  this.mode_ = mode;
};


/**
 * Draw mode.
 * @enum {string}
 */
ol.interaction.DrawMode = {
  POINT: 'point',
  LINESTRING: 'linestring',
  POLYGON: 'polygon'
};
