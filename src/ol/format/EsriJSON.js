/**
 * @module ol/format/EsriJSON
 */
import {inherits} from '../util.js';
import Feature from '../Feature.js';
import {assert} from '../asserts.js';
import {containsExtent} from '../extent.js';
import {transformWithOptions} from '../format/Feature.js';
import JSONFeature from '../format/JSONFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import LinearRing from '../geom/LinearRing.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {deflateCoordinates} from '../geom/flat/deflate.js';
import {linearRingIsClockwise} from '../geom/flat/orient.js';
import {assign, isEmpty} from '../obj.js';
import {get as getProjection} from '../proj.js';


/**
 * @const
 * @type {Object.<module:ol/geom/GeometryType, function(EsriJSONGeometry): module:ol/geom/Geometry>}
 */
const GEOMETRY_READERS = {};
GEOMETRY_READERS[GeometryType.POINT] = readPointGeometry;
GEOMETRY_READERS[GeometryType.LINE_STRING] = readLineStringGeometry;
GEOMETRY_READERS[GeometryType.POLYGON] = readPolygonGeometry;
GEOMETRY_READERS[GeometryType.MULTI_POINT] = readMultiPointGeometry;
GEOMETRY_READERS[GeometryType.MULTI_LINE_STRING] = readMultiLineStringGeometry;
GEOMETRY_READERS[GeometryType.MULTI_POLYGON] = readMultiPolygonGeometry;


/**
 * @const
 * @type {Object.<string, function(module:ol/geom/Geometry, module:ol/format/Feature~WriteOptions=): (EsriJSONGeometry)>}
 */
const GEOMETRY_WRITERS = {};
GEOMETRY_WRITERS[GeometryType.POINT] = writePointGeometry;
GEOMETRY_WRITERS[GeometryType.LINE_STRING] = writeLineStringGeometry;
GEOMETRY_WRITERS[GeometryType.POLYGON] = writePolygonGeometry;
GEOMETRY_WRITERS[GeometryType.MULTI_POINT] = writeMultiPointGeometry;
GEOMETRY_WRITERS[GeometryType.MULTI_LINE_STRING] = writeMultiLineStringGeometry;
GEOMETRY_WRITERS[GeometryType.MULTI_POLYGON] = writeMultiPolygonGeometry;


/**
 * @typedef {Object} Options
 * @property {string} [geometryName] Geometry name to use when creating features.
 */


/**
 * @classdesc
 * Feature format for reading and writing data in the EsriJSON format.
 *
 * @constructor
 * @extends {module:ol/format/JSONFeature}
 * @param {module:ol/format/EsriJSON~Options=} opt_options Options.
 * @api
 */
const EsriJSON = function(opt_options) {

  const options = opt_options ? opt_options : {};

  JSONFeature.call(this);

  /**
   * Name of the geometry attribute for features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

};

inherits(EsriJSON, JSONFeature);


/**
 * @param {EsriJSONGeometry} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 */
function readGeometry(object, opt_options) {
  if (!object) {
    return null;
  }
  /** @type {module:ol/geom/GeometryType} */
  let type;
  if (typeof object.x === 'number' && typeof object.y === 'number') {
    type = GeometryType.POINT;
  } else if (object.points) {
    type = GeometryType.MULTI_POINT;
  } else if (object.paths) {
    if (object.paths.length === 1) {
      type = GeometryType.LINE_STRING;
    } else {
      type = GeometryType.MULTI_LINE_STRING;
    }
  } else if (object.rings) {
    const layout = getGeometryLayout(object);
    const rings = convertRings(object.rings, layout);
    object = /** @type {EsriJSONGeometry} */(assign({}, object));
    if (rings.length === 1) {
      type = GeometryType.POLYGON;
      object.rings = rings[0];
    } else {
      type = GeometryType.MULTI_POLYGON;
      object.rings = rings;
    }
  }
  const geometryReader = GEOMETRY_READERS[type];
  return (
    /** @type {module:ol/geom/Geometry} */ (transformWithOptions(geometryReader(object), false, opt_options))
  );
}


/**
 * Determines inner and outer rings.
 * Checks if any polygons in this array contain any other polygons in this
 * array. It is used for checking for holes.
 * Logic inspired by: https://github.com/Esri/terraformer-arcgis-parser
 * @param {Array.<!Array.<!Array.<number>>>} rings Rings.
 * @param {module:ol/geom/GeometryLayout} layout Geometry layout.
 * @return {Array.<!Array.<!Array.<number>>>} Transformed rings.
 */
function convertRings(rings, layout) {
  const flatRing = [];
  const outerRings = [];
  const holes = [];
  let i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    flatRing.length = 0;
    deflateCoordinates(flatRing, 0, rings[i], layout.length);
    // is this ring an outer ring? is it clockwise?
    const clockwise = linearRingIsClockwise(flatRing, 0,
      flatRing.length, layout.length);
    if (clockwise) {
      outerRings.push([rings[i]]);
    } else {
      holes.push(rings[i]);
    }
  }
  while (holes.length) {
    const hole = holes.shift();
    let matched = false;
    // loop over all outer rings and see if they contain our hole.
    for (i = outerRings.length - 1; i >= 0; i--) {
      const outerRing = outerRings[i][0];
      const containsHole = containsExtent(
        new LinearRing(outerRing).getExtent(),
        new LinearRing(hole).getExtent()
      );
      if (containsHole) {
        // the hole is contained push it into our polygon
        outerRings[i].push(hole);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // no outer rings contain this hole turn it into and outer
      // ring (reverse it)
      outerRings.push([hole.reverse()]);
    }
  }
  return outerRings;
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} Point.
 */
function readPointGeometry(object) {
  let point;
  if (object.m !== undefined && object.z !== undefined) {
    point = new Point([object.x, object.y, object.z, object.m],
      GeometryLayout.XYZM);
  } else if (object.z !== undefined) {
    point = new Point([object.x, object.y, object.z],
      GeometryLayout.XYZ);
  } else if (object.m !== undefined) {
    point = new Point([object.x, object.y, object.m],
      GeometryLayout.XYM);
  } else {
    point = new Point([object.x, object.y]);
  }
  return point;
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} LineString.
 */
function readLineStringGeometry(object) {
  const layout = getGeometryLayout(object);
  return new LineString(object.paths[0], layout);
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} MultiLineString.
 */
function readMultiLineStringGeometry(object) {
  const layout = getGeometryLayout(object);
  return new MultiLineString(object.paths, layout);
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/GeometryLayout} The geometry layout to use.
 */
function getGeometryLayout(object) {
  let layout = GeometryLayout.XY;
  if (object.hasZ === true && object.hasM === true) {
    layout = GeometryLayout.XYZM;
  } else if (object.hasZ === true) {
    layout = GeometryLayout.XYZ;
  } else if (object.hasM === true) {
    layout = GeometryLayout.XYM;
  }
  return layout;
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} MultiPoint.
 */
function readMultiPointGeometry(object) {
  const layout = getGeometryLayout(object);
  return new MultiPoint(object.points, layout);
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} MultiPolygon.
 */
function readMultiPolygonGeometry(object) {
  const layout = getGeometryLayout(object);
  return new MultiPolygon(
    /** @type {Array.<Array.<Array.<Array.<number>>>>} */(object.rings),
    layout);
}


/**
 * @param {EsriJSONGeometry} object Object.
 * @return {module:ol/geom/Geometry} Polygon.
 */
function readPolygonGeometry(object) {
  const layout = getGeometryLayout(object);
  return new Polygon(object.rings, layout);
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONGeometry} EsriJSON geometry.
 */
function writePointGeometry(geometry, opt_options) {
  const coordinates = /** @type {module:ol/geom/Point} */ (geometry).getCoordinates();
  let esriJSON;
  const layout = /** @type {module:ol/geom/Point} */ (geometry).getLayout();
  if (layout === GeometryLayout.XYZ) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2]
    });
  } else if (layout === GeometryLayout.XYM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      m: coordinates[2]
    });
  } else if (layout === GeometryLayout.XYZM) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2],
      m: coordinates[3]
    });
  } else if (layout === GeometryLayout.XY) {
    esriJSON = /** @type {EsriJSONPoint} */ ({
      x: coordinates[0],
      y: coordinates[1]
    });
  } else {
    assert(false, 34); // Invalid geometry layout
  }
  return /** @type {EsriJSONGeometry} */ (esriJSON);
}


/**
 * @param {module:ol/geom/SimpleGeometry} geometry Geometry.
 * @return {Object} Object with boolean hasZ and hasM keys.
 */
function getHasZM(geometry) {
  const layout = geometry.getLayout();
  return {
    hasZ: (layout === GeometryLayout.XYZ ||
      layout === GeometryLayout.XYZM),
    hasM: (layout === GeometryLayout.XYM ||
      layout === GeometryLayout.XYZM)
  };
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
function writeLineStringGeometry(geometry, opt_options) {
  const hasZM = getHasZM(/** @type {module:ol/geom/LineString} */(geometry));
  return (
    /** @type {EsriJSONPolyline} */ {
      hasZ: hasZM.hasZ,
      hasM: hasZM.hasM,
      paths: [
        /** @type {module:ol/geom/LineString} */ (geometry).getCoordinates()
      ]
    }
  );
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONPolygon} EsriJSON geometry.
 */
function writePolygonGeometry(geometry, opt_options) {
  // Esri geometries use the left-hand rule
  const hasZM = getHasZM(/** @type {module:ol/geom/Polygon} */(geometry));
  return (
    /** @type {EsriJSONPolygon} */ {
      hasZ: hasZM.hasZ,
      hasM: hasZM.hasM,
      rings: /** @type {module:ol/geom/Polygon} */ (geometry).getCoordinates(false)
    }
  );
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONPolyline} EsriJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, opt_options) {
  const hasZM = getHasZM(/** @type {module:ol/geom/MultiLineString} */(geometry));
  return (
    /** @type {EsriJSONPolyline} */ {
      hasZ: hasZM.hasZ,
      hasM: hasZM.hasM,
      paths: /** @type {module:ol/geom/MultiLineString} */ (geometry).getCoordinates()
    }
  );
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONMultipoint} EsriJSON geometry.
 */
function writeMultiPointGeometry(geometry, opt_options) {
  const hasZM = getHasZM(/** @type {module:ol/geom/MultiPoint} */(geometry));
  return (
    /** @type {EsriJSONMultipoint} */ {
      hasZ: hasZM.hasZ,
      hasM: hasZM.hasM,
      points: /** @type {module:ol/geom/MultiPoint} */ (geometry).getCoordinates()
    }
  );
}


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONPolygon} EsriJSON geometry.
 */
function writeMultiPolygonGeometry(geometry, opt_options) {
  const hasZM = getHasZM(/** @type {module:ol/geom/MultiPolygon} */(geometry));
  const coordinates = /** @type {module:ol/geom/MultiPolygon} */ (geometry).getCoordinates(false);
  const output = [];
  for (let i = 0; i < coordinates.length; i++) {
    for (let x = coordinates[i].length - 1; x >= 0; x--) {
      output.push(coordinates[i][x]);
    }
  }
  return /** @type {EsriJSONPolygon} */ ({
    hasZ: hasZM.hasZ,
    hasM: hasZM.hasM,
    rings: output
  });
}


/**
 * Read a feature from a EsriJSON Feature source.  Only works for Feature,
 * use `readFeatures` to read FeatureCollection source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
EsriJSON.prototype.readFeature;


/**
 * Read all features from a EsriJSON source.  Works with both Feature and
 * FeatureCollection sources.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
EsriJSON.prototype.readFeatures;


/**
 * @inheritDoc
 */
EsriJSON.prototype.readFeatureFromObject = function(object, opt_options) {
  const esriJSONFeature = /** @type {EsriJSONFeature} */ (object);
  const geometry = readGeometry(esriJSONFeature.geometry, opt_options);
  const feature = new Feature();
  if (this.geometryName_) {
    feature.setGeometryName(this.geometryName_);
  }
  feature.setGeometry(geometry);
  if (opt_options && opt_options.idField &&
    esriJSONFeature.attributes[opt_options.idField]) {
    feature.setId(/** @type {number} */(esriJSONFeature.attributes[opt_options.idField]));
  }
  if (esriJSONFeature.attributes) {
    feature.setProperties(esriJSONFeature.attributes);
  }
  return feature;
};


/**
 * @inheritDoc
 */
EsriJSON.prototype.readFeaturesFromObject = function(object, opt_options) {
  const esriJSONObject = /** @type {EsriJSONObject} */ (object);
  const options = opt_options ? opt_options : {};
  if (esriJSONObject.features) {
    const esriJSONFeatureCollection = /** @type {EsriJSONFeatureCollection} */ (object);
    /** @type {Array.<module:ol/Feature>} */
    const features = [];
    const esriJSONFeatures = esriJSONFeatureCollection.features;
    options.idField = object.objectIdFieldName;
    for (let i = 0, ii = esriJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(esriJSONFeatures[i], options));
    }
    return features;
  } else {
    return [this.readFeatureFromObject(object, options)];
  }
};


/**
 * Read a geometry from a EsriJSON source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 * @api
 */
EsriJSON.prototype.readGeometry;


/**
 * @inheritDoc
 */
EsriJSON.prototype.readGeometryFromObject = function(object, opt_options) {
  return readGeometry(/** @type {EsriJSONGeometry} */(object), opt_options);
};


/**
 * Read the projection from a EsriJSON source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
EsriJSON.prototype.readProjection;


/**
 * @inheritDoc
 */
EsriJSON.prototype.readProjectionFromObject = function(object) {
  const esriJSONObject = /** @type {EsriJSONObject} */ (object);
  if (esriJSONObject.spatialReference && esriJSONObject.spatialReference.wkid) {
    const crs = esriJSONObject.spatialReference.wkid;
    return getProjection('EPSG:' + crs);
  } else {
    return null;
  }
};


/**
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONGeometry} EsriJSON geometry.
 */
function writeGeometry(geometry, opt_options) {
  const geometryWriter = GEOMETRY_WRITERS[geometry.getType()];
  return geometryWriter(/** @type {module:ol/geom/Geometry} */(
    transformWithOptions(geometry, true, opt_options)), opt_options);
}


/**
 * Encode a geometry as a EsriJSON string.
 *
 * @function
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
EsriJSON.prototype.writeGeometry;


/**
 * Encode a geometry as a EsriJSON object.
 *
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {EsriJSONGeometry} Object.
 * @override
 * @api
 */
EsriJSON.prototype.writeGeometryObject = function(geometry, opt_options) {
  return writeGeometry(geometry, this.adaptOptions(opt_options));
};


/**
 * Encode a feature as a EsriJSON Feature string.
 *
 * @function
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
EsriJSON.prototype.writeFeature;


/**
 * Encode a feature as a esriJSON Feature object.
 *
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 * @override
 * @api
 */
EsriJSON.prototype.writeFeatureObject = function(feature, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const object = {};
  const geometry = feature.getGeometry();
  if (geometry) {
    object['geometry'] = writeGeometry(geometry, opt_options);
    if (opt_options && opt_options.featureProjection) {
      object['geometry']['spatialReference'] = /** @type {EsriJSONCRS} */({
        wkid: getProjection(opt_options.featureProjection).getCode().split(':').pop()
      });
    }
  }
  const properties = feature.getProperties();
  delete properties[feature.getGeometryName()];
  if (!isEmpty(properties)) {
    object['attributes'] = properties;
  } else {
    object['attributes'] = {};
  }
  return object;
};


/**
 * Encode an array of features as EsriJSON.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} EsriJSON.
 * @api
 */
EsriJSON.prototype.writeFeatures;


/**
 * Encode an array of features as a EsriJSON object.
 *
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {Object} EsriJSON Object.
 * @override
 * @api
 */
EsriJSON.prototype.writeFeaturesObject = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const objects = [];
  for (let i = 0, ii = features.length; i < ii; ++i) {
    objects.push(this.writeFeatureObject(features[i], opt_options));
  }
  return /** @type {EsriJSONFeatureCollection} */ ({
    'features': objects
  });
};

export default EsriJSON;
