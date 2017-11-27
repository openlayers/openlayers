goog.provide('ol.coverage.Band');

goog.require('ol');
goog.require('ol.coverage.Matrix');
goog.require('ol.has');
goog.require('ol.Object');

if (ol.ENABLE_COVERAGE) {

  /**
   * @classdesc Container for a single coverage band. Usually instantiated by
   * coverage sources.
   * @constructor
   * @extends {ol.Object}
   * @param {ol.CoverageBandOptions} options Options.
   */
  ol.coverage.Band = function(options) {

    ol.Object.call(this);

    /**
     * @type {ol.coverage.MatrixType}
     * @private
     */
    this.type_ = options.type;

    /**
     * @type {number|null}
     * @private
     */
    this.null_ = options.nodata || null;

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
      ol.has.TYPED_ARRAY;

    /**
     * @type {ol.coverage.Matrix}
     * @private
     */
    this.matrix_ = this.binary_ ? this.createBinaryMatrix_(options.matrix,
        options.stride, options.resolution, this.binary_, options.type) :
      new ol.coverage.Matrix(options.matrix, options.stride, options.resolution,
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
  ol.inherits(ol.coverage.Band, ol.Object);


  /**
   * Returns the raw coverage data or a typed array. If the underlying covergage
   * is not binary, a simple array is returned.
   * @param {boolean=} opt_buffer Return the array buffer, if it is binary.
   * @return {ArrayBuffer|ol.TypedArray|Array.<number>|undefined} Coverage matrix.
   * @api
   */
  ol.coverage.Band.prototype.getCoverageData = function(opt_buffer) {
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
  ol.coverage.Band.prototype.getStride = function() {
    return this.matrix_.getStride();
  };


  /**
   * Returns the extent of this band.
   * @return {ol.Extent} Exent.
   * @api
   */
  ol.coverage.Band.prototype.getExtent = function() {
    return this.extent_;
  };


  /**
   * Returns the resolution (x,y) of this band.
   * @return {ol.Size} Resolution.
   * @api
   */
  ol.coverage.Band.prototype.getResolution = function() {
    return this.matrix_.getResolution();
  };


  /**
   * Returns the null value associated to this band, if any.
   * @return {number|null} Null value.
   * @api
   */
  ol.coverage.Band.prototype.getNullValue = function() {
    return this.null_;
  };


  /**
   * @return {ol.CoverageStatistics} Statistics.
   * @api
   */
  ol.coverage.Band.prototype.getStatistics = function() {
    return this.statistics_;
  };


  /**
   * Calculates common indices from raw coverage data.
   */
  ol.coverage.Band.prototype.calculateStatistics = function() {
    var matrix = this.getCoverageData();
    var stat = this.getStatistics();
    var nullValue = this.getNullValue();
    var min = Infinity;
    var max = -Infinity;
    var sum = 0;
    var count = 0;
    var i;

    for (i = 0; i < matrix.length; ++i) {
      if (matrix[i] !== nullValue) {
        sum += matrix[i];
        min = matrix[i] < min ? matrix[i] : min;
        max = matrix[i] > max ? matrix[i] : max;
        count++;
      }
    }
    var avg = sum / count;
    var variance = 0;

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
  ol.coverage.Band.prototype.createBinaryMatrix_ = function(matrix, stride,
      resolution, binary, type) {
    var buffer;
    if (matrix instanceof window.ArrayBuffer) {
      buffer = matrix;
    } else {
      var ctor = ol.coverage.Matrix.getArrayConstructor(type);
      buffer = new window.ArrayBuffer(matrix.length * ctor.BYTES_PER_ELEMENT);
      var view = new ctor(buffer);
      for (var i = 0; i < matrix.length; ++i) {
        view[i] = matrix[i];
      }
    }
    return new ol.coverage.Matrix(buffer, stride, resolution, binary);
  };


  /**
   * Set the null value of the coverage band.
   * @param {number} nullValue Null value.
   * @fires ol.events.Event#event:change
   * @api
   */
  ol.coverage.Band.prototype.setNullValue = function(nullValue) {
    var oldNull = this.null_;
    this.null_ = nullValue;
    if (oldNull !== nullValue) {
      this.calculateStatistics();
    }
    this.changed();
  };

}
