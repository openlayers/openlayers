// FIXME bulk feature upload - suppress events
// FIXME make change-detection more refined (notably, geometry hint)

import _ol_ from '../index';
import _ol_Collection_ from '../collection';
import _ol_CollectionEventType_ from '../collectioneventtype';
import _ol_ObjectEventType_ from '../objecteventtype';
import _ol_array_ from '../array';
import _ol_asserts_ from '../asserts';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_featureloader_ from '../featureloader';
import _ol_functions_ from '../functions';
import _ol_loadingstrategy_ from '../loadingstrategy';
import _ol_obj_ from '../obj';
import _ol_source_Source_ from '../source/source';
import _ol_source_State_ from '../source/state';
import _ol_source_VectorEventType_ from '../source/vectoreventtype';
import _ol_structs_RBush_ from '../structs/rbush';

/**
 * @classdesc
 * Provides a source of features for vector layers. Vector features provided
 * by this source are suitable for editing. See {@link ol.source.VectorTile} for
 * vector data that is optimized for rendering.
 *
 * @constructor
 * @extends {ol.source.Source}
 * @fires ol.source.Vector.Event
 * @param {olx.source.VectorOptions=} opt_options Vector source options.
 * @api
 */
var _ol_source_Vector_ = function(opt_options) {

  var options = opt_options || {};

  _ol_source_Source_.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: undefined,
    state: _ol_source_State_.READY,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

  /**
   * @private
   * @type {ol.FeatureLoader}
   */
  this.loader_ = _ol_.nullFunction;

  /**
   * @private
   * @type {ol.format.Feature|undefined}
   */
  this.format_ = options.format;

  /**
   * @private
   * @type {boolean}
   */
  this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

  /**
   * @private
   * @type {string|ol.FeatureUrlFunction|undefined}
   */
  this.url_ = options.url;

  if (options.loader !== undefined) {
    this.loader_ = options.loader;
  } else if (this.url_ !== undefined) {
    _ol_asserts_.assert(this.format_, 7); // `format` must be set when `url` is set
    // create a XHR feature loader for "url" and "format"
    this.loader_ = _ol_featureloader_.xhr(this.url_, /** @type {ol.format.Feature} */ (this.format_));
  }

  /**
   * @private
   * @type {ol.LoadingStrategy}
   */
  this.strategy_ = options.strategy !== undefined ? options.strategy :
    _ol_loadingstrategy_.all;

  var useSpatialIndex =
      options.useSpatialIndex !== undefined ? options.useSpatialIndex : true;

  /**
   * @private
   * @type {ol.structs.RBush.<ol.Feature>}
   */
  this.featuresRtree_ = useSpatialIndex ? new _ol_structs_RBush_() : null;

  /**
   * @private
   * @type {ol.structs.RBush.<{extent: ol.Extent}>}
   */
  this.loadedExtentsRtree_ = new _ol_structs_RBush_();

  /**
   * @private
   * @type {Object.<string, ol.Feature>}
   */
  this.nullGeometryFeatures_ = {};

  /**
   * A lookup of features by id (the return from feature.getId()).
   * @private
   * @type {Object.<string, ol.Feature>}
   */
  this.idIndex_ = {};

  /**
   * A lookup of features without id (keyed by ol.getUid(feature)).
   * @private
   * @type {Object.<string, ol.Feature>}
   */
  this.undefIdIndex_ = {};

  /**
   * @private
   * @type {Object.<string, Array.<ol.EventsKey>>}
   */
  this.featureChangeKeys_ = {};

  /**
   * @private
   * @type {ol.Collection.<ol.Feature>}
   */
  this.featuresCollection_ = null;

  var collection, features;
  if (options.features instanceof _ol_Collection_) {
    collection = options.features;
    features = collection.getArray();
  } else if (Array.isArray(options.features)) {
    features = options.features;
  }
  if (!useSpatialIndex && collection === undefined) {
    collection = new _ol_Collection_(features);
  }
  if (features !== undefined) {
    this.addFeaturesInternal(features);
  }
  if (collection !== undefined) {
    this.bindFeaturesCollection_(collection);
  }

};

_ol_.inherits(_ol_source_Vector_, _ol_source_Source_);


/**
 * Add a single feature to the source.  If you want to add a batch of features
 * at once, call {@link ol.source.Vector#addFeatures source.addFeatures()}
 * instead. A feature will not be added to the source if feature with
 * the same id is already there. The reason for this behavior is to avoid
 * feature duplication when using bbox or tile loading strategies.
 * @param {ol.Feature} feature Feature to add.
 * @api
 */
_ol_source_Vector_.prototype.addFeature = function(feature) {
  this.addFeatureInternal(feature);
  this.changed();
};


/**
 * Add a feature without firing a `change` event.
 * @param {ol.Feature} feature Feature.
 * @protected
 */
_ol_source_Vector_.prototype.addFeatureInternal = function(feature) {
  var featureKey = _ol_.getUid(feature).toString();

  if (!this.addToIndex_(featureKey, feature)) {
    return;
  }

  this.setupChangeEvents_(featureKey, feature);

  var geometry = feature.getGeometry();
  if (geometry) {
    var extent = geometry.getExtent();
    if (this.featuresRtree_) {
      this.featuresRtree_.insert(extent, feature);
    }
  } else {
    this.nullGeometryFeatures_[featureKey] = feature;
  }

  this.dispatchEvent(
      new _ol_source_Vector_.Event(_ol_source_VectorEventType_.ADDFEATURE, feature));
};


/**
 * @param {string} featureKey Unique identifier for the feature.
 * @param {ol.Feature} feature The feature.
 * @private
 */
_ol_source_Vector_.prototype.setupChangeEvents_ = function(featureKey, feature) {
  this.featureChangeKeys_[featureKey] = [
    _ol_events_.listen(feature, _ol_events_EventType_.CHANGE,
        this.handleFeatureChange_, this),
    _ol_events_.listen(feature, _ol_ObjectEventType_.PROPERTYCHANGE,
        this.handleFeatureChange_, this)
  ];
};


/**
 * @param {string} featureKey Unique identifier for the feature.
 * @param {ol.Feature} feature The feature.
 * @return {boolean} The feature is "valid", in the sense that it is also a
 *     candidate for insertion into the Rtree.
 * @private
 */
_ol_source_Vector_.prototype.addToIndex_ = function(featureKey, feature) {
  var valid = true;
  var id = feature.getId();
  if (id !== undefined) {
    if (!(id.toString() in this.idIndex_)) {
      this.idIndex_[id.toString()] = feature;
    } else {
      valid = false;
    }
  } else {
    _ol_asserts_.assert(!(featureKey in this.undefIdIndex_),
        30); // The passed `feature` was already added to the source
    this.undefIdIndex_[featureKey] = feature;
  }
  return valid;
};


/**
 * Add a batch of features to the source.
 * @param {Array.<ol.Feature>} features Features to add.
 * @api
 */
_ol_source_Vector_.prototype.addFeatures = function(features) {
  this.addFeaturesInternal(features);
  this.changed();
};


/**
 * Add features without firing a `change` event.
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 */
_ol_source_Vector_.prototype.addFeaturesInternal = function(features) {
  var featureKey, i, length, feature;

  var extents = [];
  var newFeatures = [];
  var geometryFeatures = [];

  for (i = 0, length = features.length; i < length; i++) {
    feature = features[i];
    featureKey = _ol_.getUid(feature).toString();
    if (this.addToIndex_(featureKey, feature)) {
      newFeatures.push(feature);
    }
  }

  for (i = 0, length = newFeatures.length; i < length; i++) {
    feature = newFeatures[i];
    featureKey = _ol_.getUid(feature).toString();
    this.setupChangeEvents_(featureKey, feature);

    var geometry = feature.getGeometry();
    if (geometry) {
      var extent = geometry.getExtent();
      extents.push(extent);
      geometryFeatures.push(feature);
    } else {
      this.nullGeometryFeatures_[featureKey] = feature;
    }
  }
  if (this.featuresRtree_) {
    this.featuresRtree_.load(extents, geometryFeatures);
  }

  for (i = 0, length = newFeatures.length; i < length; i++) {
    this.dispatchEvent(new _ol_source_Vector_.Event(
        _ol_source_VectorEventType_.ADDFEATURE, newFeatures[i]));
  }
};


/**
 * @param {!ol.Collection.<ol.Feature>} collection Collection.
 * @private
 */
_ol_source_Vector_.prototype.bindFeaturesCollection_ = function(collection) {
  var modifyingCollection = false;
  _ol_events_.listen(this, _ol_source_VectorEventType_.ADDFEATURE,
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          collection.push(evt.feature);
          modifyingCollection = false;
        }
      });
  _ol_events_.listen(this, _ol_source_VectorEventType_.REMOVEFEATURE,
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          collection.remove(evt.feature);
          modifyingCollection = false;
        }
      });
  _ol_events_.listen(collection, _ol_CollectionEventType_.ADD,
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          this.addFeature(/** @type {ol.Feature} */ (evt.element));
          modifyingCollection = false;
        }
      }, this);
  _ol_events_.listen(collection, _ol_CollectionEventType_.REMOVE,
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          this.removeFeature(/** @type {ol.Feature} */ (evt.element));
          modifyingCollection = false;
        }
      }, this);
  this.featuresCollection_ = collection;
};


/**
 * Remove all features from the source.
 * @param {boolean=} opt_fast Skip dispatching of {@link removefeature} events.
 * @api
 */
_ol_source_Vector_.prototype.clear = function(opt_fast) {
  if (opt_fast) {
    for (var featureId in this.featureChangeKeys_) {
      var keys = this.featureChangeKeys_[featureId];
      keys.forEach(_ol_events_.unlistenByKey);
    }
    if (!this.featuresCollection_) {
      this.featureChangeKeys_ = {};
      this.idIndex_ = {};
      this.undefIdIndex_ = {};
    }
  } else {
    if (this.featuresRtree_) {
      this.featuresRtree_.forEach(this.removeFeatureInternal, this);
      for (var id in this.nullGeometryFeatures_) {
        this.removeFeatureInternal(this.nullGeometryFeatures_[id]);
      }
    }
  }
  if (this.featuresCollection_) {
    this.featuresCollection_.clear();
  }

  if (this.featuresRtree_) {
    this.featuresRtree_.clear();
  }
  this.loadedExtentsRtree_.clear();
  this.nullGeometryFeatures_ = {};

  var clearEvent = new _ol_source_Vector_.Event(_ol_source_VectorEventType_.CLEAR);
  this.dispatchEvent(clearEvent);
  this.changed();
};


/**
 * Iterate through all features on the source, calling the provided callback
 * with each one.  If the callback returns any "truthy" value, iteration will
 * stop and the function will return the same value.
 *
 * @param {function(this: T, ol.Feature): S} callback Called with each feature
 *     on the source.  Return a truthy value to stop iteration.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @return {S|undefined} The return value from the last call to the callback.
 * @template T,S
 * @api
 */
_ol_source_Vector_.prototype.forEachFeature = function(callback, opt_this) {
  if (this.featuresRtree_) {
    return this.featuresRtree_.forEach(callback, opt_this);
  } else if (this.featuresCollection_) {
    return this.featuresCollection_.forEach(callback, opt_this);
  }
};


/**
 * Iterate through all features whose geometries contain the provided
 * coordinate, calling the callback with each feature.  If the callback returns
 * a "truthy" value, iteration will stop and the function will return the same
 * value.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(this: T, ol.Feature): S} callback Called with each feature
 *     whose goemetry contains the provided coordinate.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @return {S|undefined} The return value from the last call to the callback.
 * @template T,S
 */
_ol_source_Vector_.prototype.forEachFeatureAtCoordinateDirect = function(coordinate, callback, opt_this) {
  var extent = [coordinate[0], coordinate[1], coordinate[0], coordinate[1]];
  return this.forEachFeatureInExtent(extent, function(feature) {
    var geometry = feature.getGeometry();
    if (geometry.intersectsCoordinate(coordinate)) {
      return callback.call(opt_this, feature);
    } else {
      return undefined;
    }
  });
};


/**
 * Iterate through all features whose bounding box intersects the provided
 * extent (note that the feature's geometry may not intersect the extent),
 * calling the callback with each feature.  If the callback returns a "truthy"
 * value, iteration will stop and the function will return the same value.
 *
 * If you are interested in features whose geometry intersects an extent, call
 * the {@link ol.source.Vector#forEachFeatureIntersectingExtent
 * source.forEachFeatureIntersectingExtent()} method instead.
 *
 * When `useSpatialIndex` is set to false, this method will loop through all
 * features, equivalent to {@link ol.source.Vector#forEachFeature}.
 *
 * @param {ol.Extent} extent Extent.
 * @param {function(this: T, ol.Feature): S} callback Called with each feature
 *     whose bounding box intersects the provided extent.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @return {S|undefined} The return value from the last call to the callback.
 * @template T,S
 * @api
 */
_ol_source_Vector_.prototype.forEachFeatureInExtent = function(extent, callback, opt_this) {
  if (this.featuresRtree_) {
    return this.featuresRtree_.forEachInExtent(extent, callback, opt_this);
  } else if (this.featuresCollection_) {
    return this.featuresCollection_.forEach(callback, opt_this);
  }
};


/**
 * Iterate through all features whose geometry intersects the provided extent,
 * calling the callback with each feature.  If the callback returns a "truthy"
 * value, iteration will stop and the function will return the same value.
 *
 * If you only want to test for bounding box intersection, call the
 * {@link ol.source.Vector#forEachFeatureInExtent
 * source.forEachFeatureInExtent()} method instead.
 *
 * @param {ol.Extent} extent Extent.
 * @param {function(this: T, ol.Feature): S} callback Called with each feature
 *     whose geometry intersects the provided extent.
 * @param {T=} opt_this The object to use as `this` in the callback.
 * @return {S|undefined} The return value from the last call to the callback.
 * @template T,S
 * @api
 */
_ol_source_Vector_.prototype.forEachFeatureIntersectingExtent = function(extent, callback, opt_this) {
  return this.forEachFeatureInExtent(extent,
      /**
       * @param {ol.Feature} feature Feature.
       * @return {S|undefined} The return value from the last call to the callback.
       * @template S
       */
      function(feature) {
        var geometry = feature.getGeometry();
        if (geometry.intersectsExtent(extent)) {
          var result = callback.call(opt_this, feature);
          if (result) {
            return result;
          }
        }
      });
};


/**
 * Get the features collection associated with this source. Will be `null`
 * unless the source was configured with `useSpatialIndex` set to `false`, or
 * with an {@link ol.Collection} as `features`.
 * @return {ol.Collection.<ol.Feature>} The collection of features.
 * @api
 */
_ol_source_Vector_.prototype.getFeaturesCollection = function() {
  return this.featuresCollection_;
};


/**
 * Get all features on the source in random order.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_source_Vector_.prototype.getFeatures = function() {
  var features;
  if (this.featuresCollection_) {
    features = this.featuresCollection_.getArray();
  } else if (this.featuresRtree_) {
    features = this.featuresRtree_.getAll();
    if (!_ol_obj_.isEmpty(this.nullGeometryFeatures_)) {
      _ol_array_.extend(
          features, _ol_obj_.getValues(this.nullGeometryFeatures_));
    }
  }
  return /** @type {Array.<ol.Feature>} */ (features);
};


/**
 * Get all features whose geometry intersects the provided coordinate.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_source_Vector_.prototype.getFeaturesAtCoordinate = function(coordinate) {
  var features = [];
  this.forEachFeatureAtCoordinateDirect(coordinate, function(feature) {
    features.push(feature);
  });
  return features;
};


/**
 * Get all features in the provided extent.  Note that this returns an array of
 * all features intersecting the given extent in random order (so it may include
 * features whose geometries do not intersect the extent).
 *
 * This method is not available when the source is configured with
 * `useSpatialIndex` set to `false`.
 * @param {ol.Extent} extent Extent.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_source_Vector_.prototype.getFeaturesInExtent = function(extent) {
  return this.featuresRtree_.getInExtent(extent);
};


/**
 * Get the closest feature to the provided coordinate.
 *
 * This method is not available when the source is configured with
 * `useSpatialIndex` set to `false`.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(ol.Feature):boolean=} opt_filter Feature filter function.
 *     The filter function will receive one argument, the {@link ol.Feature feature}
 *     and it should return a boolean value. By default, no filtering is made.
 * @return {ol.Feature} Closest feature.
 * @api
 */
_ol_source_Vector_.prototype.getClosestFeatureToCoordinate = function(coordinate, opt_filter) {
  // Find the closest feature using branch and bound.  We start searching an
  // infinite extent, and find the distance from the first feature found.  This
  // becomes the closest feature.  We then compute a smaller extent which any
  // closer feature must intersect.  We continue searching with this smaller
  // extent, trying to find a closer feature.  Every time we find a closer
  // feature, we update the extent being searched so that any even closer
  // feature must intersect it.  We continue until we run out of features.
  var x = coordinate[0];
  var y = coordinate[1];
  var closestFeature = null;
  var closestPoint = [NaN, NaN];
  var minSquaredDistance = Infinity;
  var extent = [-Infinity, -Infinity, Infinity, Infinity];
  var filter = opt_filter ? opt_filter : _ol_functions_.TRUE;
  this.featuresRtree_.forEachInExtent(extent,
      /**
       * @param {ol.Feature} feature Feature.
       */
      function(feature) {
        if (filter(feature)) {
          var geometry = feature.getGeometry();
          var previousMinSquaredDistance = minSquaredDistance;
          minSquaredDistance = geometry.closestPointXY(
              x, y, closestPoint, minSquaredDistance);
          if (minSquaredDistance < previousMinSquaredDistance) {
            closestFeature = feature;
            // This is sneaky.  Reduce the extent that it is currently being
            // searched while the R-Tree traversal using this same extent object
            // is still in progress.  This is safe because the new extent is
            // strictly contained by the old extent.
            var minDistance = Math.sqrt(minSquaredDistance);
            extent[0] = x - minDistance;
            extent[1] = y - minDistance;
            extent[2] = x + minDistance;
            extent[3] = y + minDistance;
          }
        }
      });
  return closestFeature;
};


/**
 * Get the extent of the features currently in the source.
 *
 * This method is not available when the source is configured with
 * `useSpatialIndex` set to `false`.
 * @param {ol.Extent=} opt_extent Destination extent. If provided, no new extent
 *     will be created. Instead, that extent's coordinates will be overwritten.
 * @return {ol.Extent} Extent.
 * @api
 */
_ol_source_Vector_.prototype.getExtent = function(opt_extent) {
  return this.featuresRtree_.getExtent(opt_extent);
};


/**
 * Get a feature by its identifier (the value returned by feature.getId()).
 * Note that the index treats string and numeric identifiers as the same.  So
 * `source.getFeatureById(2)` will return a feature with id `'2'` or `2`.
 *
 * @param {string|number} id Feature identifier.
 * @return {ol.Feature} The feature (or `null` if not found).
 * @api
 */
_ol_source_Vector_.prototype.getFeatureById = function(id) {
  var feature = this.idIndex_[id.toString()];
  return feature !== undefined ? feature : null;
};


/**
 * Get the format associated with this source.
 *
 * @return {ol.format.Feature|undefined} The feature format.
 * @api
 */
_ol_source_Vector_.prototype.getFormat = function() {
  return this.format_;
};


/**
 * @return {boolean} The source can have overlapping geometries.
 */
_ol_source_Vector_.prototype.getOverlaps = function() {
  return this.overlaps_;
};


/**
 * @override
 */
_ol_source_Vector_.prototype.getResolutions = function() {};


/**
 * Get the url associated with this source.
 *
 * @return {string|ol.FeatureUrlFunction|undefined} The url.
 * @api
 */
_ol_source_Vector_.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @param {ol.events.Event} event Event.
 * @private
 */
_ol_source_Vector_.prototype.handleFeatureChange_ = function(event) {
  var feature = /** @type {ol.Feature} */ (event.target);
  var featureKey = _ol_.getUid(feature).toString();
  var geometry = feature.getGeometry();
  if (!geometry) {
    if (!(featureKey in this.nullGeometryFeatures_)) {
      if (this.featuresRtree_) {
        this.featuresRtree_.remove(feature);
      }
      this.nullGeometryFeatures_[featureKey] = feature;
    }
  } else {
    var extent = geometry.getExtent();
    if (featureKey in this.nullGeometryFeatures_) {
      delete this.nullGeometryFeatures_[featureKey];
      if (this.featuresRtree_) {
        this.featuresRtree_.insert(extent, feature);
      }
    } else {
      if (this.featuresRtree_) {
        this.featuresRtree_.update(extent, feature);
      }
    }
  }
  var id = feature.getId();
  if (id !== undefined) {
    var sid = id.toString();
    if (featureKey in this.undefIdIndex_) {
      delete this.undefIdIndex_[featureKey];
      this.idIndex_[sid] = feature;
    } else {
      if (this.idIndex_[sid] !== feature) {
        this.removeFromIdIndex_(feature);
        this.idIndex_[sid] = feature;
      }
    }
  } else {
    if (!(featureKey in this.undefIdIndex_)) {
      this.removeFromIdIndex_(feature);
      this.undefIdIndex_[featureKey] = feature;
    }
  }
  this.changed();
  this.dispatchEvent(new _ol_source_Vector_.Event(
      _ol_source_VectorEventType_.CHANGEFEATURE, feature));
};


/**
 * @return {boolean} Is empty.
 */
_ol_source_Vector_.prototype.isEmpty = function() {
  return this.featuresRtree_.isEmpty() &&
      _ol_obj_.isEmpty(this.nullGeometryFeatures_);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {ol.proj.Projection} projection Projection.
 */
_ol_source_Vector_.prototype.loadFeatures = function(
    extent, resolution, projection) {
  var loadedExtentsRtree = this.loadedExtentsRtree_;
  var extentsToLoad = this.strategy_(extent, resolution);
  var i, ii;
  for (i = 0, ii = extentsToLoad.length; i < ii; ++i) {
    var extentToLoad = extentsToLoad[i];
    var alreadyLoaded = loadedExtentsRtree.forEachInExtent(extentToLoad,
        /**
         * @param {{extent: ol.Extent}} object Object.
         * @return {boolean} Contains.
         */
        function(object) {
          return _ol_extent_.containsExtent(object.extent, extentToLoad);
        });
    if (!alreadyLoaded) {
      this.loader_.call(this, extentToLoad, resolution, projection);
      loadedExtentsRtree.insert(extentToLoad, {extent: extentToLoad.slice()});
    }
  }
};


/**
 * Remove a single feature from the source.  If you want to remove all features
 * at once, use the {@link ol.source.Vector#clear source.clear()} method
 * instead.
 * @param {ol.Feature} feature Feature to remove.
 * @api
 */
_ol_source_Vector_.prototype.removeFeature = function(feature) {
  var featureKey = _ol_.getUid(feature).toString();
  if (featureKey in this.nullGeometryFeatures_) {
    delete this.nullGeometryFeatures_[featureKey];
  } else {
    if (this.featuresRtree_) {
      this.featuresRtree_.remove(feature);
    }
  }
  this.removeFeatureInternal(feature);
  this.changed();
};


/**
 * Remove feature without firing a `change` event.
 * @param {ol.Feature} feature Feature.
 * @protected
 */
_ol_source_Vector_.prototype.removeFeatureInternal = function(feature) {
  var featureKey = _ol_.getUid(feature).toString();
  this.featureChangeKeys_[featureKey].forEach(_ol_events_.unlistenByKey);
  delete this.featureChangeKeys_[featureKey];
  var id = feature.getId();
  if (id !== undefined) {
    delete this.idIndex_[id.toString()];
  } else {
    delete this.undefIdIndex_[featureKey];
  }
  this.dispatchEvent(new _ol_source_Vector_.Event(
      _ol_source_VectorEventType_.REMOVEFEATURE, feature));
};


/**
 * Remove a feature from the id index.  Called internally when the feature id
 * may have changed.
 * @param {ol.Feature} feature The feature.
 * @return {boolean} Removed the feature from the index.
 * @private
 */
_ol_source_Vector_.prototype.removeFromIdIndex_ = function(feature) {
  var removed = false;
  for (var id in this.idIndex_) {
    if (this.idIndex_[id] === feature) {
      delete this.idIndex_[id];
      removed = true;
      break;
    }
  }
  return removed;
};


/**
 * @classdesc
 * Events emitted by {@link ol.source.Vector} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.source.Vector.Event}
 * @param {string} type Type.
 * @param {ol.Feature=} opt_feature Feature.
 */
_ol_source_Vector_.Event = function(type, opt_feature) {

  _ol_events_Event_.call(this, type);

  /**
   * The feature being added or removed.
   * @type {ol.Feature|undefined}
   * @api
   */
  this.feature = opt_feature;

};
_ol_.inherits(_ol_source_Vector_.Event, _ol_events_Event_);
export default _ol_source_Vector_;
