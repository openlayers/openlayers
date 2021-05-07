/**
 * @module ol/string
 */

/**
 * @param {number} number Number to be formatted
 * @param {number} width The desired width
 * @param {number} [opt_precision] Precision of the output string (i.e. number of decimal places)
 * @return {string} Formatted string
 */
export function padNumber(number, width, opt_precision) {
  const numberString =
    opt_precision !== undefined ? number.toFixed(opt_precision) : '' + number;
  let decimal = numberString.indexOf('.');
  decimal = decimal === -1 ? numberString.length : decimal;
  return decimal > width
    ? numberString
    : new Array(1 + width - decimal).join('0') + numberString;
}

/**
 * Adapted from https://github.com/omichelsen/compare-versions/blob/master/index.js
 * @param {string|number} v1 First version
 * @param {string|number} v2 Second version
 * @return {number} Value
 */
export function compareVersions(v1, v2) {
  const s1 = ('' + v1).split('.');
  const s2 = ('' + v2).split('.');

  for (let i = 0; i < Math.max(s1.length, s2.length); i++) {
    const n1 = parseInt(s1[i] || '0', 10);
    const n2 = parseInt(s2[i] || '0', 10);

    if (n1 > n2) {
      return 1;
    }
    if (n2 > n1) {
      return -1;
    }
  }

  return 0;
}
