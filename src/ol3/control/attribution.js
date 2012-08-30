// FIXME handle rotation
// FIXME handle date line wrap
// FIXME handle layer order
// FIXME check clean-up code

goog.provide('ol3.control.Attribution');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol3.Collection');
goog.require('ol3.Control');
goog.require('ol3.CoverageArea');
goog.require('ol3.Layer');
goog.require('ol3.MapProperty');
goog.require('ol3.TileCoverageArea');



/**
 * @constructor
 * @extends {ol3.Control}
 * @param {ol3.Map} map Map.
 */
ol3.control.Attribution = function(map) {

  goog.base(this, map);

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  /**
   * @private
   * @type {Array.<number>}
   */
  this.layersListenerKeys_ = null;

  /**
   * @private
   * @type {Object.<number, ?number>}
   */
  this.layerVisibleChangeListenerKeys_ = {};

  /**
   * @private
   * @type {Object.<number, Element>}
   */
  this.attributionElements_ = {};

  /**
   * @private
   * @type {Object.<number, Array.<ol3.CoverageArea>>}
   */
  this.coverageAreass_ = {};

  goog.events.listen(
      map, ol3.Object.getChangedEventType(ol3.MapProperty.CENTER),
      this.handleMapChanged, false, this);

  goog.events.listen(
      map, ol3.Object.getChangedEventType(ol3.MapProperty.LAYERS),
      this.handleMapLayersChanged, false, this);

  goog.events.listen(map,
      ol3.Object.getChangedEventType(ol3.MapProperty.RESOLUTION),
      this.handleMapChanged, false, this);

  goog.events.listen(map, ol3.Object.getChangedEventType(ol3.MapProperty.SIZE),
      this.handleMapChanged, false, this);

  this.handleMapLayersChanged();

};
goog.inherits(ol3.control.Attribution, ol3.Control);


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 */
ol3.control.Attribution.prototype.addLayer = function(layer) {

  var layerKey = goog.getUid(layer);

  this.layerVisibleChangeListenerKeys_[layerKey] = goog.events.listen(
      layer, ol3.Object.getChangedEventType(ol3.LayerProperty.VISIBLE),
      this.handleLayerVisibleChanged, false, this);

  if (layer.getStore().isReady()) {
    this.createAttributionElementsForLayer_(layer);
  } else {
    goog.events.listenOnce(layer, goog.events.EventType.LOAD,
        this.handleLayerLoad, false, this);
  }

};


/**
 * @param {ol3.Layer} layer Layer.
 * @private
 */
ol3.control.Attribution.prototype.createAttributionElementsForLayer_ =
    function(layer) {

  var store = layer.getStore();
  var attributions = store.getAttributions();
  if (goog.isNull(attributions)) {
    return;
  }

  var map = this.getMap();
  var mapIsDef = map.isDef();
  var mapExtent = /** @type {ol3.Extent} */ map.getExtent();
  var mapProjection = /** @type {ol3.Projection} */ map.getProjection();
  var mapResolution = /** @type {number} */ map.getResolution();

  var layerVisible = layer.getVisible();

  var attributionVisibilities;
  if (mapIsDef && layerVisible) {
    attributionVisibilities = this.getLayerAttributionVisiblities_(
        layer, mapExtent, mapResolution, mapProjection);
  } else {
    attributionVisibilities = null;
  }

  goog.array.forEach(attributions, function(attribution) {

    var attributionKey = goog.getUid(attribution);

    var attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
    attributionElement.innerHTML = attribution.getHtml();

    if (!map.isDef ||
        !layerVisible ||
        goog.isNull(attributionVisibilities) ||
        !attributionVisibilities[attributionKey]) {
      goog.style.showElement(attributionElement, false);
    }

    goog.dom.appendChild(this.ulElement_, attributionElement);

    this.attributionElements_[attributionKey] = attributionElement;

  }, this);

};


/**
 * @inheritDoc
 */
ol3.control.Attribution.prototype.getElement = function() {
  return this.ulElement_;
};


/**
 * @param {ol3.Layer} layer Layer.
 * @param {ol3.Extent} mapExtent Map extent.
 * @param {number} mapResolution Map resolution.
 * @param {ol3.Projection} mapProjection Map projection.
 * @return {Object.<number, boolean>} Attribution visibilities.
 * @private
 */
ol3.control.Attribution.prototype.getLayerAttributionVisiblities_ =
    function(layer, mapExtent, mapResolution, mapProjection) {

  var store = layer.getStore();
  var attributions = store.getAttributions();

  if (goog.isNull(attributions)) {
    return null;
  }

  var mapZ;
  if (store instanceof ol3.TileStore) {
    var tileStore = /** @type {ol3.TileStore} */ store;
    var tileGrid = tileStore.getTileGrid();
    mapZ = tileGrid.getZForResolution(mapResolution);
  }

  var attributionVisibilities = {};
  goog.array.forEach(attributions, function(attribution) {

    var attributionKey = goog.getUid(attribution);

    var attributionVisible = true;

    var coverageAreas;
    if (attributionKey in this.coverageAreass_) {
      coverageAreas = this.coverageAreass_[attributionKey];
    } else {
      var attributionProjection = attribution.getProjection();
      coverageAreas = attribution.getCoverageAreas();
      if (!goog.isNull(coverageAreas) &&
          !ol3.Projection.equivalent(attributionProjection, mapProjection)) {
        var transformFn = ol3.Projection.getTransform(
            attributionProjection, mapProjection);
        if (transformFn !== ol3.Projection.cloneTransform) {
          coverageAreas = goog.array.map(coverageAreas, function(coverageArea) {
            return coverageArea.transform(transformFn);
          });
        }
      }
      this.coverageAreass_[attributionKey] = coverageAreas;
    }

    if (!goog.isNull(coverageAreas)) {
      if (store instanceof ol3.TileStore) {
        attributionVisible = goog.array.some(
            coverageAreas,
            /**
             * @param {ol3.TileCoverageArea} tileCoverageArea
             *     Tile coverage area.
             */
            function(tileCoverageArea) {
              goog.asserts.assert(
                  tileCoverageArea instanceof ol3.TileCoverageArea);
              return tileCoverageArea.intersectsExtentAndZ(mapExtent, mapZ);
            });
      } else {
        attributionVisible = goog.array.some(
            coverageAreas,
            function(coverageArea) {
              return coverageArea.intersectsExtentAndResolution(
                  mapExtent, mapResolution);
            });
      }
    }

    attributionVisibilities[attributionKey] = attributionVisible;

  }, this);

  return attributionVisibilities;

};


/**
 * @param {goog.events.Event} event Event.
 */
ol3.control.Attribution.prototype.handleLayerLoad = function(event) {
  var layer = /** @type {ol3.Layer} */ event.target;
  this.createAttributionElementsForLayer_(layer);
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol3.control.Attribution.prototype.handleLayerVisibleChanged = function(event) {

  var map = this.getMap();
  var mapIsDef = map.isDef();
  var mapExtent = /** @type {ol3.Extent} */ map.getExtent();
  var mapProjection = /** @type {ol3.Projection} */ map.getProjection();
  var mapResolution = /** @type {number} */ map.getResolution();

  var layer = /** @type {ol3.Layer} */ event.target;

  this.updateLayerAttributionsVisibility_(
      layer, mapIsDef, mapExtent, mapResolution, mapProjection);

};


/**
 * @param {ol3.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol3.control.Attribution.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol3.Layer} */ collectionEvent.elem;
  this.addLayer(layer);
};


/**
 * @param {ol3.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol3.control.Attribution.prototype.handleLayersRemove =
    function(collectionEvent) {
  var layer = /** @type {ol3.Layer} */ collectionEvent.elem;
  this.removeLayer(layer);
};


/**
 * @protected
 */
ol3.control.Attribution.prototype.handleMapChanged = function() {

  var map = this.getMap();
  var mapIsDef = map.isDef();
  var mapExtent = /** @type {ol3.Extent} */ map.getExtent();
  var mapProjection = /** @type {ol3.Projection} */ map.getProjection();
  var mapResolution = map.getResolution();

  var layers = map.getLayers();
  layers.forEach(function(layer) {
    this.updateLayerAttributionsVisibility_(
        layer, mapIsDef, mapExtent, mapResolution, mapProjection);
  }, this);

};


/**
 * @protected
 */
ol3.control.Attribution.prototype.handleMapLayersChanged = function() {
  if (!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null;
  }
  goog.object.forEach(this.attributionElements_, function(attributionElement) {
    goog.dom.removeNode(attributionElement);
  }, this);
  this.attributionElements_ = {};
  this.coverageAreass_ = {};
  var map = this.getMap();
  var layers = map.getLayers();
  if (goog.isDefAndNotNull(layers)) {
    layers.forEach(this.addLayer, this);
    this.layersListenerKeys_ = [
      goog.events.listen(layers, ol3.CollectionEventType.ADD,
          this.handleLayersAdd, false, this),
      goog.events.listen(layers, ol3.CollectionEventType.REMOVE,
          this.handleLayersRemove, false, this)
    ];
  }
};


/**
 * @param {ol3.Layer} layer Layer.
 * @protected
 */
ol3.control.Attribution.prototype.removeLayer = function(layer) {

  var layerKey = goog.getUid(layer);

  goog.events.unlistenByKey(this.layerVisibleChangeListenerKeys_[layerKey]);
  delete this.layerVisibleChangeListenerKeys_[layerKey];

  goog.array.forEach(layer.getStore().getAttributions(), function(attribution) {
    var attributionKey = goog.getUid(attribution);
    delete this.coverageAreass_[attributionKey];
    var attributionElement = this.attributionElements_[attributionKey];
    goog.dom.removeNode(attributionElement);
    delete this.attributionElements_[attributionKey];
  }, this);

};


/**
 * @param {ol3.Layer} layer Layer.
 * @param {boolean} mapIsDef Map is defined.
 * @param {ol3.Extent} mapExtent Map extent.
 * @param {number} mapResolution Map resolution.
 * @param {ol3.Projection} mapProjection Map projection.
 * @private
 */
ol3.control.Attribution.prototype.updateLayerAttributionsVisibility_ =
    function(layer, mapIsDef, mapExtent, mapResolution, mapProjection) {
  if (mapIsDef && layer.getVisible()) {
    var attributionVisibilities = this.getLayerAttributionVisiblities_(
        layer, mapExtent, mapResolution, mapProjection);
    goog.object.forEach(
        attributionVisibilities,
        function(attributionVisible, attributionKey) {
          var attributionElement = this.attributionElements_[attributionKey];
          goog.style.showElement(attributionElement, attributionVisible);
        },
        this);
  } else {
    var store = layer.getStore();
    var attributions = store.getAttributions();
    if (!goog.isNull(attributions)) {
      goog.array.forEach(attributions, function(attribution) {
        var attributionKey = goog.getUid(attribution);
        var attributionElement = this.attributionElements_[attributionKey];
        goog.style.showElement(attributionElement, false);
      }, this);
    }
  }
};
