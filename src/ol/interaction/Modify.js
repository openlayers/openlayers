/**
 * @module ol/interaction/Modify
 */
import {getUid} from '../util.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Feature from '../Feature.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import {equals} from '../array.js';
import {equals as coordinatesEqual, distance as coordinateDistance, squaredDistance as squaredCoordinateDistance, squaredDistanceToSegment, closestOnSegment} from '../coordinate.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {always, primaryAction, altKeyOnly, singleClick} from '../events/condition.js';
import {boundingExtent, buffer as bufferExtent, createOrUpdateFromCoordinate as createExtent} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import PointerInteraction from './Pointer.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';
import {createEditingStyle} from '../style/Style.js';
import {fromUserExtent, toUserExtent, fromUserCoordinate, toUserCoordinate} from '../proj.js';


/**
 * The segment index assigned to a circle's center when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
const CIRCLE_CENTER_INDEX = 0;

/**
 * The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
const CIRCLE_CIRCUMFERENCE_INDEX = 1;

const tempExtent = [0, 0, 0, 0];
const tempSegment = [];

/**
 * @enum {string}
 */
const ModifyEventType = {
  /**
   * Triggered upon feature modification start
   * @event ModifyEvent#modifystart
   * @api
   */
  MODIFYSTART: 'modifystart',
  /**
   * Triggered upon feature modification end
   * @event ModifyEvent#modifyend
   * @api
   */
  MODIFYEND: 'modifyend'
};


/**
 * @typedef {Object} SegmentData
 * @property {Array<number>} [depth]
 * @property {Feature} feature
 * @property {import("../geom/SimpleGeometry.js").default} geometry
 * @property {number} [index]
 * @property {Array<import("../extent.js").Extent>} segment
 * @property {Array<SegmentData>} [featureSegments]
 */


/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event will be considered to add or move a
 * vertex to the sketch. Default is
 * {@link module:ol/events/condition~primaryAction}.
 * @property {import("../events/condition.js").Condition} [deleteCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. By default,
 * {@link module:ol/events/condition~singleClick} with
 * {@link module:ol/events/condition~altKeyOnly} results in a vertex deletion.
 * @property {import("../events/condition.js").Condition} [insertVertexCondition] A
 * function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether a new vertex should be added to the sketch
 * features. Default is {@link module:ol/events/condition~always}.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {import("../style/Style.js").StyleLike} [style]
 * Style used for the features being modified. By default the default edit
 * style is used (see {@link module:ol/style}).
 * @property {VectorSource} [source] The vector source with
 * features to modify.  If a vector source is not provided, a feature collection
 * must be provided with the features option.
 * @property {Collection<Feature>} [features]
 * The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the source option.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Modify~Modify} instances are
 * instances of this type.
 */
export class ModifyEvent extends Event {
  /**
   * @param {ModifyEventType} type Type.
   * @param {Collection<Feature>} features
   * The features modified.
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserPointerEvent
   * Associated {@link module:ol/MapBrowserPointerEvent}.
   */
  constructor(type, features, mapBrowserPointerEvent) {
    super(type);

    /**
     * The features being modified.
     * @type {Collection<Feature>}
     * @api
     */
    this.features = features;

    /**
     * Associated {@link module:ol/MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserPointerEvent;

  }

}


/**
 * @classdesc
 * Interaction for modifying feature geometries.  To modify features that have
 * been added to an existing source, construct the modify interaction with the
 * `source` option.  If you want to modify features in a collection (for example,
 * the collection used by a select interaction), construct the interaction with
 * the `features` option.  The interaction must be constructed with either a
 * `source` or `features` option.
 *
 * By default, the interaction will allow deletion of vertices when the `alt`
 * key is pressed.  To configure the interaction with a different condition
 * for deletion, use the `deleteCondition` option.
 * @fires ModifyEvent
 * @api
 */
class Modify extends PointerInteraction {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {

    super(/** @type {import("./Pointer.js").Options} */ (options));

    /** @private */
    this.boundHandleFeatureChange_ = this.handleFeatureChange_.bind(this);

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : primaryAction;

    /**
     * @private
     * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Browser event.
     * @return {boolean} Combined condition result.
     */
    this.defaultDeleteCondition_ = function(mapBrowserEvent) {
      return altKeyOnly(mapBrowserEvent) && singleClick(mapBrowserEvent);
    };

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.deleteCondition_ = options.deleteCondition ?
      options.deleteCondition : this.defaultDeleteCondition_;

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.insertVertexCondition_ = options.insertVertexCondition ?
      options.insertVertexCondition : always;

    /**
     * Editing vertex.
     * @type {Feature}
     * @private
     */
    this.vertexFeature_ = null;

    /**
     * Segments intersecting {@link this.vertexFeature_} by segment uid.
     * @type {Object<string, boolean>}
     * @private
     */
    this.vertexSegments_ = null;

    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.lastPixel_ = [0, 0];

    /**
     * Tracks if the next `singleclick` event should be ignored to prevent
     * accidental deletion right after vertex creation.
     * @type {boolean}
     * @private
     */
    this.ignoreNextSingleClick_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.modified_ = false;

    /**
     * Segment RTree for each layer
     * @type {RBush<SegmentData>}
     * @private
     */
    this.rBush_ = new RBush();

    /**
     * @type {number}
     * @private
     */
    this.pixelTolerance_ = options.pixelTolerance !== undefined ?
      options.pixelTolerance : 10;

    /**
     * @type {boolean}
     * @private
     */
    this.snappedToVertex_ = false;

    /**
     * Indicate whether the interaction is currently changing a feature's
     * coordinates.
     * @type {boolean}
     * @private
     */
    this.changingFeature_ = false;

    /**
     * @type {Array}
     * @private
     */
    this.dragSegments_ = [];

    /**
     * Draw overlay where sketch features are drawn.
     * @type {VectorLayer}
     * @private
     */
    this.overlay_ = new VectorLayer({
      source: new VectorSource({
        useSpatialIndex: false,
        wrapX: !!options.wrapX
      }),
      style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });

    /**
     * @const
     * @private
     * @type {!Object<string, function(Feature, import("../geom/Geometry.js").default): void>}
     */
    this.SEGMENT_WRITERS_ = {
      'Point': this.writePointGeometry_.bind(this),
      'LineString': this.writeLineStringGeometry_.bind(this),
      'LinearRing': this.writeLineStringGeometry_.bind(this),
      'Polygon': this.writePolygonGeometry_.bind(this),
      'MultiPoint': this.writeMultiPointGeometry_.bind(this),
      'MultiLineString': this.writeMultiLineStringGeometry_.bind(this),
      'MultiPolygon': this.writeMultiPolygonGeometry_.bind(this),
      'Circle': this.writeCircleGeometry_.bind(this),
      'GeometryCollection': this.writeGeometryCollectionGeometry_.bind(this)
    };


    /**
     * @type {VectorSource}
     * @private
     */
    this.source_ = null;

    let features;
    if (options.source) {
      this.source_ = options.source;
      features = new Collection(this.source_.getFeatures());
      this.source_.addEventListener(VectorEventType.ADDFEATURE, this.handleSourceAdd_.bind(this));
      this.source_.addEventListener(VectorEventType.REMOVEFEATURE, this.handleSourceRemove_.bind(this));
    } else {
      features = options.features;
    }
    if (!features) {
      throw new Error('The modify interaction requires features or a source');
    }

    /**
     * @type {Collection<Feature>}
     * @private
     */
    this.features_ = features;

    this.features_.forEach(this.addFeature_.bind(this));
    this.features_.addEventListener(CollectionEventType.ADD, this.handleFeatureAdd_.bind(this));
    this.features_.addEventListener(CollectionEventType.REMOVE, this.handleFeatureRemove_.bind(this));

    /**
     * @type {import("../MapBrowserPointerEvent.js").default}
     * @private
     */
    this.lastPointerEvent_ = null;

  }

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  addFeature_(feature) {
    const geometry = feature.getGeometry();
    if (geometry) {
      const writer = this.SEGMENT_WRITERS_[geometry.getType()];
      if (writer) {
        writer(feature, geometry);
      }
    }
    const map = this.getMap();
    if (map && map.isRendered() && this.getActive()) {
      this.handlePointerAtPixel_(this.lastPixel_, map);
    }
    feature.addEventListener(EventType.CHANGE, this.boundHandleFeatureChange_);
  }

  /**
   * @param {import("../MapBrowserPointerEvent.js").default} evt Map browser event
   * @private
   */
  willModifyFeatures_(evt) {
    if (!this.modified_) {
      this.modified_ = true;
      this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYSTART, this.features_, evt));
    }
  }

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  removeFeature_(feature) {
    this.removeFeatureSegmentData_(feature);
    // Remove the vertex feature if the collection of canditate features is empty.
    if (this.vertexFeature_ && this.features_.getLength() === 0) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
    feature.removeEventListener(EventType.CHANGE, this.boundHandleFeatureChange_);
  }

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  removeFeatureSegmentData_(feature) {
    const rBush = this.rBush_;
    /** @type {Array<SegmentData>} */
    const nodesToRemove = [];
    rBush.forEach(
      /**
       * @param {SegmentData} node RTree node.
       */
      function(node) {
        if (feature === node.feature) {
          nodesToRemove.push(node);
        }
      });
    for (let i = nodesToRemove.length - 1; i >= 0; --i) {
      const nodeToRemove = nodesToRemove[i];
      for (let j = this.dragSegments_.length - 1; j >= 0; --j) {
        if (this.dragSegments_[j][0] === nodeToRemove) {
          this.dragSegments_.splice(j, 1);
        }
      }
      rBush.remove(nodeToRemove);
    }
  }

  /**
   * @inheritDoc
   */
  setActive(active) {
    if (this.vertexFeature_ && !active) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
    super.setActive(active);
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    this.overlay_.setMap(map);
    super.setMap(map);
  }

  /**
   * Get the overlay layer that this interaction renders sketch features to.
   * @return {VectorLayer} Overlay layer.
   * @api
   */
  getOverlay() {
    return this.overlay_;
  }

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceAdd_(event) {
    if (event.feature) {
      this.features_.push(event.feature);
    }
  }

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceRemove_(event) {
    if (event.feature) {
      this.features_.remove(event.feature);
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  handleFeatureAdd_(evt) {
    this.addFeature_(/** @type {Feature} */ (evt.element));
  }

  /**
   * @param {import("../events/Event.js").default} evt Event.
   * @private
   */
  handleFeatureChange_(evt) {
    if (!this.changingFeature_) {
      const feature = /** @type {Feature} */ (evt.target);
      this.removeFeature_(feature);
      this.addFeature_(feature);
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  handleFeatureRemove_(evt) {
    const feature = /** @type {Feature} */ (evt.element);
    this.removeFeature_(feature);
  }

  /**
   * @param {Feature} feature Feature
   * @param {Point} geometry Geometry.
   * @private
   */
  writePointGeometry_(feature, geometry) {
    const coordinates = geometry.getCoordinates();

    /** @type {SegmentData} */
    const segmentData = {
      feature: feature,
      geometry: geometry,
      segment: [coordinates, coordinates]
    };

    this.rBush_.insert(geometry.getExtent(), segmentData);
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
   * @private
   */
  writeMultiPointGeometry_(feature, geometry) {
    const points = geometry.getCoordinates();
    for (let i = 0, ii = points.length; i < ii; ++i) {
      const coordinates = points[i];

      /** @type {SegmentData} */
      const segmentData = {
        feature: feature,
        geometry: geometry,
        depth: [i],
        index: i,
        segment: [coordinates, coordinates]
      };

      this.rBush_.insert(geometry.getExtent(), segmentData);
    }
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/LineString.js").default} geometry Geometry.
   * @private
   */
  writeLineStringGeometry_(feature, geometry) {
    const coordinates = geometry.getCoordinates();
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2);

      /** @type {SegmentData} */
      const segmentData = {
        feature: feature,
        geometry: geometry,
        index: i,
        segment: segment
      };

      this.rBush_.insert(boundingExtent(segment), segmentData);
    }
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
   * @private
   */
  writeMultiLineStringGeometry_(feature, geometry) {
    const lines = geometry.getCoordinates();
    for (let j = 0, jj = lines.length; j < jj; ++j) {
      const coordinates = lines[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const segment = coordinates.slice(i, i + 2);

        /** @type {SegmentData} */
        const segmentData = {
          feature: feature,
          geometry: geometry,
          depth: [j],
          index: i,
          segment: segment
        };

        this.rBush_.insert(boundingExtent(segment), segmentData);
      }
    }
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/Polygon.js").default} geometry Geometry.
   * @private
   */
  writePolygonGeometry_(feature, geometry) {
    const rings = geometry.getCoordinates();
    for (let j = 0, jj = rings.length; j < jj; ++j) {
      const coordinates = rings[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const segment = coordinates.slice(i, i + 2);

        /** @type {SegmentData} */
        const segmentData = {
          feature: feature,
          geometry: geometry,
          depth: [j],
          index: i,
          segment: segment
        };

        this.rBush_.insert(boundingExtent(segment), segmentData);
      }
    }
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
   * @private
   */
  writeMultiPolygonGeometry_(feature, geometry) {
    const polygons = geometry.getCoordinates();
    for (let k = 0, kk = polygons.length; k < kk; ++k) {
      const rings = polygons[k];
      for (let j = 0, jj = rings.length; j < jj; ++j) {
        const coordinates = rings[j];
        for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
          const segment = coordinates.slice(i, i + 2);

          /** @type {SegmentData} */
          const segmentData = {
            feature: feature,
            geometry: geometry,
            depth: [j, k],
            index: i,
            segment: segment
          };

          this.rBush_.insert(boundingExtent(segment), segmentData);
        }
      }
    }
  }

  /**
   * We convert a circle into two segments.  The segment at index
   * {@link CIRCLE_CENTER_INDEX} is the
   * circle's center (a point).  The segment at index
   * {@link CIRCLE_CIRCUMFERENCE_INDEX} is
   * the circumference, and is not a line segment.
   *
   * @param {Feature} feature Feature.
   * @param {import("../geom/Circle.js").default} geometry Geometry.
   * @private
   */
  writeCircleGeometry_(feature, geometry) {
    const coordinates = geometry.getCenter();

    /** @type {SegmentData} */
    const centerSegmentData = {
      feature: feature,
      geometry: geometry,
      index: CIRCLE_CENTER_INDEX,
      segment: [coordinates, coordinates]
    };

    /** @type {SegmentData} */
    const circumferenceSegmentData = {
      feature: feature,
      geometry: geometry,
      index: CIRCLE_CIRCUMFERENCE_INDEX,
      segment: [coordinates, coordinates]
    };

    const featureSegments = [centerSegmentData, circumferenceSegmentData];
    centerSegmentData.featureSegments = featureSegments;
    circumferenceSegmentData.featureSegments = featureSegments;
    this.rBush_.insert(createExtent(coordinates), centerSegmentData);
    this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
  }

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
   * @private
   */
  writeGeometryCollectionGeometry_(feature, geometry) {
    const geometries = geometry.getGeometriesArray();
    for (let i = 0; i < geometries.length; ++i) {
      const geometry = geometries[i];
      const writer = this.SEGMENT_WRITERS_[geometry.getType()];
      writer(feature, geometry);
    }
  }

  /**
   * @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
   * @return {Feature} Vertex feature.
   * @private
   */
  createOrUpdateVertexFeature_(coordinates) {
    let vertexFeature = this.vertexFeature_;
    if (!vertexFeature) {
      vertexFeature = new Feature(new Point(coordinates));
      this.vertexFeature_ = vertexFeature;
      this.overlay_.getSource().addFeature(vertexFeature);
    } else {
      const geometry = vertexFeature.getGeometry();
      geometry.setCoordinates(coordinates);
    }
    return vertexFeature;
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may modify the geometry.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    if (!(/** @type {import("../MapBrowserPointerEvent.js").default} */ (mapBrowserEvent).pointerEvent)) {
      return true;
    }
    this.lastPointerEvent_ = mapBrowserEvent;

    let handled;
    if (!mapBrowserEvent.map.getView().getInteracting() &&
        mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE &&
        !this.handlingDownUpSequence) {
      this.handlePointerMove_(mapBrowserEvent);
    }
    if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
      if (mapBrowserEvent.type != MapBrowserEventType.SINGLECLICK || !this.ignoreNextSingleClick_) {
        handled = this.removePoint();
      } else {
        handled = true;
      }
    }

    if (mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK) {
      this.ignoreNextSingleClick_ = false;
    }

    return super.handleEvent(mapBrowserEvent) && !handled;
  }

  /**
   * @inheritDoc
   */
  handleDragEvent(evt) {
    this.ignoreNextSingleClick_ = false;
    this.willModifyFeatures_(evt);

    const vertex = evt.coordinate;
    for (let i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
      const dragSegment = this.dragSegments_[i];
      const segmentData = dragSegment[0];
      const depth = segmentData.depth;
      const geometry = segmentData.geometry;
      let coordinates;
      const segment = segmentData.segment;
      const index = dragSegment[1];

      while (vertex.length < geometry.getStride()) {
        vertex.push(segment[index][vertex.length]);
      }

      switch (geometry.getType()) {
        case GeometryType.POINT:
          coordinates = vertex;
          segment[0] = vertex;
          segment[1] = vertex;
          break;
        case GeometryType.MULTI_POINT:
          coordinates = geometry.getCoordinates();
          coordinates[segmentData.index] = vertex;
          segment[0] = vertex;
          segment[1] = vertex;
          break;
        case GeometryType.LINE_STRING:
          coordinates = geometry.getCoordinates();
          coordinates[segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case GeometryType.MULTI_LINE_STRING:
          coordinates = geometry.getCoordinates();
          coordinates[depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case GeometryType.POLYGON:
          coordinates = geometry.getCoordinates();
          coordinates[depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case GeometryType.MULTI_POLYGON:
          coordinates = geometry.getCoordinates();
          coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case GeometryType.CIRCLE:
          segment[0] = vertex;
          segment[1] = vertex;
          if (segmentData.index === CIRCLE_CENTER_INDEX) {
            this.changingFeature_ = true;
            geometry.setCenter(vertex);
            this.changingFeature_ = false;
          } else { // We're dragging the circle's circumference:
            this.changingFeature_ = true;
            geometry.setRadius(coordinateDistance(geometry.getCenter(), vertex));
            this.changingFeature_ = false;
          }
          break;
        default:
          // pass
      }

      if (coordinates) {
        this.setGeometryCoordinates_(geometry, coordinates);
      }
    }
    this.createOrUpdateVertexFeature_(vertex);
  }

  /**
   * @inheritDoc
   */
  handleDownEvent(evt) {
    if (!this.condition_(evt)) {
      return false;
    }
    const pixelCoordinate = evt.coordinate;
    this.handlePointerAtPixel_(evt.pixel, evt.map, pixelCoordinate);
    this.dragSegments_.length = 0;
    this.modified_ = false;
    const vertexFeature = this.vertexFeature_;
    if (vertexFeature) {
      const projection = evt.map.getView().getProjection();
      const insertVertices = [];
      const vertex = vertexFeature.getGeometry().getCoordinates();
      const vertexExtent = boundingExtent([vertex]);
      const segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
      const componentSegments = {};
      segmentDataMatches.sort(compareIndexes);
      for (let i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
        const segmentDataMatch = segmentDataMatches[i];
        const segment = segmentDataMatch.segment;
        let uid = getUid(segmentDataMatch.feature);
        const depth = segmentDataMatch.depth;
        if (depth) {
          uid += '-' + depth.join('-'); // separate feature components
        }
        if (!componentSegments[uid]) {
          componentSegments[uid] = new Array(2);
        }

        if (segmentDataMatch.geometry.getType() === GeometryType.CIRCLE && segmentDataMatch.index === CIRCLE_CIRCUMFERENCE_INDEX) {
          const closestVertex = closestOnSegmentData(pixelCoordinate, segmentDataMatch, projection);
          if (coordinatesEqual(closestVertex, vertex) && !componentSegments[uid][0]) {
            this.dragSegments_.push([segmentDataMatch, 0]);
            componentSegments[uid][0] = segmentDataMatch;
          }
          continue;
        }

        if (coordinatesEqual(segment[0], vertex) && !componentSegments[uid][0]) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
          continue;
        }

        if (coordinatesEqual(segment[1], vertex) && !componentSegments[uid][1]) {
          // prevent dragging closed linestrings by the connecting node
          if ((segmentDataMatch.geometry.getType() ===
              GeometryType.LINE_STRING ||
              segmentDataMatch.geometry.getType() ===
              GeometryType.MULTI_LINE_STRING) &&
              componentSegments[uid][0] &&
              componentSegments[uid][0].index === 0) {
            continue;
          }

          this.dragSegments_.push([segmentDataMatch, 1]);
          componentSegments[uid][1] = segmentDataMatch;
          continue;
        }

        if (getUid(segment) in this.vertexSegments_ &&
            (!componentSegments[uid][0] && !componentSegments[uid][1]) &&
            this.insertVertexCondition_(evt)) {
          insertVertices.push([segmentDataMatch, vertex]);
        }
      }

      if (insertVertices.length) {
        this.willModifyFeatures_(evt);
      }

      for (let j = insertVertices.length - 1; j >= 0; --j) {
        this.insertVertex_.apply(this, insertVertices[j]);
      }
    }
    return !!this.vertexFeature_;
  }

  /**
   * @inheritDoc
   */
  handleUpEvent(evt) {
    for (let i = this.dragSegments_.length - 1; i >= 0; --i) {
      const segmentData = this.dragSegments_[i][0];
      const geometry = segmentData.geometry;
      if (geometry.getType() === GeometryType.CIRCLE) {
        // Update a circle object in the R* bush:
        const coordinates = geometry.getCenter();
        const centerSegmentData = segmentData.featureSegments[0];
        const circumferenceSegmentData = segmentData.featureSegments[1];
        centerSegmentData.segment[0] = coordinates;
        centerSegmentData.segment[1] = coordinates;
        circumferenceSegmentData.segment[0] = coordinates;
        circumferenceSegmentData.segment[1] = coordinates;
        this.rBush_.update(createExtent(coordinates), centerSegmentData);
        this.rBush_.update(geometry.getExtent(), circumferenceSegmentData);
      } else {
        this.rBush_.update(boundingExtent(segmentData.segment), segmentData);
      }
    }
    if (this.modified_) {
      this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
      this.modified_ = false;
    }
    return false;
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @private
   */
  handlePointerMove_(evt) {
    this.lastPixel_ = evt.pixel;
    this.handlePointerAtPixel_(evt.pixel, evt.map, evt.coordinate);
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../PluggableMap.js").default} map Map.
   * @param {import("../coordinate.js").Coordinate=} opt_coordinate The pixel Coordinate.
   * @private
   */
  handlePointerAtPixel_(pixel, map, opt_coordinate) {
    const pixelCoordinate = opt_coordinate || map.getCoordinateFromPixel(pixel);
    const projection = map.getView().getProjection();
    const sortByDistance = function(a, b) {
      return projectedDistanceToSegmentDataSquared(pixelCoordinate, a, projection) -
          projectedDistanceToSegmentDataSquared(pixelCoordinate, b, projection);
    };

    const viewExtent = fromUserExtent(createExtent(pixelCoordinate, tempExtent), projection);
    const buffer = map.getView().getResolution() * this.pixelTolerance_;
    const box = toUserExtent(bufferExtent(viewExtent, buffer, tempExtent), projection);

    const rBush = this.rBush_;
    const nodes = rBush.getInExtent(box);
    if (nodes.length > 0) {
      nodes.sort(sortByDistance);
      const node = nodes[0];
      const closestSegment = node.segment;
      let vertex = closestOnSegmentData(pixelCoordinate, node, projection);
      const vertexPixel = map.getPixelFromCoordinate(vertex);
      let dist = coordinateDistance(pixel, vertexPixel);
      if (dist <= this.pixelTolerance_) {
        /** @type {Object<string, boolean>} */
        const vertexSegments = {};

        if (node.geometry.getType() === GeometryType.CIRCLE && node.index === CIRCLE_CIRCUMFERENCE_INDEX) {
          this.snappedToVertex_ = true;
          this.createOrUpdateVertexFeature_(vertex);
        } else {
          const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
          const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          this.snappedToVertex_ = dist <= this.pixelTolerance_;
          if (this.snappedToVertex_) {
            vertex = squaredDist1 > squaredDist2 ? closestSegment[1] : closestSegment[0];
          }
          this.createOrUpdateVertexFeature_(vertex);
          for (let i = 1, ii = nodes.length; i < ii; ++i) {
            const segment = nodes[i].segment;
            if ((coordinatesEqual(closestSegment[0], segment[0]) &&
                coordinatesEqual(closestSegment[1], segment[1]) ||
                (coordinatesEqual(closestSegment[0], segment[1]) &&
                coordinatesEqual(closestSegment[1], segment[0])))) {
              vertexSegments[getUid(segment)] = true;
            } else {
              break;
            }
          }
        }

        vertexSegments[getUid(closestSegment)] = true;
        this.vertexSegments_ = vertexSegments;
        return;
      }
    }
    if (this.vertexFeature_) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
  }

  /**
   * @param {SegmentData} segmentData Segment data.
   * @param {import("../coordinate.js").Coordinate} vertex Vertex.
   * @private
   */
  insertVertex_(segmentData, vertex) {
    const segment = segmentData.segment;
    const feature = segmentData.feature;
    const geometry = segmentData.geometry;
    const depth = segmentData.depth;
    const index = segmentData.index;
    let coordinates;

    while (vertex.length < geometry.getStride()) {
      vertex.push(0);
    }

    switch (geometry.getType()) {
      case GeometryType.MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]].splice(index + 1, 0, vertex);
        break;
      case GeometryType.POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]].splice(index + 1, 0, vertex);
        break;
      case GeometryType.MULTI_POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
        break;
      case GeometryType.LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates.splice(index + 1, 0, vertex);
        break;
      default:
        return;
    }

    this.setGeometryCoordinates_(geometry, coordinates);
    const rTree = this.rBush_;
    rTree.remove(segmentData);
    this.updateSegmentIndices_(geometry, index, depth, 1);

    /** @type {SegmentData} */
    const newSegmentData = {
      segment: [segment[0], vertex],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index
    };

    rTree.insert(boundingExtent(newSegmentData.segment), newSegmentData);
    this.dragSegments_.push([newSegmentData, 1]);

    /** @type {SegmentData} */
    const newSegmentData2 = {
      segment: [vertex, segment[1]],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index + 1
    };

    rTree.insert(boundingExtent(newSegmentData2.segment), newSegmentData2);
    this.dragSegments_.push([newSegmentData2, 0]);
    this.ignoreNextSingleClick_ = true;
  }

  /**
   * Removes the vertex currently being pointed.
   * @return {boolean} True when a vertex was removed.
   * @api
   */
  removePoint() {
    if (this.lastPointerEvent_ && this.lastPointerEvent_.type != MapBrowserEventType.POINTERDRAG) {
      const evt = this.lastPointerEvent_;
      this.willModifyFeatures_(evt);
      const removed = this.removeVertex_();
      this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
      this.modified_ = false;
      return removed;
    }
    return false;
  }

  /**
   * Removes a vertex from all matching features.
   * @return {boolean} True when a vertex was removed.
   * @private
   */
  removeVertex_() {
    const dragSegments = this.dragSegments_;
    const segmentsByFeature = {};
    let deleted = false;
    let component, coordinates, dragSegment, geometry, i, index, left;
    let newIndex, right, segmentData, uid;
    for (i = dragSegments.length - 1; i >= 0; --i) {
      dragSegment = dragSegments[i];
      segmentData = dragSegment[0];
      uid = getUid(segmentData.feature);
      if (segmentData.depth) {
        // separate feature components
        uid += '-' + segmentData.depth.join('-');
      }
      if (!(uid in segmentsByFeature)) {
        segmentsByFeature[uid] = {};
      }
      if (dragSegment[1] === 0) {
        segmentsByFeature[uid].right = segmentData;
        segmentsByFeature[uid].index = segmentData.index;
      } else if (dragSegment[1] == 1) {
        segmentsByFeature[uid].left = segmentData;
        segmentsByFeature[uid].index = segmentData.index + 1;
      }

    }
    for (uid in segmentsByFeature) {
      right = segmentsByFeature[uid].right;
      left = segmentsByFeature[uid].left;
      index = segmentsByFeature[uid].index;
      newIndex = index - 1;
      if (left !== undefined) {
        segmentData = left;
      } else {
        segmentData = right;
      }
      if (newIndex < 0) {
        newIndex = 0;
      }
      geometry = segmentData.geometry;
      coordinates = geometry.getCoordinates();
      component = coordinates;
      deleted = false;
      switch (geometry.getType()) {
        case GeometryType.MULTI_LINE_STRING:
          if (coordinates[segmentData.depth[0]].length > 2) {
            coordinates[segmentData.depth[0]].splice(index, 1);
            deleted = true;
          }
          break;
        case GeometryType.LINE_STRING:
          if (coordinates.length > 2) {
            coordinates.splice(index, 1);
            deleted = true;
          }
          break;
        case GeometryType.MULTI_POLYGON:
          component = component[segmentData.depth[1]];
          /* falls through */
        case GeometryType.POLYGON:
          component = component[segmentData.depth[0]];
          if (component.length > 4) {
            if (index == component.length - 1) {
              index = 0;
            }
            component.splice(index, 1);
            deleted = true;
            if (index === 0) {
              // close the ring again
              component.pop();
              component.push(component[0]);
              newIndex = component.length - 1;
            }
          }
          break;
        default:
          // pass
      }

      if (deleted) {
        this.setGeometryCoordinates_(geometry, coordinates);
        const segments = [];
        if (left !== undefined) {
          this.rBush_.remove(left);
          segments.push(left.segment[0]);
        }
        if (right !== undefined) {
          this.rBush_.remove(right);
          segments.push(right.segment[1]);
        }
        if (left !== undefined && right !== undefined) {

          /** @type {SegmentData} */
          const newSegmentData = {
            depth: segmentData.depth,
            feature: segmentData.feature,
            geometry: segmentData.geometry,
            index: newIndex,
            segment: segments
          };

          this.rBush_.insert(boundingExtent(newSegmentData.segment), newSegmentData);
        }
        this.updateSegmentIndices_(geometry, index, segmentData.depth, -1);
        if (this.vertexFeature_) {
          this.overlay_.getSource().removeFeature(this.vertexFeature_);
          this.vertexFeature_ = null;
        }
        dragSegments.length = 0;
      }

    }
    return deleted;
  }

  /**
   * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
   * @param {Array} coordinates Coordinates.
   * @private
   */
  setGeometryCoordinates_(geometry, coordinates) {
    this.changingFeature_ = true;
    geometry.setCoordinates(coordinates);
    this.changingFeature_ = false;
  }

  /**
   * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
   * @param {number} index Index.
   * @param {Array<number>|undefined} depth Depth.
   * @param {number} delta Delta (1 or -1).
   * @private
   */
  updateSegmentIndices_(geometry, index, depth, delta) {
    this.rBush_.forEachInExtent(geometry.getExtent(), function(segmentDataMatch) {
      if (segmentDataMatch.geometry === geometry &&
          (depth === undefined || segmentDataMatch.depth === undefined ||
          equals(segmentDataMatch.depth, depth)) &&
          segmentDataMatch.index > index) {
        segmentDataMatch.index += delta;
      }
    });
  }
}


/**
 * @param {SegmentData} a The first segment data.
 * @param {SegmentData} b The second segment data.
 * @return {number} The difference in indexes.
 */
function compareIndexes(a, b) {
  return a.index - b.index;
}


/**
 * Returns the distance from a point to a line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The coordinates of the point from
 *        which to calculate the distance.
 * @param {SegmentData} segmentData The object describing the line
 *        segment we are calculating the distance to.
 * @param {import("../proj/Projection.js").default} projection The view projection.
 * @return {number} The square of the distance between a point and a line segment.
 */
function projectedDistanceToSegmentDataSquared(pointCoordinates, segmentData, projection) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE) {
    const circleGeometry = /** @type {import("../geom/Circle.js").default} */ (geometry);

    if (segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
      const distanceToCenterSquared =
            squaredCoordinateDistance(circleGeometry.getCenter(), pointCoordinates);
      const distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }

  const coordinate = fromUserCoordinate(pointCoordinates, projection);
  tempSegment[0] = fromUserCoordinate(segmentData.segment[0], projection);
  tempSegment[1] = fromUserCoordinate(segmentData.segment[1], projection);
  return squaredDistanceToSegment(coordinate, tempSegment);
}

/**
 * Returns the point closest to a given line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The point to which a closest point
 *        should be found.
 * @param {SegmentData} segmentData The object describing the line
 *        segment which should contain the closest point.
 * @param {import("../proj/Projection.js").default} projection The view projection.
 * @return {import("../coordinate.js").Coordinate} The point closest to the specified line segment.
 */
function closestOnSegmentData(pointCoordinates, segmentData, projection) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE && segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  const coordinate = fromUserCoordinate(pointCoordinates, projection);
  tempSegment[0] = fromUserCoordinate(segmentData.segment[0], projection);
  tempSegment[1] = fromUserCoordinate(segmentData.segment[1], projection);
  return toUserCoordinate(closestOnSegment(coordinate, tempSegment), projection);
}


/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const style = createEditingStyle();
  return function(feature, resolution) {
    return style[GeometryType.POINT];
  };
}


export default Modify;
