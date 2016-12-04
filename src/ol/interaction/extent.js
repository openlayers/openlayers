goog.provide('ol.interaction.Extent');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.coordinate');
goog.require('ol.events.Event');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Pointer');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');


/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map.
 * Once drawn, the vector box can be modified by dragging its vertices or edges.
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.Extent.Event
 * @param {olx.interaction.ExtentOptions=} opt_options Options.
 * @api
 */
ol.interaction.Extent = function(opt_options) {

  /**
   * Extent of the drawn box
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = null;

  /**
   * Handler for pointer move events
   * @type {function (ol.Coordinate): ol.Extent|null}
   * @private
   */
  this.pointerHandler_ = null;

  /**
   * Pixel threshold to snap to extent
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = 10;

  /**
   * Is the pointer snapped to an extent vertex
   * @type {boolean}
   * @private
   */
  this.snappedToVertex_ = false;

  /**
   * Feature for displaying the visible extent
   * @type {ol.Feature}
   * @private
   */
  this.extentFeature_ = null;

  /**
   * Feature for displaying the visible pointer
   * @type {ol.Feature}
   * @private
   */
  this.vertexFeature_ = null;

  if (!opt_options) {
    opt_options = {};
  }

  if (opt_options.extent) {
    this.setExtent(opt_options.extent);
  }

  /* Inherit ol.interaction.Pointer */
  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.Extent.handleDownEvent_,
    handleDragEvent: ol.interaction.Extent.handleDragEvent_,
    handleEvent: ol.interaction.Extent.handleEvent_,
    handleUpEvent: ol.interaction.Extent.handleUpEvent_
  });

  /**
   * Layer for the extentFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.extentOverlay_ = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.boxStyle ? opt_options.boxStyle : ol.interaction.Extent.getDefaultExtentStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * Layer for the vertexFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.vertexOverlay_ = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.pointerStyle ? opt_options.pointerStyle : ol.interaction.Extent.getDefaultPointerStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });
};

ol.inherits(ol.interaction.Extent, ol.interaction.Pointer);

/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @return {boolean} Propagate event?
 * @this {ol.interaction.Extent}
 * @private
 */
ol.interaction.Extent.handleEvent_ = function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof ol.MapBrowserPointerEvent)) {
    return true;
  }
  //display pointer (if not dragging)
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERMOVE && !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  //call pointer to determine up/down/drag
  ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent);
  //return false to stop propagation
  return false;
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
ol.interaction.Extent.handleDownEvent_ = function(mapBrowserEvent) {
  var pixel = mapBrowserEvent.pixel;
  var map = mapBrowserEvent.map;

  var extent = this.getExtent();
  var vertex = this.snapToVertex_(pixel, map);

  //find the extent corner opposite the passed corner
  var getOpposingPoint = function(point) {
    var x_ = null;
    var y_ = null;
    if (point[0] == extent[0]) {
      x_ = extent[2];
    } else if (point[0] == extent[2]) {
      x_ = extent[0];
    }
    if (point[1] == extent[1]) {
      y_ = extent[3];
    } else if (point[1] == extent[3]) {
      y_ = extent[1];
    }
    if (x_ !== null && y_ !== null) {
      return [x_, y_];
    }
    return null;
  };
  if (vertex && extent) {
    var x = (vertex[0] == extent[0] || vertex[0] == extent[2]) ? vertex[0] : null;
    var y = (vertex[1] == extent[1] || vertex[1] == extent[3]) ? vertex[1] : null;

    //snap to point
    if (x !== null && y !== null) {
      this.pointerHandler_ = ol.interaction.Extent.getPointHandler_(getOpposingPoint(vertex));
    //snap to edge
    } else if (x !== null) {
      this.pointerHandler_ = ol.interaction.Extent.getEdgeHandler_(
        getOpposingPoint([x, extent[1]]),
        getOpposingPoint([x, extent[3]])
      );
    } else if (y !== null) {
      this.pointerHandler_ = ol.interaction.Extent.getEdgeHandler_(
        getOpposingPoint([extent[0], y]),
        getOpposingPoint([extent[2], y])
      );
    }
  //no snap - new bbox
  } else {
    vertex = map.getCoordinateFromPixel(pixel);
    this.setExtent([vertex[0], vertex[1], vertex[0], vertex[1]]);
    this.pointerHandler_ = ol.interaction.Extent.getPointHandler_(vertex);
  }
  return true; //event handled; start downup sequence
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
ol.interaction.Extent.handleDragEvent_ = function(mapBrowserEvent) {
  if (this.pointerHandler_) {
    var pixelCoordinate = mapBrowserEvent.coordinate;
    this.setExtent(this.pointerHandler_(pixelCoordinate));
    this.createOrUpdatePointerFeature_(pixelCoordinate);
  }
  return true;
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Extent}
 * @private
 */
ol.interaction.Extent.handleUpEvent_ = function(mapBrowserEvent) {
  this.pointerHandler_ = null;
  //If bbox is zero area, set to null;
  var extent = this.getExtent();
  if (!extent || ol.extent.getArea(extent) === 0) {
    this.setExtent(null);
  }
  return false; //Stop handling downup sequence
};

/**
 * Returns the default style for the drawn bbox
 *
 * @return {ol.StyleFunction} Default Extent style
 * @private
 */
ol.interaction.Extent.getDefaultExtentStyleFunction_ = function() {
  var style = ol.style.Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[ol.geom.GeometryType.POLYGON];
  };
};

/**
 * Returns the default style for the pointer
 *
 * @return {ol.StyleFunction} Default pointer style
 * @private
 */
ol.interaction.Extent.getDefaultPointerStyleFunction_ = function() {
  var style = ol.style.Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[ol.geom.GeometryType.POINT];
  };
};

/**
 * @param {ol.Coordinate} fixedPoint corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent} event handler
 * @private
 */
ol.interaction.Extent.getPointHandler_ = function(fixedPoint) {
  return function(point) {
    return ol.extent.boundingExtent([fixedPoint, point]);
  };
};

/**
 * @param {ol.Coordinate} fixedP1 first corner that will be unchanged in the new extent
 * @param {ol.Coordinate} fixedP2 second corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent|null} event handler
 * @private
 */
ol.interaction.Extent.getEdgeHandler_ = function(fixedP1, fixedP2) {
  if (fixedP1[0] == fixedP2[0]) {
    return function(point) {
      return ol.extent.boundingExtent([fixedP1, [point[0], fixedP2[1]]]);
    };
  } else if (fixedP1[1] == fixedP2[1]) {
    return function(point) {
      return ol.extent.boundingExtent([fixedP1, [fixedP2[0], point[1]]]);
    };
  } else {
    return null;
  }
};

/**
 * @param {ol.Extent} extent extent
 * @returns {Array<Array<ol.Coordinate>>} extent line segments
 * @private
 */
ol.interaction.Extent.getSegments_ = function(extent) {
  return [
    [[extent[0], extent[1]], [extent[0], extent[3]]],
    [[extent[0], extent[3]], [extent[2], extent[3]]],
    [[extent[2], extent[3]], [extent[2], extent[1]]],
    [[extent[2], extent[1]], [extent[0], extent[1]]]
  ];
};

/**
 * @param {ol.Pixel} pixel cursor location
 * @param {ol.Map} map map
 * @returns {ol.Coordinate|null} snapped vertex on extent
 * @private
 */
ol.interaction.Extent.prototype.snapToVertex_ = function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return ol.coordinate.squaredDistanceToSegment(pixelCoordinate, a) -
        ol.coordinate.squaredDistanceToSegment(pixelCoordinate, b);
  };
  var extent = this.getExtent();
  if (extent) {
    //convert extents to line segments and find the segment closest to pixelCoordinate
    var segments = ol.interaction.Extent.getSegments_(extent);
    segments.sort(sortByDistance);
    var closestSegment = segments[0];

    var vertex = (ol.coordinate.closestOnSegment(pixelCoordinate,
        closestSegment));
    var vertexPixel = map.getPixelFromCoordinate(vertex);

    //if the distance is within tolerance, snap to the segment
    if (Math.sqrt(ol.coordinate.squaredDistance(pixel, vertexPixel)) <=
        this.pixelTolerance_) {

      //test if we should further snap to a vertex
      var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      var squaredDist1 = ol.coordinate.squaredDistance(vertexPixel, pixel1);
      var squaredDist2 = ol.coordinate.squaredDistance(vertexPixel, pixel2);
      var dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      this.snappedToVertex_ = dist <= this.pixelTolerance_;
      if (this.snappedToVertex_) {
        vertex = squaredDist1 > squaredDist2 ?
            closestSegment[1] : closestSegment[0];
      }
      return vertex;
    }
  }
  return null;
};

/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent pointer move event
 * @private
 */
ol.interaction.Extent.prototype.handlePointerMove_ = function(mapBrowserEvent) {
  var pixel = mapBrowserEvent.pixel;
  var map = mapBrowserEvent.map;

  var vertex = this.snapToVertex_(pixel, map);
  if (!vertex) {
    vertex = map.getCoordinateFromPixel(pixel);
  }
  this.createOrUpdatePointerFeature_(vertex);
};

/**
 * @param {ol.Extent} extent extent
 * @returns {ol.Feature} extent as featrue
 * @private
 */
ol.interaction.Extent.prototype.createOrUpdateExtentFeature_ = function(extent) {
  var extentFeature = this.extentFeature_;

  if (!extentFeature) {
    if (!extent) {
      extentFeature = new ol.Feature({});
    } else {
      extentFeature = new ol.Feature(ol.geom.Polygon.fromExtent(extent));
    }
    this.extentFeature_ = extentFeature;
    this.extentOverlay_.getSource().addFeature(extentFeature);
  } else {
    if (!extent) {
      extentFeature.setGeometry(undefined);
    } else {
      extentFeature.setGeometry(ol.geom.Polygon.fromExtent(extent));
    }
  }
  return extentFeature;
};


/**
 * @param {ol.Coordinate} vertex location of feature
 * @returns {ol.Feature} vertex as feature
 * @private
 */
ol.interaction.Extent.prototype.createOrUpdatePointerFeature_ = function(vertex) {
  var vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new ol.Feature(new ol.geom.Point(vertex));
    this.vertexFeature_ = vertexFeature;
    this.vertexOverlay_.getSource().addFeature(vertexFeature);
  } else {
    var geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    geometry.setCoordinates(vertex);
  }
  return vertexFeature;
};


/**
 * @inheritDoc
 */
ol.interaction.Extent.prototype.setMap = function(map) {
  this.extentOverlay_.setMap(map);
  this.vertexOverlay_.setMap(map);
  ol.interaction.Pointer.prototype.setMap.call(this, map);
};

/**
 * Returns the current drawn extent in the view projection
 *
 * @return {ol.Extent} Drawn extent in the view projection.
 * @api
 */
ol.interaction.Extent.prototype.getExtent = function() {
  return this.extent_;
};

/**
 * Manually sets the drawn extent, using the view projection.
 *
 * @param {ol.Extent} extent Extent
 * @api
 */
ol.interaction.Extent.prototype.setExtent = function(extent) {
  //Null extent means no bbox
  this.extent_ = extent ? extent : null;
  this.createOrUpdateExtentFeature_(extent);
  this.dispatchEvent(new ol.interaction.Extent.Event(this.extent_));
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Extent} instances are instances of
 * this type.
 *
 * @constructor
 * @param {ol.Extent} extent the new extent
 * @extends {ol.events.Event}
 */
ol.interaction.Extent.Event = function(extent) {
  ol.events.Event.call(this, ol.interaction.Extent.EventType.EXTENTCHANGED);

  /**
   * The current extent.
   * @type {ol.Extent}
   * @api
   */
  this.extent_ = extent;
};
ol.inherits(ol.interaction.Extent.Event, ol.events.Event);


/**
 * @enum {string}
 */
ol.interaction.Extent.EventType = {
  /**
   * Triggered after the extent is changed
   * @event ol.interaction.Extent.Event
   * @api
   */
  EXTENTCHANGED: 'extentchanged'
};
