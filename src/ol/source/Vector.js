/**
 * @module ol/source/Vector
 */

import {getUid, inherits} from '../util.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import ObjectEventType from '../ObjectEventType.js';
import {extend} from '../array.js';
import {assert} from '../asserts.js';
import {listen, unlistenByKey} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import {containsExtent, equals} from '../extent.js';
import {xhr} from '../featureloader.js';
import {TRUE, UNDEFINED} from '../functions.js';
import {all as allStrategy} from '../loadingstrategy.js';
import {isEmpty, getValues} from '../obj.js';
import Source from '../source/Source.js';
import SourceState from '../source/State.js';
import VectorEventType from '../source/VectorEventType.js';
import RBush from '../structs/RBush.js';

/**
 * A function that takes an {@link module:ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module:ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link module:ol/loadingstrategy} strategies.
 *
 * @typedef {function(module:ol/extent~Extent, number): Array.<module:ol/extent~Extent>} LoadingStrategy
 * @api
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Vector} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {module:ol/events/Event}
 * @param {string} type Type.
 * @param {module:ol/Feature=} opt_feature Feature.
 */
export const VectorSourceEvent = function(type, opt_feature) {

  Event.call(this, type);

  /**
   * The feature being added or removed.
   * @type {module:ol/Feature|undefined}
   * @api
   */
  this.feature = opt_feature;

};
inherits(VectorSourceEvent, Event);


/**
 * @typedef {Object} Options
 * @property {module:ol/source/Source~AttributionLike} [attributions] Attributions.
 * @property {Array.<module:ol/Feature>|module:ol/Collection.<module:ol/Feature>} [features]
 * Features. If provided as {@link module:ol/Collection}, the features in the source
 * and the collection will stay in sync.
 * @property {module:ol/format/Feature} [format] The feature format used by the XHR
 * feature loader when `url` is set. Required if `url` is set, otherwise ignored.
 * @property {module:ol/featureloader~FeatureLoader} [loader]
 * The loader function used to load features, from a remote source for example.
 * If this is not set and `url` is set, the source will create and use an XHR
 * feature loader.
 *
 * Example:
 *
 * ```js
 * import {Vector} from 'ol/source';
 * import {GeoJSON} from 'ol/format';
 * import {bbox} from 'ol/loadingstrategy';
 *
 * var vectorSource = new Vector({
 *   format: new GeoJSON(),
 *   loader: function(extent, resolution, projection) {
 *      var proj = projection.getCode();
 *      var url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
 *          'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
 *          'outputFormat=application/json&srsname=' + proj + '&' +
 *          'bbox=' + extent.join(',') + ',' + proj;
 *      var xhr = new XMLHttpRequest();
 *      xhr.open('GET', url);
 *      var onError = function() {
 *        vectorSource.removeLoadedExtent(extent);
 *      }
 *      xhr.onerror = onError;
 *      xhr.onload = function() {
 *        if (xhr.status == 200) {
 *          vectorSource.addFeatures(
 *              vectorSource.getFormat().readFeatures(xhr.responseText));
 *        } else {
 *          onError();
 *        }
 *      }
 *      xhr.send();
 *    },
 *    strategy: bbox
 *  });
 * ```
 * @property {boolean} [overlaps=true] This source may have overlapping geometries.
 * Setting this to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {module:ol/source/Vector~LoadingStrategy} [strategy] The loading strategy to use.
 * By default an {@link module:ol/loadingstrategy~all}
 * strategy is used, a one-off strategy which loads all features at once.
 * @property {string|module:ol/featureloader~FeatureUrlfunction} [url]
 * Setting this option instructs the source to load features using an XHR loader
 * (see {@link module:ol/featureloader~xhr}). Use a `string` and an
 * {@link module:ol/loadingstrategy~all} for a one-off download of all features from
 * the given URL. Use a {@link module:ol/featureloader~FeatureUrlfunction} to generate the url with
 * other loading strategies.
 * Requires `format` to be set as well.
 * When default XHR feature loader is provided, the features will
 * be transformed from the data projection to the view projection
 * during parsing. If your remote data source does not advertise its projection
 * properly, this transformation will be incorrect. For some formats, the
 * default projection (usually EPSG:4326) can be overridden by setting the
 * dataProjection constructor option on the format.
 * Note that if a source contains non-feature data, such as a GeoJSON geometry
 * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
 * @property {boolean} [useSpatialIndex=true]
 * By default, an RTree is used as spatial index. When features are removed and
 * added frequently, and the total number of features is low, setting this to
 * `false` may improve performance.
 *
 * Note that
 * {@link module:ol/source/Vector~VectorSource#getFeaturesInExtent},
 * {@link module:ol/source/Vector~VectorSource#getClosestFeatureToCoordinate} and
 * {@link module:ol/source/Vector~VectorSource#getExtent} cannot be used when `useSpatialIndex` is
 * set to `false`, and {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent} will loop
 * through all features.
 *
 * When set to `false`, the features will be maintained in an
 * {@link module:ol/Collection}, which can be retrieved through
 * {@link module:ol/source/Vector~VectorSource#getFeaturesCollection}.
 * @property {boolean} [wrapX=true] Wrap the world horizontally. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 */


/**
 * @classdesc
 * Provides a source of features for vector layers. Vector features provided
 * by this source are suitable for editing. See {@link module:ol/source/VectorTile~VectorTile} for
 * vector data that is optimized for rendering.
 *
 * @constructor
 * @extends {module:ol/source/Source}
 * @fires ol/source/Vector~VectorSourceEvent
 * @param {module:ol/source/Vector~Options=} opt_options Vector source options.
 * @api
 */
const VectorSource = function(opt_options) {

  const options = opt_options || {};

  Source.call(this, {
    attributions: options.attributions,
    projection: undefined,
    state: SourceState.READY,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

  /**
   * @private
   * @type {module:ol/featureloader~FeatureLoader}
   */
  this.loader_ = UNDEFINED;

  /**
   * @private
   * @type {module:ol/format/Feature|undefined}
   */
  this.format_ = options.format;

  /**
   * @private
   * @type {boolean}
   */
  this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

  /**
   * @private
   * @type {string|module:ol/featureloader~FeatureUrlFunction|undefined}
   */
  this.url_ = options.url;

  if (options.loader !== undefined) {
    this.loader_ = options.loader;
  } else if (this.url_ !== undefined) {
    assert(this.format_, 7); // `format` must be set when `url` is set
    // create a XHR feature loader for "url" and "format"
    this.loader_ = xhr(this.url_, /** @type {module:ol/format/Feature} */ (this.format_));
  }

  /**
   * @private
   * @type {module:ol/source/Vector~LoadingStrategy}
   */
  this.strategy_ = options.strategy !== undefined ? options.strategy : allStrategy;

  const useSpatialIndex =
      options.useSpatialIndex !== undefined ? options.useSpatialIndex : true;

  /**
   * @private
   * @type {module:ol/structs/RBush.<module:ol/Feature>}
   */
  this.featuresRtree_ = useSpatialIndex ? new RBush() : null;

  /**
   * @private
   * @type {module:ol/structs/RBush.<{extent: module:ol/extent~Extent}>}
   */
  this.loadedExtentsRtree_ = new RBush();

  /**
   * @private
   * @type {!Object.<string, module:ol/Feature>}
   */
  this.nullGeometryFeatures_ = {};

  /**
   * A lookup of features by id (the return from feature.getId()).
   * @private
   * @type {!Object.<string, module:ol/Feature>}
   */
  this.idIndex_ = {};

  /**
   * A lookup of features without id (keyed by getUid(feature)).
   * @private
   * @type {!Object.<string, module:ol/Feature>}
   */
  this.undefIdIndex_ = {};

  /**
   * @private
   * @type {Object.<string, Array.<module:ol/events~EventsKey>>}
   */
  this.featureChangeKeys_ = {};

  /**
   * @private
   * @type {module:ol/Collection.<module:ol/Feature>}
   */
  this.featuresCollection_ = null;

  let collection, features;
  if (options.features instanceof Collection) {
    collection = options.features;
    features = collection.getArray();
  } else if (Array.isArray(options.features)) {
    features = options.features;
  }
  if (!useSpatialIndex && collection === undefined) {
    collection = new Collection(features);
  }
  if (features !== undefined) {
    this.addFeaturesInternal(features);
  }
  if (collection !== undefined) {
    this.bindFeaturesCollection_(collection);
  }

};

inherits(VectorSource, Source);


/**
 * Add a single feature to the source.  If you want to add a batch of features
 * at once, call {@link module:ol/source/Vector~VectorSource#addFeatures #addFeatures()}
 * instead. A feature will not be added to the source if feature with
 * the same id is already there. The reason for this behavior is to avoid
 * feature duplication when using bbox or tile loading strategies.
 * @param {module:ol/Feature} feature Feature to add.
 * @api
 */
VectorSource.prototype.addFeature = function(feature) {
  this.addFeatureInternal(feature);
  this.changed();
};


/**
 * Add a feature without firing a `change` event.
 * @param {module:ol/Feature} feature Feature.
 * @protected
 */
VectorSource.prototype.addFeatureInternal = function(feature) {
  const featureKey = getUid(feature).toString();

  if (!this.addToIndex_(featureKey, feature)) {
    return;
  }

  this.setupChangeEvents_(featureKey, feature);

  const geometry = feature.getGeometry();
  if (geometry) {
    const extent = geometry.getExtent();
    if (this.featuresRtree_) {
      this.featuresRtree_.insert(extent, feature);
    }
  } else {
    this.nullGeometryFeatures_[featureKey] = feature;
  }

  this.dispatchEvent(
    new VectorSourceEvent(VectorEventType.ADDFEATURE, feature));
};


/**
 * @param {string} featureKey Unique identifier for the feature.
 * @param {module:ol/Feature} feature The feature.
 * @private
 */
VectorSource.prototype.setupChangeEvents_ = function(featureKey, feature) {
  this.featureChangeKeys_[featureKey] = [
    listen(feature, EventType.CHANGE,
      this.handleFeatureChange_, this),
    listen(feature, ObjectEventType.PROPERTYCHANGE,
      this.handleFeatureChange_, this)
  ];
};


/**
 * @param {string} featureKey Unique identifier for the feature.
 * @param {module:ol/Feature} feature The feature.
 * @return {boolean} The feature is "valid", in the sense that it is also a
 *     candidate for insertion into the Rtree.
 * @private
 */
VectorSource.prototype.addToIndex_ = function(featureKey, feature) {
  let valid = true;
  const id = feature.getId();
  if (id !== undefined) {
    if (!(id.toString() in this.idIndex_)) {
      this.idIndex_[id.toString()] = feature;
    } else {
      valid = false;
    }
  } else {
    assert(!(featureKey in this.undefIdIndex_),
      30); // The passed `feature` was already added to the source
    this.undefIdIndex_[featureKey] = feature;
  }
  return valid;
};


/**
 * Add a batch of features to the source.
 * @param {Array.<module:ol/Feature>} features Features to add.
 * @api
 */
VectorSource.prototype.addFeatures = function(features) {
  this.addFeaturesInternal(features);
  this.changed();
};


/**
 * Add features without firing a `change` event.
 * @param {Array.<module:ol/Feature>} features Features.
 * @protected
 */
VectorSource.prototype.addFeaturesInternal = function(features) {
  const extents = [];
  const newFeatures = [];
  const geometryFeatures = [];

  for (let i = 0, length = features.length; i < length; i++) {
    const feature = features[i];
    const featureKey = getUid(feature).toString();
    if (this.addToIndex_(featureKey, feature)) {
      newFeatures.push(feature);
    }
  }

  for (let i = 0, length = newFeatures.length; i < length; i++) {
    const feature = newFeatures[i];
    const featureKey = getUid(feature).toString();
    this.setupChangeEvents_(featureKey, feature);

    const geometry = feature.getGeometry();
    if (geometry) {
      const extent = geometry.getExtent();
      extents.push(extent);
      geometryFeatures.push(feature);
    } else {
      this.nullGeometryFeatures_[featureKey] = feature;
    }
  }
  if (this.featuresRtree_) {
    this.featuresRtree_.load(extents, geometryFeatures);
  }

  for (let i = 0, length = newFeatures.length; i < length; i++) {
    this.dispatchEvent(new VectorSourceEvent(VectorEventType.ADDFEATURE, newFeatures[i]));
  }
};


/**
 * @param {!module:ol/Collection.<module:ol/Feature>} collection Collection.
 * @private
 */
VectorSource.prototype.bindFeaturesCollection_ = function(collection) {
  let modifyingCollection = false;
  listen(this, VectorEventType.ADDFEATURE,
    function(evt) {
      if (!modifyingCollection) {
        modifyingCollection = true;
        collection.push(evt.feature);
        modifyingCollection = false;
      }
    });
  listen(this, VectorEventType.REMOVEFEATURE,
    function(evt) {
      if (!modifyingCollection) {
        modifyingCollection = true;
        collection.remove(evt.feature);
        modifyingCollection = false;
      }
    });
  listen(collection, CollectionEventType.ADD,
    function(evt) {
      if (!modifyingCollection) {
        modifyingCollection = true;
        this.addFeature(/** @type {module:ol/Feature} */ (evt.element));
        modifyingCollection = false;
      }
    }, this);
  listen(collection, CollectionEventType.REMOVE,
    function(evt) {
      if (!modifyingCollection) {
        modifyingCollection = true;
        this.removeFeature(/** @type {module:ol/Feature} */ (evt.element));
        modifyingCollection = false;
      }
    }, this);
  this.featuresCollection_ = collection;
};


/**
 * Remove all features from the source.
 * @param {boolean=} opt_fast Skip dispatching of {@link module:ol/source/Vector~VectorSourceEvent#removefeature} events.
 * @api
 */
VectorSource.prototype.clear = function(opt_fast) {
  if (opt_fast) {
    for (const featureId in this.featureChangeKeys_) {
      const keys = this.featureChangeKeys_[featureId];
      keys.forEach(unlistenByKey);
    }
    if (!this.featuresCollection_) {
      this.featureChangeKeys_ = {};
      this.idIndex_ = {};
      this.undefIdIndex_ = {};
    }
  } else {
    if (this.featuresRtree_) {
      this.featuresRtree_.forEach(this.removeFeatureInternal, this);
      for (const id in this.nullGeometryFeatures_) {
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

  const clearEvent = new VectorSourceEvent(VectorEventType.CLEAR);
  this.dispatchEvent(clearEvent);
  this.changed();
};


/**
 * Iterate through all features on the source, calling the provided callback
 * with each one.  If the callback returns any "truthy" value, iteration will
 * stop and the function will return the same value.
 * Note: this function only iterate through the feature that have a defined geometry.
 *
 * @param {function(module:ol/Feature): T} callback Called with each feature
 *     on the source.  Return a truthy value to stop iteration.
 * @return {T|undefined} The return value from the last call to the callback.
 * @template T
 * @api
 */
VectorSource.prototype.forEachFeature = function(callback) {
  if (this.featuresRtree_) {
    return this.featuresRtree_.forEach(callback);
  } else if (this.featuresCollection_) {
    return this.featuresCollection_.forEach(callback);
  }
};


/**
 * Iterate through all features whose geometries contain the provided
 * coordinate, calling the callback with each feature.  If the callback returns
 * a "truthy" value, iteration will stop and the function will return the same
 * value.
 *
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {function(module:ol/Feature): T} callback Called with each feature
 *     whose goemetry contains the provided coordinate.
 * @return {T|undefined} The return value from the last call to the callback.
 * @template T
 */
VectorSource.prototype.forEachFeatureAtCoordinateDirect = function(coordinate, callback) {
  const extent = [coordinate[0], coordinate[1], coordinate[0], coordinate[1]];
  return this.forEachFeatureInExtent(extent, function(feature) {
    const geometry = feature.getGeometry();
    if (geometry.intersectsCoordinate(coordinate)) {
      return callback(feature);
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
 * the {@link module:ol/source/Vector~VectorSource#forEachFeatureIntersectingExtent #forEachFeatureIntersectingExtent()} method instead.
 *
 * When `useSpatialIndex` is set to false, this method will loop through all
 * features, equivalent to {@link module:ol/source/Vector~VectorSource#forEachFeature #forEachFeature()}.
 *
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {function(module:ol/Feature): T} callback Called with each feature
 *     whose bounding box intersects the provided extent.
 * @return {T|undefined} The return value from the last call to the callback.
 * @template T
 * @api
 */
VectorSource.prototype.forEachFeatureInExtent = function(extent, callback) {
  if (this.featuresRtree_) {
    return this.featuresRtree_.forEachInExtent(extent, callback);
  } else if (this.featuresCollection_) {
    return this.featuresCollection_.forEach(callback);
  }
};


/**
 * Iterate through all features whose geometry intersects the provided extent,
 * calling the callback with each feature.  If the callback returns a "truthy"
 * value, iteration will stop and the function will return the same value.
 *
 * If you only want to test for bounding box intersection, call the
 * {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent #forEachFeatureInExtent()} method instead.
 *
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {function(module:ol/Feature): T} callback Called with each feature
 *     whose geometry intersects the provided extent.
 * @return {T|undefined} The return value from the last call to the callback.
 * @template T
 * @api
 */
VectorSource.prototype.forEachFeatureIntersectingExtent = function(extent, callback) {
  return this.forEachFeatureInExtent(extent,
    /**
     * @param {module:ol/Feature} feature Feature.
     * @return {T|undefined} The return value from the last call to the callback.
     * @template T
     */
    function(feature) {
      const geometry = feature.getGeometry();
      if (geometry.intersectsExtent(extent)) {
        const result = callback(feature);
        if (result) {
          return result;
        }
      }
    });
};


/**
 * Get the features collection associated with this source. Will be `null`
 * unless the source was configured with `useSpatialIndex` set to `false`, or
 * with an {@link module:ol/Collection} as `features`.
 * @return {module:ol/Collection.<module:ol/Feature>} The collection of features.
 * @api
 */
VectorSource.prototype.getFeaturesCollection = function() {
  return this.featuresCollection_;
};


/**
 * Get all features on the source in random order.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
VectorSource.prototype.getFeatures = function() {
  let features;
  if (this.featuresCollection_) {
    features = this.featuresCollection_.getArray();
  } else if (this.featuresRtree_) {
    features = this.featuresRtree_.getAll();
    if (!isEmpty(this.nullGeometryFeatures_)) {
      extend(features, getValues(this.nullGeometryFeatures_));
    }
  }
  return (
    /** @type {Array.<module:ol/Feature>} */ (features)
  );
};


/**
 * Get all features whose geometry intersects the provided coordinate.
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
VectorSource.prototype.getFeaturesAtCoordinate = function(coordinate) {
  const features = [];
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
 * @param {module:ol/extent~Extent} extent Extent.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
VectorSource.prototype.getFeaturesInExtent = function(extent) {
  return this.featuresRtree_.getInExtent(extent);
};


/**
 * Get the closest feature to the provided coordinate.
 *
 * This method is not available when the source is configured with
 * `useSpatialIndex` set to `false`.
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {function(module:ol/Feature):boolean=} opt_filter Feature filter function.
 *     The filter function will receive one argument, the {@link module:ol/Feature feature}
 *     and it should return a boolean value. By default, no filtering is made.
 * @return {module:ol/Feature} Closest feature.
 * @api
 */
VectorSource.prototype.getClosestFeatureToCoordinate = function(coordinate, opt_filter) {
  // Find the closest feature using branch and bound.  We start searching an
  // infinite extent, and find the distance from the first feature found.  This
  // becomes the closest feature.  We then compute a smaller extent which any
  // closer feature must intersect.  We continue searching with this smaller
  // extent, trying to find a closer feature.  Every time we find a closer
  // feature, we update the extent being searched so that any even closer
  // feature must intersect it.  We continue until we run out of features.
  const x = coordinate[0];
  const y = coordinate[1];
  let closestFeature = null;
  const closestPoint = [NaN, NaN];
  let minSquaredDistance = Infinity;
  const extent = [-Infinity, -Infinity, Infinity, Infinity];
  const filter = opt_filter ? opt_filter : TRUE;
  this.featuresRtree_.forEachInExtent(extent,
    /**
     * @param {module:ol/Feature} feature Feature.
     */
    function(feature) {
      if (filter(feature)) {
        const geometry = feature.getGeometry();
        const previousMinSquaredDistance = minSquaredDistance;
        minSquaredDistance = geometry.closestPointXY(
          x, y, closestPoint, minSquaredDistance);
        if (minSquaredDistance < previousMinSquaredDistance) {
          closestFeature = feature;
          // This is sneaky.  Reduce the extent that it is currently being
          // searched while the R-Tree traversal using this same extent object
          // is still in progress.  This is safe because the new extent is
          // strictly contained by the old extent.
          const minDistance = Math.sqrt(minSquaredDistance);
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
 * @param {module:ol/extent~Extent=} opt_extent Destination extent. If provided, no new extent
 *     will be created. Instead, that extent's coordinates will be overwritten.
 * @return {module:ol/extent~Extent} Extent.
 * @api
 */
VectorSource.prototype.getExtent = function(opt_extent) {
  return this.featuresRtree_.getExtent(opt_extent);
};


/**
 * Get a feature by its identifier (the value returned by feature.getId()).
 * Note that the index treats string and numeric identifiers as the same.  So
 * `source.getFeatureById(2)` will return a feature with id `'2'` or `2`.
 *
 * @param {string|number} id Feature identifier.
 * @return {module:ol/Feature} The feature (or `null` if not found).
 * @api
 */
VectorSource.prototype.getFeatureById = function(id) {
  const feature = this.idIndex_[id.toString()];
  return feature !== undefined ? feature : null;
};


/**
 * Get the format associated with this source.
 *
 * @return {module:ol/format/Feature|undefined} The feature format.
 * @api
 */
VectorSource.prototype.getFormat = function() {
  return this.format_;
};


/**
 * @return {boolean} The source can have overlapping geometries.
 */
VectorSource.prototype.getOverlaps = function() {
  return this.overlaps_;
};


/**
 * @override
 */
VectorSource.prototype.getResolutions = function() {};


/**
 * Get the url associated with this source.
 *
 * @return {string|module:ol/featureloader~FeatureUrlFunction|undefined} The url.
 * @api
 */
VectorSource.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @param {module:ol/events/Event} event Event.
 * @private
 */
VectorSource.prototype.handleFeatureChange_ = function(event) {
  const feature = /** @type {module:ol/Feature} */ (event.target);
  const featureKey = getUid(feature).toString();
  const geometry = feature.getGeometry();
  if (!geometry) {
    if (!(featureKey in this.nullGeometryFeatures_)) {
      if (this.featuresRtree_) {
        this.featuresRtree_.remove(feature);
      }
      this.nullGeometryFeatures_[featureKey] = feature;
    }
  } else {
    const extent = geometry.getExtent();
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
  const id = feature.getId();
  if (id !== undefined) {
    const sid = id.toString();
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
  this.dispatchEvent(new VectorSourceEvent(
    VectorEventType.CHANGEFEATURE, feature));
};

/**
 * Returns true if the feature is contained within the source.
 * @param {module:ol/Feature} feature Feature.
 * @return {boolean} Has feature.
 * @api
 */
VectorSource.prototype.hasFeature = function(feature) {
  const id = feature.getId();
  if (id !== undefined) {
    return id in this.idIndex_;
  } else {
    const featureKey = getUid(feature).toString();
    return featureKey in this.undefIdIndex_;
  }
};

/**
 * @return {boolean} Is empty.
 */
VectorSource.prototype.isEmpty = function() {
  return this.featuresRtree_.isEmpty() && isEmpty(this.nullGeometryFeatures_);
};


/**
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {module:ol/proj/Projection} projection Projection.
 */
VectorSource.prototype.loadFeatures = function(extent, resolution, projection) {
  const loadedExtentsRtree = this.loadedExtentsRtree_;
  const extentsToLoad = this.strategy_(extent, resolution);
  for (let i = 0, ii = extentsToLoad.length; i < ii; ++i) {
    const extentToLoad = extentsToLoad[i];
    const alreadyLoaded = loadedExtentsRtree.forEachInExtent(extentToLoad,
      /**
       * @param {{extent: module:ol/extent~Extent}} object Object.
       * @return {boolean} Contains.
       */
      function(object) {
        return containsExtent(object.extent, extentToLoad);
      });
    if (!alreadyLoaded) {
      this.loader_.call(this, extentToLoad, resolution, projection);
      loadedExtentsRtree.insert(extentToLoad, {extent: extentToLoad.slice()});
    }
  }
};


/**
 * Remove an extent from the list of loaded extents.
 * @param {module:ol/extent~Extent} extent Extent.
 * @api
 */
VectorSource.prototype.removeLoadedExtent = function(extent) {
  const loadedExtentsRtree = this.loadedExtentsRtree_;
  let obj;
  loadedExtentsRtree.forEachInExtent(extent, function(object) {
    if (equals(object.extent, extent)) {
      obj = object;
      return true;
    }
  });
  if (obj) {
    loadedExtentsRtree.remove(obj);
  }
};


/**
 * Remove a single feature from the source.  If you want to remove all features
 * at once, use the {@link module:ol/source/Vector~VectorSource#clear #clear()} method
 * instead.
 * @param {module:ol/Feature} feature Feature to remove.
 * @api
 */
VectorSource.prototype.removeFeature = function(feature) {
  const featureKey = getUid(feature).toString();
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
 * @param {module:ol/Feature} feature Feature.
 * @protected
 */
VectorSource.prototype.removeFeatureInternal = function(feature) {
  const featureKey = getUid(feature).toString();
  this.featureChangeKeys_[featureKey].forEach(unlistenByKey);
  delete this.featureChangeKeys_[featureKey];
  const id = feature.getId();
  if (id !== undefined) {
    delete this.idIndex_[id.toString()];
  } else {
    delete this.undefIdIndex_[featureKey];
  }
  this.dispatchEvent(new VectorSourceEvent(
    VectorEventType.REMOVEFEATURE, feature));
};


/**
 * Remove a feature from the id index.  Called internally when the feature id
 * may have changed.
 * @param {module:ol/Feature} feature The feature.
 * @return {boolean} Removed the feature from the index.
 * @private
 */
VectorSource.prototype.removeFromIdIndex_ = function(feature) {
  let removed = false;
  for (const id in this.idIndex_) {
    if (this.idIndex_[id] === feature) {
      delete this.idIndex_[id];
      removed = true;
      break;
    }
  }
  return removed;
};


/**
 * Set the new loader of the source. The next loadFeatures call will use the
 * new loader.
 * @param {module:ol/featureloader~FeatureLoader} loader The loader to set.
 * @api
 */
VectorSource.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};

export default VectorSource;
