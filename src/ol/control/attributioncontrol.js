// FIXME handle rotation
// FIXME handle date line wrap
// FIXME handle layer order
// FIXME check clean-up code
// FIXME works for View2D only

goog.provide('ol.control.Attribution');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Collection');
goog.require('ol.CoverageArea');
goog.require('ol.TileCoverageArea');
goog.require('ol.View2D');
goog.require('ol.View2DProperty');
goog.require('ol.control.Control');
goog.require('ol.layer.Layer');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.AttributionOptions} attributionOptions Attribution
 *     options.
 */
ol.control.Attribution = function(attributionOptions) {

  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-attribution'
  }, this.ulElement_);

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
   * @type {Object.<number, Array.<ol.CoverageArea>>}
   */
  this.coverageAreass_ = {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.mapListenerKeys_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.layersListenerKeys_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.viewListenerKeys_ = null;

  goog.base(this, {
    element: element,
    map: attributionOptions.map,
    target: attributionOptions.target
  });

};
goog.inherits(ol.control.Attribution, ol.control.Control);


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 */
ol.control.Attribution.prototype.addLayer = function(layer) {

  var layerKey = goog.getUid(layer);

  this.layerVisibleChangeListenerKeys_[layerKey] = goog.events.listen(
      layer, ol.Object.getChangedEventType(ol.layer.LayerProperty.VISIBLE),
      this.handleLayerVisibleChanged, false, this);

  if (layer.getSource().isReady()) {
    this.createAttributionElementsForLayer_(layer);
  } else {
    goog.events.listenOnce(layer, goog.events.EventType.LOAD,
        this.handleLayerLoad, false, this);
  }

};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.control.Attribution.prototype.createAttributionElementsForLayer_ =
    function(layer) {

  var source = layer.getSource();
  var attributions = source.getAttributions();
  if (goog.isNull(attributions)) {
    return;
  }

  var map = this.getMap();
  var mapIsDef = map.isDef();
  var layerVisible = layer.getVisible();

  var attributionVisibilities;
  if (mapIsDef && layerVisible) {
    var mapSize = /** @type {ol.Size} */ (map.getSize());
    // FIXME works for View2D only
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    var mapExtent = view.getExtent(mapSize);
    var mapProjection = /** @type {ol.Projection} */ (view.getProjection());
    var mapResolution = /** @type {number} */ (view.getResolution());
    attributionVisibilities = this.getLayerAttributionVisiblities_(
        layer, mapExtent, mapResolution, mapProjection);
  } else {
    attributionVisibilities = null;
  }

  goog.array.forEach(attributions, function(attribution) {

    var attributionKey = goog.getUid(attribution);

    var attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
    attributionElement.innerHTML = attribution.getHtml();

    if (!mapIsDef ||
        !layerVisible ||
        goog.isNull(attributionVisibilities) ||
        !attributionVisibilities[attributionKey]) {
      if (goog.style.isElementShown(attributionElement)) {
        goog.style.showElement(attributionElement, false);
      }
    }

    goog.dom.appendChild(this.ulElement_, attributionElement);

    this.attributionElements_[attributionKey] = attributionElement;

  }, this);

};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @param {ol.Extent} mapExtent View extent.
 * @param {number} mapResolution View resolution.
 * @param {ol.Projection} mapProjection Map projection.
 * @return {Object.<number, boolean>} Attribution visibilities.
 * @private
 */
ol.control.Attribution.prototype.getLayerAttributionVisiblities_ =
    function(layer, mapExtent, mapResolution, mapProjection) {

  var source = layer.getSource();
  var attributions = source.getAttributions();

  if (goog.isNull(attributions)) {
    return null;
  }

  var mapZ;
  if (source instanceof ol.source.TileSource) {
    var tileSource = /** @type {ol.source.TileSource} */ (source);
    var tileGrid = tileSource.getTileGrid();
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
          !ol.Projection.equivalent(attributionProjection, mapProjection)) {
        var transformFn = ol.Projection.getTransform(
            attributionProjection, mapProjection);
        if (transformFn !== ol.Projection.cloneTransform) {
          coverageAreas = goog.array.map(coverageAreas, function(coverageArea) {
            return coverageArea.transform(transformFn);
          });
        }
      }
      this.coverageAreass_[attributionKey] = coverageAreas;
    }

    if (!goog.isNull(coverageAreas)) {
      if (source instanceof ol.source.TileSource) {
        attributionVisible = goog.array.some(
            coverageAreas,
            function(coverageArea, index) {
              return coverageArea.intersectsExtentAndZ(mapExtent, mapZ);
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
ol.control.Attribution.prototype.handleLayerLoad = function(event) {
  var layer = /** @type {ol.layer.Layer} */ (event.target);
  this.createAttributionElementsForLayer_(layer);
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.control.Attribution.prototype.handleLayerVisibleChanged = function(event) {
  var layer = /** @type {ol.layer.Layer} */ (event.target);
  this.updateLayerAttributionsVisibility_(layer);

};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.control.Attribution.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = /** @type {ol.layer.Layer} */ (collectionEvent.elem);
  this.addLayer(layer);
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @protected
 */
ol.control.Attribution.prototype.handleLayersRemove =
    function(collectionEvent) {
  var layer = /** @type {ol.layer.Layer} */ (collectionEvent.elem);
  this.removeLayer(layer);
};


/**
 * @protected
 */
ol.control.Attribution.prototype.handleMapViewChanged = function() {
  if (!goog.isNull(this.viewListenerKeys_)) {
    goog.array.forEach(this.viewListenerKeys_, goog.events.unlistenByKey);
    this.viewListenerKeys_ = null;
  }
  var map = this.getMap();
  goog.asserts.assert(!goog.isNull(map));
  var view = map.getView();
  if (!goog.isNull(view)) {
    // FIXME works for View2D only
    goog.asserts.assert(view instanceof ol.View2D);
    this.viewListenerKeys_ = [
      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.CENTER),
          this.updateAttributions, false, this),
      goog.events.listen(
          view, ol.Object.getChangedEventType(ol.View2DProperty.RESOLUTION),
          this.updateAttributions, false, this)
    ];
  }
};


/**
 * @protected
 */
ol.control.Attribution.prototype.handleMapLayersChanged = function() {
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
      goog.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd, false, this),
      goog.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove, false, this)
    ];
  }
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 */
ol.control.Attribution.prototype.removeLayer = function(layer) {

  var layerKey = goog.getUid(layer);

  goog.events.unlistenByKey(this.layerVisibleChangeListenerKeys_[layerKey]);
  delete this.layerVisibleChangeListenerKeys_[layerKey];

  goog.array.forEach(
      layer.getSource().getAttributions(),
      function(attribution) {
        var attributionKey = goog.getUid(attribution);
        delete this.coverageAreass_[attributionKey];
        var attributionElement = this.attributionElements_[attributionKey];
        goog.dom.removeNode(attributionElement);
        delete this.attributionElements_[attributionKey];
      },
      this);

};


/**
 * @inheritDoc
 */
ol.control.Attribution.prototype.setMap = function(map) {
  if (!goog.isNull(this.mapListenerKeys_)) {
    goog.array.forEach(this.mapListenerKeys_, goog.events.unlistenByKey);
  }
  this.mapListenerKeys_ = null;
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    this.mapListenerKeys_ = [
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS),
          this.handleMapLayersChanged, false, this),
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.SIZE),
          this.updateAttributions, false, this),
      goog.events.listen(
          map, ol.Object.getChangedEventType(ol.MapProperty.VIEW),
          this.updateAttributions, false, this)
    ];
    this.handleMapViewChanged();
    this.handleMapLayersChanged();
  }
};


/**
 * @protected
 */
ol.control.Attribution.prototype.updateAttributions = function() {

  var map = this.getMap();
  var layers = map.getLayers();
  layers.forEach(function(layer) {
    this.updateLayerAttributionsVisibility_(layer);
  }, this);

};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.control.Attribution.prototype.updateLayerAttributionsVisibility_ =
    function(layer) {
  var map = this.getMap();
  if (map.isDef() && layer.getVisible()) {
    var mapSize = /** @type {ol.Size} */ (map.getSize());
    var view = map.getView();
    // FIXME works for View2D only
    goog.asserts.assert(view instanceof ol.View2D);
    var mapExtent = view.getExtent(mapSize);
    var mapProjection = /** @type {ol.Projection} */ (view.getProjection());
    var mapResolution = /** @type {number} */ (view.getResolution());
    var attributionVisibilities = this.getLayerAttributionVisiblities_(
        layer, mapExtent, mapResolution, mapProjection);
    goog.object.forEach(
        attributionVisibilities,
        function(attributionVisible, attributionKey) {
          var attributionElement = this.attributionElements_[attributionKey];
          if (goog.style.isElementShown(attributionElement) !=
              attributionVisible) {
            goog.style.showElement(attributionElement, attributionVisible);
          }
        },
        this);
  } else {
    var source = layer.getSource();
    var attributions = source.getAttributions();
    if (!goog.isNull(attributions)) {
      goog.array.forEach(attributions, function(attribution) {
        var attributionKey = goog.getUid(attribution);
        var attributionElement = this.attributionElements_[attributionKey];
        goog.style.showElement(attributionElement, false);
      }, this);
    }
  }
};
