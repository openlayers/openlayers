goog.provide('ol.css');


/**
 * The CSS class for hidden feature.
 *
 * @const
 * @type {string}
 */
ol.css.CLASS_HIDDEN = 'ol-hidden';


/**
 * The CSS class that we'll give the DOM elements to have them selectable.
 *
 * @const
 * @type {string}
 */
ol.css.CLASS_SELECTABLE = 'ol-selectable';

/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const
 * @type {string}
 */
ol.css.CLASS_UNSELECTABLE = 'ol-unselectable';


/**
 * The CSS class for unsupported feature.
 *
 * @const
 * @type {string}
 */
ol.css.CLASS_UNSUPPORTED = 'ol-unsupported';


/**
 * The CSS class for controls.
 *
 * @const
 * @type {string}
 */
ol.css.CLASS_CONTROL = 'ol-control';


/**
 * Get the list of font families from a font spec.  Note that this doesn't work
 * for font families that have commas in them.
 * @param {string} The CSS font property.
 * @return {Object.<string>} The font families (or null if the input spec is invalid).
 */
ol.css.getFontFamilies = (function() {
  var style;
  var cache = {};
  return function(font) {
    if (!style) {
      style = document.createElement('div').style;
    }
    if (!(font in cache)) {
      style.font = font;
      var family = style.fontFamily;
      style.font = '';
      if (!family) {
        return null;
      }
      cache[font] = family.split(/,\s?/);
    }
    return cache[font];
  };
})();
