goog.provide('ol.TransformFunction');


/**
 * A transform function accepts an array of input coordinate values and an
 * optional dimension (default should be 2).  The function transforms the
 * coordinate values and returns an array of the same length as the input.
 *
 * @typedef {function(Array.<number>, number=): Array.<number>}
 */
ol.TransformFunction;
