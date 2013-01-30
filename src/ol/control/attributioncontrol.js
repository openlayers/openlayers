// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.MapEventType');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.AttributionOptions} attributionOptions Attribution
 *     options.
 */
ol.control.Attribution = function(attributionOptions) {

  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-attribution ol-unselectable'
  }, this.ulElement_);

  goog.base(this, {
    element: element,
    map: attributionOptions.map,
    target: attributionOptions.target
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
   * @type {Array.<?number>}
   */
  this.listenerKeys_ = null;

};
goog.inherits(ol.control.Attribution, ol.control.Control);


/**
 * @param {ol.MapEvent} mapEvent Map event.
 */
ol.control.Attribution.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.updateElement_(null);
  } else {
    this.updateElement_(frameState.usedTiles);
  }
};


/**
 * @inheritDoc
 */
ol.control.Attribution.prototype.setMap = function(map) {
  if (!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null;
  }
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    this.listenerKeys_ = [
      goog.events.listen(map, ol.MapEventType.POSTRENDER,
          this.handleMapPostrender, false, this)
    ];
  }
};


/**
 * @private
 * @param {?Object.<string, Object.<string, ol.TileRange>>} usedTiles Used
 *     tiles.
 */
ol.control.Attribution.prototype.updateElement_ = function(usedTiles) {

  if (goog.isNull(usedTiles)) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.element, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var map = this.getMap();

  /** @type {Object.<string, boolean>} */
  var attributionsToRemove = {};
  /** @type {Object.<string, ol.source.TileSource>} */
  var tileSources = {};
  var layers = map.getLayers();
  if (goog.isDef(layers)) {
    layers.forEach(function(layer) {
      var source = layer.getSource();
      if (source instanceof ol.source.TileSource) {
        tileSources[goog.getUid(source).toString()] = source;
      }
      var attributions = source.getAttributions();
      if (!goog.isNull(attributions)) {
        var attribution, i;
        for (i = 0; i < attributions.length; ++i) {
          attribution = attributions[i];
          attributionKey = goog.getUid(attribution).toString();
          attributionsToRemove[attributionKey] = true;
        }
      }
    });
  }

  /** @type {Object.<string, ol.Attribution>} */
  var attributions = {};
  var i, tileRanges, tileSource, tileSourceAttribution,
      tileSourceAttributionKey, tileSourceAttributions, tileSourceKey, z;
  for (tileSourceKey in usedTiles) {
    goog.asserts.assert(tileSourceKey in tileSources);
    tileSource = tileSources[tileSourceKey];
    tileSourceAttributions = tileSource.getAttributions();
    if (goog.isNull(tileSourceAttributions)) {
      continue;
    }
    tileRanges = usedTiles[tileSourceKey];
    for (i = 0; i < tileSourceAttributions.length; ++i) {
      tileSourceAttribution = tileSourceAttributions[i];
      tileSourceAttributionKey = goog.getUid(tileSourceAttribution).toString();
      if (tileSourceAttributionKey in attributions) {
        continue;
      }
      if (tileSourceAttribution.intersectsAnyTileRange(tileRanges)) {
        attributions[tileSourceAttributionKey] = tileSourceAttribution;
      }
    }
  }

  /** @type {Array.<number>} */
  var attributionKeys =
      goog.array.map(goog.object.getKeys(attributions), Number);
  goog.array.sort(attributionKeys);
  var attributionElement, attributionKey;
  for (i = 0; i < attributionKeys.length; ++i) {
    attributionKey = attributionKeys[i].toString();
    if (attributionKey in this.attributionElements_) {
      if (!this.attributionElementRenderedVisible_[attributionKey]) {
        goog.style.showElement(this.attributionElements_[attributionKey], true);
        this.attributionElementRenderedVisible_[attributionKey] = true;
      }
    } else {
      attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
      attributionElement.innerHTML = attributions[attributionKey].getHTML();
      goog.dom.appendChild(this.ulElement_, attributionElement);
      this.attributionElements_[attributionKey] = attributionElement;
      this.attributionElementRenderedVisible_[attributionKey] = true;
    }
    delete attributionsToRemove[attributionKey];
  }

  for (attributionKey in attributionsToRemove) {
    goog.dom.removeNode(this.attributionElements_[attributionKey]);
    delete this.attributionElements_[attributionKey];
    delete this.attributionElementRenderedVisible_[attributionKey];
  }

  var renderVisible = !goog.array.isEmpty(attributionKeys);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.showElement(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }

};
