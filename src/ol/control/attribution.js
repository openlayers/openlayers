// FIXME handle date line wrap

import _ol_ from '../index';
import _ol_dom_ from '../dom';
import _ol_control_Control_ from '../control/control';
import _ol_css_ from '../css';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_obj_ from '../obj';

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
var _ol_control_Attribution_ = function(opt_options) {

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

  _ol_events_.listen(button, _ol_events_EventType_.CLICK, this.handleClick_, this);

  var cssClasses = className + ' ' + _ol_css_.CLASS_UNSELECTABLE + ' ' +
      _ol_css_.CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  var element = document.createElement('div');
  element.className = cssClasses;
  element.appendChild(this.ulElement_);
  element.appendChild(button);

  var render = options.render ? options.render : _ol_control_Attribution_.render;

  _ol_control_Control_.call(this, {
    element: element,
    render: render,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {Object.<string, Element>}
   */
  this.attributionElements_ = {};

  /**
   * @private
   * @type {Object.<string, boolean>}
   */
  this.attributionElementRenderedVisible_ = {};

  /**
   * @private
   * @type {Object.<string, Element>}
   */
  this.logoElements_ = {};

};

_ol_.inherits(_ol_control_Attribution_, _ol_control_Control_);


/**
 * @param {?olx.FrameState} frameState Frame state.
 * @return {Array.<Object.<string, ol.Attribution>>} Attributions.
 */
_ol_control_Attribution_.prototype.getSourceAttributions = function(frameState) {
  var i, ii, j, jj, tileRanges, source, sourceAttribution,
      sourceAttributionKey, sourceAttributions, sourceKey;
  var intersectsTileRange;
  var layerStatesArray = frameState.layerStatesArray;
  /** @type {Object.<string, ol.Attribution>} */
  var attributions = _ol_obj_.assign({}, frameState.attributions);
  /** @type {Object.<string, ol.Attribution>} */
  var hiddenAttributions = {};
  var uniqueAttributions = {};
  var projection = /** @type {!ol.proj.Projection} */ (frameState.viewState.projection);
  for (i = 0, ii = layerStatesArray.length; i < ii; i++) {
    source = layerStatesArray[i].layer.getSource();
    if (!source) {
      continue;
    }
    sourceKey = _ol_.getUid(source).toString();
    sourceAttributions = source.getAttributions();
    if (!sourceAttributions) {
      continue;
    }
    for (j = 0, jj = sourceAttributions.length; j < jj; j++) {
      sourceAttribution = sourceAttributions[j];
      sourceAttributionKey = _ol_.getUid(sourceAttribution).toString();
      if (sourceAttributionKey in attributions) {
        continue;
      }
      tileRanges = frameState.usedTiles[sourceKey];
      if (tileRanges) {
        var tileGrid = /** @type {ol.source.Tile} */ (source).getTileGridForProjection(projection);
        intersectsTileRange = sourceAttribution.intersectsAnyTileRange(
            tileRanges, tileGrid, projection);
      } else {
        intersectsTileRange = false;
      }
      if (intersectsTileRange) {
        if (sourceAttributionKey in hiddenAttributions) {
          delete hiddenAttributions[sourceAttributionKey];
        }
        var html = sourceAttribution.getHTML();
        if (!(html in uniqueAttributions)) {
          uniqueAttributions[html] = true;
          attributions[sourceAttributionKey] = sourceAttribution;
        }
      } else {
        hiddenAttributions[sourceAttributionKey] = sourceAttribution;
      }
    }
  }
  return [attributions, hiddenAttributions];
};


/**
 * Update the attribution element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.Attribution}
 * @api
 */
_ol_control_Attribution_.render = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @private
 * @param {?olx.FrameState} frameState Frame state.
 */
_ol_control_Attribution_.prototype.updateElement_ = function(frameState) {

  if (!frameState) {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var attributions = this.getSourceAttributions(frameState);
  /** @type {Object.<string, ol.Attribution>} */
  var visibleAttributions = attributions[0];
  /** @type {Object.<string, ol.Attribution>} */
  var hiddenAttributions = attributions[1];

  var attributionElement, attributionKey;
  for (attributionKey in this.attributionElements_) {
    if (attributionKey in visibleAttributions) {
      if (!this.attributionElementRenderedVisible_[attributionKey]) {
        this.attributionElements_[attributionKey].style.display = '';
        this.attributionElementRenderedVisible_[attributionKey] = true;
      }
      delete visibleAttributions[attributionKey];
    } else if (attributionKey in hiddenAttributions) {
      if (this.attributionElementRenderedVisible_[attributionKey]) {
        this.attributionElements_[attributionKey].style.display = 'none';
        delete this.attributionElementRenderedVisible_[attributionKey];
      }
      delete hiddenAttributions[attributionKey];
    } else {
      _ol_dom_.removeNode(this.attributionElements_[attributionKey]);
      delete this.attributionElements_[attributionKey];
      delete this.attributionElementRenderedVisible_[attributionKey];
    }
  }
  for (attributionKey in visibleAttributions) {
    attributionElement = document.createElement('LI');
    attributionElement.innerHTML =
        visibleAttributions[attributionKey].getHTML();
    this.ulElement_.appendChild(attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
    this.attributionElementRenderedVisible_[attributionKey] = true;
  }
  for (attributionKey in hiddenAttributions) {
    attributionElement = document.createElement('LI');
    attributionElement.innerHTML =
        hiddenAttributions[attributionKey].getHTML();
    attributionElement.style.display = 'none';
    this.ulElement_.appendChild(attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
  }

  var renderVisible =
      !_ol_obj_.isEmpty(this.attributionElementRenderedVisible_) ||
      !_ol_obj_.isEmpty(frameState.logos);
  if (this.renderedVisible_ != renderVisible) {
    this.element.style.display = renderVisible ? '' : 'none';
    this.renderedVisible_ = renderVisible;
  }
  if (renderVisible &&
      _ol_obj_.isEmpty(this.attributionElementRenderedVisible_)) {
    this.element.classList.add('ol-logo-only');
  } else {
    this.element.classList.remove('ol-logo-only');
  }

  this.insertLogos_(frameState);

};


/**
 * @param {?olx.FrameState} frameState Frame state.
 * @private
 */
_ol_control_Attribution_.prototype.insertLogos_ = function(frameState) {

  var logo;
  var logos = frameState.logos;
  var logoElements = this.logoElements_;

  for (logo in logoElements) {
    if (!(logo in logos)) {
      _ol_dom_.removeNode(logoElements[logo]);
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

  this.logoLi_.style.display = !_ol_obj_.isEmpty(logos) ? '' : 'none';

};


/**
 * @param {Event} event The event to handle
 * @private
 */
_ol_control_Attribution_.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
_ol_control_Attribution_.prototype.handleToggle_ = function() {
  this.element.classList.toggle('ol-collapsed');
  if (this.collapsed_) {
    _ol_dom_.replaceNode(this.collapseLabel_, this.label_);
  } else {
    _ol_dom_.replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;
};


/**
 * Return `true` if the attribution is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api
 */
_ol_control_Attribution_.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the attribution should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api
 */
_ol_control_Attribution_.prototype.setCollapsible = function(collapsible) {
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
_ol_control_Attribution_.prototype.setCollapsed = function(collapsed) {
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
_ol_control_Attribution_.prototype.getCollapsed = function() {
  return this.collapsed_;
};
export default _ol_control_Attribution_;
