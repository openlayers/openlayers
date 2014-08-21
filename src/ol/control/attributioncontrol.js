// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Attribution');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.pointer.PointerEventHandler');



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

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  /**
   * @private
   * @type {Element}
   */
  this.logoLi_ = goog.dom.createElement(goog.dom.TagName.LI);

  goog.dom.appendChild(this.ulElement_, this.logoLi_);
  goog.style.setElementShown(this.logoLi_, false);

  /**
   * @private
   * @type {boolean}
   */
  this.collapsed_ = goog.isDef(options.collapsed) ? options.collapsed : true;

  /**
   * @private
   * @type {boolean}
   */
  this.collapsible_ = goog.isDef(options.collapsible) ?
      options.collapsible : true;

  if (!this.collapsible_) {
    this.collapsed_ = false;
  }

  var className = goog.isDef(options.className) ?
      options.className : 'ol-attribution';

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Attributions';
  var tip = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, tipLabel);

  /**
   * @private
   * @type {string}
   */
  this.collapseLabel_ = goog.isDef(options.collapseLabel) ?
      options.collapseLabel : '\u00BB';

  /**
   * @private
   * @type {string}
   */
  this.label_ = goog.isDef(options.label) ? options.label : 'i';
  var label = goog.dom.createDom(goog.dom.TagName.SPAN, {},
      (this.collapsible_ && !this.collapsed_) ?
      this.collapseLabel_ : this.label_);


  /**
   * @private
   * @type {Element}
   */
  this.labelSpan_ = label;
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': 'ol-has-tooltip',
    'type': 'button'
  }, this.labelSpan_);
  goog.dom.appendChild(button, tip);

  var buttonHandler = new ol.pointer.PointerEventHandler(button);
  this.registerDisposable(buttonHandler);
  goog.events.listen(buttonHandler, ol.pointer.EventType.POINTERUP,
      this.handlePointerUp_, false, this);
  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
        ol.css.CLASS_CONTROL +
        (this.collapsed_ && this.collapsible_ ? ' ol-collapsed' : '') +
        (this.collapsible_ ? '' : ' ol-uncollapsible')
  }, this.ulElement_, button);

  goog.base(this, {
    element: element,
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
  var layerStatesArray = frameState.layerStatesArray;
  /** @type {Object.<string, ol.Attribution>} */
  var attributions = goog.object.clone(frameState.attributions);
  /** @type {Object.<string, ol.Attribution>} */
  var hiddenAttributions = {};
  for (i = 0, ii = layerStatesArray.length; i < ii; i++) {
    source = layerStatesArray[i].layer.getSource();
    sourceKey = goog.getUid(source).toString();
    sourceAttributions = source.getAttributions();
    if (goog.isNull(sourceAttributions)) {
      continue;
    }
    for (j = 0, jj = sourceAttributions.length; j < jj; j++) {
      sourceAttribution = sourceAttributions[j];
      sourceAttributionKey = goog.getUid(sourceAttribution).toString();
      if (sourceAttributionKey in attributions) {
        continue;
      }
      tileRanges = frameState.usedTiles[sourceKey];
      if (goog.isDef(tileRanges) &&
          sourceAttribution.intersectsAnyTileRange(tileRanges)) {
        if (sourceAttributionKey in hiddenAttributions) {
          delete hiddenAttributions[sourceAttributionKey];
        }
        attributions[sourceAttributionKey] = sourceAttribution;
      }
      else {
        hiddenAttributions[sourceAttributionKey] = sourceAttribution;
      }
    }
  }
  return [attributions, hiddenAttributions];
};


/**
 * @inheritDoc
 */
ol.control.Attribution.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @private
 * @param {?olx.FrameState} frameState Frame state.
 */
ol.control.Attribution.prototype.updateElement_ = function(frameState) {

  if (goog.isNull(frameState)) {
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
    attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
    attributionElement.innerHTML =
        visibleAttributions[attributionKey].getHTML();
    goog.dom.appendChild(this.ulElement_, attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
    this.attributionElementRenderedVisible_[attributionKey] = true;
  }
  for (attributionKey in hiddenAttributions) {
    attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
    attributionElement.innerHTML =
        hiddenAttributions[attributionKey].getHTML();
    goog.style.setElementShown(attributionElement, false);
    goog.dom.appendChild(this.ulElement_, attributionElement);
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
        logoElement = goog.dom.createDom(goog.dom.TagName.A, {
          'href': logoValue,
          'target': '_blank'
        });
        logoElement.appendChild(image);
      }
      goog.dom.appendChild(this.logoLi_, logoElement);
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
  if (event.screenX !== 0 && event.screenY !== 0) {
    return;
  }
  this.handleToggle_();
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent The event to handle
 * @private
 */
ol.control.Attribution.prototype.handlePointerUp_ = function(pointerEvent) {
  pointerEvent.browserEvent.preventDefault();
  this.handleToggle_();
};


/**
 * @private
 */
ol.control.Attribution.prototype.handleToggle_ = function() {
  goog.dom.classlist.toggle(this.element, 'ol-collapsed');
  goog.dom.setTextContent(this.labelSpan_,
      (this.collapsed_) ? this.collapseLabel_ : this.label_);
  this.collapsed_ = !this.collapsed_;
};


/**
 * @return {boolean} True if the widget is collapsible.
 * @api stable
 */
ol.control.Attribution.prototype.getCollapsible = function() {
  return this.collapsible_;
};


/**
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
 * @return {boolean} True if the widget is collapsed.
 * @api stable
 */
ol.control.Attribution.prototype.getCollapsed = function() {
  return this.collapsed_;
};
