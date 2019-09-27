/**
 * @module ol/css
 */

/**
 * @typedef {Object} FontParameters
 * @property {Array<string>} families
 * @property {string} style
 * @property {string} weight
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
 * @param {string} The CSS font property.
 * @return {FontParameters} The font families (or null if the input spec is invalid).
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
  return function(font) {
    if (!style) {
      style = document.createElement('div').style;
    }
    if (!(font in cache)) {
      style.font = font;
      const family = style.fontFamily;
      const fontWeight = style.fontWeight;
      const fontStyle = style.fontStyle;
      style.font = '';
      if (!family) {
        return null;
      }
      const families = family.split(/,\s?/);
      cache[font] = {
        families: families,
        weight: fontWeight,
        style: fontStyle
      };
    }
    return cache[font];
  };
})();
