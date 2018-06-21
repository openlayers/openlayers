/**
 * @module ol/control/Attribution
 */
import {inherits} from '../util.js';
import {equals} from '../array.js';
import Control from '../control/Control.js';
import {CLASS_CONTROL, CLASS_UNSELECTABLE, CLASS_COLLAPSED} from '../css.js';
import {removeChildren, replaceNode} from '../dom.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import {visibleAtResolution} from '../layer/Layer.js';


/**
 * @typedef {Object} Options
 * @property {string} [className='ol-attribution'] CSS class name.
 * @property {Element|string} [target] Specify a target if you
 * want the control to be rendered outside of the map's
 * viewport.
 * @property {boolean} [collapsible=true] Specify if attributions can
 * be collapsed. If you use an OSM source, should be set to `false` — see
 * {@link https://www.openstreetmap.org/copyright OSM Copyright} —
 * @property {boolean} [collapsed=true] Specify if attributions should
 * be collapsed at startup.
 * @property {string} [tipLabel='Attributions'] Text label to use for the button tip.
 * @property {string} [label='i'] Text label to use for the
 * collapsed attributions button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|Element} [collapseLabel='»'] Text label to use
 * for the expanded attributions button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {function(module:ol/MapEvent)} [render] Function called when
 * the control should be re-rendered. This is called in a `requestAnimationFrame`
 * callback.
 */


/**
 * @classdesc
 * Control to show all the attributions associated with the layer sources
 * in the map. This control is one of the default controls included in maps.
 * By default it will show in the bottom right portion of the map, but this can
 * be changed by using a css selector for `.ol-attribution`.
 *
 * @constructor
 * @extends {module:ol/control/Control}
 * @param {module:ol/control/Attribution~Options=} opt_options Attribution options.
 * @api
 */
const Attribution = function(opt_options) {

  const options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = document.createElement('UL');

  /**
   * @private
   * @type {boolean}
   */
  this.collapsed_ = options.collapsed !== undefined ? options.collapsed : true;

  /**
   * @private
   * @type {boolean}
   */
  this.collapsible_ = options.collapsible !== undefined ?
    options.collapsible : true;

  if (!this.collapsible_) {
    this.collapsed_ = false;
  }

  const className = options.className !== undefined ? options.className : 'ol-attribution';

  const tipLabel = options.tipLabel !== undefined ? options.tipLabel : 'Attributions';

  const collapseLabel = options.collapseLabel !== undefined ? options.collapseLabel : '\u00BB';

  if (typeof collapseLabel === 'string') {
    /**
     * @private
     * @type {Element}
     */
    this.collapseLabel_ = document.createElement('span');
    this.collapseLabel_.textContent = collapseLabel;
  } else {
    this.collapseLabel_ = collapseLabel;
  }

  const label = options.label !== undefined ? options.label : 'i';

  if (typeof label === 'string') {
    /**
     * @private
     * @type {Element}
     */
    this.label_ = document.createElement('span');
    this.label_.textContent = label;
  } else {
    this.label_ = label;
  }


  const activeLabel = (this.collapsible_ && !this.collapsed_) ?
    this.collapseLabel_ : this.label_;
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(activeLabel);

  listen(button, EventType.CLICK, this.handleClick_, this);

  const cssClasses = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ' + CLASS_COLLAPSED : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  const element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(this.ulElement_);
  element.appendChild(button);

  Control.call(this, {
    element: element,
    render: options.render || render,
    target: options.target
  });

  /**
   * A list of currently rendered resolutions.
   * @type {Array.<string>}
   * @private
   */
  this.renderedAttributions_ = [];

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

};

inherits(Attribution, Control);


/**
 * Get a list of visible attributions.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @return {Array.<string>} Attributions.
 * @private
 */
Attribution.prototype.getSourceAttributions_ = function(frameState) {
  /**
   * Used to determine if an attribution already exists.
   * @type {!Object.<string, boolean>}
   */
  const lookup = {};

  /**
   * A list of visible attributions.
   * @type {Array.<string>}
   */
  const visibleAttributions = [];

  const layerStatesArray = frameState.layerStatesArray;
  const resolution = frameState.viewState.resolution;
  for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    const layerState = layerStatesArray[i];
    if (!visibleAtResolution(layerState, resolution)) {
      continue;
    }

    const source = layerState.layer.getSource();
    if (!source) {
      continue;
    }

    const attributionGetter = source.getAttributions();
    if (!attributionGetter) {
      continue;
    }

    const attributions = attributionGetter(frameState);
    if (!attributions) {
      continue;
    }

    if (Array.isArray(attributions)) {
      for (let j = 0, jj = attributions.length; j < jj; ++j) {
        if (!(attributions[j] in lookup)) {
          visibleAttributions.push(attributions[j]);
          lookup[attributions[j]] = true;
        }
      }
    } else {
      if (!(attributions in lookup)) {
        visibleAttributions.push(attributions);
        lookup[attributions] = true;
      }
    }
  }
  return visibleAttributions;
};


/**
 * Update the attribution element.
 * @param {module:ol/MapEvent} mapEvent Map event.
 * @this {module:ol/control/Attribution}
 * @api
 */
export function render(mapEvent) {
  this.updateElement_(mapEvent.frameState);
}


/**
 * @private
 * @param {?module:ol/PluggableMap~FrameState} frameState Frame state.
 */
Attribution.prototype.updateElement_ = function(frameState) {
  if (!frameState) {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  const attributions = this.getSourceAttributions_(frameState);

  const visible = attributions.length > 0;
  if (this.renderedVisible_ != visible) {
    this.element.style.display = visible ? '' : 'none';
    this.renderedVisible_ = visible;
  }

  if (equals(attributions, this.renderedAttributions_)) {
    return;
  }

  removeChildren(this.ulElement_);

  // append the attributions
  for (let i = 0, ii = attributions.length; i < ii; ++i) {
    const element = document.createElement('LI');
    element.innerHTML = attributions[i];
    this.ulElement_.appendChild(element);
  }

  this.renderedAttributions_ = attributions;
};


/**
 * @param {Event} event The event to handle
 * @private
 */
Attribution.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
Attribution.prototype.handleToggle_ = function() {
  this.element.classList.toggle(CLASS_COLLAPSED);
  if (this.collapsed_) {
    replaceNode(this.collapseLabel_, this.label_);
  } else {
    replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;
};


/**
 * Return `true` if the attribution is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api
 */
Attribution.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the attribution should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api
 */
Attribution.prototype.setCollapsible = function(collapsible) {
  if (this.collapsible_ === collapsible) {
    return;
  }
  this.collapsible_ = collapsible;
  this.element.classList.toggle('ol-uncollapsible');
  if (!collapsible && this.collapsed_) {
    this.handleToggle_();
  }
};


/**
 * Collapse or expand the attribution according to the passed parameter. Will
 * not do anything if the attribution isn't collapsible or if the current
 * collapsed state is already the one requested.
 * @param {boolean} collapsed True if the widget is collapsed.
 * @api
 */
Attribution.prototype.setCollapsed = function(collapsed) {
  if (!this.collapsible_ || this.collapsed_ === collapsed) {
    return;
  }
  this.handleToggle_();
};


/**
 * Return `true` when the attribution is currently collapsed or `false`
 * otherwise.
 * @return {boolean} True if the widget is collapsed.
 * @api
 */
Attribution.prototype.getCollapsed = function() {
  return this.collapsed_;
};
export default Attribution;
