// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Attribution');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * Create a new attribution control to show all the attributions associated
 * with the layer sources in the map. A default map has this control included.
 * By default it will show in the bottom right portion of the map, but it can
 * be changed by using a css selector for `.ol-attribution`.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.AttributionOptions=} opt_options Attribution options.
 * @todo api
 */
ol.control.Attribution = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  var className = goog.isDef(options.className) ?
      options.className : 'ol-attribution';
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  }, this.ulElement_);

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

};
goog.inherits(ol.control.Attribution, ol.control.Control);


/**
 * @param {?oli.FrameState} frameState Frame state.
 * @return {Array.<Object.<string, ol.Attribution>>} Attributions.
 */
ol.control.Attribution.prototype.getSourceAttributions =
    function(frameState) {
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
 * @param {?oli.FrameState} frameState Frame state.
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
      !goog.object.isEmpty(this.attributionElementRenderedVisible_);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.setElementShown(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }

};
