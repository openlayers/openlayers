goog.provide('ol.RasterBand');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.events');
goog.require('ol.Object');
goog.require('ol.Raster');
goog.require('ol.RasterType');

if (ol.ENABLE_RASTER) {

  /**
   * @classdesc Container for a single raster band. Usually instantiated by
   * raster sources.
   * @constructor
   * @extends {ol.Object}
   * @param {ArrayBuffer|Array.<number>} raster Raster data.
   * @param {number} stride Number of columns.
   * @param {ol.Size} resolution Cell resolution.
   * @param {ol.RasterType} type Raster data type.
   * @param {number=} nullvalue Null value.
   * @param {function(number):number=} convert Type conversion function.
   */
  ol.RasterBand = function(raster, stride, resolution, type, nullvalue, convert) {

    ol.Object.call(this);

    /**
     * @type {ol.RasterType}
     * @private
     */
    this.type_ = type;

    /**
     * @type {number|null}
     * @private
     */
    this.null_ = nullvalue || null;

    /**
     * @type {ol.Raster}
     * @private
     */
    this.raster_ = this.createRaster_(raster, stride, resolution, type, convert);

    /**
     * @type {ol.RasterStatistics}
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

    ol.events.listen(
        this, 'change:raster',
        this.handleRasterChange_, this);
  };
  ol.inherits(ol.RasterBand, ol.Object);


  /**
   * Returns the raw raster data if no data type is specified. Otherwise, returns
   * a typed array through the raster can also be written.
   * @param {ol.RasterType=} opt_type Data type.
   * @return {ArrayBuffer|ol.TypedArray} Raw raster data.
   * @observable
   * @api
   */
  ol.RasterBand.prototype.getRaster = function(opt_type) {
    return /** @type {ArrayBuffer|ol.TypedArray} */ (
      this.raster_.getRaster(opt_type));
  };


  /**
   * Returns the number of columns (row length).
   * @return {number} Stride.
   * @api
   */
  ol.RasterBand.prototype.getStride = function() {
    return this.raster_.getStride();
  };


  /**
   * Returns the resolution (x,y) of this band.
   * @return {ol.Size} Resolution.
   * @api
   */
  ol.RasterBand.prototype.getResolution = function() {
    return this.raster_.getResolution();
  };


  /**
   * Returns the null value associated to this band, if any.
   * @return {number|null} Null value.
   * @api
   */
  ol.RasterBand.prototype.getNullValue = function() {
    return this.null_;
  };


  /**
   * @return {ol.RasterStatistics} Statistics.
   * @api
   */
  ol.RasterBand.prototype.getStatistics = function() {
    return this.statistics_;
  };


  /**
   * Calculates common indices from raw raster data.
   */
  ol.RasterBand.prototype.calculateStatistics = function() {
    var raster = this.getRaster(this.type_);
    var stat = this.statistics_;
    var min = Infinity;
    var max = -Infinity;
    var sum = 0;
    var count = raster.length;
    var i;

    for (i = 0; i < raster.length; ++i) {
      sum += raster[i];
      min = raster[i] < min ? raster[i] : min;
      max = raster[i] > max ? raster[i] : max;
    }
    var avg = sum / count;
    var variance = 0;

    for (i = 0; i < raster.length; ++i) {
      variance += Math.pow(raster[i] - avg, 2);
    }
    variance /= count;

    stat.min = min;
    stat.max = max;
    stat.sum = sum;
    stat.count = count;
    stat.variance = variance;
  };


  /**
   * @param {ArrayBuffer|Array.<number>} raster Raster data.
   * @param {number} stride Stride.
   * @param {ol.Size} resolution Cell resolution.
   * @param {ol.RasterType} type Raster data type.
   * @param {function(number):number=} convert Type conversion function.
   * @return {ol.Raster} Binary raster.
   * @private
   */
  ol.RasterBand.prototype.createRaster_ = function(raster, stride, resolution, type,
      convert) {
    var buffer;
    if (!(raster instanceof window.ArrayBuffer)) {
      var ctor = ol.Raster.getArrayConstructor(type);
      buffer = new window.ArrayBuffer(raster.length * ctor.BYTES_PER_ELEMENT);
      var view = new ctor(buffer);
      var hasFunction = convert && typeof convert === 'function';
      for (var i = 0; i < raster.length; ++i) {
        view[i] = hasFunction ? convert(raster[i]) : raster[i];
      }
    } else {
      buffer = raster;
    }
    return new ol.Raster(buffer, stride, resolution);
  };


  /**
   * @private
   */
  ol.RasterBand.prototype.handleRasterChange_ = function() {
    this.calculateStatistics();
    this.changed();
  };


  /**
   * Set the null value of the raster band.
   * @param {number} nullValue Null value.
   * @fires ol.events.Event#event:change
   * @api
   */
  ol.RasterBand.prototype.setNullValue = function(nullValue) {
    this.null_ = nullValue;
    this.changed();
  };


  /**
   * Set the raw raster data of the band. The raw matrix of the band can be in
   * an array, though an explicit data type and the number of columns have to be
   * provided. An optional converter function can be provided, which correctly
   * converts raster values between different data types.
   * @param {ArrayBuffer|Array.<number>} raster Raster data.
   * @param {number} stride Number of columns.
   * @param {ol.Size} resolution Cell resolution.
   * @param {ol.RasterType} type Raster data type.
   * @param {function(number):number=} opt_convert Type conversion function.
   * @observable
   * @api
   */
  ol.RasterBand.prototype.setRaster = function(raster, stride, resolution, type,
      opt_convert) {
    ol.asserts.assert(type in ol.RasterType, 61);
    this.raster_ = this.createRaster_(raster, stride, resolution, type, opt_convert);
  };

}
