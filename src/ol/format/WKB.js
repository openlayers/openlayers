/**
 * @module ol/format/WKB
 */
import CircularString from '../geom/CircularString.js';
import CompoundCurve from '../geom/CompoundCurve.js';
import CurvePolygon from '../geom/CurvePolygon.js';
import Feature from '../Feature.js';
import FeatureFormat, {transformGeometryWithOptions} from './Feature.js';
import FormatType from './FormatType.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import MultiCurve from '../geom/MultiCurve.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {get as getProjection} from '../proj.js';

import SimpleGeometry from '../geom/SimpleGeometry.js';
import {assign} from '../obj.js';

// WKB spec: https://www.ogc.org/standards/sfa
// EWKB spec: https://raw.githubusercontent.com/postgis/postgis/2.1.0/doc/ZMSgeoms.txt

/**
 * @const
 * @enum {number}
 */
const WKBGeometryType = {
  POINT: 1,
  LINE_STRING: 2,
  POLYGON: 3,
  MULTI_POINT: 4,
  MULTI_LINE_STRING: 5,
  MULTI_POLYGON: 6,
  GEOMETRY_COLLECTION: 7,

  CIRCULAR_STRING: 8,
  COMPOUND_CURVE: 9,
  CURVE_POLYGON: 10,

  MULTI_CURVE: 11,
  /*
  MULTI_SURFACE: 12,
  CURVE: 13,
  SURFACE: 14,
  */

  POLYHEDRAL_SURFACE: 15,
  TIN: 16,
  TRIANGLE: 17,
};

class WkbReader {
  /**
   * @param {DataView} view source to read
   */
  constructor(view) {
    this.view_ = view;
    this.pos_ = 0;

    this.initialized_ = false;
    this.isLittleEndian_ = false;
    this.hasZ_ = false;
    this.hasM_ = false;
    /** @type {number} */
    this.srid_ = null;

    this.layout_ = GeometryLayout.XY;
  }

  /**
   * @return {number} value
   */
  readUint8() {
    return this.view_.getUint8(this.pos_++);
  }

  /**
   * @param {boolean} [isLittleEndian] Whether read value as little endian
   * @return {number} value
   */
  readUint32(isLittleEndian) {
    return this.view_.getUint32(
      (this.pos_ += 4) - 4,
      isLittleEndian !== undefined ? isLittleEndian : this.isLittleEndian_
    );
  }

  /**
   * @param {boolean} [isLittleEndian] Whether read value as little endian
   * @return {number} value
   */
  readDouble(isLittleEndian) {
    return this.view_.getFloat64(
      (this.pos_ += 8) - 8,
      isLittleEndian !== undefined ? isLittleEndian : this.isLittleEndian_
    );
  }

  /**
   * @return {import('../coordinate.js').Coordinate} coords for Point
   */
  readPoint() {
    /** @type import('../coordinate.js').Coordinate */
    const coords = [];

    coords.push(this.readDouble());
    coords.push(this.readDouble());
    if (this.hasZ_) {
      coords.push(this.readDouble());
    }
    if (this.hasM_) {
      coords.push(this.readDouble());
    }

    return coords;
  }

  /**
   * @return {Array<import('../coordinate.js').Coordinate>} coords for CircularString
   */
  readCircularString() {
    return this.readLineString();
  }

  /**
   * @return {Array<import('../geom/Geometry.js').default>} array of geometries
   */
  readCompoundCurve() {
    return this.readGeometryCollection();
  }

  readCurvePolygon() {
    return this.readGeometryCollection();
  }

  readMultiCurve() {
    return this.readGeometryCollection();
  }

  /**
   * @return {Array<import('../coordinate.js').Coordinate>} coords for LineString / LinearRing
   */
  readLineString() {
    const numPoints = this.readUint32();

    /** @type Array<import('../coordinate.js').Coordinate> */
    const coords = [];
    for (let i = 0; i < numPoints; i++) {
      coords.push(this.readPoint());
    }

    return coords;
  }

  /**
   * @return {Array<Array<import('../coordinate.js').Coordinate>>} coords for Polygon like
   */
  readPolygon() {
    const numRings = this.readUint32();

    /** @type Array<Array<import('../coordinate.js').Coordinate>> */
    const rings = [];
    for (let i = 0; i < numRings; i++) {
      rings.push(this.readLineString()); // as a LinearRing
    }

    return rings;
  }

  /**
   * @param {number} [expectedTypeId] Expected WKB Type ID
   * @return {number} WKB Type ID
   */
  readWkbHeader(expectedTypeId) {
    const byteOrder = this.readUint8();
    const isLittleEndian = byteOrder > 0;

    const wkbType = this.readUint32(isLittleEndian);
    const wkbTypeThousandth = Math.floor((wkbType & 0x0fffffff) / 1000);
    const hasZ =
      Boolean(wkbType & 0x80000000) ||
      wkbTypeThousandth === 1 ||
      wkbTypeThousandth === 3;
    const hasM =
      Boolean(wkbType & 0x40000000) ||
      wkbTypeThousandth === 2 ||
      wkbTypeThousandth === 3;
    const hasSRID = Boolean(wkbType & 0x20000000);
    const typeId = (wkbType & 0x0fffffff) % 1000; // Assume 1000 is an upper limit for type ID
    const layout = ['XY', hasZ ? 'Z' : '', hasM ? 'M' : ''].join('');

    const srid = hasSRID ? this.readUint32(isLittleEndian) : null;

    if (expectedTypeId !== undefined && expectedTypeId !== typeId) {
      throw new Error('Unexpected WKB geometry type ' + typeId);
    }

    if (this.initialized_) {
      // sanity checks
      if (this.isLittleEndian_ !== isLittleEndian) {
        throw new Error('Inconsistent endian');
      }
      if (this.layout_ !== layout) {
        throw new Error('Inconsistent geometry layout');
      }
      if (srid && this.srid_ !== srid) {
        throw new Error('Inconsistent coordinate system (SRID)');
      }
    } else {
      this.isLittleEndian_ = isLittleEndian;
      this.hasZ_ = hasZ;
      this.hasM_ = hasM;
      this.layout_ = layout;
      this.srid_ = srid;
      this.initialized_ = true;
    }

    return typeId;
  }

  /**
   * @param {number} typeId WKB Type ID
   * @return {any} values read
   */
  readWkbPayload(typeId) {
    switch (typeId) {
      case WKBGeometryType.POINT:
        return this.readPoint();

      case WKBGeometryType.LINE_STRING:
        return this.readLineString();

      case WKBGeometryType.POLYGON:
      case WKBGeometryType.TRIANGLE:
        return this.readPolygon();

      case WKBGeometryType.MULTI_POINT:
        return this.readMultiPoint();

      case WKBGeometryType.MULTI_LINE_STRING:
        return this.readMultiLineString();

      case WKBGeometryType.MULTI_POLYGON:
      case WKBGeometryType.POLYHEDRAL_SURFACE:
      case WKBGeometryType.TIN:
        return this.readMultiPolygon();

      case WKBGeometryType.GEOMETRY_COLLECTION:
        return this.readGeometryCollection();

      case WKBGeometryType.CIRCULAR_STRING:
        return this.readCircularString();

      case WKBGeometryType.COMPOUND_CURVE:
        return this.readCompoundCurve();

      case WKBGeometryType.CURVE_POLYGON:
        return this.readCurvePolygon();

      case WKBGeometryType.MULTI_CURVE:
        return this.readMultiCurve();

      default:
        throw new Error(
          'Unsupported WKB geometry type ' + typeId + ' is found'
        );
    }
  }

  /**
   * @param {number} expectedTypeId Expected WKB Type ID
   * @return {any} values read
   */
  readWkbBlock(expectedTypeId) {
    return this.readWkbPayload(this.readWkbHeader(expectedTypeId));
  }

  /**
   * @param {Function} reader reader function for each item
   * @param {number} [expectedTypeId] Expected WKB Type ID
   * @return {any} values read
   */
  readWkbCollection(reader, expectedTypeId) {
    const num = this.readUint32();

    const items = [];
    for (let i = 0; i < num; i++) {
      const result = reader.call(this, expectedTypeId);
      if (result) {
        items.push(result);
      }
    }

    return items;
  }

  /**
   * @return {Array<import('../coordinate.js').Coordinate>} coords for MultiPoint
   */
  readMultiPoint() {
    return this.readWkbCollection(this.readWkbBlock, WKBGeometryType.POINT);
  }

  /**
   * @return {Array<Array<import('../coordinate.js').Coordinate>>} coords for MultiLineString like
   */
  readMultiLineString() {
    return this.readWkbCollection(
      this.readWkbBlock,
      WKBGeometryType.LINE_STRING
    );
  }

  /**
   * @return {Array<Array<Array<import('../coordinate.js').Coordinate>>>} coords for MultiPolygon like
   */
  readMultiPolygon() {
    return this.readWkbCollection(this.readWkbBlock, WKBGeometryType.POLYGON);
  }

  /**
   * @return {Array<import('../geom/Geometry.js').default>} array of geometries
   */
  readGeometryCollection() {
    return this.readWkbCollection(this.readGeometry);
  }

  /**
   * @return {import('../geom/Geometry.js').default} geometry
   */
  readGeometry() {
    const typeId = this.readWkbHeader();
    const result = this.readWkbPayload(typeId);

    switch (typeId) {
      case WKBGeometryType.POINT:
        return new Point(
          /** @type {import('../coordinate.js').Coordinate} */ (result),
          this.layout_
        );

      case WKBGeometryType.LINE_STRING:
        return new LineString(
          /** @type {Array<import('../coordinate.js').Coordinate>} */ (result),
          this.layout_
        );

      case WKBGeometryType.POLYGON:
      case WKBGeometryType.TRIANGLE:
        return new Polygon(
          /** @type {Array<Array<import('../coordinate.js').Coordinate>>} */ (
            result
          ),
          this.layout_
        );

      case WKBGeometryType.MULTI_POINT:
        return new MultiPoint(
          /** @type {Array<import('../coordinate.js').Coordinate>} */ (result),
          this.layout_
        );

      case WKBGeometryType.MULTI_LINE_STRING:
        return new MultiLineString(
          /** @type {Array<Array<import('../coordinate.js').Coordinate>>} */ (
            result
          ),
          this.layout_
        );

      case WKBGeometryType.MULTI_POLYGON:
      case WKBGeometryType.POLYHEDRAL_SURFACE:
      case WKBGeometryType.TIN:
        return new MultiPolygon(
          /** @type {Array<Array<Array<import('../coordinate.js').Coordinate>>>} */ (
            result
          ),
          this.layout_
        );

      case WKBGeometryType.GEOMETRY_COLLECTION:
        return new GeometryCollection(
          /** @type {Array<import('../geom/Geometry.js').default>} */ (result)
        );

      case WKBGeometryType.CIRCULAR_STRING:
        return new CircularString(
          /** @type {Array<import('../coordinate.js').Coordinate>} */ (result),
          this.layout_
        );

      case WKBGeometryType.COMPOUND_CURVE:
        return new CompoundCurve(
          /** @type {Array<import('../geom/Geometry.js').default>} */ (result),
          this.layout_
        );

      case WKBGeometryType.CURVE_POLYGON:
        return new CurvePolygon(
          /** @type {Array<import('../geom/Geometry.js').default>} */ (result),
          this.layout_
        );

      case WKBGeometryType.MULTI_CURVE:
        return new MultiCurve(
          /** @type {Array<import('../geom/Geometry.js').default>} */ (result),
          this.layout_
        )

      default:
        return null;
    }
  }

  /**
   * @return {number} SRID in the EWKB. `null` if not defined.
   */
  getSrid() {
    return this.srid_;
  }
}

class WkbWriter {
  /**
   * @type {object}
   * @property {string} [layout] geometryLayout
   * @property {boolean} [littleEndian=true] littleEndian
   * @property {boolean} [ewkb=true] Whether writes in EWKB format
   * @property {object} [nodata] NoData value for each axes
   * @param {object} opts options
   */
  constructor(opts) {
    opts = opts || {};

    /** @type {string} */
    this.layout_ = opts.layout;
    this.isLittleEndian_ = opts.littleEndian !== false;

    this.isEWKB_ = opts.ewkb !== false;

    /** @type {Array<Array<number>>} */
    this.writeQueue_ = [];

    /**
     * @type {object}
     * @property {number} X NoData value for X
     * @property {number} Y NoData value for Y
     * @property {number} Z NoData value for Z
     * @property {number} M NoData value for M
     */
    this.nodata_ = assign({X: 0, Y: 0, Z: 0, M: 0}, opts.nodata);
  }

  /**
   * @param {number} value value
   */
  writeUint8(value) {
    this.writeQueue_.push([1, value]);
  }

  /**
   * @param {number} value value
   */
  writeUint32(value) {
    this.writeQueue_.push([4, value]);
  }

  /**
   * @param {number} value value
   */
  writeDouble(value) {
    this.writeQueue_.push([8, value]);
  }

  /**
   * @param {import('../coordinate.js').Coordinate} coords coords
   * @param {import("../geom/GeometryLayout").default} layout layout
   */
  writePoint(coords, layout) {
    /**
     * @type {object}
     * @property {number} X NoData value for X
     * @property {number} Y NoData value for Y
     * @property {number} [Z] NoData value for Z
     * @property {number} [M] NoData value for M
     */
    const coordsObj = assign.apply(
      null,
      layout.split('').map((axis, idx) => ({[axis]: coords[idx]}))
    );

    for (const axis of this.layout_) {
      this.writeDouble(
        axis in coordsObj ? coordsObj[axis] : this.nodata_[axis]
      );
    }
  }

  /**
   * @param {Array<import('../coordinate.js').Coordinate>} coords coords
   * @param {import("../geom/GeometryLayout").default} layout layout
   */
  writeLineString(coords, layout) {
    this.writeUint32(coords.length); // numPoints
    for (let i = 0; i < coords.length; i++) {
      this.writePoint(coords[i], layout);
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} rings rings
   * @param {import("../geom/GeometryLayout").default} layout layout
   */
  writePolygon(rings, layout) {
    this.writeUint32(rings.length); // numRings
    for (let i = 0; i < rings.length; i++) {
      this.writeLineString(rings[i], layout); // as a LinearRing
    }
  }

  /**
   * @param {number} wkbType WKB Type ID
   * @param {number} [srid] SRID
   */
  writeWkbHeader(wkbType, srid) {
    wkbType %= 1000; // Assume 1000 is an upper limit for type ID
    if (this.layout_.indexOf('Z') >= 0) {
      wkbType += this.isEWKB_ ? 0x80000000 : 1000;
    }
    if (this.layout_.indexOf('M') >= 0) {
      wkbType += this.isEWKB_ ? 0x40000000 : 2000;
    }
    if (this.isEWKB_ && Number.isInteger(srid)) {
      wkbType |= 0x20000000;
    }

    this.writeUint8(this.isLittleEndian_ ? 1 : 0);
    this.writeUint32(wkbType);
    if (this.isEWKB_ && Number.isInteger(srid)) {
      this.writeUint32(srid);
    }
  }

  /**
   * @param {Array<import('../coordinate.js').Coordinate>} coords coords
   * @param {string} layout layout
   */
  writeMultiPoint(coords, layout) {
    this.writeUint32(coords.length); // numItems
    for (let i = 0; i < coords.length; i++) {
      this.writeWkbHeader(1);
      this.writePoint(coords[i], layout);
    }
  }

  /**
   * @param {Array<Array<import('../coordinate.js').Coordinate>>} coords coords
   * @param {string} layout layout
   */
  writeMultiLineString(coords, layout) {
    this.writeUint32(coords.length); // numItems
    for (let i = 0; i < coords.length; i++) {
      this.writeWkbHeader(2);
      this.writeLineString(coords[i], layout);
    }
  }

  /**
   * @param {Array<Array<Array<import('../coordinate.js').Coordinate>>>} coords coords
   * @param {string} layout layout
   */
  writeMultiPolygon(coords, layout) {
    this.writeUint32(coords.length); // numItems
    for (let i = 0; i < coords.length; i++) {
      this.writeWkbHeader(3);
      this.writePolygon(coords[i], layout);
    }
  }

  /**
   * @param {Array<import('../geom/Geometry.js').default>} geometries geometries
   */
  writeGeometryCollection(geometries) {
    this.writeUint32(geometries.length); // numItems

    for (let i = 0; i < geometries.length; i++) {
      this.writeGeometry(geometries[i]);
    }
  }

  /**
   * @param {import("../geom/Geometry.js").default} geom geometry
   * @param {import("../geom/GeometryLayout.js").default} [layout] layout
   * @return {import("../geom/GeometryLayout.js").default} minumum layout made by common axes
   */
  findMinimumLayout(geom, layout = GeometryLayout.XYZM) {
    /**
     * @param {import("../geom/GeometryLayout.js").default} a A
     * @param {import("../geom/GeometryLayout.js").default} b B
     * @return {import("../geom/GeometryLayout.js").default} minumum layout made by common axes
     */
    const GeometryLayout_min = (a, b) => {
      if (a === b) {
        return a;
      }

      if (a === GeometryLayout.XYZM) {
        // anything `b` is minimum
        return b;
      }
      if (b === GeometryLayout.XYZM) {
        // anything `a` is minimum
        return a;
      }

      // otherwise, incompatible
      return GeometryLayout.XY;
    };

    if (geom instanceof SimpleGeometry) {
      return GeometryLayout_min(geom.getLayout(), layout);
    }

    if (geom instanceof GeometryCollection) {
      const geoms = geom.getGeometriesArray();
      for (let i = 0; i < geoms.length && layout !== GeometryLayout.XY; i++) {
        layout = this.findMinimumLayout(geoms[i], layout);
      }
    }

    return layout;
  }

  /**
   * @param {import("../geom/Geometry.js").default} geom geometry
   * @param {number} [srid] SRID
   */
  writeGeometry(geom, srid) {
    const wkblut = {
      [GeometryType.POINT]: WKBGeometryType.POINT,
      [GeometryType.LINE_STRING]: WKBGeometryType.LINE_STRING,
      [GeometryType.POLYGON]: WKBGeometryType.POLYGON,
      [GeometryType.MULTI_POINT]: WKBGeometryType.MULTI_POINT,
      [GeometryType.MULTI_LINE_STRING]: WKBGeometryType.MULTI_LINE_STRING,
      [GeometryType.MULTI_POLYGON]: WKBGeometryType.MULTI_POLYGON,
      [GeometryType.GEOMETRY_COLLECTION]: WKBGeometryType.GEOMETRY_COLLECTION,
    };
    const geomType = geom.getType();
    const typeId = wkblut[geomType];

    if (!typeId) {
      throw new Error('GeometryType ' + geomType + ' is not supported');
    }

    // first call of writeGeometry() traverse whole geometries to determine its output layout if not specified on constructor.
    if (!this.layout_) {
      this.layout_ = this.findMinimumLayout(geom);
    }

    this.writeWkbHeader(typeId, srid);

    if (geom instanceof SimpleGeometry) {
      const writerLUT = {
        [GeometryType.POINT]: this.writePoint,
        [GeometryType.LINE_STRING]: this.writeLineString,
        [GeometryType.POLYGON]: this.writePolygon,
        [GeometryType.MULTI_POINT]: this.writeMultiPoint,
        [GeometryType.MULTI_LINE_STRING]: this.writeMultiLineString,
        [GeometryType.MULTI_POLYGON]: this.writeMultiPolygon,
      };
      writerLUT[geomType].call(this, geom.getCoordinates(), geom.getLayout());
    } else if (geom instanceof GeometryCollection) {
      this.writeGeometryCollection(geom.getGeometriesArray());
    }
  }

  getBuffer() {
    const byteLength = this.writeQueue_.reduce((acc, item) => acc + item[0], 0);
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    let pos = 0;
    this.writeQueue_.forEach((item) => {
      switch (item[0]) {
        case 1:
          view.setUint8(pos, item[1]);
          break;
        case 4:
          view.setUint32(pos, item[1], this.isLittleEndian_);
          break;
        case 8:
          view.setFloat64(pos, item[1], this.isLittleEndian_);
          break;
        default:
          break;
      }

      pos += item[0];
    });

    return buffer;
  }
}

/**
 * @typedef {Object} Options
 * @property {boolean} [splitCollection=false] Whether to split GeometryCollections into multiple features on reading.
 * @property {boolean} [hex=true] Returns hex string instead of ArrayBuffer for output. This also is used as a hint internally whether it should load contents as text or ArrayBuffer on reading.
 * @property {boolean} [littleEndian=true] Use littleEndian for output.
 * @property {boolean} [ewkb=true] Use EWKB format for output.
 * @property {import("../geom/GeometryLayout").default} [geometryLayout=null] Use specific coordinate layout for output features (null: auto detect)
 * @property {number} [nodataZ=0] If the `geometryLayout` doesn't match with geometry to be output, this value is used to fill missing coordinate value of Z.
 * @property {number} [nodataM=0] If the `geometryLayout` doesn't match with geometry to be output, this value is used to fill missing coordinate value of M.
 * @property {number|boolean} [srid=true] SRID for output. Specify integer value to enforce the value as a SRID. Specify `true` to extract from `dataProjection`. `false` to suppress the output. This option only takes effect when `ewkb` is `true`.
 */

/**
 * @classdesc
 * Geometry format for reading and writing data in the `Well-Known Binary` (WKB) format.
 * Also supports `Extended Well-Known Binary` (EWKB) format, used in PostGIS for example.
 *
 * @api
 */
class WKB extends FeatureFormat {
  /**
   * @param {Options} [opt_options] Optional configuration object.
   */
  constructor(opt_options) {
    super();

    const options = opt_options ? opt_options : {};

    this.splitCollection = Boolean(options.splitCollection);

    this.viewCache_ = null;

    this.hex_ = options.hex !== false;
    this.littleEndian_ = options.littleEndian !== false;
    this.ewkb_ = options.ewkb !== false;

    this.layout_ = options.geometryLayout; // null for auto detect
    this.nodataZ_ = options.nodataZ || 0;
    this.nodataM_ = options.nodataM || 0;

    this.srid_ = options.srid;
  }

  /**
   * @return {import("./FormatType.js").default} Format.
   */
  getType() {
    return this.hex_ ? FormatType.TEXT : FormatType.ARRAY_BUFFER;
  }

  /**
   * Read a single feature from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
   * @return {import("../Feature.js").FeatureLike} Feature.
   * @api
   */
  readFeature(source, opt_options) {
    return new Feature({
      geometry: this.readGeometry(source, opt_options),
    });
  }

  /**
   * Read all features from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
   * @return {Array<import("../Feature.js").FeatureLike>} Features.
   * @api
   */
  readFeatures(source, opt_options) {
    let geometries = [];
    const geometry = this.readGeometry(source, opt_options);
    if (this.splitCollection && geometry instanceof GeometryCollection) {
      geometries = geometry.getGeometriesArray();
    } else {
      geometries = [geometry];
    }
    return geometries.map((geometry) => new Feature({geometry}));
  }

  /**
   * Read a single geometry from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @api
   */
  readGeometry(source, opt_options) {
    const view = getDataView(source);
    if (!view) {
      return null;
    }

    const reader = new WkbReader(view);
    const geometry = reader.readGeometry();

    this.viewCache_ = view; // cache for internal subsequent call of readProjection()
    const options = this.getReadOptions(source, opt_options);
    this.viewCache_ = null; // release

    return transformGeometryWithOptions(geometry, false, options);
  }

  /**
   * Read the projection from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @return {import("../proj/Projection.js").default|undefined} Projection.
   * @api
   */
  readProjection(source) {
    const view = this.viewCache_ || getDataView(source);
    if (!view) {
      return undefined;
    }

    const reader = new WkbReader(view);
    reader.readWkbHeader();

    return (
      (reader.getSrid() && getProjection('EPSG:' + reader.getSrid())) ||
      undefined
    );
  }

  /**
   * Encode a feature in this format.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeFeature(feature, opt_options) {
    return this.writeGeometry(feature.getGeometry(), opt_options);
  }

  /**
   * Encode an array of features in this format.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeFeatures(features, opt_options) {
    return this.writeGeometry(
      new GeometryCollection(features.map((f) => f.getGeometry())),
      opt_options
    );
  }

  /**
   * Write a single geometry in this format.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeGeometry(geometry, opt_options) {
    const options = this.adaptOptions(opt_options);

    const writer = new WkbWriter({
      layout: this.layout_,
      littleEndian: this.littleEndian_,
      ewkb: this.ewkb_,

      nodata: {
        Z: this.nodataZ_,
        M: this.nodataM_,
      },
    });

    // extract SRID from `dataProjection`
    let srid = Number.isInteger(this.srid_) ? Number(this.srid_) : null;
    if (this.srid_ !== false && !Number.isInteger(this.srid_)) {
      const dataProjection =
        options.dataProjection && getProjection(options.dataProjection);
      if (dataProjection) {
        const code = dataProjection.getCode();
        if (code.indexOf('EPSG:') === 0) {
          srid = Number(code.substring(5));
        }
      }
    }

    writer.writeGeometry(
      transformGeometryWithOptions(geometry, true, options),
      srid
    );
    const buffer = writer.getBuffer();

    return this.hex_ ? encodeHexString(buffer) : buffer;
  }
}

/**
 * @param {ArrayBuffer} buffer source buffer
 * @return {string} encoded hex string
 */
function encodeHexString(buffer) {
  const view = new Uint8Array(buffer);
  return Array.from(view.values())
    .map((x) => (x < 16 ? '0' : '') + Number(x).toString(16).toUpperCase())
    .join('');
}

/**
 * @param {string} text source text
 * @return {DataView} decoded binary buffer
 */
function decodeHexString(text) {
  const buffer = new Uint8Array(text.length / 2);
  for (let i = 0; i < text.length / 2; i++) {
    buffer[i] = parseInt(text.substr(i * 2, 2), 16);
  }
  return new DataView(buffer.buffer);
}

/**
 * @param {string | ArrayBuffer | ArrayBufferView} source source
 * @return {DataView} data view
 */
function getDataView(source) {
  if (typeof source === 'string') {
    return decodeHexString(source);
  } else if (ArrayBuffer.isView(source)) {
    if (source instanceof DataView) {
      return source;
    }
    return new DataView(source.buffer, source.byteOffset, source.byteLength);
  } else if (source instanceof ArrayBuffer) {
    return new DataView(source);
  } else {
    return null;
  }
}

export default WKB;
