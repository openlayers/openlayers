goog.provide('ol.RasterBand');

goog.require('ol');
goog.require('ol.has');
goog.require('ol.Object');
goog.require('ol.Raster');

if (ol.ENABLE_RASTER) {

  /**
   * @classdesc Container for a single raster band. Usually instantiated by
   * raster sources.
   * @constructor
   * @extends {ol.Object}
   * @param {ol.RasterBandOptions} options Options.
   */
  ol.RasterBand = function(options) {

    ol.Object.call(this);

    /**
     * @type {ol.RasterType}
     * @private
     */
    this.type_ = options.type;

    /**
     * @type {number|null}
     * @private
     */
    this.null_ = options.nullvalue || null;

    var binary = typeof options.binary === 'boolean' ? options.binary :
      ol.has.TYPED_ARRAY;

    /**
     * @type {ol.Raster}
     * @private
     */
    this.raster_ = binary ? this.createRaster_(options.raster, options.stride,
        options.resolution, options.type, options.convert) :
      new ol.Raster(options.raster, options.stride, options.resolution, false);

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

  };
  ol.inherits(ol.RasterBand, ol.Object);


  /**
   * Returns the raw raster data if no data type is specified. Otherwise, returns
   * a typed array through the raster can also be written.
   * @param {ol.RasterType=} opt_type Data type.
   * @return {ArrayBuffer|ol.TypedArray|Array.<number>} Raw raster data.
   * @api
   */
  ol.RasterBand.prototype.getRaster = function(opt_type) {
    return /** @type {ArrayBuffer|ol.TypedArray|Array.<number>} */ (
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
    var stat = this.getStatistics();
    var nullValue = this.getNullValue();
    var min = Infinity;
    var max = -Infinity;
    var sum = 0;
    var count = 0;
    var i;

    for (i = 0; i < raster.length; ++i) {
      if (raster[i] !== nullValue) {
        sum += raster[i];
        min = raster[i] < min ? raster[i] : min;
        max = raster[i] > max ? raster[i] : max;
        count++;
      }
    }
    var avg = sum / count;
    var variance = 0;

    for (i = 0; i < raster.length; ++i) {
      if (raster[i] !== nullValue) {
        variance += Math.pow(raster[i] - avg, 2);
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
   * @param {ArrayBuffer|Array.<number>} raster Raster data.
   * @param {number} stride Stride.
   * @param {ol.Size} resolution Cell resolution.
   * @param {ol.RasterType} type Raster data type.
   * @param {function(number):number=} convert Type conversion function.
   * @return {ol.Raster} Raster object.
   * @private
   */
  ol.RasterBand.prototype.createRaster_ = function(raster, stride, resolution, type,
      convert) {
    var buffer;
    if (raster instanceof window.ArrayBuffer) {
      buffer = raster;
    } else {
      var ctor = ol.Raster.getArrayConstructor(type);
      buffer = new window.ArrayBuffer(raster.length * ctor.BYTES_PER_ELEMENT);
      var view = new ctor(buffer);
      var hasFunction = convert && typeof convert === 'function';
      for (var i = 0; i < raster.length; ++i) {
        view[i] = hasFunction ? convert(raster[i]) : raster[i];
      }
    }
    return new ol.Raster(buffer, stride, resolution, true);
  };


  /**
   * Set the null value of the raster band.
   * @param {number} nullValue Null value.
   * @fires ol.events.Event#event:change
   * @api
   */
  ol.RasterBand.prototype.setNullValue = function(nullValue) {
    var oldNull = this.null_;
    this.null_ = nullValue;
    if (oldNull !== nullValue) {
      this.calculateStatistics();
    }
    this.changed();
  };

}
