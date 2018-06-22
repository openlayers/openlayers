/**
 * @module ol/format/MVT
 */
//FIXME Implement projection handling

import {inherits} from '../util.js';
import {assert} from '../asserts.js';
import PBF from 'pbf';
import FeatureFormat, {transformWithOptions} from '../format/Feature.js';
import FormatType from '../format/FormatType.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {linearRingIsClockwise} from '../geom/flat/orient.js';
import Projection from '../proj/Projection.js';
import Units from '../proj/Units.js';
import RenderFeature from '../render/Feature.js';


/**
 * @typedef {Object} Options
 * @property {function((module:ol/geom/Geometry|Object.<string,*>)=)|function(module:ol/geom/GeometryType,Array.<number>,(Array.<number>|Array.<Array.<number>>),Object.<string,*>,number)} [featureClass]
 * Class for features returned by {@link module:ol/format/MVT#readFeatures}. Set to
 * {@link module:ol/Feature~Feature} to get full editing and geometry support at the cost of
 * decreased rendering performance. The default is {@link module:ol/render/Feature~RenderFeature},
 * which is optimized for rendering and hit detection.
 * @property {string} [geometryName='geometry'] Geometry name to use when creating
 * features.
 * @property {string} [layerName='layer'] Name of the feature attribute that
 * holds the layer name.
 * @property {Array.<string>} [layers] Layers to read features from. If not
 * provided, features will be read from all layers.
 */


/**
 * @classdesc
 * Feature format for reading data in the Mapbox MVT format.
 *
 * @constructor
 * @extends {module:ol/format/Feature}
 * @param {module:ol/format/MVT~Options=} opt_options Options.
 * @api
 */
const MVT = function(opt_options) {

  FeatureFormat.call(this);

  const options = opt_options ? opt_options : {};

  /**
   * @type {module:ol/proj/Projection}
   */
  this.dataProjection = new Projection({
    code: '',
    units: Units.TILE_PIXELS
  });

  /**
   * @private
   * @type {function((module:ol/geom/Geometry|Object.<string,*>)=)|
   *     function(module:ol/geom/GeometryType,Array.<number>,
   *         (Array.<number>|Array.<Array.<number>>),Object.<string,*>,number)}
   */
  this.featureClass_ = options.featureClass ?
    options.featureClass : RenderFeature;

  /**
   * @private
   * @type {string|undefined}
   */
  this.geometryName_ = options.geometryName;

  /**
   * @private
   * @type {string}
   */
  this.layerName_ = options.layerName ? options.layerName : 'layer';

  /**
   * @private
   * @type {Array.<string>}
   */
  this.layers_ = options.layers ? options.layers : null;

  /**
   * @private
   * @type {module:ol/extent~Extent}
   */
  this.extent_ = null;

};

inherits(MVT, FeatureFormat);


/**
 * Reader callback for parsing layers.
 * @param {number} tag The tag.
 * @param {Object} layers The layers object.
 * @param {Object} pbf The PBF.
 */
function layersPBFReader(tag, layers, pbf) {
  if (tag === 3) {
    const layer = {
      keys: [],
      values: [],
      features: []
    };
    const end = pbf.readVarint() + pbf.pos;
    pbf.readFields(layerPBFReader, layer, end);
    layer.length = layer.features.length;
    if (layer.length) {
      layers[layer.name] = layer;
    }
  }
}

/**
 * Reader callback for parsing layer.
 * @param {number} tag The tag.
 * @param {Object} layer The layer object.
 * @param {Object} pbf The PBF.
 */
function layerPBFReader(tag, layer, pbf) {
  if (tag === 15) {
    layer.version = pbf.readVarint();
  } else if (tag === 1) {
    layer.name = pbf.readString();
  } else if (tag === 5) {
    layer.extent = pbf.readVarint();
  } else if (tag === 2) {
    layer.features.push(pbf.pos);
  } else if (tag === 3) {
    layer.keys.push(pbf.readString());
  } else if (tag === 4) {
    let value = null;
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      tag = pbf.readVarint() >> 3;
      value = tag === 1 ? pbf.readString() :
        tag === 2 ? pbf.readFloat() :
          tag === 3 ? pbf.readDouble() :
            tag === 4 ? pbf.readVarint64() :
              tag === 5 ? pbf.readVarint() :
                tag === 6 ? pbf.readSVarint() :
                  tag === 7 ? pbf.readBoolean() : null;
    }
    layer.values.push(value);
  }
}

/**
 * Reader callback for parsing feature.
 * @param {number} tag The tag.
 * @param {Object} feature The feature object.
 * @param {Object} pbf The PBF.
 */
function featurePBFReader(tag, feature, pbf) {
  if (tag == 1) {
    feature.id = pbf.readVarint();
  } else if (tag == 2) {
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      const key = feature.layer.keys[pbf.readVarint()];
      const value = feature.layer.values[pbf.readVarint()];
      feature.properties[key] = value;
    }
  } else if (tag == 3) {
    feature.type = pbf.readVarint();
  } else if (tag == 4) {
    feature.geometry = pbf.pos;
  }
}


/**
 * Read a raw feature from the pbf offset stored at index `i` in the raw layer.
 * @suppress {missingProperties}
 * @param {Object} pbf PBF.
 * @param {Object} layer Raw layer.
 * @param {number} i Index of the feature in the raw layer's `features` array.
 * @return {Object} Raw feature.
 */
function readRawFeature(pbf, layer, i) {
  pbf.pos = layer.features[i];
  const end = pbf.readVarint() + pbf.pos;

  const feature = {
    layer: layer,
    type: 0,
    properties: {}
  };
  pbf.readFields(featurePBFReader, feature, end);
  return feature;
}


/**
 * Read the raw geometry from the pbf offset stored in a raw feature's geometry
 * property.
 * @suppress {missingProperties}
 * @param {Object} pbf PBF.
 * @param {Object} feature Raw feature.
 * @param {Array.<number>} flatCoordinates Array to store flat coordinates in.
 * @param {Array.<number>} ends Array to store ends in.
 * @private
 */
MVT.prototype.readRawGeometry_ = function(pbf, feature, flatCoordinates, ends) {
  pbf.pos = feature.geometry;

  const end = pbf.readVarint() + pbf.pos;
  let cmd = 1;
  let length = 0;
  let x = 0;
  let y = 0;
  let coordsLen = 0;
  let currentEnd = 0;

  while (pbf.pos < end) {
    if (!length) {
      const cmdLen = pbf.readVarint();
      cmd = cmdLen & 0x7;
      length = cmdLen >> 3;
    }

    length--;

    if (cmd === 1 || cmd === 2) {
      x += pbf.readSVarint();
      y += pbf.readSVarint();

      if (cmd === 1) { // moveTo
        if (coordsLen > currentEnd) {
          ends.push(coordsLen);
          currentEnd = coordsLen;
        }
      }

      flatCoordinates.push(x, y);
      coordsLen += 2;

    } else if (cmd === 7) {

      if (coordsLen > currentEnd) {
        // close polygon
        flatCoordinates.push(
          flatCoordinates[currentEnd], flatCoordinates[currentEnd + 1]);
        coordsLen += 2;
      }

    } else {
      assert(false, 59); // Invalid command found in the PBF
    }
  }

  if (coordsLen > currentEnd) {
    ends.push(coordsLen);
    currentEnd = coordsLen;
  }

};


/**
 * @suppress {missingProperties}
 * @param {number} type The raw feature's geometry type
 * @param {number} numEnds Number of ends of the flat coordinates of the
 * geometry.
 * @return {module:ol/geom/GeometryType} The geometry type.
 */
function getGeometryType(type, numEnds) {
  /** @type {module:ol/geom/GeometryType} */
  let geometryType;
  if (type === 1) {
    geometryType = numEnds === 1 ?
      GeometryType.POINT : GeometryType.MULTI_POINT;
  } else if (type === 2) {
    geometryType = numEnds === 1 ?
      GeometryType.LINE_STRING :
      GeometryType.MULTI_LINE_STRING;
  } else if (type === 3) {
    geometryType = GeometryType.POLYGON;
    // MultiPolygon not relevant for rendering - winding order determines
    // outer rings of polygons.
  }
  return geometryType;
}

/**
 * @private
 * @param {Object} pbf PBF
 * @param {Object} rawFeature Raw Mapbox feature.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature|module:ol/render/Feature} Feature.
 */
MVT.prototype.createFeature_ = function(pbf, rawFeature, opt_options) {
  const type = rawFeature.type;
  if (type === 0) {
    return null;
  }

  let feature;
  const id = rawFeature.id;
  const values = rawFeature.properties;
  values[this.layerName_] = rawFeature.layer.name;

  const flatCoordinates = [];
  let ends = [];
  this.readRawGeometry_(pbf, rawFeature, flatCoordinates, ends);

  const geometryType = getGeometryType(type, ends.length);

  if (this.featureClass_ === RenderFeature) {
    feature = new this.featureClass_(geometryType, flatCoordinates, ends, values, id);
  } else {
    let geom;
    if (geometryType == GeometryType.POLYGON) {
      const endss = [];
      let offset = 0;
      let prevEndIndex = 0;
      for (let i = 0, ii = ends.length; i < ii; ++i) {
        const end = ends[i];
        if (!linearRingIsClockwise(flatCoordinates, offset, end, 2)) {
          endss.push(ends.slice(prevEndIndex, i));
          prevEndIndex = i;
        }
        offset = end;
      }
      if (endss.length > 1) {
        ends = endss;
        geom = new MultiPolygon(null);
      } else {
        geom = new Polygon(null);
      }
    } else {
      geom = geometryType === GeometryType.POINT ? new Point(null) :
        geometryType === GeometryType.LINE_STRING ? new LineString(null) :
          geometryType === GeometryType.POLYGON ? new Polygon(null) :
            geometryType === GeometryType.MULTI_POINT ? new MultiPoint (null) :
              geometryType === GeometryType.MULTI_LINE_STRING ? new MultiLineString(null) :
                null;
    }
    geom.setFlatCoordinates(GeometryLayout.XY, flatCoordinates, ends);
    feature = new this.featureClass_();
    if (this.geometryName_) {
      feature.setGeometryName(this.geometryName_);
    }
    const geometry = transformWithOptions(geom, false, this.adaptOptions(opt_options));
    feature.setGeometry(geometry);
    feature.setId(id);
    feature.setProperties(values);
  }

  return feature;
};


/**
 * @inheritDoc
 * @api
 */
MVT.prototype.getLastExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
MVT.prototype.getType = function() {
  return FormatType.ARRAY_BUFFER;
};


/**
 * @inheritDoc
 * @api
 */
MVT.prototype.readFeatures = function(source, opt_options) {
  const layers = this.layers_;

  const pbf = new PBF(/** @type {ArrayBuffer} */ (source));
  const pbfLayers = pbf.readFields(layersPBFReader, {});
  /** @type {Array.<module:ol/Feature|module:ol/render/Feature>} */
  const features = [];
  for (const name in pbfLayers) {
    if (layers && layers.indexOf(name) == -1) {
      continue;
    }
    const pbfLayer = pbfLayers[name];

    for (let i = 0, ii = pbfLayer.length; i < ii; ++i) {
      const rawFeature = readRawFeature(pbf, pbfLayer, i);
      features.push(this.createFeature_(pbf, rawFeature));
    }
    this.extent_ = pbfLayer ? [0, 0, pbfLayer.extent, pbfLayer.extent] : null;
  }

  return features;
};


/**
 * @inheritDoc
 * @api
 */
MVT.prototype.readProjection = function(source) {
  return this.dataProjection;
};


/**
 * Sets the layers that features will be read from.
 * @param {Array.<string>} layers Layers.
 * @api
 */
MVT.prototype.setLayers = function(layers) {
  this.layers_ = layers;
};


/**
 * Not implemented.
 * @override
 */
MVT.prototype.readFeature = function() {};


/**
 * Not implemented.
 * @override
 */
MVT.prototype.readGeometry = function() {};


/**
 * Not implemented.
 * @override
 */
MVT.prototype.writeFeature = function() {};


/**
 * Not implemented.
 * @override
 */
MVT.prototype.writeGeometry = function() {};


/**
 * Not implemented.
 * @override
 */
MVT.prototype.writeFeatures = function() {};
export default MVT;
