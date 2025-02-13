/**
 * @module ol/interaction/Snap
 */
import CollectionEventType from '../CollectionEventType.js';
import {
  closestOnCircle,
  closestOnSegment,
  squaredDistance,
} from '../coordinate.js';
import EventType from '../events/EventType.js';
import {SnapEvent, SnapEventType} from '../events/SnapEvent.js';
import {listen, unlistenByKey} from '../events.js';
import {
  boundingExtent,
  buffer,
  createEmpty,
  intersects as intersectsExtent,
} from '../extent.js';
import {FALSE, TRUE} from '../functions.js';
import {fromCircle} from '../geom/Polygon.js';
import {getIntersectionPoint} from '../geom/flat/segments.js';
import {
  fromUserCoordinate,
  getUserProjection,
  toUserCoordinate,
  toUserExtent,
} from '../proj.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';
import {getUid} from '../util.js';
import PointerInteraction from './Pointer.js';

/**
 * @typedef {Array<import("../coordinate.js").Coordinate>} Segment
 * An array of two coordinates representing a line segment, or an array of one
 * coordinate representing a point.
 */

/**
 * @typedef {Object} SegmentData
 * @property {import("../Feature.js").default} feature Feature.
 * @property {Segment} segment Segment.
 * @property {boolean} [isIntersection] Is intersection.
 */

/**
 * @template {import("../geom/Geometry.js").default} [GeometryType=import("../geom/Geometry.js").default]
 * @typedef {(geometry: GeometryType, projection?: import("../proj/Projection.js").default) => Array<Segment>} Segmenter
 * A function taking a {@link module:ol/geom/Geometry~Geometry} as argument and returning an array of {@link Segment}s.
 */

/**
 * Each segmenter specified here will override the default segmenter for the
 * corresponding geometry type. To exclude all geometries of a specific geometry type from being snapped to,
 * set the segmenter to `null`.
 * @typedef {Object} Segmenters
 * @property {Segmenter<import("../geom/Point.js").default>|null} [Point] Point segmenter.
 * @property {Segmenter<import("../geom/LineString.js").default>|null} [LineString] LineString segmenter.
 * @property {Segmenter<import("../geom/Polygon.js").default>|null} [Polygon] Polygon segmenter.
 * @property {Segmenter<import("../geom/Circle.js").default>|null} [Circle] Circle segmenter.
 * @property {Segmenter<import("../geom/GeometryCollection.js").default>|null} [GeometryCollection] GeometryCollection segmenter.
 * @property {Segmenter<import("../geom/MultiPoint.js").default>|null} [MultiPoint] MultiPoint segmenter.
 * @property {Segmenter<import("../geom/MultiLineString.js").default>|null} [MultiLineString] MultiLineString segmenter.
 * @property {Segmenter<import("../geom/MultiPolygon.js").default>|null} [MultiPolygon] MultiPolygon segmenter.
 */

/**
 * @typedef {Object} Options
 * @property {import("../Collection.js").default<import("../Feature.js").default>} [features] Snap to these features. Either this option or source should be provided.
 * @property {import("../source/Vector.js").default} [source] Snap to features from this source. Either this option or features should be provided
 * @property {boolean} [edge=true] Snap to edges.
 * @property {boolean} [vertex=true] Snap to vertices.
 * @property {boolean} [intersection=false] Snap to intersections between segments.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for snapping.
 * @property {Segmenters} [segmenters] Custom segmenters by {@link module:ol/geom/Geometry~Type}. By default, the
 * following segmenters are used:
 *   - `Point`: A one-dimensional segment (e.g. `[[10, 20]]`) representing the point.
 *   - `LineString`: One two-dimensional segment (e.g. `[[10, 20], [30, 40]]`) for each segment of the linestring.
 *   - `Polygon`: One two-dimensional segment for each segment of the exterior ring and the interior rings.
 *   - `Circle`: One two-dimensional segment for each segment of a regular polygon with 32 points representing the circle circumference.
 *   - `GeometryCollection`: All segments of the contained geometries.
 *   - `MultiPoint`: One one-dimensional segment for each point.
 *   - `MultiLineString`: One two-dimensional segment for each segment of the linestrings.
 *   - `MultiPolygon`: One two-dimensional segment for each segment of the polygons.
 */

/**
 * Information about the last snapped state.
 * @typedef {Object} SnappedInfo
 * @property {import("../coordinate.js").Coordinate|null} vertex - The snapped vertex.
 * @property {import("../pixel.js").Pixel|null} vertexPixel - The pixel of the snapped vertex.
 * @property {import("../Feature.js").default|null} feature - The feature being snapped.
 * @property {Segment|null} segment - Segment, or `null` if snapped to a vertex.
 */

/***
 * @type {Object<string, Segmenter>}
 */
const GEOMETRY_SEGMENTERS = {
  /**
   * @param {import("../geom/Circle.js").default} geometry Geometry.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {Array<Segment>} Segments
   */
  Circle(geometry, projection) {
    let circleGeometry = geometry;
    const userProjection = getUserProjection();
    if (userProjection) {
      circleGeometry = circleGeometry
        .clone()
        .transform(userProjection, projection);
    }
    const polygon = fromCircle(circleGeometry);
    if (userProjection) {
      polygon.transform(projection, userProjection);
    }
    return GEOMETRY_SEGMENTERS.Polygon(polygon);
  },

  /**
   * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {Array<Segment>} Segments
   */
  GeometryCollection(geometry, projection) {
    /** @type {Array<Array<Segment>>} */
    const segments = [];
    const geometries = geometry.getGeometriesArray();
    for (let i = 0; i < geometries.length; ++i) {
      const segmenter = GEOMETRY_SEGMENTERS[geometries[i].getType()];
      if (segmenter) {
        segments.push(segmenter(geometries[i], projection));
      }
    }
    return segments.flat();
  },

  /**
   * @param {import("../geom/LineString.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  LineString(geometry) {
    /** @type {Array<Segment>} */
    const segments = [];
    const coordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    for (let i = 0, ii = coordinates.length - stride; i < ii; i += stride) {
      segments.push([
        coordinates.slice(i, i + 2),
        coordinates.slice(i + stride, i + stride + 2),
      ]);
    }
    return segments;
  },

  /**
   * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  MultiLineString(geometry) {
    /** @type {Array<Segment>} */
    const segments = [];
    const coordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    const ends = geometry.getEnds();
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      for (let j = offset, jj = end - stride; j < jj; j += stride) {
        segments.push([
          coordinates.slice(j, j + 2),
          coordinates.slice(j + stride, j + stride + 2),
        ]);
      }
      offset = end;
    }
    return segments;
  },

  /**
   * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  MultiPoint(geometry) {
    /** @type {Array<Segment>} */
    const segments = [];
    const coordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    for (let i = 0, ii = coordinates.length - stride; i < ii; i += stride) {
      segments.push([coordinates.slice(i, i + 2)]);
    }
    return segments;
  },

  /**
   * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  MultiPolygon(geometry) {
    /** @type {Array<Segment>} */
    const segments = [];
    const coordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    const endss = geometry.getEndss();
    let offset = 0;
    for (let i = 0, ii = endss.length; i < ii; ++i) {
      const ends = endss[i];
      for (let j = 0, jj = ends.length; j < jj; ++j) {
        const end = ends[j];
        for (let k = offset, kk = end - stride; k < kk; k += stride) {
          segments.push([
            coordinates.slice(k, k + 2),
            coordinates.slice(k + stride, k + stride + 2),
          ]);
        }
        offset = end;
      }
    }
    return segments;
  },

  /**
   * @param {import("../geom/Point.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  Point(geometry) {
    return [[geometry.getFlatCoordinates().slice(0, 2)]];
  },

  /**
   * @param {import("../geom/Polygon.js").default} geometry Geometry.
   * @return {Array<Segment>} Segments
   */
  Polygon(geometry) {
    /** @type {Array<Segment>} */
    const segments = [];
    const coordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    const ends = geometry.getEnds();
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      for (let j = offset, jj = end - stride; j < jj; j += stride) {
        segments.push([
          coordinates.slice(j, j + 2),
          coordinates.slice(j + stride, j + stride + 2),
        ]);
      }
      offset = end;
    }
    return segments;
  },
};

/**
 * @param  {import("../source/Vector.js").VectorSourceEvent|import("../Collection.js").CollectionEvent<import("../Feature.js").default>} evt Event.
 * @return {import("../Feature.js").default|null} Feature.
 */
function getFeatureFromEvent(evt) {
  if (
    /** @type {import("../source/Vector.js").VectorSourceEvent} */ (evt).feature
  ) {
    return /** @type {import("../source/Vector.js").VectorSourceEvent} */ (evt)
      .feature;
  }
  if (
    /** @type {import("../Collection.js").CollectionEvent<import("../Feature.js").default>} */ (
      evt
    ).element
  ) {
    return /** @type {import("../Collection.js").CollectionEvent<import("../Feature.js").default>} */ (
      evt
    ).element;
  }
  return null;
}

const tempSegment = [];
/** @type {Array<import('../extent.js').Extent>} */
const tempExtents = [];
/** @type {Array<SegmentData>} */
const tempSegmentData = [];

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'snap'|'unsnap', SnapEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'snap'|'unsnap', Return>} SnapOnSignature
 */

/**
 * @classdesc
 * Handles snapping of vector features while modifying or drawing them.  The
 * features can come from a {@link module:ol/source/Vector~VectorSource} or {@link module:ol/Collection~Collection}
 * Any interaction object that allows the user to interact
 * with the features using the mouse can benefit from the snapping, as long
 * as it is added before.
 *
 * The snap interaction modifies map browser event `coordinate` and `pixel`
 * properties to force the snap to occur to any interaction that uses them.
 *
 * Example:
 *
 *     import Snap from 'ol/interaction/Snap.js';
 *
 *     const snap = new Snap({
 *       source: source
 *     });
 *
 *     map.addInteraction(snap);
 *
 * @fires SnapEvent
 * @api
 */
class Snap extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const pointerOptions = /** @type {import("./Pointer.js").Options} */ (
      options
    );

    if (!pointerOptions.handleDownEvent) {
      pointerOptions.handleDownEvent = TRUE;
    }

    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = FALSE;
    }

    super(pointerOptions);

    /***
     * @type {SnapOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {SnapOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {SnapOnSignature<void>}
     */
    this.un;

    /**
     * @type {import("../source/Vector.js").default|null}
     * @private
     */
    this.source_ = options.source ? options.source : null;

    /**
     * @private
     * @type {boolean}
     */
    this.vertex_ = options.vertex !== undefined ? options.vertex : true;

    /**
     * @private
     * @type {boolean}
     */
    this.edge_ = options.edge !== undefined ? options.edge : true;

    /**
     * @private
     * @type {boolean}
     */
    this.intersection_ =
      options.intersection !== undefined ? options.intersection : false;

    /**
     * @type {import("../Collection.js").default<import("../Feature.js").default>|null}
     * @private
     */
    this.features_ = options.features ? options.features : null;

    /**
     * @type {Array<import("../events.js").EventsKey>}
     * @private
     */
    this.featuresListenerKeys_ = [];

    /**
     * @type {Object<string, import("../events.js").EventsKey>}
     * @private
     */
    this.featureChangeListenerKeys_ = {};

    /**
     * Extents are preserved so indexed segment can be quickly removed
     * when its feature geometry changes
     * @type {Object<string, import("../extent.js").Extent>}
     * @private
     */
    this.indexedFeaturesExtents_ = {};

    /**
     * If a feature geometry changes while a pointer drag|move event occurs, the
     * feature doesn't get updated right away.  It will be at the next 'pointerup'
     * event fired.
     * @type {!Object<string, import("../Feature.js").default>}
     * @private
     */
    this.pendingFeatures_ = {};

    /**
     * @type {number}
     * @private
     */
    this.pixelTolerance_ =
      options.pixelTolerance !== undefined ? options.pixelTolerance : 10;

    /**
     * Segment RTree for each layer
     * @type {import("../structs/RBush.js").default<SegmentData>}
     * @private
     */
    this.rBush_ = new RBush();

    /**
     * Holds information about the last snapped state.
     * @type {SnappedInfo|null}
     * @private
     */
    this.snapped_ = null;

    /**
     * @type {Object<string, Segmenter>}
     * @private
     */
    this.segmenters_ = Object.assign(
      {},
      GEOMETRY_SEGMENTERS,
      options.segmenters,
    );
  }

  /**
   * Add a feature to the collection of features that we may snap to.
   * @param {import("../Feature.js").default} feature Feature.
   * @param {boolean} [register] Whether to listen to the feature change or not
   *     Defaults to `true`.
   * @api
   */
  addFeature(feature, register) {
    register = register !== undefined ? register : true;
    const feature_uid = getUid(feature);
    const geometry = feature.getGeometry();
    if (geometry) {
      const segmenter = this.segmenters_[geometry.getType()];
      if (segmenter) {
        this.indexedFeaturesExtents_[feature_uid] =
          geometry.getExtent(createEmpty());
        const segments = segmenter(
          geometry,
          this.getMap().getView().getProjection(),
        );
        let segmentCount = segments.length;
        for (let i = 0; i < segmentCount; ++i) {
          const segment = segments[i];
          tempExtents[i] = boundingExtent(segment);
          tempSegmentData[i] = {
            feature: feature,
            segment: segment,
          };
        }
        tempExtents.length = segmentCount;
        tempSegmentData.length = segmentCount;

        if (this.intersection_) {
          for (let j = 0, jj = segments.length; j < jj; ++j) {
            const segment = segments[j];
            if (segment.length === 1) {
              continue;
            }
            const extent = tempExtents[j];
            // Calculate intersections with own segments
            for (let k = 0, kk = segments.length; k < kk; ++k) {
              if (j === k || j - 1 === k || j + 1 === k) {
                // Exclude self and neighbours
                continue;
              }
              const otherSegment = segments[k];
              if (!intersectsExtent(extent, tempExtents[k])) {
                continue;
              }
              const intersection = getIntersectionPoint(segment, otherSegment);
              if (!intersection) {
                continue;
              }
              const intersectionSegment = [intersection];
              tempExtents[segmentCount] = boundingExtent(intersectionSegment);
              tempSegmentData[segmentCount++] = {
                feature,
                segment: intersectionSegment,
                isIntersection: true,
              };
            }
            // Calculate intersections with existing segments
            const otherSegments = this.rBush_.getInExtent(tempExtents[j]);
            for (const {segment: otherSegment} of otherSegments) {
              if (otherSegment.length === 1) {
                continue;
              }
              const intersection = getIntersectionPoint(segment, otherSegment);
              if (!intersection) {
                continue;
              }
              const intersectionSegment = [intersection];
              tempExtents[segmentCount] = boundingExtent(intersectionSegment);
              tempSegmentData[segmentCount++] = {
                feature,
                segment: intersectionSegment,
                isIntersection: true,
              };
            }
          }
        }

        if (segmentCount === 1) {
          this.rBush_.insert(tempExtents[0], tempSegmentData[0]);
        } else {
          this.rBush_.load(tempExtents, tempSegmentData);
        }
      }
    }

    if (register) {
      this.featureChangeListenerKeys_[feature_uid] = listen(
        feature,
        EventType.CHANGE,
        this.handleFeatureChange_,
        this,
      );
    }
  }

  /**
   * @return {import("../Collection.js").default<import("../Feature.js").default>|Array<import("../Feature.js").default>} Features.
   * @private
   */
  getFeatures_() {
    /** @type {import("../Collection.js").default<import("../Feature.js").default>|Array<import("../Feature.js").default>} */
    let features;
    if (this.features_) {
      features = this.features_;
    } else if (this.source_) {
      features = this.source_.getFeatures();
    }
    return features;
  }

  /**
   * Checks if two snap data sets are equal.
   * Compares the segment and the feature.
   *
   * @param {SnappedInfo} data1 The first snap data set.
   * @param {SnappedInfo} data2 The second snap data set.
   * @return {boolean} `true` if the data sets are equal, otherwise `false`.
   * @private
   */
  areSnapDataEqual_(data1, data2) {
    return data1.segment === data2.segment && data1.feature === data2.feature;
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} evt Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   * @override
   */
  handleEvent(evt) {
    const result = this.snapTo(evt.pixel, evt.coordinate, evt.map);

    if (result) {
      evt.coordinate = result.vertex.slice(0, 2);
      evt.pixel = result.vertexPixel;

      // Dispatch UNSNAP event if already snapped
      if (this.snapped_ && !this.areSnapDataEqual_(this.snapped_, result)) {
        this.dispatchEvent(new SnapEvent(SnapEventType.UNSNAP, this.snapped_));
      }

      this.snapped_ = {
        vertex: evt.coordinate,
        vertexPixel: evt.pixel,
        feature: result.feature,
        segment: result.segment,
      };
      this.dispatchEvent(new SnapEvent(SnapEventType.SNAP, this.snapped_));
    } else if (this.snapped_) {
      // Dispatch UNSNAP event if no longer snapped
      this.dispatchEvent(new SnapEvent(SnapEventType.UNSNAP, this.snapped_));
      this.snapped_ = null;
    }

    return super.handleEvent(evt);
  }

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent|import("../Collection.js").CollectionEvent<import("../Feature.js").default>} evt Event.
   * @private
   */
  handleFeatureAdd_(evt) {
    const feature = getFeatureFromEvent(evt);
    if (feature) {
      this.addFeature(feature);
    }
  }

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent|import("../Collection.js").CollectionEvent<import("../Feature.js").default>} evt Event.
   * @private
   */
  handleFeatureRemove_(evt) {
    const feature = getFeatureFromEvent(evt);
    if (feature) {
      this.removeFeature(feature);
    }
  }

  /**
   * @param {import("../events/Event.js").default} evt Event.
   * @private
   */
  handleFeatureChange_(evt) {
    const feature = /** @type {import("../Feature.js").default} */ (evt.target);
    if (this.handlingDownUpSequence) {
      const uid = getUid(feature);
      if (!(uid in this.pendingFeatures_)) {
        this.pendingFeatures_[uid] = feature;
      }
    } else {
      this.updateFeature_(feature);
    }
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleUpEvent(evt) {
    const featuresToUpdate = Object.values(this.pendingFeatures_);
    if (featuresToUpdate.length) {
      for (const feature of featuresToUpdate) {
        this.updateFeature_(feature);
      }
    }
    return false;
  }

  /**
   * Remove a feature from the collection of features that we may snap to.
   * @param {import("../Feature.js").default} feature Feature
   * @param {boolean} [unlisten] Whether to unlisten to the feature change
   *     or not. Defaults to `true`.
   * @api
   */
  removeFeature(feature, unlisten) {
    const unregister = unlisten !== undefined ? unlisten : true;
    const feature_uid = getUid(feature);
    const extent = this.indexedFeaturesExtents_[feature_uid];
    if (extent) {
      const rBush = this.rBush_;
      const nodesToRemove = [];
      rBush.forEachInExtent(extent, function (node) {
        if (feature === node.feature) {
          nodesToRemove.push(node);
        }
      });
      for (let i = nodesToRemove.length - 1; i >= 0; --i) {
        rBush.remove(nodesToRemove[i]);
      }
    }

    if (unregister) {
      unlistenByKey(this.featureChangeListenerKeys_[feature_uid]);
      delete this.featureChangeListenerKeys_[feature_uid];
    }
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default} map Map.
   * @override
   */
  setMap(map) {
    const currentMap = this.getMap();
    const keys = this.featuresListenerKeys_;
    let features = this.getFeatures_();
    if (!Array.isArray(features)) {
      features = features.getArray();
    }

    if (currentMap) {
      keys.forEach(unlistenByKey);
      keys.length = 0;
      this.rBush_.clear();
      Object.values(this.featureChangeListenerKeys_).forEach(unlistenByKey);
      this.featureChangeListenerKeys_ = {};
    }
    super.setMap(map);

    if (map) {
      if (this.features_) {
        keys.push(
          listen(
            this.features_,
            CollectionEventType.ADD,
            this.handleFeatureAdd_,
            this,
          ),
          listen(
            this.features_,
            CollectionEventType.REMOVE,
            this.handleFeatureRemove_,
            this,
          ),
        );
      } else if (this.source_) {
        keys.push(
          listen(
            this.source_,
            VectorEventType.ADDFEATURE,
            this.handleFeatureAdd_,
            this,
          ),
          listen(
            this.source_,
            VectorEventType.REMOVEFEATURE,
            this.handleFeatureRemove_,
            this,
          ),
        );
      }
      for (const feature of features) {
        this.addFeature(feature);
      }
    }
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../coordinate.js").Coordinate} pixelCoordinate Coordinate
   * @param {import("../Map.js").default} map Map.
   * @return {SnappedInfo|null} Snap result
   */
  snapTo(pixel, pixelCoordinate, map) {
    const projection = map.getView().getProjection();
    const projectedCoordinate = fromUserCoordinate(pixelCoordinate, projection);

    const box = toUserExtent(
      buffer(
        boundingExtent([projectedCoordinate]),
        map.getView().getResolution() * this.pixelTolerance_,
      ),
      projection,
    );

    const segments = this.rBush_.getInExtent(box);
    const segmentsLength = segments.length;
    if (segmentsLength === 0) {
      return null;
    }

    let closestVertex;
    let minSquaredDistance = Infinity;
    let closestFeature;
    let closestSegment = null;
    let isIntersection;

    const squaredPixelTolerance = this.pixelTolerance_ * this.pixelTolerance_;
    const getResult = () => {
      if (closestVertex) {
        const vertexPixel = map.getPixelFromCoordinate(closestVertex);
        const squaredPixelDistance = squaredDistance(pixel, vertexPixel);
        if (
          squaredPixelDistance <= squaredPixelTolerance &&
          ((isIntersection && this.intersection_) ||
            (!isIntersection && (this.vertex_ || this.edge_)))
        ) {
          return {
            vertex: closestVertex,
            vertexPixel: [
              Math.round(vertexPixel[0]),
              Math.round(vertexPixel[1]),
            ],
            feature: closestFeature,
            segment: closestSegment,
          };
        }
      }
      return null;
    };

    if (this.vertex_ || this.intersection_) {
      for (let i = 0; i < segmentsLength; ++i) {
        const segmentData = segments[i];
        if (segmentData.feature.getGeometry().getType() !== 'Circle') {
          for (const vertex of segmentData.segment) {
            const tempVertexCoord = fromUserCoordinate(vertex, projection);
            const delta = squaredDistance(projectedCoordinate, tempVertexCoord);
            if (delta < minSquaredDistance) {
              closestVertex = vertex;
              minSquaredDistance = delta;
              closestFeature = segmentData.feature;
              isIntersection = segmentData.isIntersection;
            }
          }
        }
      }
      const result = getResult();
      if (result) {
        return result;
      }
    }

    if (this.edge_) {
      for (let i = 0; i < segmentsLength; ++i) {
        let vertex = null;
        const segmentData = segments[i];
        if (segmentData.feature.getGeometry().getType() === 'Circle') {
          let circleGeometry = segmentData.feature.getGeometry();
          const userProjection = getUserProjection();
          if (userProjection) {
            circleGeometry = circleGeometry
              .clone()
              .transform(userProjection, projection);
          }
          vertex = closestOnCircle(
            projectedCoordinate,
            /** @type {import("../geom/Circle.js").default} */ (circleGeometry),
          );
        } else {
          const [segmentStart, segmentEnd] = segmentData.segment;
          // points have only one coordinate
          if (segmentEnd) {
            tempSegment[0] = fromUserCoordinate(segmentStart, projection);
            tempSegment[1] = fromUserCoordinate(segmentEnd, projection);
            vertex = closestOnSegment(projectedCoordinate, tempSegment);
          }
        }
        if (vertex) {
          const delta = squaredDistance(projectedCoordinate, vertex);
          if (delta < minSquaredDistance) {
            closestVertex = toUserCoordinate(vertex, projection);
            closestSegment =
              segmentData.feature.getGeometry().getType() === 'Circle'
                ? null
                : segmentData.segment;
            minSquaredDistance = delta;
            closestFeature = segmentData.feature;
          }
        }
      }

      const result = getResult();
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * @param {import("../Feature.js").default} feature Feature
   * @private
   */
  updateFeature_(feature) {
    this.removeFeature(feature, false);
    this.addFeature(feature, false);
  }
}

export default Snap;
