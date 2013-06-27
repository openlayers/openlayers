goog.provide('ol.css');


/**
 * The CSS class for a group of buttons.
 *
 * @const {string}
 */
ol.css.CLASS_BUTTON_GROUP = 'ol-button-group';


/**
 * The CSS class for vertical alignment, to be used with 'ol-button-group'.
 *
 * @const {string}
 */
ol.css.CLASS_VERTICAL = 'ol-vertical';


/**
 * The CSS class for horizontal alignment, to be used with 'ol-button-group'.
 *
 * @const {string}
 */
ol.css.CLASS_HORIZONTAL = 'ol-horizontal';


/**
 * The CSS class for a button.
 *
 * DOM structure:
 * <div class="ol-button-group ol-vertical">
 *   <a href="#action">text</a>
 * </div>
 *
 * @const {string}
 */
ol.css.CLASS_BUTTON = ol.css.CLASS_BUTTON_GROUP + ' ' + ol.css.CLASS_VERTICAL;


/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const {string}
 */
ol.css.CLASS_UNSELECTABLE = 'ol-unselectable';


/**
 * The CSS class for unsupported feature.
 *
 * @const {string}
 */
ol.css.CLASS_UNSUPPORTED = 'ol-unsupported';
