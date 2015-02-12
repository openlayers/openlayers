goog.provide('ol.interaction.DrawBox');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('ol.Collection');
goog.require('ol.DrawEvent');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.Map');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Object');
goog.require('ol.events.condition');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.InteractionProperty');
goog.require('ol.interaction.Pointer');



/**
 * @classdesc
 * Interaction that allows drawing rectangular geometries. Supports using an
 * {@link ol.events.condition}, shift key by default, to restrict the shape to
 * a square.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.DrawEvent
 * @param {olx.interaction.DrawBoxOptions} options Options.
 * @api stable
 */
ol.interaction.DrawBox = function(options) {

  goog.base(this, {
    handleDownEvent: ol.interaction.DrawBox.handleDownEvent_,
    handleEvent: ol.interaction.DrawBox.handleEvent,
    handleUpEvent: ol.interaction.DrawBox.handleUpEvent_
  });

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
   * The first point for the box.
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
   * Draw overlay where our sketch features are drawn.
   * @type {ol.FeatureOverlay}
   * @private
   */
  this.overlay_ = new ol.FeatureOverlay({
    style: goog.isDef(options.style) ?
        options.style : ol.interaction.DrawBox.getDefaultStyleFunction()
  });

  /**
   * Name of the geometry attribute for newly created features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

  /**
   * If true, we draw a square, otherwise a rectangle.
   * @type {ol.events.ConditionType}
   * @private
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.shiftKeyOnly;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.updateState_, false, this);
};
goog.inherits(ol.interaction.DrawBox, ol.interaction.Pointer);


/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.DrawBox.getDefaultStyleFunction = function() {
  var styles = ol.style.createDefaultEditingStyles();
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
};


/**
 * @inheritDoc
 */
ol.interaction.DrawBox.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  this.updateState_();
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.DrawBox}
 * @api
 */
ol.interaction.DrawBox.handleEvent = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  if (!map.isDef()) {
    return true;
  }
  var pass = true;
  if (mapBrowserEvent.type === ol.MapBrowserEvent.EventType.POINTERMOVE) {
    pass = this.handlePointerMove_(mapBrowserEvent);
  } else if (mapBrowserEvent.type === ol.MapBrowserEvent.EventType.DBLCLICK) {
    pass = false;
  }
  return ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent) && pass;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DrawBox}
 * @private
 */
ol.interaction.DrawBox.handleDownEvent_ = function(event) {
  return true;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DrawBox}
 * @private
 */
ol.interaction.DrawBox.handleUpEvent_ = function(event) {
  if (this.startCoordinate_) {
    this.finishDrawing();
  } else {
    this.startDrawing_(event);
  }
  return false;
};


/**
 * Handle move events.
 * @param {ol.MapBrowserEvent} event A move event.
 * @return {boolean} Pass the event to other interactions.
 * @private
 */
ol.interaction.DrawBox.prototype.handlePointerMove_ = function(event) {
  if (!goog.isNull(this.startCoordinate_)) {
    this.modifyDrawing_(event);
  } else {
    this.createOrUpdateSketchPoint_(event);
  }

  return true;
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.DrawBox.prototype.createOrUpdateSketchPoint_ = function(event) {
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
ol.interaction.DrawBox.prototype.startDrawing_ = function(event) {
  var start = event.coordinate;
  this.startCoordinate_ = start;
  this.sketchLine_ = new ol.Feature(new ol.geom.LineString([start.slice(),
        start.slice()]));
  var geometry = new ol.geom.Polygon([[start.slice(), start.slice()]]);
  this.sketchFeature_ = new ol.Feature(geometry);
  if (goog.isDef(this.geometryName_)) {
    this.sketchFeature_.setGeometryName(this.geometryName_);
  }

  this.updateSketchFeatures_();
  this.dispatchEvent(new ol.DrawEvent(ol.DrawEventType.DRAWSTART,
      this.sketchFeature_));
};


/**
 * Modify the drawing.
 * @param {ol.MapBrowserEvent} event Event.
 * @private
 */
ol.interaction.DrawBox.prototype.modifyDrawing_ = function(event) {
  var newCoord = event.coordinate.slice();
  var geometry = this.sketchFeature_.getGeometry();
  var lsGeom = this.sketchLine_.getGeometry();
  var pointGeom = this.sketchPoint_.getGeometry();

  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
  goog.asserts.assertInstanceof(lsGeom, ol.geom.LineString);
  goog.asserts.assertInstanceof(pointGeom, ol.geom.Point);

  var start = this.startCoordinate_;

  var width = newCoord[0] - start[0];
  var height = newCoord[1] - start[1];

  var first = [start[0], start[1]];
  var second = [start[0], start[1]];

  if (this.condition_(event)) {
    var maxLen = Math.max(Math.abs(width), Math.abs(height));

    if (width > 0) { second[0] += maxLen; } else { first[0] -= maxLen; }
    if (height > 0) { second[1] += maxLen; } else { first[1] -= maxLen; }
  } else {
    if (width > 0) { second[0] += width; } else { first[0] += width; }
    if (height > 0) { second[1] += height; } else { first[1] += height; }
  }

  var coordinates = [
    [first[0], first[1]],
    [first[0], second[1]],
    [second[0], second[1]],
    [second[0], first[1]]
  ];

  geometry.setCoordinates([coordinates]);

  // Line string needs the first and last coordinate to be the same
  coordinates.push(coordinates[0].slice());
  lsGeom.setCoordinates(coordinates);

  // Update sketch point position
  pointGeom.setCoordinates(newCoord);

  this.updateSketchFeatures_();
};


/**
 * Redraw the sketch features.
 * @private
 */
ol.interaction.DrawBox.prototype.updateSketchFeatures_ = function() {
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
 * Stop drawing without adding the sketch feature to the target layer.
 * @return {ol.Feature} The sketch feature (or null if none).
 * @private
 */
ol.interaction.DrawBox.prototype.abortDrawing_ = function() {
  this.startCoordinate_ = null;
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
 * Stop drawing and add the sketch feature to the target layer.
 * @api
 */
ol.interaction.DrawBox.prototype.finishDrawing = function() {
  var sketchFeature = this.abortDrawing_();
  goog.asserts.assert(!goog.isNull(sketchFeature));

  if (!goog.isNull(this.features_)) {
    this.features_.push(sketchFeature);
  }
  if (!goog.isNull(this.source_)) {
    this.source_.addFeature(sketchFeature);
  }
  this.dispatchEvent(new ol.DrawEvent(ol.DrawEventType.DRAWEND, sketchFeature));
};


/**
 * @private
 */
ol.interaction.DrawBox.prototype.updateState_ = function() {
  var map = this.getMap();
  var active = this.getActive();
  if (goog.isNull(map) || !active) {
    this.abortDrawing_();
  }
  this.overlay_.setMap(active ? map : null);
};
