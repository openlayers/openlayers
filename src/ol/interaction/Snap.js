/**
 * @module ol/interaction/Snap
 */
import {getUid, inherits} from '../index.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import _ol_coordinate_ from '../coordinate.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {boundingExtent, createEmpty} from '../extent.js';
import {TRUE, FALSE} from '../functions.js';
import GeometryType from '../geom/GeometryType.js';
import {fromCircle} from '../geom/Polygon.js';
import PointerInteraction from '../interaction/Pointer.js';
import {getValues} from '../obj.js';
import VectorSource from '../source/Vector.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';

/**
 * @classdesc
 * Handles snapping of vector features while modifying or drawing them.  The
 * features can come from a {@link ol.source.Vector} or {@link ol.Collection}
 * Any interaction object that allows the user to interact
 * with the features using the mouse can benefit from the snapping, as long
 * as it is added before.
 *
 * The snap interaction modifies map browser event `coordinate` and `pixel`
 * properties to force the snap to occur to any interaction that them.
 *
 * Example:
 *
 *     var snap = new ol.interaction.Snap({
 *       source: source
 *     });
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.SnapOptions=} opt_options Options.
 * @api
 */
const Snap = function(opt_options) {

  PointerInteraction.call(this, {
    handleEvent: Snap.handleEvent_,
    handleDownEvent: TRUE,
    handleUpEvent: Snap.handleUpEvent_
  });

  const options = opt_options ? opt_options : {};

  /**
   * @type {ol.source.Vector}
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
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features ? options.features : null;

  /**
   * @type {Array.<ol.EventsKey>}
   * @private
   */
  this.featuresListenerKeys_ = [];

  /**
   * @type {Object.<number, ol.EventsKey>}
   * @private
   */
  this.featureChangeListenerKeys_ = {};

  /**
   * Extents are preserved so indexed segment can be quickly removed
   * when its feature geometry changes
   * @type {Object.<number, ol.Extent>}
   * @private
   */
  this.indexedFeaturesExtents_ = {};

  /**
   * If a feature geometry changes while a pointer drag|move event occurs, the
   * feature doesn't get updated right away.  It will be at the next 'pointerup'
   * event fired.
   * @type {Object.<number, ol.Feature>}
   * @private
   */
  this.pendingFeatures_ = {};

  /**
   * Used for distance sorting in sortByDistance_
   * @type {ol.Coordinate}
   * @private
   */
  this.pixelCoordinate_ = null;

  /**
   * @type {number}
   * @private
   */
  this.pixelTolerance_ = options.pixelTolerance !== undefined ?
    options.pixelTolerance : 10;

  /**
   * @type {function(ol.SnapSegmentDataType, ol.SnapSegmentDataType): number}
   * @private
   */
  this.sortByDistance_ = Snap.sortByDistance.bind(this);


  /**
  * Segment RTree for each layer
  * @type {ol.structs.RBush.<ol.SnapSegmentDataType>}
  * @private
  */
  this.rBush_ = new RBush();


  /**
  * @const
  * @private
  * @type {Object.<string, function(ol.Feature, ol.geom.Geometry)>}
  */
  this.SEGMENT_WRITERS_ = {
    'Point': this.writePointGeometry_,
    'LineString': this.writeLineStringGeometry_,
    'LinearRing': this.writeLineStringGeometry_,
    'Polygon': this.writePolygonGeometry_,
    'MultiPoint': this.writeMultiPointGeometry_,
    'MultiLineString': this.writeMultiLineStringGeometry_,
    'MultiPolygon': this.writeMultiPolygonGeometry_,
    'GeometryCollection': this.writeGeometryCollectionGeometry_,
    'Circle': this.writeCircleGeometry_
  };
};

inherits(Snap, PointerInteraction);


/**
 * Add a feature to the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature.
 * @param {boolean=} opt_listen Whether to listen to the feature change or not
 *     Defaults to `true`.
 * @api
 */
Snap.prototype.addFeature = function(feature, opt_listen) {
  const register = opt_listen !== undefined ? opt_listen : true;
  const feature_uid = getUid(feature);
  const geometry = feature.getGeometry();
  if (geometry) {
    const segmentWriter = this.SEGMENT_WRITERS_[geometry.getType()];
    if (segmentWriter) {
      this.indexedFeaturesExtents_[feature_uid] = geometry.getExtent(createEmpty());
      segmentWriter.call(this, feature, geometry);
    }
  }

  if (register) {
    this.featureChangeListenerKeys_[feature_uid] = listen(
      feature,
      EventType.CHANGE,
      this.handleFeatureChange_, this);
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
Snap.prototype.forEachFeatureAdd_ = function(feature) {
  this.addFeature(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
Snap.prototype.forEachFeatureRemove_ = function(feature) {
  this.removeFeature(feature);
};


/**
 * @return {ol.Collection.<ol.Feature>|Array.<ol.Feature>} Features.
 * @private
 */
Snap.prototype.getFeatures_ = function() {
  let features;
  if (this.features_) {
    features = this.features_;
  } else if (this.source_) {
    features = this.source_.getFeatures();
  }
  return /** @type {!Array.<ol.Feature>|!ol.Collection.<ol.Feature>} */ (features);
};


/**
 * @param {ol.source.Vector.Event|ol.Collection.Event} evt Event.
 * @private
 */
Snap.prototype.handleFeatureAdd_ = function(evt) {
  let feature;
  if (evt instanceof VectorSource.Event) {
    feature = evt.feature;
  } else if (evt instanceof Collection.Event) {
    feature = evt.element;
  }
  this.addFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.source.Vector.Event|ol.Collection.Event} evt Event.
 * @private
 */
Snap.prototype.handleFeatureRemove_ = function(evt) {
  let feature;
  if (evt instanceof VectorSource.Event) {
    feature = evt.feature;
  } else if (evt instanceof Collection.Event) {
    feature = evt.element;
  }
  this.removeFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
Snap.prototype.handleFeatureChange_ = function(evt) {
  const feature = /** @type {ol.Feature} */ (evt.target);
  if (this.handlingDownUpSequence) {
    const uid = getUid(feature);
    if (!(uid in this.pendingFeatures_)) {
      this.pendingFeatures_[uid] = feature;
    }
  } else {
    this.updateFeature_(feature);
  }
};


/**
 * Remove a feature from the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature
 * @param {boolean=} opt_unlisten Whether to unlisten to the feature change
 *     or not. Defaults to `true`.
 * @api
 */
Snap.prototype.removeFeature = function(feature, opt_unlisten) {
  const unregister = opt_unlisten !== undefined ? opt_unlisten : true;
  const feature_uid = getUid(feature);
  const extent = this.indexedFeaturesExtents_[feature_uid];
  if (extent) {
    const rBush = this.rBush_;
    const nodesToRemove = [];
    rBush.forEachInExtent(extent, function(node) {
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
};


/**
 * @inheritDoc
 */
Snap.prototype.setMap = function(map) {
  const currentMap = this.getMap();
  const keys = this.featuresListenerKeys_;
  const features = this.getFeatures_();

  if (currentMap) {
    keys.forEach(unlistenByKey);
    keys.length = 0;
    features.forEach(this.forEachFeatureRemove_.bind(this));
  }
  PointerInteraction.prototype.setMap.call(this, map);

  if (map) {
    if (this.features_) {
      keys.push(
        listen(this.features_, CollectionEventType.ADD,
          this.handleFeatureAdd_, this),
        listen(this.features_, CollectionEventType.REMOVE,
          this.handleFeatureRemove_, this)
      );
    } else if (this.source_) {
      keys.push(
        listen(this.source_, VectorEventType.ADDFEATURE,
          this.handleFeatureAdd_, this),
        listen(this.source_, VectorEventType.REMOVEFEATURE,
          this.handleFeatureRemove_, this)
      );
    }
    features.forEach(this.forEachFeatureAdd_.bind(this));
  }
};


/**
 * @inheritDoc
 */
Snap.prototype.shouldStopEvent = FALSE;


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Coordinate} pixelCoordinate Coordinate
 * @param {ol.PluggableMap} map Map.
 * @return {ol.SnapResultType} Snap result
 */
Snap.prototype.snapTo = function(pixel, pixelCoordinate, map) {

  const lowerLeft = map.getCoordinateFromPixel(
    [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  const upperRight = map.getCoordinateFromPixel(
    [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  const box = boundingExtent([lowerLeft, upperRight]);

  let segments = this.rBush_.getInExtent(box);

  // If snapping on vertices only, don't consider circles
  if (this.vertex_ && !this.edge_) {
    segments = segments.filter(function(segment) {
      return segment.feature.getGeometry().getType() !==
          GeometryType.CIRCLE;
    });
  }

  let snappedToVertex = false;
  let snapped = false;
  let vertex = null;
  let vertexPixel = null;
  let dist, pixel1, pixel2, squaredDist1, squaredDist2;
  if (segments.length > 0) {
    this.pixelCoordinate_ = pixelCoordinate;
    segments.sort(this.sortByDistance_);
    const closestSegment = segments[0].segment;
    const isCircle = segments[0].feature.getGeometry().getType() ===
        GeometryType.CIRCLE;
    if (this.vertex_ && !this.edge_) {
      pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
      pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
      squaredDist1 = _ol_coordinate_.squaredDistance(pixel, pixel1);
      squaredDist2 = _ol_coordinate_.squaredDistance(pixel, pixel2);
      dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
      snappedToVertex = dist <= this.pixelTolerance_;
      if (snappedToVertex) {
        snapped = true;
        vertex = squaredDist1 > squaredDist2 ?
          closestSegment[1] : closestSegment[0];
        vertexPixel = map.getPixelFromCoordinate(vertex);
      }
    } else if (this.edge_) {
      if (isCircle) {
        vertex = _ol_coordinate_.closestOnCircle(pixelCoordinate,
          /** @type {ol.geom.Circle} */ (segments[0].feature.getGeometry()));
      } else {
        vertex = (_ol_coordinate_.closestOnSegment(pixelCoordinate,
          closestSegment));
      }
      vertexPixel = map.getPixelFromCoordinate(vertex);
      if (_ol_coordinate_.distance(pixel, vertexPixel) <= this.pixelTolerance_) {
        snapped = true;
        if (this.vertex_ && !isCircle) {
          pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          squaredDist1 = _ol_coordinate_.squaredDistance(vertexPixel, pixel1);
          squaredDist2 = _ol_coordinate_.squaredDistance(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          snappedToVertex = dist <= this.pixelTolerance_;
          if (snappedToVertex) {
            vertex = squaredDist1 > squaredDist2 ?
              closestSegment[1] : closestSegment[0];
            vertexPixel = map.getPixelFromCoordinate(vertex);
          }
        }
      }
    }
    if (snapped) {
      vertexPixel = [Math.round(vertexPixel[0]), Math.round(vertexPixel[1])];
    }
  }
  return /** @type {ol.SnapResultType} */ ({
    snapped: snapped,
    vertex: vertex,
    vertexPixel: vertexPixel
  });
};


/**
 * @param {ol.Feature} feature Feature
 * @private
 */
Snap.prototype.updateFeature_ = function(feature) {
  this.removeFeature(feature, false);
  this.addFeature(feature, false);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Circle} geometry Geometry.
 * @private
 */
Snap.prototype.writeCircleGeometry_ = function(feature, geometry) {
  const polygon = fromCircle(geometry);
  const coordinates = polygon.getCoordinates()[0];
  for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    const segment = coordinates.slice(i, i + 2);
    const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
      feature: feature,
      segment: segment
    });
    this.rBush_.insert(boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
Snap.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
  const geometries = geometry.getGeometriesArray();
  for (let i = 0; i < geometries.length; ++i) {
    const segmentWriter = this.SEGMENT_WRITERS_[geometries[i].getType()];
    if (segmentWriter) {
      segmentWriter.call(this, feature, geometries[i]);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.LineString} geometry Geometry.
 * @private
 */
Snap.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    const segment = coordinates.slice(i, i + 2);
    const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
      feature: feature,
      segment: segment
    });
    this.rBush_.insert(boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @private
 */
Snap.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  const lines = geometry.getCoordinates();
  for (let j = 0, jj = lines.length; j < jj; ++j) {
    const coordinates = lines[j];
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2);
      const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
Snap.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  const points = geometry.getCoordinates();
  for (let i = 0, ii = points.length; i < ii; ++i) {
    const coordinates = points[i];
    const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
      feature: feature,
      segment: [coordinates, coordinates]
    });
    this.rBush_.insert(geometry.getExtent(), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPolygon} geometry Geometry.
 * @private
 */
Snap.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  const polygons = geometry.getCoordinates();
  for (let k = 0, kk = polygons.length; k < kk; ++k) {
    const rings = polygons[k];
    for (let j = 0, jj = rings.length; j < jj; ++j) {
      const coordinates = rings[j];
      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const segment = coordinates.slice(i, i + 2);
        const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
          feature: feature,
          segment: segment
        });
        this.rBush_.insert(boundingExtent(segment), segmentData);
      }
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
Snap.prototype.writePointGeometry_ = function(feature, geometry) {
  const coordinates = geometry.getCoordinates();
  const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
    feature: feature,
    segment: [coordinates, coordinates]
  });
  this.rBush_.insert(geometry.getExtent(), segmentData);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Polygon} geometry Geometry.
 * @private
 */
Snap.prototype.writePolygonGeometry_ = function(feature, geometry) {
  const rings = geometry.getCoordinates();
  for (let j = 0, jj = rings.length; j < jj; ++j) {
    const coordinates = rings[j];
    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      const segment = coordinates.slice(i, i + 2);
      const segmentData = /** @type {ol.SnapSegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(boundingExtent(segment), segmentData);
    }
  }
};


/**
 * Handle all pointer events events.
 * @param {ol.MapBrowserEvent} evt A move event.
 * @return {boolean} Pass the event to other interactions.
 * @this {ol.interaction.Snap}
 * @private
 */
Snap.handleEvent_ = function(evt) {
  const result = this.snapTo(evt.pixel, evt.coordinate, evt.map);
  if (result.snapped) {
    evt.coordinate = result.vertex.slice(0, 2);
    evt.pixel = result.vertexPixel;
  }
  return PointerInteraction.handleEvent.call(this, evt);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Snap}
 * @private
 */
Snap.handleUpEvent_ = function(evt) {
  const featuresToUpdate = getValues(this.pendingFeatures_);
  if (featuresToUpdate.length) {
    featuresToUpdate.forEach(this.updateFeature_.bind(this));
    this.pendingFeatures_ = {};
  }
  return false;
};


/**
 * Sort segments by distance, helper function
 * @param {ol.SnapSegmentDataType} a The first segment data.
 * @param {ol.SnapSegmentDataType} b The second segment data.
 * @return {number} The difference in distance.
 * @this {ol.interaction.Snap}
 */
Snap.sortByDistance = function(a, b) {
  return _ol_coordinate_.squaredDistanceToSegment(
    this.pixelCoordinate_, a.segment) -
      _ol_coordinate_.squaredDistanceToSegment(
        this.pixelCoordinate_, b.segment);
};
export default Snap;
