// FIXME add 7 GeometryCollection
// FIXME add 24 MultiGeometryCollection
// FIXME add 25 topo linestring
// FIXME add 26 topo polygon

goog.provide('ol.format.TWKB');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.format.BinaryFeature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.BinaryFeature}
 * @param {olx.format.TWKBOptions=} opt_options Options.
 */
ol.format.TWKB = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.defaultProjection_ = ol.proj.get(goog.isDef(options.defaultProjection) ?
      options.defaultProjection : 'EPSG:4326');

  /**
   * @private
   * @type {ol.binary.IReader}
   */
  this.reader_ = null;

  /**
   * @private
   * @type {boolean}
   */
  this.hasId_ = false;

  /**
   * @private
   * @type {number}
   */
  this.serializationMethod_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.scale_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.stride_ = 0;

};
goog.inherits(ol.format.TWKB, ol.format.BinaryFeature);


/**
 * @param {function(this: ol.format.TWKB): ol.Feature} featureReader Feature
 *     reader.
 * @private
 * @return {function(this: ol.format.TWKB, Array.<ol.Feature>)} Features reader.
 */
ol.format.TWKB.makeFeaturePusher_ = function(featureReader) {
  return (
      /**
       * @param {Array.<ol.Feature>} features Features.
       * @this {ol.format.TWKB}
       */
      function(features) {
        return features.push(featureReader.call(this));
      });
};


/**
 * @param {function(this: ol.format.TWKB): ol.Feature} featureReader Feature
 *     reader.
 * @private
 * @return {function(this: ol.format.TWKB, Array.<ol.Feature>)} Feature pusher.
 */
ol.format.TWKB.makeMultiFeaturePusher_ = function(featureReader) {
  return (
      /**
       * @param {Array.<ol.Feature>} features Features.
       * @this {ol.format.TWKB}
       */
      function(features) {
        var i, ii;
        for (i = 0, ii = this.readVarInt64_(); i < ii; ++i) {
          features.push(featureReader.call(this));
        }
      });
};


/**
 * @param {function(this: ol.format.TWKB): ol.geom.Geometry} geometryReader
 *     Geometry reader.
 * @private
 * @return {function(this: ol.format.TWKB): ol.Feature} Feature reader.
 */
ol.format.TWKB.makeFeatureReader_ = function(geometryReader) {
  return (
      /**
       * @return {ol.Feature} Feature.
       * @this {ol.format.TWKB}
       */
      function() {
        var id;
        if (this.hasId_) {
          id = this.readVarInt64_();
        }
        var feature = new ol.Feature(geometryReader.call(this));
        if (goog.isDef(id)) {
          feature.setId(id);
        }
        return feature;
      });
};


/**
 * @private
 * @return {ol.geom.LineString} LineString.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readLineStringGeometry_ = function() {
  var flatCoordinates = this.readFlatCoordinates_([]);
  var geometry = new ol.geom.LineString(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates));
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readLineStringFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readLineStringGeometry_);


/**
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiLineStringGeometry_ = function() {
  /** @type {Array.<number>} */
  var ends = [];
  var flatCoordinates = this.readFlatCoordinatess_([], ends);
  var geometry = new ol.geom.MultiLineString(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates), ends);
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiLineStringFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readMultiLineStringGeometry_);


/**
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiPointGeometry_ = function() {
  var flatCoordinates = this.readFlatCoordinates_([]);
  var geometry = new ol.geom.MultiPoint(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates));
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiPointFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readMultiPointGeometry_);


/**
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiPolygonGeometry_ = function() {
  /** @type {Array.<Array.<number>>} */
  var endss = [];
  var flatCoordinates = this.readFlatCoordinatesss_([], endss);
  var geometry = new ol.geom.MultiPolygon(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates), endss);
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readMultiPolygonFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readMultiPolygonGeometry_);


/**
 * @private
 * @return {ol.geom.Point} Point.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readPointGeometry_ = function() {
  var flatCoordinates = this.readNFlatCoordinates_(1, []);
  var geometry = new ol.geom.Point(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates));
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readPointFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readPointGeometry_);


/**
 * @private
 * @return {ol.geom.Polygon} Polygon.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readPolygonGeometry_ = function() {
  /** @type {Array.<number>} */
  var ends = [];
  var flatCoordinates = this.readFlatCoordinatess_([], ends);
  var geometry = new ol.geom.Polygon(null);
  geometry.setFlatCoordinates(
      this.layout_, this.scaleFlatCoordinates(flatCoordinates), ends);
  return geometry;
};


/**
 * @private
 * @return {ol.Feature} Feature.
 * @this {ol.format.TWKB}
 */
ol.format.TWKB.readPolygonFeature_ =
    ol.format.TWKB.makeFeatureReader_(
        ol.format.TWKB.readPolygonGeometry_);


/**
 * @private
 * @type {Object.<number, function(this: ol.format.TWKB, Array.<ol.Feature>)>}
 */
ol.format.TWKB.FEATURES_PUSHER_ = {
  1: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readPointFeature_),
  2: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readLineStringFeature_),
  3: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readPolygonFeature_),
  4: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readMultiPointFeature_),
  5: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readMultiLineStringFeature_),
  6: ol.format.TWKB.makeFeaturePusher_(
      ol.format.TWKB.readMultiPolygonFeature_),
  21: ol.format.TWKB.makeMultiFeaturePusher_(
      ol.format.TWKB.readPointFeature_),
  22: ol.format.TWKB.makeMultiFeaturePusher_(
      ol.format.TWKB.readLineStringFeature_),
  23: ol.format.TWKB.makeMultiFeaturePusher_(
      ol.format.TWKB.readPolygonFeature_)
};


/**
 * @private
 * @return {boolean} At EOF.
 */
ol.format.TWKB.prototype.atEOF_ = function() {
  goog.asserts.assert(!goog.isNull(this.reader_));
  return this.reader_.atEOF();
};


/**
 * @private
 * @return {number} Byte
 */
ol.format.TWKB.prototype.readByte_ = function() {
  goog.asserts.assert(!goog.isNull(this.reader_));
  return this.reader_.readByte();
};


/**
 * @param {number} n N.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.TWKB.prototype.readNFlatCoordinates_ = function(n, flatCoordinates) {
  if (n === 0) {
    return flatCoordinates;
  }
  var i, ii;
  var offset = flatCoordinates.length;
  var stride = this.stride_;
  if (offset === 0) {
    for (i = 0; i < stride; ++i) {
      flatCoordinates.push(this.readSVarInt64_());
    }
    offset += stride;
    --n;
  }
  for (i = offset, ii = offset + n * stride; i < ii; ++i) {
    flatCoordinates.push(flatCoordinates[i - stride] + this.readSVarInt64_());
  }
  return flatCoordinates;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.TWKB.prototype.readFlatCoordinates_ = function(flatCoordinates) {
  return this.readNFlatCoordinates_(this.readVarInt64_(), flatCoordinates);
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>} ends Ends.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.TWKB.prototype.readFlatCoordinatess_ =
    function(flatCoordinates, ends) {
  var i, ii;
  for (i = 0, ii = this.readVarInt64_(); i < ii; ++i) {
    ends.push(this.readFlatCoordinates_(flatCoordinates).length);
  }
  return flatCoordinates;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} endss Endss.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.TWKB.prototype.readFlatCoordinatesss_ =
    function(flatCoordinates, endss) {
  var i, ii;
  for (i = 0, ii = this.readVarInt64_(); i < ii; ++i) {
    /** @type {Array.<number>} */
    var ends = [];
    this.readFlatCoordinatess_(flatCoordinates, ends);
    endss.push(ends);
  }
  return flatCoordinates;
};


/**
 * @inheritDoc
 */
ol.format.TWKB.prototype.readFeaturesFromBuffer = function(buffer) {

  goog.asserts.assert(goog.isNull(this.reader_));
  this.reader_ = buffer.getReader();
  /** @type {Array.<ol.Feature>} */
  var features = [];

  while (!this.atEOF_()) {

    var b = this.readByte_();
    this.hasId_ = (b & 0x01) == 1;
    this.serializationMethod_ = (b >> 1) & 0x07;
    goog.asserts.assert(this.serializationMethod_ == 1);
    this.scale_ = Math.pow(10, b >> 4);

    b = this.readByte_();
    var type = b & 0x1f;
    this.stride_ = b >> 5;
    switch (this.stride_) {
      case 2:
        this.layout_ = ol.geom.GeometryLayout.XY;
        break;
      case 3:
        this.layout_ = ol.geom.GeometryLayout.XYZ;
        break;
      case 4:
        this.layout_ = ol.geom.GeometryLayout.XYZM;
        break;
      default:
        goog.asserts.fail();
    }

    var featuresPusher = ol.format.TWKB.FEATURES_PUSHER_[type];
    goog.asserts.assert(goog.isDef(featuresPusher));
    featuresPusher.call(this, features);

  }

  this.reader_ = null;
  return features;

};


/**
 * @inheritDoc
 */
ol.format.TWKB.prototype.readProjectionFromBuffer = function(buffer) {
  return this.defaultProjection_;
};


/**
 * @private
 * @return {number} SVarInt64.
 */
ol.format.TWKB.prototype.readSVarInt64_ = function() {
  var varInt64 = this.readVarInt64_();
  if (varInt64 & 1) {
    return -(varInt64 >> 1) - 1;
  } else {
    return varInt64 >> 1;
  }
};


/**
 * @private
 * @return {number} VarInt64.
 */
ol.format.TWKB.prototype.readVarInt64_ = function() {
  var result = 0;
  var shift = 0;
  var i;
  for (i = 0; i < 8; ++i) {
    var b = this.readByte_();
    if (b & 0x80) {
      result |= (b & 0x7f) << shift;
      shift += 7;
    } else {
      return result | (b & 0x7f) << shift;
    }
  }
  return result;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.TWKB.prototype.scaleFlatCoordinates = function(flatCoordinates) {
  var scale = this.scale_;
  var i, ii;
  for (i = 0, ii = flatCoordinates.length; i < ii; ++i) {
    flatCoordinates[i] /= scale;
  }
  return flatCoordinates;
};
