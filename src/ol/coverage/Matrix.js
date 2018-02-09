/**
 * @module ol/coverage/Matrix
 */
import {inherits} from '../index.js';
import BaseObject from '../Object.js';
import {TYPED_ARRAY} from '../has.js';
import {assert} from '../asserts.js';
import MatrixType from './MatrixType.js';

/**
 * @classdesc Basic container for raw, binary coverage data.
 * @constructor
 * @extends {ol.Object}
 * @param {ArrayBuffer|Array.<number>} matrix Coverage data.
 * @param {number} stride Number of columns.
 * @param {ol.Size} resolution Cell resolution.
 * @param {boolean} binary This is a binary coverage.
 */
const Matrix = function(matrix, stride, resolution, binary) {

  BaseObject.call(this);

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

inherits(Matrix, BaseObject);


/**
 * @param {ol.coverage.MatrixType=} type Return an array with the specified type.
 * @return {ArrayBuffer|ol.TypedArray|Array.<number>} Coverage data.
 */
Matrix.prototype.getData = function(type) {
  if (this.binary_) {
    return type ? this.asArray_(type) : this.matrix_;
  } else {
    return this.matrix_;
  }
};


/**
 * @return {number} Stride.
 */
Matrix.prototype.getStride = function() {
  return this.stride_;
};


/**
 * @return {ol.Size} Resolution.
 */
Matrix.prototype.getResolution = function() {
  return this.resolution_;
};


/**
 * @param {ol.coverage.MatrixType} type Type of the raster.
 * @return {ol.TypedArray} Array.
 * @private
 */
Matrix.prototype.asArray_ = function(type) {
  const view = Matrix.getArrayConstructor(type);
  return new view(this.matrix_);
};


/**
 * @param {ol.coverage.MatrixType} type Raster type.
 * @return {?} Typed array constructor.
 * @api
 */
Matrix.getArrayConstructor = function(type) {
  if (TYPED_ARRAY) {
    assert(type in Matrix.typeMap_, 61);
    return Matrix.typeMap_[type];
  }
};


/**
 * @return {Object} Type map.
 * @private
 */
Matrix.typeMap_ = function() {
  const typeMap = {};
  if (TYPED_ARRAY) {
    typeMap[MatrixType.UINT8] = window.Uint8Array;
    typeMap[MatrixType.INT8] = window.Int8Array;
    typeMap[MatrixType.UINT16] = window.Uint16Array;
    typeMap[MatrixType.INT16] = window.Int16Array;
    typeMap[MatrixType.UINT32] = window.Uint32Array;
    typeMap[MatrixType.INT32] = window.Int32Array;
    typeMap[MatrixType.FLOAT32] = window.Float32Array;
    typeMap[MatrixType.FLOAT64] = window.Float64Array;
  }
  return typeMap;
}();
export default Matrix;
