/**
 * @module ol/style/Monochrome
 */
import {clamp} from '../math.js';


/**
 * @classdesc
 * Single band greyscale raster style. Cell values are transformed to byte
 * range (0-255) according to the supplied or calculated minimum and maximum
 * cell values.
 *
 * @constructor
 * @struct
 * @param {olx.style.MonochromeOptions=} opt_options Options.
 * @api
 */
const Monochrome = function(opt_options) {

  const options = opt_options || {};

  /**
   * @private
   * @type {number|undefined}
   */
  this.min_ = options.min;

  /**
   * @private
   * @type {number|undefined}
   */
  this.max_ = options.max;

  /**
   * @private
   * @type {number|undefined}
   */
  this.band_ = options.band;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};


/**
 * @param {number=} opt_index Band index.
 * @return {ol.style.Monochrome} Default raster style.
 */
Monochrome.defaultStyle = function(opt_index) {
  return new Monochrome({band: opt_index ? opt_index : 0});
};


/**
 * Clones the style.
 * @return {ol.style.Monochrome} The cloned style.
 * @api
 */
Monochrome.prototype.clone = function() {
  return new Monochrome({
    min: this.getMin(),
    max: this.getMax(),
    band: this.getBandIndex()
  });
};


/**
 * Get the minimum value.
 * @return {number|undefined} Minimum value.
 * @api
 */
Monochrome.prototype.getMin = function() {
  return this.min_;
};


/**
 * Get the maximum value.
 * @return {number|undefined} Maximum value.
 * @api
 */
Monochrome.prototype.getMax = function() {
  return this.max_;
};


/**
 * Get the styled band's index.
 * @return {number|undefined} Band index.
 * @api
 */
Monochrome.prototype.getBandIndex = function() {
  return this.band_;
};


/**
 * Set the minimum value.
 * @param {number} min New minimum value.
 * @api
 */
Monochrome.prototype.setMin = function(min) {
  this.min_ = min;
  this.checksum_ = undefined;
};


/**
 * Set the maximum value.
 * @param {number} max New maximum value.
 * @api
 */
Monochrome.prototype.setMax = function(max) {
  this.max_ = max;
  this.checksum_ = undefined;
};


/**
 * Set the styled band's index.
 * @param {number} band New band index.
 * @api
 */
Monochrome.prototype.setBandIndex = function(band) {
  this.band_ = band;
  this.checksum_ = undefined;
};


/**
 * Fill missing values from band statistics.
 * @param {Array.<ol.coverage.Band>} bands Coverage bands.
 */
Monochrome.prototype.fillMissingValues = function(bands) {
  const bandIndex = this.getBandIndex();
  if (bandIndex !== undefined && bands[bandIndex]) {
    const bandStat = bands[bandIndex].getStatistics();
    if (!this.getMin() && bandStat.min) {
      this.setMin(bandStat.min);
    }
    if (!this.getMax() && bandStat.max) {
      this.setMax(bandStat.max);
    }
  }
};


/**
 * Apply this style to the specified matrix.
 * @param {Array.<number>|ol.TypedArray} matrix Input matrix.
 * @param {number} nodata NoData value.
 * @param {number} minAlpha Minimum alpha value.
 * @param {number} maxAlpha Maximum alpha value.
 * @return {Array.<number>} Styled interleaved matrix.
 */
Monochrome.prototype.apply = function(matrix, nodata, minAlpha, maxAlpha) {
  const interleaved = [];
  let k = 0;
  let i, ii;
  let min = this.getMin();
  if (typeof min !== 'number') {
    min = Math.min.apply(matrix);
  }
  let max = this.getMax();
  if (typeof max !== 'number') {
    max = Math.max.apply(matrix);
  }
  const range = max - min;

  for (i = 0, ii = matrix.length; i < ii; ++i) {
    const lerp = (matrix[i] - min) / range;
    const value = clamp(Math.round(255 * lerp), 0, 255);

    interleaved[k++] = value;
    interleaved[k++] = value;
    interleaved[k++] = value;
    interleaved[k++] = matrix[i] === nodata ? maxAlpha : minAlpha;
  }
  return interleaved;
};


/**
 * @return {string} The checksum.
 */
Monochrome.prototype.getChecksum = function() {
  if (this.checksum_ === undefined) {
    this.checksum_ = 'm';
    if (this.getBandIndex() !== undefined) {
      this.checksum_ += this.getBandIndex().toString() + ',' +
      (this.getMin() !== undefined ? this.getMin().toString() : '-') + ',' +
      (this.getMax() !== undefined ? this.getMax().toString() : '-');
    } else {
      this.checksum_ += '-';
    }
  }

  return this.checksum_;
};
export default Monochrome;
