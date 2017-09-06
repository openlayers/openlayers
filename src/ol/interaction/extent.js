import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_MapBrowserEventType_ from '../mapbrowsereventtype';
import _ol_MapBrowserPointerEvent_ from '../mapbrowserpointerevent';
import _ol_coordinate_ from '../coordinate';
import _ol_events_Event_ from '../events/event';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_interaction_ExtentEventType_ from '../interaction/extenteventtype';
import _ol_interaction_Pointer_ from '../interaction/pointer';
import _ol_layer_Vector_ from '../layer/vector';
import _ol_source_Vector_ from '../source/vector';
import _ol_style_Style_ from '../style/style';

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
var _ol_interaction_Extent_ = function(opt_options) {

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

  /* Inherit ol.interaction.Pointer */
  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_Extent_.handleDownEvent_,
    handleDragEvent: _ol_interaction_Extent_.handleDragEvent_,
    handleEvent: _ol_interaction_Extent_.handleEvent_,
    handleUpEvent: _ol_interaction_Extent_.handleUpEvent_
  });

  /**
   * Layer for the extentFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.extentOverlay_ = new _ol_layer_Vector_({
    source: new _ol_source_Vector_({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.boxStyle ? opt_options.boxStyle : _ol_interaction_Extent_.getDefaultExtentStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * Layer for the vertexFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.vertexOverlay_ = new _ol_layer_Vector_({
    source: new _ol_source_Vector_({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.pointerStyle ? opt_options.pointerStyle : _ol_interaction_Extent_.getDefaultPointerStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  if (opt_options.extent) {
    this.setExtent(opt_options.extent);
  }
};

_ol_.inherits(_ol_interaction_Extent_, _ol_interaction_Pointer_);

/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @return {boolean} Propagate event?
 * @this {ol.interaction.Extent}
 * @private
 */
_ol_interaction_Extent_.handleEvent_ = function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof _ol_MapBrowserPointerEvent_)) {
    return true;
  }
  //display pointer (if not dragging)
  if (mapBrowserEvent.type == _ol_MapBrowserEventType_.POINTERMOVE && !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  //call pointer to determine up/down/drag
  _ol_interaction_Pointer_.handleEvent.call(this, mapBrowserEvent);
  //return false to stop propagation
  return false;
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
_ol_interaction_Extent_.handleDownEvent_ = function(mapBrowserEvent) {
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
      this.pointerHandler_ = _ol_interaction_Extent_.getPointHandler_(getOpposingPoint(vertex));
    //snap to edge
    } else if (x !== null) {
      this.pointerHandler_ = _ol_interaction_Extent_.getEdgeHandler_(
          getOpposingPoint([x, extent[1]]),
          getOpposingPoint([x, extent[3]])
      );
    } else if (y !== null) {
      this.pointerHandler_ = _ol_interaction_Extent_.getEdgeHandler_(
          getOpposingPoint([extent[0], y]),
          getOpposingPoint([extent[2], y])
      );
    }
  //no snap - new bbox
  } else {
    vertex = map.getCoordinateFromPixel(pixel);
    this.setExtent([vertex[0], vertex[1], vertex[0], vertex[1]]);
    this.pointerHandler_ = _ol_interaction_Extent_.getPointHandler_(vertex);
  }
  return true; //event handled; start downup sequence
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
_ol_interaction_Extent_.handleDragEvent_ = function(mapBrowserEvent) {
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
_ol_interaction_Extent_.handleUpEvent_ = function(mapBrowserEvent) {
  this.pointerHandler_ = null;
  //If bbox is zero area, set to null;
  var extent = this.getExtent();
  if (!extent || _ol_extent_.getArea(extent) === 0) {
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
_ol_interaction_Extent_.getDefaultExtentStyleFunction_ = function() {
  var style = _ol_style_Style_.createDefaultEditing();
  return function(feature, resolution) {
    return style[_ol_geom_GeometryType_.POLYGON];
  };
};

/**
 * Returns the default style for the pointer
 *
 * @return {ol.StyleFunction} Default pointer style
 * @private
 */
_ol_interaction_Extent_.getDefaultPointerStyleFunction_ = function() {
  var style = _ol_style_Style_.createDefaultEditing();
  return function(feature, resolution) {
    return style[_ol_geom_GeometryType_.POINT];
  };
};

/**
 * @param {ol.Coordinate} fixedPoint corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent} event handler
 * @private
 */
_ol_interaction_Extent_.getPointHandler_ = function(fixedPoint) {
  return function(point) {
    return _ol_extent_.boundingExtent([fixedPoint, point]);
  };
};

/**
 * @param {ol.Coordinate} fixedP1 first corner that will be unchanged in the new extent
 * @param {ol.Coordinate} fixedP2 second corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent|null} event handler
 * @private
 */
_ol_interaction_Extent_.getEdgeHandler_ = function(fixedP1, fixedP2) {
  if (fixedP1[0] == fixedP2[0]) {
    return function(point) {
      return _ol_extent_.boundingExtent([fixedP1, [point[0], fixedP2[1]]]);
    };
  } else if (fixedP1[1] == fixedP2[1]) {
    return function(point) {
      return _ol_extent_.boundingExtent([fixedP1, [fixedP2[0], point[1]]]);
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
_ol_interaction_Extent_.getSegments_ = function(extent) {
  return [
    [[extent[0], extent[1]], [extent[0], extent[3]]],
    [[extent[0], extent[3]], [extent[2], extent[3]]],
    [[extent[2], extent[3]], [extent[2], extent[1]]],
    [[extent[2], extent[1]], [extent[0], extent[1]]]
  ];
};

/**
 * @param {ol.Pixel} pixel cursor location
 * @param {ol.PluggableMap} map map
 * @returns {ol.Coordinate|null} snapped vertex on extent
 * @private
 */
_ol_interaction_Extent_.prototype.snapToVertex_ = function(pixel, map) {
  var pixelCoordinate = map.getCoordinateFromPixel(pixel);
  var sortByDistance = function(a, b) {
    return _ol_coordinate_.squaredDistanceToSegment(pixelCoordinate, a) -
        _ol_coordinate_.squaredDistanceToSegment(pixelCoordinate, b);
  };
  var extent = this.getExtent();
  if (extent) {
    //convert extents to line segments and find the segment closest to pixelCoordinate
    var segments = _ol_interaction_Extent_.getSegments_(extent);
    segments.sort(sortByDistance);
    var closestSegment = segments[0];

    var vertex = (_ol_coordinate_.closestOnSegment(pixelCoordinate,
        closestSegment));
    var vertexPixel = map.getPixelFromCoordinate(vertex);

    //if the distance is within tolerance, snap to the segment
    if (_ol_coordinate_.distance(pixel, vertexPixel) <= this.pixelTolerance_) {
      //test if we should further snap to a vertex
      var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      var squaredDist1 = _ol_coordinate_.squaredDistance(vertexPixel, pixel1);
      var squaredDist2 = _ol_coordinate_.squaredDistance(vertexPixel, pixel2);
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
_ol_interaction_Extent_.prototype.handlePointerMove_ = function(mapBrowserEvent) {
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
_ol_interaction_Extent_.prototype.createOrUpdateExtentFeature_ = function(extent) {
  var extentFeature = this.extentFeature_;

  if (!extentFeature) {
    if (!extent) {
      extentFeature = new _ol_Feature_({});
    } else {
      extentFeature = new _ol_Feature_(_ol_geom_Polygon_.fromExtent(extent));
    }
    this.extentFeature_ = extentFeature;
    this.extentOverlay_.getSource().addFeature(extentFeature);
  } else {
    if (!extent) {
      extentFeature.setGeometry(undefined);
    } else {
      extentFeature.setGeometry(_ol_geom_Polygon_.fromExtent(extent));
    }
  }
  return extentFeature;
};


/**
 * @param {ol.Coordinate} vertex location of feature
 * @returns {ol.Feature} vertex as feature
 * @private
 */
_ol_interaction_Extent_.prototype.createOrUpdatePointerFeature_ = function(vertex) {
  var vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new _ol_Feature_(new _ol_geom_Point_(vertex));
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
_ol_interaction_Extent_.prototype.setMap = function(map) {
  this.extentOverlay_.setMap(map);
  this.vertexOverlay_.setMap(map);
  _ol_interaction_Pointer_.prototype.setMap.call(this, map);
};

/**
 * Returns the current drawn extent in the view projection
 *
 * @return {ol.Extent} Drawn extent in the view projection.
 * @api
 */
_ol_interaction_Extent_.prototype.getExtent = function() {
  return this.extent_;
};

/**
 * Manually sets the drawn extent, using the view projection.
 *
 * @param {ol.Extent} extent Extent
 * @api
 */
_ol_interaction_Extent_.prototype.setExtent = function(extent) {
  //Null extent means no bbox
  this.extent_ = extent ? extent : null;
  this.createOrUpdateExtentFeature_(extent);
  this.dispatchEvent(new _ol_interaction_Extent_.Event(this.extent_));
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Extent} instances are instances of
 * this type.
 *
 * @constructor
 * @implements {oli.ExtentEvent}
 * @param {ol.Extent} extent the new extent
 * @extends {ol.events.Event}
 */
_ol_interaction_Extent_.Event = function(extent) {
  _ol_events_Event_.call(this, _ol_interaction_ExtentEventType_.EXTENTCHANGED);

  /**
   * The current extent.
   * @type {ol.Extent}
   * @api
   */
  this.extent = extent;

};
_ol_.inherits(_ol_interaction_Extent_.Event, _ol_events_Event_);
export default _ol_interaction_Extent_;
