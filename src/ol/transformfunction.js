goog.provide('ol.TransformFunction');


/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 *
 * @api stable
 * @callback ol.TransformFunction
 * @param {Array.<number>} input The array of input coordinate values
 * @param {Array.<number>} [output] The output array
 * @param {number} [dimension] The dimension
 * @return {Array.<number>} The output array
 */
ol.TransformFunction;
