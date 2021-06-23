/**
 * @module ol/interaction/Extent
 */
import Event from '../events/Event.js';
import Feature from '../Feature.js';
import GeometryType from '../geom/GeometryType.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import Point from '../geom/Point.js';
import PointerInteraction from './Pointer.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import {always} from '../events/condition.js';
import {boundingExtent, getArea} from '../extent.js';
import {
  closestOnSegment,
  distance as coordinateDistance,
  squaredDistance as squaredCoordinateDistance,
  squaredDistanceToSegment,
} from '../coordinate.js';
import {createEditingStyle} from '../style/Style.js';
import {fromExtent as polygonFromExtent} from '../geom/Polygon.js';
import {toUserExtent} from '../proj.js';

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition.always}.
 * @property {import("../extent.js").Extent} [extent] Initial extent. Defaults to no
 * initial extent.
 * @property {import("../style/Style.js").StyleLike} [boxStyle]
 * Style for the drawn extent box. Defaults to
 * {@link module:ol/style/Style~createEditing()['Polygon']}
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {import("../style/Style.js").StyleLike} [pointerStyle]
 * Style for the cursor used to draw the extent. Defaults to
 * {@link module:ol/style/Style~createEditing()['Point']}
 * @property {boolean} [wrapX=false] Wrap the drawn extent across multiple maps
 * in the X direction? Only affects visuals, not functionality.
 */

/**
 * @enum {string}
 */
const ExtentEventType = {
  /**
   * Triggered after the extent is changed
   * @event ExtentEvent#extentchanged
   * @api
   */
  EXTENTCHANGED: 'extentchanged',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Extent~Extent} instances are
 * instances of this type.
 */
export class ExtentEvent extends Event {
  /**
   * @param {import("../extent.js").Extent} extent the new extent
   */
  constructor(extent) {
    super(ExtentEventType.EXTENTCHANGED);

    /**
     * The current extent.
     * @type {import("../extent.js").Extent}
     * @api
     */
    this.extent = extent;
  }
}

/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map.
 * Once drawn, the vector box can be modified by dragging its vertices or edges.
 * This interaction is only supported for mouse devices.
 *
 * @fires ExtentEvent
 * @api
 */
class Extent extends PointerInteraction {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    super(/** @type {import("./Pointer.js").Options} */ (options));

    /***
     * @type {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default> &
     *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
     *     'change:active', import("../Object").ObjectEvent> &
     *   import("../Observable").OnSignature<'extentchanged', ExtentEvent>}
     */
    this.on;

    /**
     * Condition
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.condition_ = options.condition ? options.condition : always;

    /**
     * Extent of the drawn box
     * @type {import("../extent.js").Extent}
     * @private
     */
    this.extent_ = null;

    /**
     * Handler for pointer move events
     * @type {function (import("../coordinate.js").Coordinate): import("../extent.js").Extent|null}
     * @private
     */
    this.pointerHandler_ = null;

    /**
     * Pixel threshold to snap to extent
     * @type {number}
     * @private
     */
    this.pixelTolerance_ =
      options.pixelTolerance !== undefined ? options.pixelTolerance : 10;

    /**
     * Is the pointer snapped to an extent vertex
     * @type {boolean}
     * @private
     */
    this.snappedToVertex_ = false;

    /**
     * Feature for displaying the visible extent
     * @type {Feature}
     * @private
     */
    this.extentFeature_ = null;

    /**
     * Feature for displaying the visible pointer
     * @type {Feature<Point>}
     * @private
     */
    this.vertexFeature_ = null;

    if (!opt_options) {
      opt_options = {};
    }

    /**
     * Layer for the extentFeature
     * @type {VectorLayer}
     * @private
     */
    this.extentOverlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!opt_options.wrapX,
      }),
      style: opt_options.boxStyle
        ? opt_options.boxStyle
        : getDefaultExtentStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
    });

    /**
     * Layer for the vertexFeature
     * @type {VectorLayer}
     * @private
     */
    this.vertexOverlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!opt_options.wrapX,
      }),
      style: opt_options.pointerStyle
        ? opt_options.pointerStyle
        : getDefaultPointerStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
    });

    if (opt_options.extent) {
      this.setExtent(opt_options.extent);
    }
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel cursor location
   * @param {import("../PluggableMap.js").default} map map
   * @return {import("../coordinate.js").Coordinate|null} snapped vertex on extent
   * @private
   */
  snapToVertex_(pixel, map) {
    const pixelCoordinate = map.getCoordinateFromPixelInternal(pixel);
    const sortByDistance = function (a, b) {
      return (
        squaredDistanceToSegment(pixelCoordinate, a) -
        squaredDistanceToSegment(pixelCoordinate, b)
      );
    };
    const extent = this.getExtentInternal();
    if (extent) {
      //convert extents to line segments and find the segment closest to pixelCoordinate
      const segments = getSegments(extent);
      segments.sort(sortByDistance);
      const closestSegment = segments[0];

      let vertex = closestOnSegment(pixelCoordinate, closestSegment);
      const vertexPixel = map.getPixelFromCoordinateInternal(vertex);

      //if the distance is within tolerance, snap to the segment
      if (coordinateDistance(pixel, vertexPixel) <= this.pixelTolerance_) {
        //test if we should further snap to a vertex
        const pixel1 = map.getPixelFromCoordinateInternal(closestSegment[0]);
        const pixel2 = map.getPixelFromCoordinateInternal(closestSegment[1]);
        const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
        const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
        const dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        this.snappedToVertex_ = dist <= this.pixelTolerance_;
        if (this.snappedToVertex_) {
          vertex =
            squaredDist1 > squaredDist2 ? closestSegment[1] : closestSegment[0];
        }
        return vertex;
      }
    }
    return null;
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent pointer move event
   * @private
   */
  handlePointerMove_(mapBrowserEvent) {
    const pixel = mapBrowserEvent.pixel;
    const map = mapBrowserEvent.map;

    let vertex = this.snapToVertex_(pixel, map);
    if (!vertex) {
      vertex = map.getCoordinateFromPixelInternal(pixel);
    }
    this.createOrUpdatePointerFeature_(vertex);
  }

  /**
   * @param {import("../extent.js").Extent} extent extent
   * @return {Feature} extent as featrue
   * @private
   */
  createOrUpdateExtentFeature_(extent) {
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
  }

  /**
   * @param {import("../coordinate.js").Coordinate} vertex location of feature
   * @return {Feature} vertex as feature
   * @private
   */
  createOrUpdatePointerFeature_(vertex) {
    let vertexFeature = this.vertexFeature_;
    if (!vertexFeature) {
      vertexFeature = new Feature(new Point(vertex));
      this.vertexFeature_ = vertexFeature;
      this.vertexOverlay_.getSource().addFeature(vertexFeature);
    } else {
      const geometry = vertexFeature.getGeometry();
      geometry.setCoordinates(vertex);
    }
    return vertexFeature;
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   */
  handleEvent(mapBrowserEvent) {
    if (!mapBrowserEvent.originalEvent || !this.condition_(mapBrowserEvent)) {
      return true;
    }
    //display pointer (if not dragging)
    if (
      mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE &&
      !this.handlingDownUpSequence
    ) {
      this.handlePointerMove_(mapBrowserEvent);
    }
    //call pointer to determine up/down/drag
    super.handleEvent(mapBrowserEvent);
    //return false to stop propagation
    return false;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleDownEvent(mapBrowserEvent) {
    const pixel = mapBrowserEvent.pixel;
    const map = mapBrowserEvent.map;

    const extent = this.getExtentInternal();
    let vertex = this.snapToVertex_(pixel, map);

    //find the extent corner opposite the passed corner
    const getOpposingPoint = function (point) {
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
      const x =
        vertex[0] == extent[0] || vertex[0] == extent[2] ? vertex[0] : null;
      const y =
        vertex[1] == extent[1] || vertex[1] == extent[3] ? vertex[1] : null;

      //snap to point
      if (x !== null && y !== null) {
        this.pointerHandler_ = getPointHandler(getOpposingPoint(vertex));
        //snap to edge
      } else if (x !== null) {
        this.pointerHandler_ = getEdgeHandler(
          getOpposingPoint([x, extent[1]]),
          getOpposingPoint([x, extent[3]])
        );
      } else if (y !== null) {
        this.pointerHandler_ = getEdgeHandler(
          getOpposingPoint([extent[0], y]),
          getOpposingPoint([extent[2], y])
        );
      }
      //no snap - new bbox
    } else {
      vertex = map.getCoordinateFromPixelInternal(pixel);
      this.setExtent([vertex[0], vertex[1], vertex[0], vertex[1]]);
      this.pointerHandler_ = getPointHandler(vertex);
    }
    return true; //event handled; start downup sequence
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   */
  handleDragEvent(mapBrowserEvent) {
    if (this.pointerHandler_) {
      const pixelCoordinate = mapBrowserEvent.coordinate;
      this.setExtent(this.pointerHandler_(pixelCoordinate));
      this.createOrUpdatePointerFeature_(pixelCoordinate);
    }
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleUpEvent(mapBrowserEvent) {
    this.pointerHandler_ = null;
    //If bbox is zero area, set to null;
    const extent = this.getExtentInternal();
    if (!extent || getArea(extent) === 0) {
      this.setExtent(null);
    }
    return false; //Stop handling downup sequence
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   */
  setMap(map) {
    this.extentOverlay_.setMap(map);
    this.vertexOverlay_.setMap(map);
    super.setMap(map);
  }

  /**
   * Returns the current drawn extent in the view projection (or user projection if set)
   *
   * @return {import("../extent.js").Extent} Drawn extent in the view projection.
   * @api
   */
  getExtent() {
    return toUserExtent(
      this.getExtentInternal(),
      this.getMap().getView().getProjection()
    );
  }

  /**
   * Returns the current drawn extent in the view projection
   *
   * @return {import("../extent.js").Extent} Drawn extent in the view projection.
   * @api
   */
  getExtentInternal() {
    return this.extent_;
  }

  /**
   * Manually sets the drawn extent, using the view projection.
   *
   * @param {import("../extent.js").Extent} extent Extent
   * @api
   */
  setExtent(extent) {
    //Null extent means no bbox
    this.extent_ = extent ? extent : null;
    this.createOrUpdateExtentFeature_(extent);
    this.dispatchEvent(new ExtentEvent(this.extent_));
  }
}

/**
 * Returns the default style for the drawn bbox
 *
 * @return {import("../style/Style.js").StyleFunction} Default Extent style
 */
function getDefaultExtentStyleFunction() {
  const style = createEditingStyle();
  return function (feature, resolution) {
    return style[GeometryType.POLYGON];
  };
}

/**
 * Returns the default style for the pointer
 *
 * @return {import("../style/Style.js").StyleFunction} Default pointer style
 */
function getDefaultPointerStyleFunction() {
  const style = createEditingStyle();
  return function (feature, resolution) {
    return style[GeometryType.POINT];
  };
}

/**
 * @param {import("../coordinate.js").Coordinate} fixedPoint corner that will be unchanged in the new extent
 * @return {function (import("../coordinate.js").Coordinate): import("../extent.js").Extent} event handler
 */
function getPointHandler(fixedPoint) {
  return function (point) {
    return boundingExtent([fixedPoint, point]);
  };
}

/**
 * @param {import("../coordinate.js").Coordinate} fixedP1 first corner that will be unchanged in the new extent
 * @param {import("../coordinate.js").Coordinate} fixedP2 second corner that will be unchanged in the new extent
 * @return {function (import("../coordinate.js").Coordinate): import("../extent.js").Extent|null} event handler
 */
function getEdgeHandler(fixedP1, fixedP2) {
  if (fixedP1[0] == fixedP2[0]) {
    return function (point) {
      return boundingExtent([fixedP1, [point[0], fixedP2[1]]]);
    };
  } else if (fixedP1[1] == fixedP2[1]) {
    return function (point) {
      return boundingExtent([fixedP1, [fixedP2[0], point[1]]]);
    };
  } else {
    return null;
  }
}

/**
 * @param {import("../extent.js").Extent} extent extent
 * @return {Array<Array<import("../coordinate.js").Coordinate>>} extent line segments
 */
function getSegments(extent) {
  return [
    [
      [extent[0], extent[1]],
      [extent[0], extent[3]],
    ],
    [
      [extent[0], extent[3]],
      [extent[2], extent[3]],
    ],
    [
      [extent[2], extent[3]],
      [extent[2], extent[1]],
    ],
    [
      [extent[2], extent[1]],
      [extent[0], extent[1]],
    ],
  ];
}

export default Extent;
