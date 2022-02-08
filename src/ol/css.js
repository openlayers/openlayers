/**
 * @module ol/css
 */

/**
 * @typedef {Object} FontParameters
 * @property {string} style Style.
 * @property {string} variant Variant.
 * @property {string} weight Weight.
 * @property {string} size Size.
 * @property {string} lineHeight LineHeight.
 * @property {string} family Family.
 * @property {Array<string>} families Families.
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
 * From https://stackoverflow.com/questions/10135697/regex-to-parse-any-css-font
 * @type {RegExp}
 */
const fontRegEx = new RegExp(
  [
    '^\\s*(?=(?:(?:[-a-z]+\\s*){0,2}(italic|oblique))?)',
    '(?=(?:(?:[-a-z]+\\s*){0,2}(small-caps))?)',
    '(?=(?:(?:[-a-z]+\\s*){0,2}(bold(?:er)?|lighter|[1-9]00 ))?)',
    '(?:(?:normal|\\1|\\2|\\3)\\s*){0,3}((?:xx?-)?',
    '(?:small|large)|medium|smaller|larger|[\\.\\d]+(?:\\%|in|[cem]m|ex|p[ctx]))',
    '(?:\\s*\\/\\s*(normal|[\\.\\d]+(?:\\%|in|[cem]m|ex|p[ctx])?))',
    '?\\s*([-,\\"\\\'\\sa-z]+?)\\s*$',
  ].join(''),
  'i'
);
const fontRegExMatchIndex = [
  'style',
  'variant',
  'weight',
  'size',
  'lineHeight',
  'family',
];

/**
 * Get the list of font families from a font spec.  Note that this doesn't work
 * for font families that have commas in them.
 * @param {string} fontSpec The CSS font property.
 * @return {FontParameters|null} The font parameters (or null if the input spec is invalid).
 */
export const getFontParameters = function (fontSpec) {
  const match = fontSpec.match(fontRegEx);
  if (!match) {
    return null;
  }
  const style = /** @type {FontParameters} */ ({
    lineHeight: 'normal',
    size: '1.2em',
    style: 'normal',
    weight: 'normal',
    variant: 'normal',
  });
  for (let i = 0, ii = fontRegExMatchIndex.length; i < ii; ++i) {
    const value = match[i + 1];
    if (value !== undefined) {
      style[fontRegExMatchIndex[i]] = value;
    }
  }
  style.families = style.family.split(/,\s?/);
  return style;
};

/**
 * @param {number} opacity Opacity (0..1).
 * @return {string} CSS opacity.
 */
export function cssOpacity(opacity) {
  return opacity === 1 ? '' : String(Math.round(opacity * 100) / 100);
}
