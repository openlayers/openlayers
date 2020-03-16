/**
 * @module ol/css
 */

/**
 * @typedef {Object} FontParameters
 * @property {Array<string>} families
 * @property {string} style
 * @property {string} weight
 * @property {string} lineHeight
 */


/**
 * The CSS class for hidden feature.
 *
 * @const
 * @type {string}
 */
export const CLASS_HIDDEN = 'ol-hidden';


/**
 * The CSS class that we'll give the DOM elements to have them selectable.
 *
 * @const
 * @type {string}
 */
export const CLASS_SELECTABLE = 'ol-selectable';


/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const
 * @type {string}
 */
export const CLASS_UNSELECTABLE = 'ol-unselectable';


/**
 * The CSS class for unsupported feature.
 *
 * @const
 * @type {string}
 */
export const CLASS_UNSUPPORTED = 'ol-unsupported';


/**
 * The CSS class for controls.
 *
 * @const
 * @type {string}
 */
export const CLASS_CONTROL = 'ol-control';


/**
 * The CSS class that we'll give the DOM elements that are collapsed, i.e.
 * to those elements which usually can be expanded.
 *
 * @const
 * @type {string}
 */
export const CLASS_COLLAPSED = 'ol-collapsed';


/**
 * Get the list of font families from a font spec.  Note that this doesn't work
 * for font families that have commas in them.
 * @param {string} fontSpec The CSS font property.
 * @param {function(FontParameters):void} callback Called with the font families
 * (or null if the input spec is invalid).
 */
export const getFontParameters = (function() {
  /**
   * @type {CSSStyleDeclaration}
   */
  let style;
  /**
   * @type {Object<string, FontParameters>}
   */
  const cache = {};
  return function(fontSpec, callback) {
    if (!style) {
      style = document.createElement('div').style;
    }
    if (!(fontSpec in cache)) {
      style.font = fontSpec;
      const family = style.fontFamily;
      if (!family) {
        callback(null);
      }
      const families = family.split(/,\s?/);
      cache[fontSpec] = {
        families: families,
        weight: style.fontWeight,
        style: style.fontStyle,
        lineHeight: style.lineHeight
      };
      style.font = '';
    }
    callback(cache[fontSpec]);
  };
})();
