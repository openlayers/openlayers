goog.provide('ol.Raster');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.has');
goog.require('ol.Object');
goog.require('ol.RasterType');

if (ol.ENABLE_RASTER) {

  /**
   * @classdesc Basic container for raw, binary raster data.
   * @constructor
   * @extends {ol.Object}
   * @param {ArrayBuffer|Array.<number>} raster Raster data.
   * @param {number} stride Number of columns.
   * @param {ol.Size} resolution Cell resolution.
   */
  ol.Raster = function(raster, stride, resolution) {

    ol.Object.call(this);

    /**
     * @type {ArrayBuffer|Array.<number>}
     * @private
     */
    this.raster_ = raster;

    /**
     * @type {number}
     * @private
     */
    this.stride_ = stride;

    /**
     * @type {ol.Size}
     * @private
     */
    this.resolution_ = resolution;

    /**
     * @type {boolean}
     * @private
     */
    this.binary_ = !(Array.isArray(raster));
  };
  ol.inherits(ol.Raster, ol.Object);


  /**
   * @param {ol.RasterType=} type Return an array with the specified type.
   * @return {ArrayBuffer|ol.TypedArray|Array.<number>} Raster data.
   */
  ol.Raster.prototype.getRaster = function(type) {
    if (this.binary_) {
      return type ? this.asArray_(type) : this.raster_;
    } else {
      return this.raster_;
    }
  };


  /**
   * @return {number} Stride.
   */
  ol.Raster.prototype.getStride = function() {
    return this.stride_;
  };


  /**
   * @return {ol.Size} Resolution.
   */
  ol.Raster.prototype.getResolution = function() {
    return this.resolution_;
  };


  /**
   * @param {ol.RasterType} type Type of the raster.
   * @return {ol.TypedArray} Array.
   * @private
   */
  ol.Raster.prototype.asArray_ = function(type) {
    var view = ol.Raster.getArrayConstructor(type);
    return new view(this.raster_);
  };


  /**
   * @param {ol.RasterType} type Raster type.
   * @return {?} Typed array constructor.
   * @api
   */
  ol.Raster.getArrayConstructor = function(type) {
    if (ol.has.TYPED_ARRAY) {
      ol.asserts.assert(type in ol.Raster.typeMap_, 61);
      return ol.Raster.typeMap_[type];
    }
  };


  /**
   * @return {Object} Type map.
   * @private
   */
  ol.Raster.typeMap_ = function() {
    var typeMap = {};
    if (ol.has.TYPED_ARRAY) {
      typeMap[ol.RasterType.UINT8] = window.Uint8Array;
      typeMap[ol.RasterType.INT8] = window.Int8Array;
      typeMap[ol.RasterType.UINT16] = window.Uint16Array;
      typeMap[ol.RasterType.INT16] = window.Int16Array;
      typeMap[ol.RasterType.UINT32] = window.Uint32Array;
      typeMap[ol.RasterType.INT32] = window.Int32Array;
      typeMap[ol.RasterType.FLOAT32] = window.Float32Array;
      typeMap[ol.RasterType.FLOAT64] = window.Float64Array;
    }
    return typeMap;
  }();

}
