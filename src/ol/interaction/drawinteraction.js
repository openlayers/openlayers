goog.provide('ol.DrawEvent');
goog.provide('ol.interaction.Draw');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.events.condition');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Pointer');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');


/**
 * @enum {string}
 */
ol.DrawEventType = {
  /**
   * Triggered upon feature draw start
   * @event ol.DrawEvent#drawstart
   * @api stable
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event ol.DrawEvent#drawend
   * @api stable
   */
  DRAWEND: 'drawend'
};



/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Draw} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.DrawEvent}
 * @param {ol.DrawEventType} type Type.
 * @param {ol.Feature} feature The feature drawn.
 */
ol.DrawEvent = function(type, feature) {

  goog.base(this, type);

  /**
   * The feature being drawn.
   * @type {ol.Feature}
   * @api stable
   */
  this.feature = feature;

};
goog.inherits(ol.DrawEvent, goog.events.Event);



/**
 * @classdesc
 * Interaction that allows drawing geometries.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.DrawEvent
 * @param {olx.interaction.DrawOptions} options Options.
 * @api stable
 */
ol.interaction.Draw = function(options) {

  goog.base(this);

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.downPx_ = null;

  /**
   * Target source for drawn features.
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = goog.isDef(options.source) ? options.source : null;

  /**
   * Target collection for drawn features.
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = goog.isDef(options.features) ? options.features : null;

  /**
   * Pixel distance for snapping.
   * @type {number}
   * @private
   */
  this.snapTolerance_ = goog.isDef(options.snapTolerance) ?
      options.snapTolerance : 12;

  /**
   * The number of points that must be drawn before a polygon ring can be
   * finished.  The default is 3.
   * @type {number}
   * @private
   */
  this.minPointsPerRing_ = goog.isDef(options.minPointsPerRing) ?
      options.minPointsPerRing : 3;

  /**
   * Geometry type.
   * @type {ol.geom.GeometryType}
   * @private
   */
  this.type_ = options.type;

  /**
   * Drawing mode (derived from geometry type.
   * @type {ol.interaction.DrawMode}
   * @private
   */
  this.mode_ = ol.interaction.Draw.getMode_(this.type_);

  /**
   * Finish coordinate for the feature (first point for polygons, last point for
   * linestrings).
   * @type {ol.Coordinate}
   * @private
   */
  this.finishCoordinate_ = null;

  /**
   * Sketch feature.
   * @type {ol.Feature}
   * @private
   */
  this.sketchFeature_ = null;

  /**
   * Sketch point.
   * @type {ol.Feature}
   * @private
   */
  this.sketchPoint_ = null;

  /**
   * Sketch line. Used when drawing polygon.
   * @type {ol.Feature}
   * @private
   */
  this.sketchLine_ = null;

  /**
   * Sketch polygon. Used when drawing polygon.
   * @type {Array.<Array.<ol.Coordinate>>}
   * @private
   */
  this.sketchPolygonCoords_ = null;

  /**
   * Squared tolerance for handling up events.  If the squared distance
   * between a down and up event is greater than this tolerance, up events
   * will not be handled.
   * @type {number}
   * @private
   */
  this.squaredClickTolerance_ = 4;

  /**
   * Draw overlay where our sketch features are drawn.
   * @type {ol.FeatureOverlay}
   * @private
   */
  this.overlay_ = new ol.FeatureOverlay({
    style: goog.isDef(options.style) ?
        options.style : ol.interaction.Draw.getDefaultStyleFunction()
  });

  /**
   * Name of the geometry attribute for newly created features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.noModifierKeys;

};
goog.inherits(ol.interaction.Draw, ol.interaction.Pointer);


/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.Draw.getDefaultStyleFunction = function() {
  var styles = ol.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
};


/**
 * @inheritDoc
 */
ol.interaction.Draw.prototype.setMap = function(map) {
  if (goog.isNull(map)) {
    // removing from a map, clean up
    this.abortDrawing_();
  }
  this.overlay_.setMap(map);
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
  if (event.type === ol.MapBrowserEvent.EventType.POINTERMOVE) {
    pass = this.handlePointerMove_(event);
  } else if (event.type === ol.MapBrowserEvent.EventType.DBLCLICK) {
    pass = false;
  }
  return (goog.base(this, 'handleMapBrowserEvent', event) && pass);
};


/**
 * Handle down events.
 * @param {ol.MapBrowserEvent} event A down event.
 * @return {boolean} Pass the event to other interactions.
 */
ol.interaction.Draw.prototype.handlePointerDown = function(event) {
  if (this.condition_(event)) {
    this.downPx_ = event.pixel;
    return true;
  } else {
    return false;
  }
};


/**
 * Handle up events.
 * @param {ol.MapBrowserEvent} event An up event.
 * @return {boolean} Pass the event to other interactions.
 */
ol.interaction.Draw.prototype.handlePointerUp = function(event) {
  var downPx = this.downPx_;
  var clickPx = event.pixel;
  var dx = downPx[0] - clickPx[0];
  var dy = downPx[1] - clickPx[1];
  var squaredDistance = dx * dx + dy * dy;
  var pass = true;
  if (squaredDistance <= this.squaredClickTolerance_) {
    this.handlePointerMove_(event);
    if (goog.isNull(this.finishCoordinate_)) {
      this.startDrawing_(event);
    } else if (this.mode_ === ol.interaction.DrawMode.POINT ||
        this.atFinish_(event)) {
      this.finishDrawing_(event);
    } else {
      this.addToDrawing_(event);
    }
    pass = false;
  }
  return pass;
};


/**
 * Handle move events.
 * @param {ol.MapBrowserEvent} event A move event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
ol.interaction.Draw.prototype.handlePointerMove_ = function(event) {
  if (this.mode_ === ol.interaction.DrawMode.POINT &&
      goog.isNull(this.finishCoordinate_)) {
    this.startDrawing_(event);
  } else if (!goog.isNull(this.finishCoordinate_)) {
    this.modifyDrawing_(event);
  } else {
    this.createOrUpdateSketchPoint_(event);
  }
  return true;
};


/**
 * Determine if an event is within the snapping tolerance of the start coord.
 * @param {ol.MapBrowserEvent} event Event.
 * @return {boolean} The event is within the snapping tolerance of the start.
 * @private
 */
ol.interaction.Draw.prototype.atFinish_ = function(event) {
  var at = false;
  if (!goog.isNull(this.sketchFeature_)) {
    var geometry = this.sketchFeature_.getGeometry();
    var potentiallyDone = false;
    var potentiallyFinishCoordinates = [this.finishCoordinate_];
    if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
      goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
      potentiallyDone = geometry.getCoordinates().length > 2;
    } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
      goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
      potentiallyDone = geometry.getCoordinates()[0].length >
          this.minPointsPerRing_;
      potentiallyFinishCoordinates = [this.sketchPolygonCoords_[0][0],
        this.sketchPolygonCoords_[0][this.sketchPolygonCoords_[0].length - 2]];
    }
    if (potentiallyDone) {
      var map = event.map;
      for (var i = 0, ii = potentiallyFinishCoordinates.length; i < ii; i++) {
        var finishCoordinate = potentiallyFinishCoordinates[i];
        var finishPixel = map.getPixelFromCoordinate(finishCoordinate);
        var pixel = event.pixel;
        var dx = pixel[0] - finishPixel[0];
        var dy = pixel[1] - finishPixel[1];
        at = Math.sqrt(dx * dx + dy * dy) <= this.snapTolerance_;
        if (at) {
          this.finishCoordinate_ = finishCoordinate;
          break;
        }
      }
    }
  }
  return at;
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.createOrUpdateSketchPoint_ = function(event) {
  var coordinates = event.coordinate.slice();
  if (goog.isNull(this.sketchPoint_)) {
    this.sketchPoint_ = new ol.Feature(new ol.geom.Point(coordinates));
    this.updateSketchFeatures_();
  } else {
    var sketchPointGeom = this.sketchPoint_.getGeometry();
    goog.asserts.assertInstanceof(sketchPointGeom, ol.geom.Point);
    sketchPointGeom.setCoordinates(coordinates);
  }
};


/**
 * Start the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.startDrawing_ = function(event) {
  var start = event.coordinate;
  this.finishCoordinate_ = start;
  var geometry;
  if (this.mode_ === ol.interaction.DrawMode.POINT) {
    geometry = new ol.geom.Point(start.slice());
  } else {
    if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
      geometry = new ol.geom.LineString([start.slice(), start.slice()]);
    } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
      this.sketchLine_ = new ol.Feature(new ol.geom.LineString([start.slice(),
            start.slice()]));
      this.sketchPolygonCoords_ = [[start.slice(), start.slice()]];
      geometry = new ol.geom.Polygon(this.sketchPolygonCoords_);
    }
  }
  goog.asserts.assert(goog.isDef(geometry));
  this.sketchFeature_ = new ol.Feature();
  if (goog.isDef(this.geometryName_)) {
    this.sketchFeature_.setGeometryName(this.geometryName_);
  }
  this.sketchFeature_.setGeometry(geometry);
  this.updateSketchFeatures_();
  this.dispatchEvent(new ol.DrawEvent(ol.DrawEventType.DRAWSTART,
      this.sketchFeature_));
};


/**
 * Modify the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.modifyDrawing_ = function(event) {
  var coordinate = event.coordinate;
  var geometry = this.sketchFeature_.getGeometry();
  var coordinates, last;
  if (this.mode_ === ol.interaction.DrawMode.POINT) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Point);
    last = geometry.getCoordinates();
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    geometry.setCoordinates(last);
  } else {
    if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
      goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
      coordinates = geometry.getCoordinates();
    } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
      goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
      coordinates = this.sketchPolygonCoords_[0];
    }
    if (this.atFinish_(event)) {
      // snap to finish
      coordinate = this.finishCoordinate_.slice();
    }
    var sketchPointGeom = this.sketchPoint_.getGeometry();
    goog.asserts.assertInstanceof(sketchPointGeom, ol.geom.Point);
    sketchPointGeom.setCoordinates(coordinate);
    last = coordinates[coordinates.length - 1];
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
      goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
      geometry.setCoordinates(coordinates);
    } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
      var sketchLineGeom = this.sketchLine_.getGeometry();
      goog.asserts.assertInstanceof(sketchLineGeom, ol.geom.LineString);
      sketchLineGeom.setCoordinates(coordinates);
      goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
      geometry.setCoordinates(this.sketchPolygonCoords_);
    }
  }
  this.updateSketchFeatures_();
};


/**
 * Add a new coordinate to the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.addToDrawing_ = function(event) {
  var coordinate = event.coordinate;
  var geometry = this.sketchFeature_.getGeometry();
  var coordinates;
  if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
    this.finishCoordinate_ = coordinate.slice();
    goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
    coordinates = geometry.getCoordinates();
    coordinates.push(coordinate.slice());
    geometry.setCoordinates(coordinates);
  } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
    this.sketchPolygonCoords_[0].push(coordinate.slice());
    goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
    geometry.setCoordinates(this.sketchPolygonCoords_);
  }
  this.updateSketchFeatures_();
};


/**
 * Stop drawing and add the sketch feature to the target layer.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.Draw.prototype.finishDrawing_ = function(event) {
  var sketchFeature = this.abortDrawing_();
  goog.asserts.assert(!goog.isNull(sketchFeature));
  var coordinates;
  var geometry = sketchFeature.getGeometry();
  if (this.mode_ === ol.interaction.DrawMode.POINT) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Point);
    coordinates = geometry.getCoordinates();
  } else if (this.mode_ === ol.interaction.DrawMode.LINE_STRING) {
    goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
    coordinates = geometry.getCoordinates();
    // remove the redundant last point
    coordinates.pop();
    geometry.setCoordinates(coordinates);
  } else if (this.mode_ === ol.interaction.DrawMode.POLYGON) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
    // When we finish drawing a polygon on the last point,
    // the last coordinate is duplicated as for LineString
    // we force the replacement by the first point
    this.sketchPolygonCoords_[0].pop();
    this.sketchPolygonCoords_[0].push(this.sketchPolygonCoords_[0][0]);
    geometry.setCoordinates(this.sketchPolygonCoords_);
    coordinates = geometry.getCoordinates();
  }

  // cast multi-part geometries
  if (this.type_ === ol.geom.GeometryType.MULTI_POINT) {
    sketchFeature.setGeometry(new ol.geom.MultiPoint([coordinates]));
  } else if (this.type_ === ol.geom.GeometryType.MULTI_LINE_STRING) {
    sketchFeature.setGeometry(new ol.geom.MultiLineString([coordinates]));
  } else if (this.type_ === ol.geom.GeometryType.MULTI_POLYGON) {
    sketchFeature.setGeometry(new ol.geom.MultiPolygon([coordinates]));
  }

  if (!goog.isNull(this.features_)) {
    this.features_.push(sketchFeature);
  }
  if (!goog.isNull(this.source_)) {
    this.source_.addFeature(sketchFeature);
  }
  this.dispatchEvent(new ol.DrawEvent(ol.DrawEventType.DRAWEND, sketchFeature));
};


/**
 * Stop drawing without adding the sketch feature to the target layer.
 * @return {ol.Feature} The sketch feature (or null if none).
 * @private
 */
ol.interaction.Draw.prototype.abortDrawing_ = function() {
  this.finishCoordinate_ = null;
  var sketchFeature = this.sketchFeature_;
  if (!goog.isNull(sketchFeature)) {
    this.sketchFeature_ = null;
    this.sketchPoint_ = null;
    this.sketchLine_ = null;
    this.overlay_.getFeatures().clear();
  }
  return sketchFeature;
};


/**
 * Redraw the skecth features.
 * @private
 */
ol.interaction.Draw.prototype.updateSketchFeatures_ = function() {
  var sketchFeatures = [];
  if (!goog.isNull(this.sketchFeature_)) {
    sketchFeatures.push(this.sketchFeature_);
  }
  if (!goog.isNull(this.sketchLine_)) {
    sketchFeatures.push(this.sketchLine_);
  }
  if (!goog.isNull(this.sketchPoint_)) {
    sketchFeatures.push(this.sketchPoint_);
  }
  this.overlay_.setFeatures(new ol.Collection(sketchFeatures));
};


/**
 * Get the drawing mode.  The mode for mult-part geometries is the same as for
 * their single-part cousins.
 * @param {ol.geom.GeometryType} type Geometry type.
 * @return {ol.interaction.DrawMode} Drawing mode.
 * @private
 */
ol.interaction.Draw.getMode_ = function(type) {
  var mode;
  if (type === ol.geom.GeometryType.POINT ||
      type === ol.geom.GeometryType.MULTI_POINT) {
    mode = ol.interaction.DrawMode.POINT;
  } else if (type === ol.geom.GeometryType.LINE_STRING ||
      type === ol.geom.GeometryType.MULTI_LINE_STRING) {
    mode = ol.interaction.DrawMode.LINE_STRING;
  } else if (type === ol.geom.GeometryType.POLYGON ||
      type === ol.geom.GeometryType.MULTI_POLYGON) {
    mode = ol.interaction.DrawMode.POLYGON;
  }
  goog.asserts.assert(goog.isDef(mode));
  return mode;
};


/**
 * Draw mode.  This collapses multi-part geometry types with their single-part
 * cousins.
 * @enum {string}
 */
ol.interaction.DrawMode = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon'
};
