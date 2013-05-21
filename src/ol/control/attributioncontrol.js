// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Attribution');
goog.require('ol.FrameState');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.AttributionOptions=} opt_options Attribution options.
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
    map: options.map,
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
 * @param {?ol.FrameState} frameState Frame state.
 * @return {Object.<string, ol.Attribution>} Attributions.
 */
ol.control.Attribution.prototype.getTileSourceAttributions =
    function(frameState) {
  /** @type {Object.<string, ol.Attribution>} */
  var attributions = {};
  var i, ii, j, jj, tileRanges, tileSource, tileSourceAttribution,
      tileSourceAttributionKey, tileSourceAttributions, tileSourceKey;
  var layers = frameState.layersArray;
  for (i = 0, ii = layers.length; i < ii; i++) {
    tileSource = layers[i].getSource();
    tileSourceKey = goog.getUid(tileSource).toString();
    if (tileSourceKey in frameState.usedTiles) {
      tileSourceAttributions = tileSource.getAttributions();
      if (goog.isNull(tileSourceAttributions)) {
        continue;
      }
      tileRanges = frameState.usedTiles[tileSourceKey];
      for (j = 0, jj = tileSourceAttributions.length; j < jj; j++) {
        tileSourceAttribution = tileSourceAttributions[j];
        tileSourceAttributionKey =
            goog.getUid(tileSourceAttribution).toString();
        if (!(tileSourceAttributionKey in attributions) &&
            tileSourceAttribution.intersectsAnyTileRange(tileRanges)) {
          attributions[tileSourceAttributionKey] = tileSourceAttribution;
        }
      }
    }
  }
  return attributions;
};


/**
 * @inheritDoc
 */
ol.control.Attribution.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @private
 * @param {?ol.FrameState} frameState Frame state.
 */
ol.control.Attribution.prototype.updateElement_ = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.element, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  /** @type {Object.<string, ol.Attribution>} */
  var attributions = goog.object.clone(frameState.attributions);
  goog.object.extend(attributions, this.getTileSourceAttributions(frameState));

  var attributionElement, attributionKey;
  for (attributionKey in this.attributionElements_) {
    if (attributionKey in attributions) {
      if (!this.attributionElementRenderedVisible_[attributionKey]) {
        goog.style.showElement(this.attributionElements_[attributionKey], true);
        this.attributionElementRenderedVisible_[attributionKey] = true;
      }
      delete attributions[attributionKey];
    }
    else {
      goog.dom.removeNode(this.attributionElements_[attributionKey]);
      delete this.attributionElements_[attributionKey];
      delete this.attributionElementRenderedVisible_[attributionKey];
    }
  }
  for (attributionKey in attributions) {
    attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
    attributionElement.innerHTML = attributions[attributionKey].getHTML();
    goog.dom.appendChild(this.ulElement_, attributionElement);
    this.attributionElements_[attributionKey] = attributionElement;
    this.attributionElementRenderedVisible_[attributionKey] = true;
  }

  var renderVisible = !goog.object.isEmpty(this.attributionElements_);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.showElement(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }

};
