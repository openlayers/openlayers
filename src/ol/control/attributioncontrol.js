// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.source.Tile');



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
 * @api stable
 */
ol.control.Attribution = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement('UL');

  /**
   * @private
   * @type {Element}
   */
  this.logoLi_ = goog.dom.createElement('LI');

  this.ulElement_.appendChild(this.logoLi_);
  goog.style.setElementShown(this.logoLi_, false);

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

  var className = options.className ? options.className : 'ol-attribution';

  var tipLabel = options.tipLabel ? options.tipLabel : 'Attributions';

  var collapseLabel = options.collapseLabel ? options.collapseLabel : '\u00BB';

  /**
   * @private
   * @type {Node}
   */
  this.collapseLabel_ = goog.isString(collapseLabel) ?
      goog.dom.createDom('SPAN', {}, collapseLabel) :
      collapseLabel;

  var label = options.label ? options.label : 'i';

  /**
   * @private
   * @type {Node}
   */
  this.label_ = goog.isString(label) ?
      goog.dom.createDom('SPAN', {}, label) :
      label;

  var activeLabel = (this.collapsible_ && !this.collapsed_) ?
      this.collapseLabel_ : this.label_;
  var button = goog.dom.createDom('BUTTON', {
    'type': 'button',
    'title': tipLabel
  }, activeLabel);

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL +
      (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
      (this.collapsible_ ? '' : ' ol-uncollapsible');
  var element = goog.dom.createDom('DIV',
      cssClasses, this.ulElement_, button);

  var render = options.render ? options.render : ol.control.Attribution.render;

  goog.base(this, {
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
goog.inherits(ol.control.Attribution, ol.control.Control);


/**
 * @param {?olx.FrameState} frameState Frame state.
 * @return {Array.<Object.<string, ol.Attribution>>} Attributions.
 */
ol.control.Attribution.prototype.getSourceAttributions = function(frameState) {
  var i, ii, j, jj, tileRanges, source, sourceAttribution,
      sourceAttributionKey, sourceAttributions, sourceKey;
  var intersectsTileRange;
  var layerStatesArray = frameState.layerStatesArray;
  /** @type {Object.<string, ol.Attribution>} */
  var attributions = goog.object.clone(frameState.attributions);
  /** @type {Object.<string, ol.Attribution>} */
  var hiddenAttributions = {};
  var projection = frameState.viewState.projection;
  goog.asserts.assert(projection, 'projection of viewState required');
  for (i = 0, ii = layerStatesArray.length; i < ii; i++) {
    source = layerStatesArray[i].layer.getSource();
    if (!source) {
      continue;
    }
    sourceKey = goog.getUid(source).toString();
    sourceAttributions = source.getAttributions();
    if (!sourceAttributions) {
      continue;
    }
    for (j = 0, jj = sourceAttributions.length; j < jj; j++) {
      sourceAttribution = sourceAttributions[j];
      sourceAttributionKey = goog.getUid(sourceAttribution).toString();
      if (sourceAttributionKey in attributions) {
        continue;
      }
      tileRanges = frameState.usedTiles[sourceKey];
      if (tileRanges) {
        goog.asserts.assertInstanceof(source, ol.source.Tile,
            'source should be an ol.source.Tile');
        var tileGrid = source.getTileGridForProjection(projection);
        goog.asserts.assert(tileGrid, 'tileGrid required for projection');
        intersectsTileRange = sourceAttribution.intersectsAnyTileRange(
            tileRanges, tileGrid, projection);
      } else {
        intersectsTileRange = false;
      }
      if (intersectsTileRange) {
        if (sourceAttributionKey in hiddenAttributions) {
          delete hiddenAttributions[sourceAttributionKey];
        }
        attributions[sourceAttributionKey] = sourceAttribution;
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
      goog.style.setElementShown(this.element, false);
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
        goog.style.setElementShown(
            this.attributionElements_[attributionKey], true);
        this.attributionElementRenderedVisible_[attributionKey] = true;
      }
      delete visibleAttributions[attributionKey];
    }
    else if (attributionKey in hiddenAttributions) {
      if (this.attributionElementRenderedVisible_[attributionKey]) {
        goog.style.setElementShown(
            this.attributionElements_[attributionKey], false);
        delete this.attributionElementRenderedVisible_[attributionKey];
      }
      delete hiddenAttributions[attributionKey];
    }
    else {
      goog.dom.removeNode(this.attributionElements_[attributionKey]);
      delete this.attributionElements_[attributionKey];
      delete this.attributionElementRenderedVisible_[attributionKey];
    }
  }
  for (attributionKey in visibleAttributions) {
    attributionElement = goog.dom.createElement('LI');
    attributionElement.innerHTML =
        visibleAttributions[attributionKey].getHTML();
    this.ulElement_.appendChild(attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
    this.attributionElementRenderedVisible_[attributionKey] = true;
  }
  for (attributionKey in hiddenAttributions) {
    attributionElement = goog.dom.createElement('LI');
    attributionElement.innerHTML =
        hiddenAttributions[attributionKey].getHTML();
    goog.style.setElementShown(attributionElement, false);
    this.ulElement_.appendChild(attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
  }

  var renderVisible =
      !goog.object.isEmpty(this.attributionElementRenderedVisible_) ||
      !goog.object.isEmpty(frameState.logos);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.setElementShown(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }
  if (renderVisible &&
      goog.object.isEmpty(this.attributionElementRenderedVisible_)) {
    goog.dom.classlist.add(this.element, 'ol-logo-only');
  } else {
    goog.dom.classlist.remove(this.element, 'ol-logo-only');
  }

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
      goog.dom.removeNode(logoElements[logo]);
      delete logoElements[logo];
    }
  }

  var image, logoElement, logoKey;
  for (logoKey in logos) {
    if (!(logoKey in logoElements)) {
      image = new Image();
      image.src = logoKey;
      var logoValue = logos[logoKey];
      if (logoValue === '') {
        logoElement = image;
      } else {
        logoElement = goog.dom.createDom('A', {
          'href': logoValue
        });
        logoElement.appendChild(image);
      }
      this.logoLi_.appendChild(logoElement);
      logoElements[logoKey] = logoElement;
    }
  }

  goog.style.setElementShown(this.logoLi_, !goog.object.isEmpty(logos));

};


/**
 * @param {goog.events.BrowserEvent} event The event to handle
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
  goog.dom.classlist.toggle(this.element, 'ol-collapsed');
  if (this.collapsed_) {
    goog.dom.replaceNode(this.collapseLabel_, this.label_);
  } else {
    goog.dom.replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;
};


/**
 * Return `true` if the attribution is collapsible, `false` otherwise.
 * @return {boolean} True if the widget is collapsible.
 * @api stable
 */
ol.control.Attribution.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
 * Set whether the attribution should be collapsible.
 * @param {boolean} collapsible True if the widget is collapsible.
 * @api stable
 */
ol.control.Attribution.prototype.setCollapsible = function(collapsible) {
  if (this.collapsible_ === collapsible) {
    return;
  }
  this.collapsible_ = collapsible;
  goog.dom.classlist.toggle(this.element, 'ol-uncollapsible');
  if (!collapsible && this.collapsed_) {
    this.handleToggle_();
  }
};


/**
 * Collapse or expand the attribution according to the passed parameter. Will
 * not do anything if the attribution isn't collapsible or if the current
 * collapsed state is already the one requested.
 * @param {boolean} collapsed True if the widget is collapsed.
 * @api stable
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
 * @api stable
 */
ol.control.Attribution.prototype.getCollapsed = function() {
  return this.collapsed_;
};
