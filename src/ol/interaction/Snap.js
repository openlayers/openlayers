/**
 * @module ol/interaction/Snap
 */
import CollectionEventType from '../CollectionEventType.js';
import EventType from '../events/EventType.js';
import PointerInteraction from './Pointer.js';
import RBush from '../structs/RBush.js';
import VectorEventType from '../source/VectorEventType.js';
import {FALSE, TRUE} from '../functions.js';
import {SnapEvent, SnapEventType} from '../events/SnapEvent.js';
import {boundingExtent, buffer, createEmpty} from '../extent.js';
import {
  closestOnCircle,
  closestOnSegment,
  squaredDistance,
} from '../coordinate.js';
import {fromCircle} from '../geom/Polygon.js';
import {
  fromUserCoordinate,
  getUserProjection,
  toUserCoordinate,
  toUserExtent,
} from '../proj.js';
import {getUid} from '../util.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {Object} Result
 * @property {import("../coordinate.js").Coordinate|null} vertex Vertex.
 * @property {import("../pixel.js").Pixel|null} vertexPixel VertexPixel.
 * @property {import("../Feature.js").default|null} feature Feature.
 * @property {Array<import("../coordinate.js").Coordinate>|null} segment Segment, or `null` if snapped to a vertex.
 */

/**
 * @typedef {Object} SegmentData
 * @property {import("../Feature.js").default} feature Feature.
 * @property {Array<import("../coordinate.js").Coordinate>} segment Segment.
 */

/**
 * @typedef {Object} Options
 * @property {import("../Collection.js").default<import("../Feature.js").default>} [features] Snap to these features. Either this option or source should be provided.
 * @property {boolean} [edge=true] Snap to edges.
 * @property {boolean} [vertex=true] Snap to vertices.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for snapping.
 * @property {import("../source/Vector.js").default} [source] Snap to features from this source. Either this option or features should be provided
 */

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

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'snap', SnapEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'snap', Return>} SnapOnSignature
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
 * properties to force the snap to occur to any interaction that them.
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
     * @const
     * @private
     * @type {Object<string, function(Array<Array<import('../coordinate.js').Coordinate>>, import("../geom/Geometry.js").default): void>}
     */
    this.GEOMETRY_SEGMENTERS_ = {
      'Point': this.segmentPointGeometry_.bind(this),
      'LineString': this.segmentLineStringGeometry_.bind(this),
      'LinearRing': this.segmentLineStringGeometry_.bind(this),
      'Polygon': this.segmentPolygonGeometry_.bind(this),
      'MultiPoint': this.segmentMultiPointGeometry_.bind(this),
      'MultiLineString': this.segmentMultiLineStringGeometry_.bind(this),
      'MultiPolygon': this.segmentMultiPolygonGeometry_.bind(this),
      'GeometryCollection': this.segmentGeometryCollectionGeometry_.bind(this),
      'Circle': this.segmentCircleGeometry_.bind(this),
    };
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
      const segmenter = this.GEOMETRY_SEGMENTERS_[geometry.getType()];
      if (segmenter) {
        this.indexedFeaturesExtents_[feature_uid] = geometry.getExtent(
          createEmpty()
        );
        const segments =
          /** @type {Array<Array<import('../coordinate.js').Coordinate>>} */ ([]);
        segmenter(segments, geometry);
        if (segments.length === 1) {
          this.rBush_.insert(boundingExtent(segments[0]), {
            feature: feature,
            segment: segments[0],
          });
        } else if (segments.length > 1) {
          const extents = segments.map((s) => boundingExtent(s));
          const segmentsData = segments.map((segment) => ({
            feature: feature,
            segment: segment,
          }));
          this.rBush_.load(extents, segmentsData);
        }
      }
    }

    if (register) {
      this.featureChangeListenerKeys_[feature_uid] = listen(
        feature,
        EventType.CHANGE,
        this.handleFeatureChange_,
        this
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
   * @param {import("../MapBrowserEvent.js").default} evt Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   */
  handleEvent(evt) {
    const result = this.snapTo(evt.pixel, evt.coordinate, evt.map);
    if (result) {
      evt.coordinate = result.vertex.slice(0, 2);
      evt.pixel = result.vertexPixel;
      this.dispatchEvent(
        new SnapEvent(SnapEventType.SNAP, {
          vertex: evt.coordinate,
          vertexPixel: evt.pixel,
          feature: result.feature,
          segment: result.segment,
        })
      );
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
   */
  handleUpEvent(evt) {
    const featuresToUpdate = Object.values(this.pendingFeatures_);
    if (featuresToUpdate.length) {
      featuresToUpdate.forEach(this.updateFeature_.bind(this));
      this.pendingFeatures_ = {};
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
   */
  setMap(map) {
    const currentMap = this.getMap();
    const keys = this.featuresListenerKeys_;
    const features = /** @type {Array<import("../Feature.js").default>} */ (
      this.getFeatures_()
    );

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
            this
          ),
          listen(
            this.features_,
            CollectionEventType.REMOVE,
            this.handleFeatureRemove_,
            this
          )
        );
      } else if (this.source_) {
        keys.push(
          listen(
            this.source_,
            VectorEventType.ADDFEATURE,
            this.handleFeatureAdd_,
            this
          ),
          listen(
            this.source_,
            VectorEventType.REMOVEFEATURE,
            this.handleFeatureRemove_,
            this
          )
        );
      }
      features.forEach((feature) => this.addFeature(feature));
    }
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../coordinate.js").Coordinate} pixelCoordinate Coordinate
   * @param {import("../Map.js").default} map Map.
   * @return {Result|null} Snap result
   */
  snapTo(pixel, pixelCoordinate, map) {
    const projection = map.getView().getProjection();
    const projectedCoordinate = fromUserCoordinate(pixelCoordinate, projection);

    const box = toUserExtent(
      buffer(
        boundingExtent([projectedCoordinate]),
        map.getView().getResolution() * this.pixelTolerance_
      ),
      projection
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

    const squaredPixelTolerance = this.pixelTolerance_ * this.pixelTolerance_;
    const getResult = () => {
      if (closestVertex) {
        const vertexPixel = map.getPixelFromCoordinate(closestVertex);
        const squaredPixelDistance = squaredDistance(pixel, vertexPixel);
        if (squaredPixelDistance <= squaredPixelTolerance) {
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

    if (this.vertex_) {
      for (let i = 0; i < segmentsLength; ++i) {
        const segmentData = segments[i];
        if (segmentData.feature.getGeometry().getType() !== 'Circle') {
          segmentData.segment.forEach((vertex) => {
            const tempVertexCoord = fromUserCoordinate(vertex, projection);
            const delta = squaredDistance(projectedCoordinate, tempVertexCoord);
            if (delta < minSquaredDistance) {
              closestVertex = vertex;
              minSquaredDistance = delta;
              closestFeature = segmentData.feature;
            }
          });
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
            /** @type {import("../geom/Circle.js").default} */ (circleGeometry)
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

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/Circle.js").default} geometry Geometry.
   * @private
   */
  segmentCircleGeometry_(segments, geometry) {
    const projection = this.getMap().getView().getProjection();
    let circleGeometry = geometry;
    const userProjection = getUserProjection();
    if (userProjection) {
      circleGeometry = /** @type {import("../geom/Circle.js").default} */ (
        circleGeometry.clone().transform(userProjection, projection)
      );
    }
    const polygon = fromCircle(circleGeometry);
    if (userProjection) {
      polygon.transform(projection, userProjection);
    }
    const coordinates = polygon.getCoordinates()[0];
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segments.push(coordinates.slice(i, i + 2));
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
   * @private
   */
  segmentGeometryCollectionGeometry_(segments, geometry) {
    const geometries = geometry.getGeometriesArray();
    for (let i = 0; i < geometries.length; ++i) {
      const segmenter = this.GEOMETRY_SEGMENTERS_[geometries[i].getType()];
      if (segmenter) {
        segmenter(segments, geometries[i]);
      }
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/LineString.js").default} geometry Geometry.
   * @private
   */
  segmentLineStringGeometry_(segments, geometry) {
    const coordinates = geometry.getCoordinates();
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segments.push(coordinates.slice(i, i + 2));
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
   * @private
   */
  segmentMultiLineStringGeometry_(segments, geometry) {
    const lines = geometry.getCoordinates();
    for (let j = 0, jj = lines.length; j < jj; ++j) {
      const coordinates = lines[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segments.push(coordinates.slice(i, i + 2));
      }
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
   * @private
   */
  segmentMultiPointGeometry_(segments, geometry) {
    geometry.getCoordinates().forEach((point) => {
      segments.push([point]);
    });
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
   * @private
   */
  segmentMultiPolygonGeometry_(segments, geometry) {
    const polygons = geometry.getCoordinates();
    for (let k = 0, kk = polygons.length; k < kk; ++k) {
      const rings = polygons[k];
      for (let j = 0, jj = rings.length; j < jj; ++j) {
        const coordinates = rings[j];
        for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
          segments.push(coordinates.slice(i, i + 2));
        }
      }
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/Point.js").default} geometry Geometry.
   * @private
   */
  segmentPointGeometry_(segments, geometry) {
    segments.push([geometry.getCoordinates()]);
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} segments Segments
   * @param {import("../geom/Polygon.js").default} geometry Geometry.
   * @private
   */
  segmentPolygonGeometry_(segments, geometry) {
    const rings = geometry.getCoordinates();
    for (let j = 0, jj = rings.length; j < jj; ++j) {
      const coordinates = rings[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segments.push(coordinates.slice(i, i + 2));
      }
    }
  }
}

export default Snap;
