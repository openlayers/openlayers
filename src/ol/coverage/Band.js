/**
 * @module ol/coverage/Band
 */
import {inherits} from '../index.js';
import BaseObject from '../Object.js';
import {TYPED_ARRAY} from '../has.js';
import Matrix from './Matrix.js';

/**
 * @classdesc Container for a single coverage band. Usually instantiated by
 * coverage sources.
 * @constructor
 * @extends {ol.Object}
 * @param {ol.CoverageBandOptions} options Options.
 */
const Band = function(options) {

  BaseObject.call(this);

  /**
   * @type {ol.coverage.MatrixType}
   * @private
   */
  this.type_ = options.type;

  /**
   * @type {number|null}
   * @private
   */
  this.null_ = options.nodata !== undefined ? options.nodata : null;

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = options.extent;


  /**
   * @type {boolean}
   * @private
   */
  this.binary_ = typeof options.binary === 'boolean' ? options.binary :
    TYPED_ARRAY;

  /**
   * @type {ol.coverage.Matrix}
   * @private
   */
  this.matrix_ = this.binary_ ? this.createBinaryMatrix_(options.matrix,
    options.stride, options.resolution, this.binary_, options.type) :
    new Matrix(options.matrix, options.stride, options.resolution,
      this.binary_);

  /**
   * @type {ol.CoverageStatistics}
   * @private
   */
  this.statistics_ = {
    min: undefined,
    max: undefined,
    sum: undefined,
    count: undefined,
    variance: undefined
  };
  this.calculateStatistics();

};

inherits(Band, BaseObject);


/**
 * Returns the raw coverage data or a typed array. If the underlying covergage
 * is not binary, a simple array is returned.
 * @param {boolean=} opt_buffer Return the array buffer, if it is binary.
 * @return {ArrayBuffer|ol.TypedArray|Array.<number>|undefined} Coverage matrix.
 * @api
 */
Band.prototype.getCoverageData = function(opt_buffer) {
  if (opt_buffer) {
    return this.matrix_.getData();
  }
  return /** @type {ol.TypedArray|Array.<number>} */ (
    this.matrix_.getData(this.type_));
};


/**
 * Returns the number of columns (row length).
 * @return {number} Stride.
 * @api
 */
Band.prototype.getStride = function() {
  return this.matrix_.getStride();
};


/**
 * Returns the extent of this band.
 * @return {ol.Extent} Exent.
 * @api
 */
Band.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Returns the resolution (x,y) of this band.
 * @return {ol.Size} Resolution.
 * @api
 */
Band.prototype.getResolution = function() {
  return this.matrix_.getResolution();
};


/**
 * Returns the null value associated to this band, if any.
 * @return {number|null} Null value.
 * @api
 */
Band.prototype.getNullValue = function() {
  return this.null_;
};


/**
 * @return {ol.CoverageStatistics} Statistics.
 * @api
 */
Band.prototype.getStatistics = function() {
  return this.statistics_;
};


/**
 * Calculates common indices from raw coverage data.
 */
Band.prototype.calculateStatistics = function() {
  const matrix = this.getCoverageData();
  const stat = this.getStatistics();
  const nullValue = this.getNullValue();
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  let i;

  for (i = 0; i < matrix.length; ++i) {
    if (matrix[i] !== nullValue) {
      sum += matrix[i];
      min = matrix[i] < min ? matrix[i] : min;
      max = matrix[i] > max ? matrix[i] : max;
      count++;
    }
  }
  const avg = sum / count;
  let variance = 0;

  for (i = 0; i < matrix.length; ++i) {
    if (matrix[i] !== nullValue) {
      variance += Math.pow(matrix[i] - avg, 2);
    }
  }
  variance /= count;

  stat.min = min;
  stat.max = max;
  stat.sum = sum;
  stat.count = count;
  stat.variance = variance;
};


/**
 * @param {ArrayBuffer|Array.<number>} matrix Coverage data.
 * @param {number} stride Stride.
 * @param {ol.Size} resolution Cell resolution.
 * @param {boolean} binary This is a binary coverage.
 * @param {ol.coverage.MatrixType} type CoverageData data type.
 * @return {ol.coverage.Matrix} Coverage object.
 * @private
 */
Band.prototype.createBinaryMatrix_ = function(matrix, stride,
  resolution, binary, type) {
  let buffer;
  if (matrix instanceof window.ArrayBuffer) {
    buffer = matrix;
  } else {
    const ctor = Matrix.getArrayConstructor(type);
    buffer = new window.ArrayBuffer(matrix.length * ctor.BYTES_PER_ELEMENT);
    const view = new ctor(buffer);
    for (let i = 0; i < matrix.length; ++i) {
      view[i] = matrix[i];
    }
  }
  return new Matrix(buffer, stride, resolution, binary);
};


/**
 * Set the null value of the coverage band.
 * @param {number} nullValue Null value.
 * @fires ol.events.Event#event:change
 * @api
 */
Band.prototype.setNullValue = function(nullValue) {
  const oldNull = this.null_;
  this.null_ = nullValue !== undefined ? nullValue : null;
  if (oldNull !== this.null_) {
    this.calculateStatistics();
  }
  this.changed();
};
export default Band;
