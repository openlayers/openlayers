/**
 * @module ol/interaction/Extent
 */
import {inherits} from '../index.js';
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import _ol_coordinate_ from '../coordinate.js';
import Event from '../events/Event.js';
import {boundingExtent, getArea} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import {fromExtent as polygonFromExtent} from '../geom/Polygon.js';
import ExtentEventType from '../interaction/ExtentEventType.js';
import PointerInteraction from '../interaction/Pointer.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import Style from '../style/Style.js';

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
const ExtentInteraction = function(opt_options) {

  const options = opt_options || {};

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
  this.pixelTolerance_ = options.pixelTolerance !== undefined ?
    options.pixelTolerance : 10;

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
  PointerInteraction.call(this, {
    handleDownEvent: ExtentInteraction.handleDownEvent_,
    handleDragEvent: ExtentInteraction.handleDragEvent_,
    handleEvent: ExtentInteraction.handleEvent_,
    handleUpEvent: ExtentInteraction.handleUpEvent_
  });

  /**
   * Layer for the extentFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.extentOverlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.boxStyle ? opt_options.boxStyle : ExtentInteraction.getDefaultExtentStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * Layer for the vertexFeature
   * @type {ol.layer.Vector}
   * @private
   */
  this.vertexOverlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: !!opt_options.wrapX
    }),
    style: opt_options.pointerStyle ? opt_options.pointerStyle : ExtentInteraction.getDefaultPointerStyleFunction_(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  if (opt_options.extent) {
    this.setExtent(opt_options.extent);
  }
};

inherits(ExtentInteraction, PointerInteraction);

/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @return {boolean} Propagate event?
 * @this {ol.interaction.Extent}
 * @private
 */
ExtentInteraction.handleEvent_ = function(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof MapBrowserPointerEvent)) {
    return true;
  }
  //display pointer (if not dragging)
  if (mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE && !this.handlingDownUpSequence) {
    this.handlePointerMove_(mapBrowserEvent);
  }
  //call pointer to determine up/down/drag
  PointerInteraction.handleEvent.call(this, mapBrowserEvent);
  //return false to stop propagation
  return false;
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
ExtentInteraction.handleDownEvent_ = function(mapBrowserEvent) {
  const pixel = mapBrowserEvent.pixel;
  const map = mapBrowserEvent.map;

  const extent = this.getExtent();
  let vertex = this.snapToVertex_(pixel, map);

  //find the extent corner opposite the passed corner
  const getOpposingPoint = function(point) {
    let x_ = null;
    let y_ = null;
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
    const x = (vertex[0] == extent[0] || vertex[0] == extent[2]) ? vertex[0] : null;
    const y = (vertex[1] == extent[1] || vertex[1] == extent[3]) ? vertex[1] : null;

    //snap to point
    if (x !== null && y !== null) {
      this.pointerHandler_ = ExtentInteraction.getPointHandler_(getOpposingPoint(vertex));
    //snap to edge
    } else if (x !== null) {
      this.pointerHandler_ = ExtentInteraction.getEdgeHandler_(
        getOpposingPoint([x, extent[1]]),
        getOpposingPoint([x, extent[3]])
      );
    } else if (y !== null) {
      this.pointerHandler_ = ExtentInteraction.getEdgeHandler_(
        getOpposingPoint([extent[0], y]),
        getOpposingPoint([extent[2], y])
      );
    }
  //no snap - new bbox
  } else {
    vertex = map.getCoordinateFromPixel(pixel);
    this.setExtent([vertex[0], vertex[1], vertex[0], vertex[1]]);
    this.pointerHandler_ = ExtentInteraction.getPointHandler_(vertex);
  }
  return true; //event handled; start downup sequence
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Event handled?
 * @this {ol.interaction.Extent}
 * @private
 */
ExtentInteraction.handleDragEvent_ = function(mapBrowserEvent) {
  if (this.pointerHandler_) {
    const pixelCoordinate = mapBrowserEvent.coordinate;
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
ExtentInteraction.handleUpEvent_ = function(mapBrowserEvent) {
  this.pointerHandler_ = null;
  //If bbox is zero area, set to null;
  const extent = this.getExtent();
  if (!extent || getArea(extent) === 0) {
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
ExtentInteraction.getDefaultExtentStyleFunction_ = function() {
  const style = Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[GeometryType.POLYGON];
  };
};

/**
 * Returns the default style for the pointer
 *
 * @return {ol.StyleFunction} Default pointer style
 * @private
 */
ExtentInteraction.getDefaultPointerStyleFunction_ = function() {
  const style = Style.createDefaultEditing();
  return function(feature, resolution) {
    return style[GeometryType.POINT];
  };
};

/**
 * @param {ol.Coordinate} fixedPoint corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent} event handler
 * @private
 */
ExtentInteraction.getPointHandler_ = function(fixedPoint) {
  return function(point) {
    return boundingExtent([fixedPoint, point]);
  };
};

/**
 * @param {ol.Coordinate} fixedP1 first corner that will be unchanged in the new extent
 * @param {ol.Coordinate} fixedP2 second corner that will be unchanged in the new extent
 * @returns {function (ol.Coordinate): ol.Extent|null} event handler
 * @private
 */
ExtentInteraction.getEdgeHandler_ = function(fixedP1, fixedP2) {
  if (fixedP1[0] == fixedP2[0]) {
    return function(point) {
      return boundingExtent([fixedP1, [point[0], fixedP2[1]]]);
    };
  } else if (fixedP1[1] == fixedP2[1]) {
    return function(point) {
      return boundingExtent([fixedP1, [fixedP2[0], point[1]]]);
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
ExtentInteraction.getSegments_ = function(extent) {
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
ExtentInteraction.prototype.snapToVertex_ = function(pixel, map) {
  const pixelCoordinate = map.getCoordinateFromPixel(pixel);
  const sortByDistance = function(a, b) {
    return _ol_coordinate_.squaredDistanceToSegment(pixelCoordinate, a) -
        _ol_coordinate_.squaredDistanceToSegment(pixelCoordinate, b);
  };
  const extent = this.getExtent();
  if (extent) {
    //convert extents to line segments and find the segment closest to pixelCoordinate
    const segments = ExtentInteraction.getSegments_(extent);
    segments.sort(sortByDistance);
    const closestSegment = segments[0];

    let vertex = (_ol_coordinate_.closestOnSegment(pixelCoordinate,
      closestSegment));
    const vertexPixel = map.getPixelFromCoordinate(vertex);

    //if the distance is within tolerance, snap to the segment
    if (_ol_coordinate_.distance(pixel, vertexPixel) <= this.pixelTolerance_) {
      //test if we should further snap to a vertex
      const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      const squaredDist1 = _ol_coordinate_.squaredDistance(vertexPixel, pixel1);
      const squaredDist2 = _ol_coordinate_.squaredDistance(vertexPixel, pixel2);
      const dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
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
ExtentInteraction.prototype.handlePointerMove_ = function(mapBrowserEvent) {
  const pixel = mapBrowserEvent.pixel;
  const map = mapBrowserEvent.map;

  let vertex = this.snapToVertex_(pixel, map);
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
ExtentInteraction.prototype.createOrUpdateExtentFeature_ = function(extent) {
  let extentFeature = this.extentFeature_;

  if (!extentFeature) {
    if (!extent) {
      extentFeature = new Feature({});
    } else {
      extentFeature = new Feature(polygonFromExtent(extent));
    }
    this.extentFeature_ = extentFeature;
    this.extentOverlay_.getSource().addFeature(extentFeature);
  } else {
    if (!extent) {
      extentFeature.setGeometry(undefined);
    } else {
      extentFeature.setGeometry(polygonFromExtent(extent));
    }
  }
  return extentFeature;
};


/**
 * @param {ol.Coordinate} vertex location of feature
 * @returns {ol.Feature} vertex as feature
 * @private
 */
ExtentInteraction.prototype.createOrUpdatePointerFeature_ = function(vertex) {
  let vertexFeature = this.vertexFeature_;
  if (!vertexFeature) {
    vertexFeature = new Feature(new Point(vertex));
    this.vertexFeature_ = vertexFeature;
    this.vertexOverlay_.getSource().addFeature(vertexFeature);
  } else {
    const geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    geometry.setCoordinates(vertex);
  }
  return vertexFeature;
};


/**
 * @inheritDoc
 */
ExtentInteraction.prototype.setMap = function(map) {
  this.extentOverlay_.setMap(map);
  this.vertexOverlay_.setMap(map);
  PointerInteraction.prototype.setMap.call(this, map);
};

/**
 * Returns the current drawn extent in the view projection
 *
 * @return {ol.Extent} Drawn extent in the view projection.
 * @api
 */
ExtentInteraction.prototype.getExtent = function() {
  return this.extent_;
};

/**
 * Manually sets the drawn extent, using the view projection.
 *
 * @param {ol.Extent} extent Extent
 * @api
 */
ExtentInteraction.prototype.setExtent = function(extent) {
  //Null extent means no bbox
  this.extent_ = extent ? extent : null;
  this.createOrUpdateExtentFeature_(extent);
  this.dispatchEvent(new ExtentInteraction.Event(this.extent_));
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
ExtentInteraction.Event = function(extent) {
  Event.call(this, ExtentEventType.EXTENTCHANGED);

  /**
   * The current extent.
   * @type {ol.Extent}
   * @api
   */
  this.extent = extent;

};
inherits(ExtentInteraction.Event, Event);
export default ExtentInteraction;
