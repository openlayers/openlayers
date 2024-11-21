/**
 * @module ol/format/MVT
 */
//FIXME Implement projection handling

import FeatureFormat, {transformGeometryWithOptions} from './Feature.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import PBF from 'pbf';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import Projection from '../proj/Projection.js';
import RenderFeature from '../render/Feature.js';
import {get} from '../proj.js';
import {inflateEnds} from '../geom/flat/orient.js';

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 * @typedef {Object} Options
 * @property {import('./Feature.js').FeatureToFeatureClass<FeatureType>} [featureClass] Class for features returned by
 * {@link module:ol/format/MVT~MVT#readFeatures}. Set to {@link module:ol/Feature~Feature} to get full editing and geometry
 * support at the cost of decreased rendering performance. The default is
 * {@link module:ol/render/Feature~RenderFeature}, which is optimized for rendering and hit detection.
 * @property {string} [geometryName='geometry'] Geometry name to use when creating features.
 * @property {string} [layerName='layer'] Name of the feature attribute that holds the layer name.
 * @property {Array<string>} [layers] Layers to read features from. If not provided, features will be read from all
 * @property {string} [idProperty] Optional property that will be assigned as the feature id and removed from the properties.
 * layers.
 */

/**
 * @classdesc
 * Feature format for reading data in the Mapbox MVT format.
 *
 * @template {import('../Feature.js').FeatureLike} [FeatureType=RenderFeature]
 * @extends {FeatureFormat<FeatureType>}
 * @api
 */
class MVT extends FeatureFormat {
  /**
   * @param {Options<FeatureType>} [options] Options.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @type {Projection}
     */
    this.dataProjection = new Projection({
      code: '',
      units: 'tile-pixels',
    });

    this.featureClass = options.featureClass
      ? options.featureClass
      : /** @type {import('./Feature.js').FeatureToFeatureClass<FeatureType>} */ (
          RenderFeature
        );

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
     * @type {Array<string>|null}
     */
    this.layers_ = options.layers ? options.layers : null;

    /**
     * @private
     * @type {string}
     */
    this.idProperty_ = options.idProperty;

    this.supportedMediaTypes = [
      'application/vnd.mapbox-vector-tile',
      'application/x-protobuf',
    ];
  }

  /**
   * Read the raw geometry from the pbf offset stored in a raw feature's geometry
   * property.
   * @param {PBF} pbf PBF.
   * @param {Object} feature Raw feature.
   * @param {Array<number>} flatCoordinates Array to store flat coordinates in.
   * @param {Array<number>} ends Array to store ends in.
   * @private
   */
  readRawGeometry_(pbf, feature, flatCoordinates, ends) {
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

        if (cmd === 1) {
          // moveTo
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
            flatCoordinates[currentEnd],
            flatCoordinates[currentEnd + 1],
          );
          coordsLen += 2;
        }
      } else {
        throw new Error('Invalid command found in the PBF');
      }
    }

    if (coordsLen > currentEnd) {
      ends.push(coordsLen);
      currentEnd = coordsLen;
    }
  }

  /**
   * @private
   * @param {PBF} pbf PBF
   * @param {Object} rawFeature Raw Mapbox feature.
   * @param {import("./Feature.js").ReadOptions} options Read options.
   * @return {FeatureType|null} Feature.
   */
  createFeature_(pbf, rawFeature, options) {
    const type = rawFeature.type;
    if (type === 0) {
      return null;
    }

    let feature;
    const values = rawFeature.properties;

    let id;
    if (!this.idProperty_) {
      id = rawFeature.id;
    } else {
      id = values[this.idProperty_];
      delete values[this.idProperty_];
    }

    values[this.layerName_] = rawFeature.layer.name;

    const flatCoordinates = /** @type {Array<number>} */ ([]);
    const ends = /** @type {Array<number>} */ ([]);
    this.readRawGeometry_(pbf, rawFeature, flatCoordinates, ends);

    const geometryType = getGeometryType(type, ends.length);

    if (this.featureClass === RenderFeature) {
      feature =
        new /** @type {import('./Feature.js').FeatureToFeatureClass<RenderFeature>} */ (
          this.featureClass
        )(geometryType, flatCoordinates, ends, 2, values, id);
      feature.transform(options.dataProjection);
    } else {
      let geom;
      if (geometryType == 'Polygon') {
        const endss = inflateEnds(flatCoordinates, ends);
        geom =
          endss.length > 1
            ? new MultiPolygon(flatCoordinates, 'XY', endss)
            : new Polygon(flatCoordinates, 'XY', ends);
      } else {
        geom =
          geometryType === 'Point'
            ? new Point(flatCoordinates, 'XY')
            : geometryType === 'LineString'
              ? new LineString(flatCoordinates, 'XY')
              : geometryType === 'MultiPoint'
                ? new MultiPoint(flatCoordinates, 'XY')
                : geometryType === 'MultiLineString'
                  ? new MultiLineString(flatCoordinates, 'XY', ends)
                  : null;
      }
      const ctor = /** @type {typeof import("../Feature.js").default} */ (
        this.featureClass
      );
      feature = new ctor();
      if (this.geometryName_) {
        feature.setGeometryName(this.geometryName_);
      }
      const geometry = transformGeometryWithOptions(geom, false, options);
      feature.setGeometry(geometry);
      if (id !== undefined) {
        feature.setId(id);
      }
      feature.setProperties(values, true);
    }

    return /** @type {FeatureType} */ (feature);
  }

  /**
   * @return {import("./Feature.js").Type} Format.
   * @override
   */
  getType() {
    return 'arraybuffer';
  }

  /**
   * Read all features.
   *
   * @param {ArrayBuffer} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {Array<FeatureType>} Features.
   * @api
   * @override
   */
  readFeatures(source, options) {
    const layers = this.layers_;
    options = this.adaptOptions(options);
    const dataProjection = get(options.dataProjection);
    dataProjection.setWorldExtent(options.extent);
    options.dataProjection = dataProjection;

    const pbf = new PBF(/** @type {ArrayBuffer} */ (source));
    const pbfLayers = pbf.readFields(layersPBFReader, {});
    const features = [];
    for (const name in pbfLayers) {
      if (layers && !layers.includes(name)) {
        continue;
      }
      const pbfLayer = pbfLayers[name];

      const extent = pbfLayer ? [0, 0, pbfLayer.extent, pbfLayer.extent] : null;
      dataProjection.setExtent(extent);

      for (let i = 0, ii = pbfLayer.length; i < ii; ++i) {
        const rawFeature = readRawFeature(pbf, pbfLayer, i);
        const feature = this.createFeature_(pbf, rawFeature, options);
        if (feature !== null) {
          features.push(feature);
        }
      }
    }

    return /** @type {Array<FeatureType>} */ (features);
  }

  /**
   * Read the projection from the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   * @override
   */
  readProjection(source) {
    return this.dataProjection;
  }

  /**
   * Sets the layers that features will be read from.
   * @param {Array<string>} layers Layers.
   * @api
   */
  setLayers(layers) {
    this.layers_ = layers;
  }
}

/**
 * Reader callback for parsing layers.
 * @param {number} tag The tag.
 * @param {Object} layers The layers object.
 * @param {PBF} pbf The PBF.
 */
function layersPBFReader(tag, layers, pbf) {
  if (tag === 3) {
    const layer = {
      keys: [],
      values: [],
      features: [],
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
 * @param {PBF} pbf The PBF.
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
      value =
        tag === 1
          ? pbf.readString()
          : tag === 2
            ? pbf.readFloat()
            : tag === 3
              ? pbf.readDouble()
              : tag === 4
                ? pbf.readVarint64()
                : tag === 5
                  ? pbf.readVarint()
                  : tag === 6
                    ? pbf.readSVarint()
                    : tag === 7
                      ? pbf.readBoolean()
                      : null;
    }
    layer.values.push(value);
  }
}

/**
 * Reader callback for parsing feature.
 * @param {number} tag The tag.
 * @param {Object} feature The feature object.
 * @param {PBF} pbf The PBF.
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
 * @param {PBF} pbf PBF.
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
    properties: {},
  };
  pbf.readFields(featurePBFReader, feature, end);
  return feature;
}

/**
 * @param {number} type The raw feature's geometry type
 * @param {number} numEnds Number of ends of the flat coordinates of the
 * geometry.
 * @return {import("../render/Feature.js").Type} The geometry type.
 */
function getGeometryType(type, numEnds) {
  /** @type {import("../render/Feature.js").Type} */
  let geometryType;
  if (type === 1) {
    geometryType = numEnds === 1 ? 'Point' : 'MultiPoint';
  } else if (type === 2) {
    geometryType = numEnds === 1 ? 'LineString' : 'MultiLineString';
  } else if (type === 3) {
    geometryType = 'Polygon';
    // MultiPolygon not relevant for rendering - winding order determines
    // outer rings of polygons.
  }
  return geometryType;
}

export default MVT;
