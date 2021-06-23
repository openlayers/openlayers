/**
 * @module ol/interaction/Modify
 */
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import Feature from '../Feature.js';
import GeometryType from '../geom/GeometryType.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import Point from '../geom/Point.js';
import PointerInteraction from './Pointer.js';
import RBush from '../structs/RBush.js';
import VectorEventType from '../source/VectorEventType.js';
import VectorLayer from '../layer/Vector.js';
import VectorSource from '../source/Vector.js';
import {
  altKeyOnly,
  always,
  primaryAction,
  singleClick,
} from '../events/condition.js';
import {
  boundingExtent,
  buffer as bufferExtent,
  createOrUpdateFromCoordinate as createExtent,
} from '../extent.js';
import {
  closestOnSegment,
  distance as coordinateDistance,
  equals as coordinatesEqual,
  squaredDistance as squaredCoordinateDistance,
  squaredDistanceToSegment,
} from '../coordinate.js';
import {createEditingStyle} from '../style/Style.js';
import {equals, includes} from '../array.js';
import {fromCircle} from '../geom/Polygon.js';
import {
  fromUserCoordinate,
  fromUserExtent,
  getUserProjection,
  toUserCoordinate,
  toUserExtent,
} from '../proj.js';
import {getUid} from '../util.js';

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
  MODIFYEND: 'modifyend',
};

/**
 * @typedef {Object} SegmentData
 * @property {Array<number>} [depth] Depth.
 * @property {import("../Feature").FeatureLike} feature Feature.
 * @property {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @property {number} [index] Index.
 * @property {Array<Array<number>>} segment Segment.
 * @property {Array<SegmentData>} [featureSegments] FeatureSegments.
 */

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event will be considered to add or move a
 * vertex to the sketch. Default is
 * {@link module:ol/events/condition.primaryAction}.
 * @property {import("../events/condition.js").Condition} [deleteCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. By default,
 * {@link module:ol/events/condition.singleClick} with
 * {@link module:ol/events/condition.altKeyOnly} results in a vertex deletion.
 * @property {import("../events/condition.js").Condition} [insertVertexCondition] A
 * function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether a new vertex should be added to the sketch
 * features. Default is {@link module:ol/events/condition.always}.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {import("../style/Style.js").StyleLike} [style]
 * Style used for the modification point or vertex. For linestrings and polygons, this will
 * be the affected vertex, for circles a point along the circle, and for points the actual
 * point. If not configured, the default edit style is used (see {@link module:ol/style}).
 * When using a style function, the point feature passed to the function will have a `features`
 * property - an array whose entries are the features that are being modified, and a `geometries`
 * property - an array whose entries are the geometries that are being modified. Both arrays are
 * in the same order. The `geometries` are only useful when modifying geometry collections, where
 * the geometry will be the particular geometry from the collection that is being modified.
 * @property {VectorSource} [source] The vector source with
 * features to modify.  If a vector source is not provided, a feature collection
 * must be provided with the `features` option.
 * @property {boolean|import("../layer/BaseVector").default} [hitDetection] When configured, point
 * features will be considered for modification based on their visual appearance, instead of being within
 * the `pixelTolerance` from the pointer location. When a {@link module:ol/layer/BaseVector} is
 * provided, only the rendered representation of the features on that layer will be considered.
 * @property {Collection<Feature>} [features]
 * The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the `source` option.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 * @property {boolean} [snapToPointer=!hitDetection] The vertex, point or segment being modified snaps to the
 * pointer coordinate when clicked within the `pixelTolerance`.
 */

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Modify~Modify} instances are
 * instances of this type.
 */
export class ModifyEvent extends Event {
  /**
   * @param {ModifyEventType} type Type.
   * @param {Collection<import("../Feature").FeatureLike>} features
   * The features modified.
   * @param {import("../MapBrowserEvent.js").default} MapBrowserEvent
   * Associated {@link module:ol/MapBrowserEvent}.
   */
  constructor(type, features, MapBrowserEvent) {
    super(type);

    /**
     * The features being modified.
     * @type {Collection<import("../Feature").FeatureLike>}
     * @api
     */
    this.features = features;

    /**
     * Associated {@link module:ol/MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = MapBrowserEvent;
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
 * Cartesian distance from the pointer is used to determine the features that
 * will be modified. This means that geometries will only be considered for
 * modification when they are within the configured `pixelTolerane`. For point
 * geometries, the `hitDetection` option can be used to match their visual
 * appearance.
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

    /***
     * @type {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default> &
     *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
     *     'change:active', import("../Object").ObjectEvent> &
     *   import("../Observable").OnSignature<'modifyend'|'modifystart', ModifyEvent> &
     *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
     *     'change:active'|'modifyend'|'modifystart'>}
     */
    this.on;

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
    this.defaultDeleteCondition_ = function (mapBrowserEvent) {
      return altKeyOnly(mapBrowserEvent) && singleClick(mapBrowserEvent);
    };

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.deleteCondition_ = options.deleteCondition
      ? options.deleteCondition
      : this.defaultDeleteCondition_;

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.insertVertexCondition_ = options.insertVertexCondition
      ? options.insertVertexCondition
      : always;

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
     * @type {Collection<import("../Feature").FeatureLike>}
     * @private
     */
    this.featuresBeingModified_ = null;

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
    this.pixelTolerance_ =
      options.pixelTolerance !== undefined ? options.pixelTolerance : 10;

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
        wrapX: !!options.wrapX,
      }),
      style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
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
      'GeometryCollection': this.writeGeometryCollectionGeometry_.bind(this),
    };

    /**
     * @type {VectorSource}
     * @private
     */
    this.source_ = null;

    /**
     * @type {boolean|import("../layer/BaseVector").default}
     */
    this.hitDetection_ = null;

    let features;
    if (options.features) {
      features = options.features;
    } else if (options.source) {
      this.source_ = options.source;
      features = new Collection(this.source_.getFeatures());
      this.source_.addEventListener(
        VectorEventType.ADDFEATURE,
        this.handleSourceAdd_.bind(this)
      );
      this.source_.addEventListener(
        VectorEventType.REMOVEFEATURE,
        this.handleSourceRemove_.bind(this)
      );
    }
    if (!features) {
      throw new Error(
        'The modify interaction requires features, a source or a layer'
      );
    }
    if (options.hitDetection) {
      this.hitDetection_ = options.hitDetection;
    }

    /**
     * @type {Collection<import("../Feature.js").FeatureLike>}
     * @private
     */
    this.features_ = features;

    this.features_.forEach(this.addFeature_.bind(this));
    this.features_.addEventListener(
      CollectionEventType.ADD,
      this.handleFeatureAdd_.bind(this)
    );
    this.features_.addEventListener(
      CollectionEventType.REMOVE,
      this.handleFeatureRemove_.bind(this)
    );

    /**
     * @type {import("../MapBrowserEvent.js").default}
     * @private
     */
    this.lastPointerEvent_ = null;

    /**
     * Delta (x, y in map units) between matched rtree vertex and pointer vertex.
     * @type {Array<number>}
     */
    this.delta_ = [0, 0];

    /**
     * @private
     */
    this.snapToPointer_ =
      options.snapToPointer === undefined
        ? !this.hitDetection_
        : options.snapToPointer;
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
   * @param {import("../MapBrowserEvent.js").default} evt Map browser event.
   * @param {Array<Array<SegmentData>>} segments The segments subject to modification.
   * @private
   */
  willModifyFeatures_(evt, segments) {
    if (!this.featuresBeingModified_) {
      this.featuresBeingModified_ = new Collection();
      const features = this.featuresBeingModified_.getArray();
      for (let i = 0, ii = segments.length; i < ii; ++i) {
        const segment = segments[i];
        for (let s = 0, ss = segment.length; s < ss; ++s) {
          const feature = segment[s].feature;
          if (feature && features.indexOf(feature) === -1) {
            this.featuresBeingModified_.push(feature);
          }
        }
      }
      if (this.featuresBeingModified_.getLength() === 0) {
        this.featuresBeingModified_ = null;
      } else {
        this.dispatchEvent(
          new ModifyEvent(
            ModifyEventType.MODIFYSTART,
            this.featuresBeingModified_,
            evt
          )
        );
      }
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
    feature.removeEventListener(
      EventType.CHANGE,
      this.boundHandleFeatureChange_
    );
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
      function (node) {
        if (feature === node.feature) {
          nodesToRemove.push(node);
        }
      }
    );
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
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  setActive(active) {
    if (this.vertexFeature_ && !active) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
    super.setActive(active);
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   */
  setMap(map) {
    this.overlay_.setMap(map);
    super.setMap(map);
  }

  /**
   * Get the overlay layer that this interaction renders the modification point or vertex to.
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
      segment: [coordinates, coordinates],
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
        segment: [coordinates, coordinates],
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
        segment: segment,
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
          segment: segment,
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
          segment: segment,
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
            segment: segment,
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
      segment: [coordinates, coordinates],
    };

    /** @type {SegmentData} */
    const circumferenceSegmentData = {
      feature: feature,
      geometry: geometry,
      index: CIRCLE_CIRCUMFERENCE_INDEX,
      segment: [coordinates, coordinates],
    };

    const featureSegments = [centerSegmentData, circumferenceSegmentData];
    centerSegmentData.featureSegments = featureSegments;
    circumferenceSegmentData.featureSegments = featureSegments;
    this.rBush_.insert(createExtent(coordinates), centerSegmentData);
    let circleGeometry = /** @type {import("../geom/Geometry.js").default} */ (
      geometry
    );
    const userProjection = getUserProjection();
    if (userProjection && this.getMap()) {
      const projection = this.getMap().getView().getProjection();
      circleGeometry = circleGeometry
        .clone()
        .transform(userProjection, projection);
      circleGeometry = fromCircle(
        /** @type {import("../geom/Circle.js").default} */ (circleGeometry)
      ).transform(projection, userProjection);
    }
    this.rBush_.insert(circleGeometry.getExtent(), circumferenceSegmentData);
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
   * @param {Array<import("../Feature").FeatureLike>} features The features being modified.
   * @param {Array<import("../geom/SimpleGeometry.js").default>} geometries The geometries being modified.
   * @return {Feature} Vertex feature.
   * @private
   */
  createOrUpdateVertexFeature_(coordinates, features, geometries) {
    let vertexFeature = this.vertexFeature_;
    if (!vertexFeature) {
      vertexFeature = new Feature(new Point(coordinates));
      this.vertexFeature_ = vertexFeature;
      this.overlay_.getSource().addFeature(vertexFeature);
    } else {
      const geometry = vertexFeature.getGeometry();
      geometry.setCoordinates(coordinates);
    }
    vertexFeature.set('features', features);
    vertexFeature.set('geometries', geometries);
    return vertexFeature;
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may modify the geometry.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   */
  handleEvent(mapBrowserEvent) {
    if (!mapBrowserEvent.originalEvent) {
      return true;
    }
    this.lastPointerEvent_ = mapBrowserEvent;

    let handled;
    if (
      !mapBrowserEvent.map.getView().getInteracting() &&
      mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE &&
      !this.handlingDownUpSequence
    ) {
      this.handlePointerMove_(mapBrowserEvent);
    }
    if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
      if (
        mapBrowserEvent.type != MapBrowserEventType.SINGLECLICK ||
        !this.ignoreNextSingleClick_
      ) {
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
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   */
  handleDragEvent(evt) {
    this.ignoreNextSingleClick_ = false;
    this.willModifyFeatures_(evt, this.dragSegments_);

    const vertex = [
      evt.coordinate[0] + this.delta_[0],
      evt.coordinate[1] + this.delta_[1],
    ];
    const features = [];
    const geometries = [];
    for (let i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
      const dragSegment = this.dragSegments_[i];
      const segmentData = dragSegment[0];
      const feature = segmentData.feature;
      if (features.indexOf(feature) === -1) {
        features.push(feature);
      }
      const geometry = segmentData.geometry;
      if (geometries.indexOf(geometry) === -1) {
        geometries.push(geometry);
      }
      const depth = segmentData.depth;
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
          } else {
            // We're dragging the circle's circumference:
            this.changingFeature_ = true;
            const projection = evt.map.getView().getProjection();
            let radius = coordinateDistance(
              fromUserCoordinate(geometry.getCenter(), projection),
              fromUserCoordinate(vertex, projection)
            );
            const userProjection = getUserProjection();
            if (userProjection) {
              const circleGeometry = geometry
                .clone()
                .transform(userProjection, projection);
              circleGeometry.setRadius(radius);
              radius = circleGeometry
                .transform(projection, userProjection)
                .getRadius();
            }
            geometry.setRadius(radius);
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
    this.createOrUpdateVertexFeature_(vertex, features, geometries);
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @return {boolean} If the event was consumed.
   */
  handleDownEvent(evt) {
    if (!this.condition_(evt)) {
      return false;
    }
    const pixelCoordinate = evt.coordinate;
    this.handlePointerAtPixel_(evt.pixel, evt.map, pixelCoordinate);
    this.dragSegments_.length = 0;
    this.featuresBeingModified_ = null;
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
        let uid = getUid(segmentDataMatch.geometry);
        const depth = segmentDataMatch.depth;
        if (depth) {
          uid += '-' + depth.join('-'); // separate feature components
        }
        if (!componentSegments[uid]) {
          componentSegments[uid] = new Array(2);
        }

        if (
          segmentDataMatch.geometry.getType() === GeometryType.CIRCLE &&
          segmentDataMatch.index === CIRCLE_CIRCUMFERENCE_INDEX
        ) {
          const closestVertex = closestOnSegmentData(
            pixelCoordinate,
            segmentDataMatch,
            projection
          );
          if (
            coordinatesEqual(closestVertex, vertex) &&
            !componentSegments[uid][0]
          ) {
            this.dragSegments_.push([segmentDataMatch, 0]);
            componentSegments[uid][0] = segmentDataMatch;
          }
          continue;
        }

        if (
          coordinatesEqual(segment[0], vertex) &&
          !componentSegments[uid][0]
        ) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
          continue;
        }

        if (
          coordinatesEqual(segment[1], vertex) &&
          !componentSegments[uid][1]
        ) {
          // prevent dragging closed linestrings by the connecting node
          if (
            (segmentDataMatch.geometry.getType() === GeometryType.LINE_STRING ||
              segmentDataMatch.geometry.getType() ===
                GeometryType.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0
          ) {
            continue;
          }

          this.dragSegments_.push([segmentDataMatch, 1]);
          componentSegments[uid][1] = segmentDataMatch;
          continue;
        }

        if (
          getUid(segment) in this.vertexSegments_ &&
          !componentSegments[uid][0] &&
          !componentSegments[uid][1] &&
          this.insertVertexCondition_(evt)
        ) {
          insertVertices.push(segmentDataMatch);
        }
      }

      if (insertVertices.length) {
        this.willModifyFeatures_(evt, [insertVertices]);
      }

      for (let j = insertVertices.length - 1; j >= 0; --j) {
        this.insertVertex_(insertVertices[j], vertex);
      }
    }
    return !!this.vertexFeature_;
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @return {boolean} If the event was consumed.
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
        let circleGeometry = geometry;
        const userProjection = getUserProjection();
        if (userProjection) {
          const projection = evt.map.getView().getProjection();
          circleGeometry = circleGeometry
            .clone()
            .transform(userProjection, projection);
          circleGeometry = fromCircle(circleGeometry).transform(
            projection,
            userProjection
          );
        }
        this.rBush_.update(
          circleGeometry.getExtent(),
          circumferenceSegmentData
        );
      } else {
        this.rBush_.update(boundingExtent(segmentData.segment), segmentData);
      }
    }
    if (this.featuresBeingModified_) {
      this.dispatchEvent(
        new ModifyEvent(
          ModifyEventType.MODIFYEND,
          this.featuresBeingModified_,
          evt
        )
      );
      this.featuresBeingModified_ = null;
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
   * @param {import("../coordinate.js").Coordinate} [opt_coordinate] The pixel Coordinate.
   * @private
   */
  handlePointerAtPixel_(pixel, map, opt_coordinate) {
    const pixelCoordinate = opt_coordinate || map.getCoordinateFromPixel(pixel);
    const projection = map.getView().getProjection();
    const sortByDistance = function (a, b) {
      return (
        projectedDistanceToSegmentDataSquared(pixelCoordinate, a, projection) -
        projectedDistanceToSegmentDataSquared(pixelCoordinate, b, projection)
      );
    };

    /** @type {Array<SegmentData>|undefined} */
    let nodes;
    let hitPointGeometry;
    if (this.hitDetection_) {
      const layerFilter =
        typeof this.hitDetection_ === 'object'
          ? (layer) => layer === this.hitDetection_
          : undefined;
      map.forEachFeatureAtPixel(
        pixel,
        (feature, layer, geometry) => {
          geometry = geometry || feature.getGeometry();
          if (
            geometry.getType() === GeometryType.POINT &&
            includes(this.features_.getArray(), feature)
          ) {
            hitPointGeometry = geometry;
            const coordinate = geometry.getFlatCoordinates().slice(0, 2);
            nodes = [
              {
                feature,
                geometry,
                segment: [coordinate, coordinate],
              },
            ];
          }
          return true;
        },
        {layerFilter}
      );
    }
    if (!nodes) {
      const viewExtent = fromUserExtent(
        createExtent(pixelCoordinate, tempExtent),
        projection
      );
      const buffer = map.getView().getResolution() * this.pixelTolerance_;
      const box = toUserExtent(
        bufferExtent(viewExtent, buffer, tempExtent),
        projection
      );
      nodes = this.rBush_.getInExtent(box);
    }

    if (nodes && nodes.length > 0) {
      const node = nodes.sort(sortByDistance)[0];
      const closestSegment = node.segment;
      let vertex = closestOnSegmentData(pixelCoordinate, node, projection);
      const vertexPixel = map.getPixelFromCoordinate(vertex);
      let dist = coordinateDistance(pixel, vertexPixel);
      if (hitPointGeometry || dist <= this.pixelTolerance_) {
        /** @type {Object<string, boolean>} */
        const vertexSegments = {};
        vertexSegments[getUid(closestSegment)] = true;

        if (!this.snapToPointer_) {
          this.delta_[0] = vertex[0] - pixelCoordinate[0];
          this.delta_[1] = vertex[1] - pixelCoordinate[1];
        }
        if (
          node.geometry.getType() === GeometryType.CIRCLE &&
          node.index === CIRCLE_CIRCUMFERENCE_INDEX
        ) {
          this.snappedToVertex_ = true;
          this.createOrUpdateVertexFeature_(
            vertex,
            [node.feature],
            [node.geometry]
          );
        } else {
          const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
          const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          this.snappedToVertex_ = dist <= this.pixelTolerance_;
          if (this.snappedToVertex_) {
            vertex =
              squaredDist1 > squaredDist2
                ? closestSegment[1]
                : closestSegment[0];
          }
          this.createOrUpdateVertexFeature_(
            vertex,
            [node.feature],
            [node.geometry]
          );
          const geometries = {};
          geometries[getUid(node.geometry)] = true;
          for (let i = 1, ii = nodes.length; i < ii; ++i) {
            const segment = nodes[i].segment;
            if (
              (coordinatesEqual(closestSegment[0], segment[0]) &&
                coordinatesEqual(closestSegment[1], segment[1])) ||
              (coordinatesEqual(closestSegment[0], segment[1]) &&
                coordinatesEqual(closestSegment[1], segment[0]))
            ) {
              const geometryUid = getUid(nodes[i].geometry);
              if (!(geometryUid in geometries)) {
                geometries[geometryUid] = true;
                vertexSegments[getUid(segment)] = true;
              }
            } else {
              break;
            }
          }
        }

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
      index: index,
    };

    rTree.insert(boundingExtent(newSegmentData.segment), newSegmentData);
    this.dragSegments_.push([newSegmentData, 1]);

    /** @type {SegmentData} */
    const newSegmentData2 = {
      segment: [vertex, segment[1]],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index + 1,
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
    if (
      this.lastPointerEvent_ &&
      this.lastPointerEvent_.type != MapBrowserEventType.POINTERDRAG
    ) {
      const evt = this.lastPointerEvent_;
      this.willModifyFeatures_(evt, this.dragSegments_);
      const removed = this.removeVertex_();
      this.dispatchEvent(
        new ModifyEvent(
          ModifyEventType.MODIFYEND,
          this.featuresBeingModified_,
          evt
        )
      );
      this.featuresBeingModified_ = null;
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
            segment: segments,
          };

          this.rBush_.insert(
            boundingExtent(newSegmentData.segment),
            newSegmentData
          );
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
    this.rBush_.forEachInExtent(
      geometry.getExtent(),
      function (segmentDataMatch) {
        if (
          segmentDataMatch.geometry === geometry &&
          (depth === undefined ||
            segmentDataMatch.depth === undefined ||
            equals(segmentDataMatch.depth, depth)) &&
          segmentDataMatch.index > index
        ) {
          segmentDataMatch.index += delta;
        }
      }
    );
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
function projectedDistanceToSegmentDataSquared(
  pointCoordinates,
  segmentData,
  projection
) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE) {
    let circleGeometry = /** @type {import("../geom/Circle.js").default} */ (
      geometry
    );

    if (segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
      const userProjection = getUserProjection();
      if (userProjection) {
        circleGeometry = /** @type {import("../geom/Circle.js").default} */ (
          circleGeometry.clone().transform(userProjection, projection)
        );
      }
      const distanceToCenterSquared = squaredCoordinateDistance(
        circleGeometry.getCenter(),
        fromUserCoordinate(pointCoordinates, projection)
      );
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

  if (
    geometry.getType() === GeometryType.CIRCLE &&
    segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX
  ) {
    let circleGeometry = /** @type {import("../geom/Circle.js").default} */ (
      geometry
    );
    const userProjection = getUserProjection();
    if (userProjection) {
      circleGeometry = /** @type {import("../geom/Circle.js").default} */ (
        circleGeometry.clone().transform(userProjection, projection)
      );
    }
    return toUserCoordinate(
      circleGeometry.getClosestPoint(
        fromUserCoordinate(pointCoordinates, projection)
      ),
      projection
    );
  }
  const coordinate = fromUserCoordinate(pointCoordinates, projection);
  tempSegment[0] = fromUserCoordinate(segmentData.segment[0], projection);
  tempSegment[1] = fromUserCoordinate(segmentData.segment[1], projection);
  return toUserCoordinate(
    closestOnSegment(coordinate, tempSegment),
    projection
  );
}

/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const style = createEditingStyle();
  return function (feature, resolution) {
    return style[GeometryType.POINT];
  };
}

export default Modify;
