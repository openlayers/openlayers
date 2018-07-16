/**
 * @module ol/format/JSONFeature
 */
import {inherits} from '../util.js';
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/format/Feature}
 */
class JSONFeature {
 constructor() {
   FeatureFormat.call(this);
 }

 /**
  * @inheritDoc
  */
 getType() {
   return FormatType.JSON;
 }

 /**
  * @inheritDoc
  */
 readFeature(source, opt_options) {
   return this.readFeatureFromObject(
     getObject(source), this.getReadOptions(source, opt_options));
 }

 /**
  * @inheritDoc
  */
 readFeatures(source, opt_options) {
   return this.readFeaturesFromObject(
     getObject(source), this.getReadOptions(source, opt_options));
 }

 /**
  * @abstract
  * @param {Object} object Object.
  * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
  * @protected
  * @return {module:ol/Feature} Feature.
  */
 readFeatureFromObject(object, opt_options) {}

 /**
  * @abstract
  * @param {Object} object Object.
  * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
  * @protected
  * @return {Array.<module:ol/Feature>} Features.
  */
 readFeaturesFromObject(object, opt_options) {}

 /**
  * @inheritDoc
  */
 readGeometry(source, opt_options) {
   return this.readGeometryFromObject(
     getObject(source), this.getReadOptions(source, opt_options));
 }

 /**
  * @abstract
  * @param {Object} object Object.
  * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
  * @protected
  * @return {module:ol/geom/Geometry} Geometry.
  */
 readGeometryFromObject(object, opt_options) {}

 /**
  * @inheritDoc
  */
 readProjection(source) {
   return this.readProjectionFromObject(getObject(source));
 }

 /**
  * @abstract
  * @param {Object} object Object.
  * @protected
  * @return {module:ol/proj/Projection} Projection.
  */
 readProjectionFromObject(object) {}

 /**
  * @inheritDoc
  */
 writeFeature(feature, opt_options) {
   return JSON.stringify(this.writeFeatureObject(feature, opt_options));
 }

 /**
  * @abstract
  * @param {module:ol/Feature} feature Feature.
  * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
  * @return {Object} Object.
  */
 writeFeatureObject(feature, opt_options) {}

 /**
  * @inheritDoc
  */
 writeFeatures(features, opt_options) {
   return JSON.stringify(this.writeFeaturesObject(features, opt_options));
 }

 /**
  * @abstract
  * @param {Array.<module:ol/Feature>} features Features.
  * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
  * @return {Object} Object.
  */
 writeFeaturesObject(features, opt_options) {}

 /**
  * @inheritDoc
  */
 writeGeometry(geometry, opt_options) {
   return JSON.stringify(this.writeGeometryObject(geometry, opt_options));
 }

 /**
  * @abstract
  * @param {module:ol/geom/Geometry} geometry Geometry.
  * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
  * @return {Object} Object.
  */
 writeGeometryObject(geometry, opt_options) {}
}

inherits(JSONFeature, FeatureFormat);


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {Object} Object.
 */
function getObject(source) {
  if (typeof source === 'string') {
    const object = JSON.parse(source);
    return object ? /** @type {Object} */ (object) : null;
  } else if (source !== null) {
    return source;
  } else {
    return null;
  }
}


export default JSONFeature;
