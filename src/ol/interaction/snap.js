import _ol_ from '../index';
import _ol_Collection_ from '../collection';
import _ol_CollectionEventType_ from '../collectioneventtype';
import _ol_coordinate_ from '../coordinate';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_functions_ from '../functions';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_interaction_Pointer_ from '../interaction/pointer';
import _ol_obj_ from '../obj';
import _ol_source_Vector_ from '../source/vector';
import _ol_source_VectorEventType_ from '../source/vectoreventtype';
import _ol_structs_RBush_ from '../structs/rbush';

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
var _ol_interaction_Snap_ = function(opt_options) {

  _ol_interaction_Pointer_.call(this, {
    handleEvent: _ol_interaction_Snap_.handleEvent_,
    handleDownEvent: _ol_functions_.TRUE,
    handleUpEvent: _ol_interaction_Snap_.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

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
  this.sortByDistance_ = _ol_interaction_Snap_.sortByDistance.bind(this);


  /**
  * Segment RTree for each layer
  * @type {ol.structs.RBush.<ol.SnapSegmentDataType>}
  * @private
  */
  this.rBush_ = new _ol_structs_RBush_();


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

_ol_.inherits(_ol_interaction_Snap_, _ol_interaction_Pointer_);


/**
 * Add a feature to the collection of features that we may snap to.
 * @param {ol.Feature} feature Feature.
 * @param {boolean=} opt_listen Whether to listen to the feature change or not
 *     Defaults to `true`.
 * @api
 */
_ol_interaction_Snap_.prototype.addFeature = function(feature, opt_listen) {
  var listen = opt_listen !== undefined ? opt_listen : true;
  var feature_uid = _ol_.getUid(feature);
  var geometry = feature.getGeometry();
  if (geometry) {
    var segmentWriter = this.SEGMENT_WRITERS_[geometry.getType()];
    if (segmentWriter) {
      this.indexedFeaturesExtents_[feature_uid] = geometry.getExtent(
          _ol_extent_.createEmpty());
      segmentWriter.call(this, feature, geometry);
    }
  }

  if (listen) {
    this.featureChangeListenerKeys_[feature_uid] = _ol_events_.listen(
        feature,
        _ol_events_EventType_.CHANGE,
        this.handleFeatureChange_, this);
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_interaction_Snap_.prototype.forEachFeatureAdd_ = function(feature) {
  this.addFeature(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @private
 */
_ol_interaction_Snap_.prototype.forEachFeatureRemove_ = function(feature) {
  this.removeFeature(feature);
};


/**
 * @return {ol.Collection.<ol.Feature>|Array.<ol.Feature>} Features.
 * @private
 */
_ol_interaction_Snap_.prototype.getFeatures_ = function() {
  var features;
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
_ol_interaction_Snap_.prototype.handleFeatureAdd_ = function(evt) {
  var feature;
  if (evt instanceof _ol_source_Vector_.Event) {
    feature = evt.feature;
  } else if (evt instanceof _ol_Collection_.Event) {
    feature = evt.element;
  }
  this.addFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.source.Vector.Event|ol.Collection.Event} evt Event.
 * @private
 */
_ol_interaction_Snap_.prototype.handleFeatureRemove_ = function(evt) {
  var feature;
  if (evt instanceof _ol_source_Vector_.Event) {
    feature = evt.feature;
  } else if (evt instanceof _ol_Collection_.Event) {
    feature = evt.element;
  }
  this.removeFeature(/** @type {ol.Feature} */ (feature));
};


/**
 * @param {ol.events.Event} evt Event.
 * @private
 */
_ol_interaction_Snap_.prototype.handleFeatureChange_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.target);
  if (this.handlingDownUpSequence) {
    var uid = _ol_.getUid(feature);
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
_ol_interaction_Snap_.prototype.removeFeature = function(feature, opt_unlisten) {
  var unlisten = opt_unlisten !== undefined ? opt_unlisten : true;
  var feature_uid = _ol_.getUid(feature);
  var extent = this.indexedFeaturesExtents_[feature_uid];
  if (extent) {
    var rBush = this.rBush_;
    var i, nodesToRemove = [];
    rBush.forEachInExtent(extent, function(node) {
      if (feature === node.feature) {
        nodesToRemove.push(node);
      }
    });
    for (i = nodesToRemove.length - 1; i >= 0; --i) {
      rBush.remove(nodesToRemove[i]);
    }
  }

  if (unlisten) {
    _ol_events_.unlistenByKey(this.featureChangeListenerKeys_[feature_uid]);
    delete this.featureChangeListenerKeys_[feature_uid];
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_Snap_.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var keys = this.featuresListenerKeys_;
  var features = this.getFeatures_();

  if (currentMap) {
    keys.forEach(_ol_events_.unlistenByKey);
    keys.length = 0;
    features.forEach(this.forEachFeatureRemove_, this);
  }
  _ol_interaction_Pointer_.prototype.setMap.call(this, map);

  if (map) {
    if (this.features_) {
      keys.push(
          _ol_events_.listen(this.features_, _ol_CollectionEventType_.ADD,
              this.handleFeatureAdd_, this),
          _ol_events_.listen(this.features_, _ol_CollectionEventType_.REMOVE,
              this.handleFeatureRemove_, this)
      );
    } else if (this.source_) {
      keys.push(
          _ol_events_.listen(this.source_, _ol_source_VectorEventType_.ADDFEATURE,
              this.handleFeatureAdd_, this),
          _ol_events_.listen(this.source_, _ol_source_VectorEventType_.REMOVEFEATURE,
              this.handleFeatureRemove_, this)
      );
    }
    features.forEach(this.forEachFeatureAdd_, this);
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_Snap_.prototype.shouldStopEvent = _ol_functions_.FALSE;


/**
 * @param {ol.Pixel} pixel Pixel
 * @param {ol.Coordinate} pixelCoordinate Coordinate
 * @param {ol.PluggableMap} map Map.
 * @return {ol.SnapResultType} Snap result
 */
_ol_interaction_Snap_.prototype.snapTo = function(pixel, pixelCoordinate, map) {

  var lowerLeft = map.getCoordinateFromPixel(
      [pixel[0] - this.pixelTolerance_, pixel[1] + this.pixelTolerance_]);
  var upperRight = map.getCoordinateFromPixel(
      [pixel[0] + this.pixelTolerance_, pixel[1] - this.pixelTolerance_]);
  var box = _ol_extent_.boundingExtent([lowerLeft, upperRight]);

  var segments = this.rBush_.getInExtent(box);

  // If snapping on vertices only, don't consider circles
  if (this.vertex_ && !this.edge_) {
    segments = segments.filter(function(segment) {
      return segment.feature.getGeometry().getType() !==
          _ol_geom_GeometryType_.CIRCLE;
    });
  }

  var snappedToVertex = false;
  var snapped = false;
  var vertex = null;
  var vertexPixel = null;
  var dist, pixel1, pixel2, squaredDist1, squaredDist2;
  if (segments.length > 0) {
    this.pixelCoordinate_ = pixelCoordinate;
    segments.sort(this.sortByDistance_);
    var closestSegment = segments[0].segment;
    var isCircle = segments[0].feature.getGeometry().getType() ===
        _ol_geom_GeometryType_.CIRCLE;
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
_ol_interaction_Snap_.prototype.updateFeature_ = function(feature) {
  this.removeFeature(feature, false);
  this.addFeature(feature, false);
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Circle} geometry Geometry.
 * @private
 */
_ol_interaction_Snap_.prototype.writeCircleGeometry_ = function(feature, geometry) {
  var polygon = _ol_geom_Polygon_.fromCircle(geometry);
  var coordinates = polygon.getCoordinates()[0];
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.SnapSegmentDataType} */ ({
      feature: feature,
      segment: segment
    });
    this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.GeometryCollection} geometry Geometry.
 * @private
 */
_ol_interaction_Snap_.prototype.writeGeometryCollectionGeometry_ = function(feature, geometry) {
  var i, geometries = geometry.getGeometriesArray();
  for (i = 0; i < geometries.length; ++i) {
    var segmentWriter = this.SEGMENT_WRITERS_[geometries[i].getType()];
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
_ol_interaction_Snap_.prototype.writeLineStringGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var i, ii, segment, segmentData;
  for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    segment = coordinates.slice(i, i + 2);
    segmentData = /** @type {ol.SnapSegmentDataType} */ ({
      feature: feature,
      segment: segment
    });
    this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiLineString} geometry Geometry.
 * @private
 */
_ol_interaction_Snap_.prototype.writeMultiLineStringGeometry_ = function(feature, geometry) {
  var lines = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = lines.length; j < jj; ++j) {
    coordinates = lines[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.SnapSegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.MultiPoint} geometry Geometry.
 * @private
 */
_ol_interaction_Snap_.prototype.writeMultiPointGeometry_ = function(feature, geometry) {
  var points = geometry.getCoordinates();
  var coordinates, i, ii, segmentData;
  for (i = 0, ii = points.length; i < ii; ++i) {
    coordinates = points[i];
    segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
_ol_interaction_Snap_.prototype.writeMultiPolygonGeometry_ = function(feature, geometry) {
  var polygons = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, k, kk, rings, segment, segmentData;
  for (k = 0, kk = polygons.length; k < kk; ++k) {
    rings = polygons[k];
    for (j = 0, jj = rings.length; j < jj; ++j) {
      coordinates = rings[j];
      for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        segment = coordinates.slice(i, i + 2);
        segmentData = /** @type {ol.SnapSegmentDataType} */ ({
          feature: feature,
          segment: segment
        });
        this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
      }
    }
  }
};


/**
 * @param {ol.Feature} feature Feature
 * @param {ol.geom.Point} geometry Geometry.
 * @private
 */
_ol_interaction_Snap_.prototype.writePointGeometry_ = function(feature, geometry) {
  var coordinates = geometry.getCoordinates();
  var segmentData = /** @type {ol.SnapSegmentDataType} */ ({
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
_ol_interaction_Snap_.prototype.writePolygonGeometry_ = function(feature, geometry) {
  var rings = geometry.getCoordinates();
  var coordinates, i, ii, j, jj, segment, segmentData;
  for (j = 0, jj = rings.length; j < jj; ++j) {
    coordinates = rings[j];
    for (i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      segment = coordinates.slice(i, i + 2);
      segmentData = /** @type {ol.SnapSegmentDataType} */ ({
        feature: feature,
        segment: segment
      });
      this.rBush_.insert(_ol_extent_.boundingExtent(segment), segmentData);
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
_ol_interaction_Snap_.handleEvent_ = function(evt) {
  var result = this.snapTo(evt.pixel, evt.coordinate, evt.map);
  if (result.snapped) {
    evt.coordinate = result.vertex.slice(0, 2);
    evt.pixel = result.vertexPixel;
  }
  return _ol_interaction_Pointer_.handleEvent.call(this, evt);
};


/**
 * @param {ol.MapBrowserPointerEvent} evt Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Snap}
 * @private
 */
_ol_interaction_Snap_.handleUpEvent_ = function(evt) {
  var featuresToUpdate = _ol_obj_.getValues(this.pendingFeatures_);
  if (featuresToUpdate.length) {
    featuresToUpdate.forEach(this.updateFeature_, this);
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
_ol_interaction_Snap_.sortByDistance = function(a, b) {
  return _ol_coordinate_.squaredDistanceToSegment(
      this.pixelCoordinate_, a.segment) -
      _ol_coordinate_.squaredDistanceToSegment(
          this.pixelCoordinate_, b.segment);
};
export default _ol_interaction_Snap_;
