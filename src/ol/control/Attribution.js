// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.layer.Layer');
goog.require('ol.obj');


/**
 * @classdesc
 * Control to show all the attributions associated with the layer sources
 * in the map. This control is one of the default controls included in maps.
 * By default it will show in the bottom right portion of the map, but this can
 * be changed by using a css selector for `.ol-attribution`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.AttributionOptions=} opt_options Attribution options.
 * @api
 */
ol.control.Attribution = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = document.createElement('UL');

  /**
   * @private
   * @type {Element}
   */
  this.logoLi_ = document.createElement('LI');

  this.ulElement_.appendChild(this.logoLi_);
  this.logoLi_.style.display = 'none';

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

  var className = options.className !== undefined ? options.className : 'ol-attribution';

  var tipLabel = options.tipLabel !== undefined ? options.tipLabel : 'Attributions';

  var collapseLabel = options.collapseLabel !== undefined ? options.collapseLabel : '\u00BB';

  if (typeof collapseLabel === 'string') {
    /**
     * @private
     * @type {Node}
     */
    this.collapseLabel_ = document.createElement('span');
    this.collapseLabel_.textContent = collapseLabel;
  } else {
    this.collapseLabel_ = collapseLabel;
  }

  var label = options.label !== undefined ? options.label : 'i';

  if (typeof label === 'string') {
    /**
     * @private
     * @type {Node}
     */
    this.label_ = document.createElement('span');
    this.label_.textContent = label;
  } else {
    this.label_ = label;
  }


  var activeLabel = (this.collapsible_ && !this.collapsed_) ?
    this.collapseLabel_ : this.label_;
  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.title = tipLabel;
  button.appendChild(activeLabel);

  ol.events.listen(button, ol.events.EventType.CLICK, this.handleClick_, this);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(this.ulElement_);
  element.appendChild(button);

  var render = options.render ? options.render : ol.control.Attribution.render;

  ol.control.Control.call(this, {
    element: element,
    render: render,
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

  /**
   * @private
   * @type {Object.<string, Element>}
   */
  this.logoElements_ = {};

};
ol.inherits(ol.control.Attribution, ol.control.Control);


/**
 * Get a list of visible attributions.
 * @param {olx.FrameState} frameState Frame state.
 * @return {Array.<string>} Attributions.
 * @private
 */
ol.control.Attribution.prototype.getSourceAttributions_ = function(frameState) {
  /**
   * Used to determine if an attribution already exists.
   * @type {Object.<string, boolean>}
   */
  var lookup = {};

  /**
   * A list of visible attributions.
   * @type {Array.<string>}
   */
  var visibleAttributions = [];

  var layerStatesArray = frameState.layerStatesArray;
  var resolution = frameState.viewState.resolution;
  for (var i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    var layerState = layerStatesArray[i];
    if (!ol.layer.Layer.visibleAtResolution(layerState, resolution)) {
      continue;
    }

    var source = layerState.layer.getSource();
    if (!source) {
      continue;
    }

    var attributionGetter = source.getAttributions2();
    if (!attributionGetter) {
      continue;
    }

    var attributions = attributionGetter(frameState);
    if (!attributions) {
      continue;
    }

    if (Array.isArray(attributions)) {
      for (var j = 0, jj = attributions.length; j < jj; ++j) {
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
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.Attribution}
 * @api
 */
ol.control.Attribution.render = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @private
 * @param {?olx.FrameState} frameState Frame state.
 */
ol.control.Attribution.prototype.updateElement_ = function(frameState) {
  if (!frameState) {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var attributions = this.getSourceAttributions_(frameState);
  if (ol.array.equals(attributions, this.renderedAttributions_)) {
    return;
  }

  // remove everything but the logo
  while (this.ulElement_.lastChild !== this.logoLi_) {
    this.ulElement_.removeChild(this.ulElement_.lastChild);
  }

  // append the attributions
  for (var i = 0, ii = attributions.length; i < ii; ++i) {
    var element = document.createElement('LI');
    element.innerHTML = attributions[i];
    this.ulElement_.appendChild(element);
  }


  if (attributions.length === 0 && this.renderedAttributions_.length > 0) {
    this.element.classList.add('ol-logo-only');
  } else if (this.renderedAttributions_.length === 0 && attributions.length > 0) {
    this.element.classList.remove('ol-logo-only');
  }

  var visible = attributions.length > 0 || !ol.obj.isEmpty(frameState.logos);
  if (this.renderedVisible_ != visible) {
    this.element.style.display = visible ? '' : 'none';
    this.renderedVisible_ = visible;
  }

  this.renderedAttributions_ = attributions;
  this.insertLogos_(frameState);
};


/**
 * @param {?olx.FrameState} frameState Frame state.
 * @private
 */
ol.control.Attribution.prototype.insertLogos_ = function(frameState) {

  var logo;
  var logos = frameState.logos;
  var logoElements = this.logoElements_;

  for (logo in logoElements) {
    if (!(logo in logos)) {
      ol.dom.removeNode(logoElements[logo]);
      delete logoElements[logo];
    }
  }

  var image, logoElement, logoKey;
  for (logoKey in logos) {
    var logoValue = logos[logoKey];
    if (logoValue instanceof HTMLElement) {
      this.logoLi_.appendChild(logoValue);
      logoElements[logoKey] = logoValue;
    }
    if (!(logoKey in logoElements)) {
      image = new Image();
      image.src = logoKey;
      if (logoValue === '') {
        logoElement = image;
      } else {
        logoElement = document.createElement('a');
        logoElement.href = logoValue;
        logoElement.appendChild(image);
      }
      this.logoLi_.appendChild(logoElement);
      logoElements[logoKey] = logoElement;
    }
  }

  this.logoLi_.style.display = !ol.obj.isEmpty(logos) ? '' : 'none';

};


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.Attribution.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
ol.control.Attribution.prototype.handleToggle_ = function() {
  this.element.classList.toggle('ol-collapsed');
  if (this.collapsed_) {
    ol.dom.replaceNode(this.collapseLabel_, this.label_);
  } else {
    ol.dom.replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;
};


/**
 * Return `true` if the attribution is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api
 */
ol.control.Attribution.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the attribution should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api
 */
ol.control.Attribution.prototype.setCollapsible = function(collapsible) {
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
ol.control.Attribution.prototype.setCollapsed = function(collapsed) {
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
ol.control.Attribution.prototype.getCollapsed = function() {
  return this.collapsed_;
};
