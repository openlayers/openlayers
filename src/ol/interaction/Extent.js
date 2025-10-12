/**
 * @module ol/interaction/Extent
 */
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import {
  closestOnSegment,
  distance as coordinateDistance,
  squaredDistance as squaredCoordinateDistance,
  squaredDistanceToSegment,
} from '../coordinate.js';
import Event from '../events/Event.js';
import {always} from '../events/condition.js';
import {boundingExtent, containsCoordinate, getArea} from '../extent.js';
import Point from '../geom/Point.js';
import {fromExtent as polygonFromExtent} from '../geom/Polygon.js';
import VectorLayer from '../layer/Vector.js';
import {toUserExtent} from '../proj.js';
import VectorSource from '../source/Vector.js';
import {createEditingStyle} from '../style/Style.js';
import PointerInteraction from './Pointer.js';

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition.always}.
 * @property {import("../events/condition.js").Condition|null} [createCondition=null] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled to create a new extent.
 * If `null`, the `condition` will also be used as `createCondition`.
 * @property {boolean} [drag=false] An extent can be dragged.
 * @property {import("../extent.js").Extent} [extent] Initial extent. Defaults to no
 * initial extent.
 * @property {import("../style/Style.js").StyleLike} [boxStyle]
 * Style for the drawn extent box. Defaults to the `Polygon` editing style
 * documented in {@link module:ol/style/Style~Style}
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {import("../style/Style.js").StyleLike} [pointerStyle]
 * Style for the cursor used to draw the extent. Defaults to the `Point` editing style
 * documented in {@link module:ol/style/Style~Style}
 * @property {boolean} [wrapX=false] Wrap the drawn extent across multiple maps
 * in the X direction? Only affects visuals, not functionality.
 */

/**
 * @enum {string}
 */
export const ExtentEventType = {
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
 * @typedef {function (import("../coordinate.js").Coordinate): import("../extent.js").Extent} PointerHandler
 */

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'extentchanged', ExtentEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'extentchanged', Return>} ExtentOnSignature
 */

/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map.
 * Once drawn, the vector box can be modified by dragging its vertices or edges.
 * The interaction can also be configured with an initial extent and a `createCondition`
 * to prevent the creation of a new extent on `pointerdown`, if desired.
 *
 * @fires ExtentEvent
 * @api
 */
class Extent extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options || {};

    super(/** @type {import("./Pointer.js").Options} */ (options));

    /***
     * @type {ExtentOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {ExtentOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {ExtentOnSignature<void>}
     */
    this.un;

    /**
     * Condition
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.condition_ = options.condition ? options.condition : always;

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.createCondition_ = options.createCondition || this.condition_;

    /**
     * @type {boolean}
     * @private
     */
    this.drag_ = options.drag || false;

    /**
     * Extent of the drawn box
     * @type {import("../extent.js").Extent}
     * @private
     */
    this.extent_ = null;

    /**
     * Handler for pointer move events
     * @type {PointerHandler|null}
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

    if (!options) {
      options = {};
    }

    /**
     * Layer for the extentFeature
     * @type {VectorLayer}
     * @private
     */
    this.extentOverlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!options.wrapX,
      }),
      style: options.boxStyle
        ? options.boxStyle
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
        wrapX: !!options.wrapX,
      }),
      style: options.pointerStyle
        ? options.pointerStyle
        : getDefaultPointerStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
    });

    if (options.extent) {
      this.setExtent(options.extent);
    }
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel cursor location
   * @param {import("../Map.js").default} map map
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
   * @return {boolean} The event was handled.
   * @private
   */
  handlePointerMove_(mapBrowserEvent) {
    const pixel = mapBrowserEvent.pixel;
    const map = mapBrowserEvent.map;
    const draggable =
      this.drag_ &&
      containsCoordinate(this.extent_, mapBrowserEvent.coordinate);

    let vertex = this.snapToVertex_(pixel, map);
    if (!vertex && this.createCondition_(mapBrowserEvent) && !draggable) {
      vertex = map.getCoordinateFromPixelInternal(pixel);
    }
    if (draggable && !vertex) {
      this.getMap().getViewport().classList.add('ol-grab');
    } else {
      this.getMap().getViewport().classList.remove('ol-grab');
    }
    if (vertex) {
      this.updatePointerFeature_(vertex);
      return true;
    }
    this.noVertexFeature_();
    return false;
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
   * @param {boolean} [createIfNotExists] create the feature if it does not exist
   * @return {Feature} vertex as feature
   * @private
   */
  updatePointerFeature_(vertex, createIfNotExists = true) {
    let vertexFeature = this.vertexFeature_;
    if (createIfNotExists && !vertexFeature) {
      vertexFeature = new Feature(new Point(vertex));
      this.vertexFeature_ = vertexFeature;
      this.vertexOverlay_.getSource().addFeature(vertexFeature);
    }
    if (vertexFeature) {
      const geometry = vertexFeature.getGeometry();
      geometry.setCoordinates(vertex);
    }
    return vertexFeature;
  }

  /**
   * Remove the vertex feature if it exists.
   * @private
   */
  noVertexFeature_() {
    if (this.vertexFeature_) {
      this.vertexOverlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    if (!mapBrowserEvent.originalEvent || !this.condition_(mapBrowserEvent)) {
      this.noVertexFeature_();
      return true;
    }

    let handled = this.handlingDownUpSequence;

    //display pointer (if not dragging)
    if (
      mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE &&
      !this.handlingDownUpSequence
    ) {
      handled = this.handlePointerMove_(mapBrowserEvent);
    }
    //call pointer to determine up/down/drag
    super.handleEvent(mapBrowserEvent);
    //return false to stop propagation
    return !handled;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
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
          getOpposingPoint([x, extent[3]]),
        );
      } else if (y !== null) {
        this.pointerHandler_ = getEdgeHandler(
          getOpposingPoint([extent[0], y]),
          getOpposingPoint([extent[2], y]),
        );
      }
      //no snap - new bbox or dragging existing bbox
    } else {
      vertex = map.getCoordinateFromPixelInternal(pixel);
      let drag = false;
      if (this.drag_) {
        if (containsCoordinate(extent, vertex)) {
          this.pointerHandler_ = getDragHandler(extent, vertex);
          drag = true;
        }
      }
      if (!drag && this.createCondition_(mapBrowserEvent)) {
        this.setExtent([vertex[0], vertex[1], vertex[0], vertex[1]]);
        this.pointerHandler_ = getPointHandler(vertex);
      }
    }
    return !!this.pointerHandler_; //event handled; start downup sequence
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @override
   */
  handleDragEvent(mapBrowserEvent) {
    if (this.pointerHandler_) {
      const pixelCoordinate = mapBrowserEvent.coordinate;
      this.setExtent(this.pointerHandler_(pixelCoordinate));
      this.updatePointerFeature_(pixelCoordinate, false);
    }
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
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
   * @param {import("../Map.js").default} map Map.
   * @override
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
      this.getMap().getView().getProjection(),
    );
  }

  /**
   * Returns the current drawn extent in the view projection
   *
   * @return {import("../extent.js").Extent} Drawn extent in the view projection.
   * @api
   * @deprecated Use {@link module:ol/interaction/Extent~Extent#getExtent} instead.
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
    return style['Polygon'];
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
    return style['Point'];
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
 * @return {PointerHandler|null} event handler
 */
function getEdgeHandler(fixedP1, fixedP2) {
  if (fixedP1[0] == fixedP2[0]) {
    return function (point) {
      return boundingExtent([fixedP1, [point[0], fixedP2[1]]]);
    };
  }
  if (fixedP1[1] == fixedP2[1]) {
    return function (point) {
      return boundingExtent([fixedP1, [fixedP2[0], point[1]]]);
    };
  }
  return null;
}

/**
 * @param {import("../extent.js").Extent} extent The extent that will be dragged
 * @param {import("../coordinate.js").Coordinate} vertex The vertex that drag delta is calculated from
 * @return {PointerHandler|null} event handler
 */
function getDragHandler(extent, vertex) {
  return function (point) {
    const deltaX = point[0] - vertex[0];
    const deltaY = point[1] - vertex[1];
    return [
      extent[0] + deltaX,
      extent[1] + deltaY,
      extent[2] + deltaX,
      extent[3] + deltaY,
    ];
  };
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
