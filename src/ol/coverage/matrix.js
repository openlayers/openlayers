goog.provide('ol.coverage.Matrix');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.has');
goog.require('ol.Object');
goog.require('ol.coverage.MatrixType');

if (ol.ENABLE_COVERAGE) {

  /**
   * @classdesc Basic container for raw, binary coverage data.
   * @constructor
   * @extends {ol.Object}
   * @param {ArrayBuffer|Array.<number>} matrix Coverage data.
   * @param {number} stride Number of columns.
   * @param {ol.Size} resolution Cell resolution.
   * @param {boolean} binary This is a binary coverage.
   */
  ol.coverage.Matrix = function(matrix, stride, resolution, binary) {

    ol.Object.call(this);

    /**
     * @type {ArrayBuffer|Array.<number>}
     * @private
     */
    this.matrix_ = matrix;

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
    this.binary_ = binary;
  };
  ol.inherits(ol.coverage.Matrix, ol.Object);


  /**
   * @param {ol.coverage.MatrixType=} type Return an array with the specified type.
   * @return {ArrayBuffer|ol.TypedArray|Array.<number>} Coverage data.
   */
  ol.coverage.Matrix.prototype.getData = function(type) {
    if (this.binary_) {
      return type ? this.asArray_(type) : this.matrix_;
    } else {
      return this.matrix_;
    }
  };


  /**
   * @return {number} Stride.
   */
  ol.coverage.Matrix.prototype.getStride = function() {
    return this.stride_;
  };


  /**
   * @return {ol.Size} Resolution.
   */
  ol.coverage.Matrix.prototype.getResolution = function() {
    return this.resolution_;
  };


  /**
   * @param {ol.coverage.MatrixType} type Type of the raster.
   * @return {ol.TypedArray} Array.
   * @private
   */
  ol.coverage.Matrix.prototype.asArray_ = function(type) {
    var view = ol.coverage.Matrix.getArrayConstructor(type);
    return new view(this.matrix_);
  };


  /**
   * @param {ol.coverage.MatrixType} type Raster type.
   * @return {?} Typed array constructor.
   * @api
   */
  ol.coverage.Matrix.getArrayConstructor = function(type) {
    if (ol.has.TYPED_ARRAY) {
      ol.asserts.assert(type in ol.coverage.Matrix.typeMap_, 61);
      return ol.coverage.Matrix.typeMap_[type];
    }
  };


  /**
   * @return {Object} Type map.
   * @private
   */
  ol.coverage.Matrix.typeMap_ = function() {
    var typeMap = {};
    if (ol.has.TYPED_ARRAY) {
      typeMap[ol.coverage.MatrixType.UINT8] = window.Uint8Array;
      typeMap[ol.coverage.MatrixType.INT8] = window.Int8Array;
      typeMap[ol.coverage.MatrixType.UINT16] = window.Uint16Array;
      typeMap[ol.coverage.MatrixType.INT16] = window.Int16Array;
      typeMap[ol.coverage.MatrixType.UINT32] = window.Uint32Array;
      typeMap[ol.coverage.MatrixType.INT32] = window.Int32Array;
      typeMap[ol.coverage.MatrixType.FLOAT32] = window.Float32Array;
      typeMap[ol.coverage.MatrixType.FLOAT64] = window.Float64Array;
    }
    return typeMap;
  }();

}
