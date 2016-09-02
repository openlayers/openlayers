goog.provide('ga.Map');
goog.provide('ol.View2D');

goog.require('goog.ui.Dialog');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.dom');
goog.require('goog.dom.classlist');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.interaction');
goog.require('ol.proj');
goog.require('ol.Overlay');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.layer.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Circle');


goog.require('ga.Tooltip');
goog.require('ga.Lang');


/**
 * @classdesc
 * The map is the core component of the GeoAdmin API. In its minimal configuration it
 * needs a view, one or more geoadmin layers, and a target container:
 *
 *     var map = new ga.Map({
 *       view: new ol.View({
 *         center: [600000, 200000]
 *       }),
 *       layers: [
 *         ga.layer.create('ch.swisstopo.pixelkarte-farbe')
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map with a GeoAdmin layer on a 2D view and
 * renders it to a DOM element with the id 'map'.
 * The coordinate system EPSG:21781 is automatically set.
 *
 * @constructor
 * @extends {ol.Map}
 * @param {gax.MapOptions} options Map options.
 * @api stable
 */
ga.Map = function(options) {

  var renderer = 'canvas';

  if (goog.isDefAndNotNull(options.renderer)) {
    renderer = options.renderer;
  }
  options.renderer = renderer;

  var swissExtent = [420000, 30000, 900000, 350000];
  var swissProjection = ol.proj.get('EPSG:21781');
  swissProjection.setExtent(swissExtent);

  var view = new ol.View({
    resolutions: [
      650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    ],
    extent: swissExtent,
    projection: swissProjection,
    center: [660000, 190000],
    zoom: 0
  });
  if (goog.isDef(options.view)) {
    // FIXME: see ol3 #1000
    if (goog.isDefAndNotNull(options.view.getCenter())) {
      view.setCenter(options.view.getCenter());
    }
    if (goog.isDef(options.view.getResolution())) {
      view.setResolution(options.view.getResolution());
    }
    if (goog.isDef(options.view.getRotation())) {
      view.setRotation(options.view.getRotation());
    }
    delete options.view;
  }
  options.view = view;
  options.logo = false;
  options.interactions = goog.isDef(options.interactions) ? options.interactions : ol.interaction.defaults();
  options.controls = goog.isDef(options.controls) ? options.controls : ol.control.defaults({
    zoomOptions: /** @type {olx.control.ZoomOptions} */ ({
      zoomInTipLabel: ga.Lang.translate('Zoom in'),
      zoomOutTipLabel: ga.Lang.translate('Zoom out')
    }),
    rotateOptions: /** @type {olx.control.RotateOptions} */ ({
      tipLabel: ga.Lang.translate('Reset rotation')
    }),
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  });

  ol.Map.call(this, options);

  this.addControl(new ol.control.ScaleLine());


  this.serviceUrl = window['GeoAdmin']['serviceUrl'];

  // Geocoder
  this.geocoderDialog_ = null;
  this.geocoderList_ = null;
  this.geocoderCrossElement_ = null;
  this.geocoderOverlay_ = null;
  this.geocoderDialog_ = new goog.ui.Dialog('geocoder-dialog');
  this.geocoderDialog_.setTitle(ga.Lang.translate('Geocoding results'));
  this.geocoderDialog_.setModal(true);
  this.geocoderDialog_.setButtonSet(null);


  // gaTooltip
  this.gaTooltip_ = null;
  options.tooltip = goog.isDefAndNotNull(options.tooltip) ? options.tooltip : true;

  if (options.tooltip) {
    this.gaTooltip_ = new ga.Tooltip();
    this.gaTooltip_.setMap(this);
  }
};
goog.inherits(ga.Map, ol.Map);

/**
 * Geocode using api.geo.admin.ch
 * @param {String} text text to geocode.
 * @api stable
 */
ga.Map.prototype.geocode = function(text) {
  ol.net.jsonp(
    this.serviceUrl + '/rest/services/api/SearchServer' +
      '?searchText=' + text +
      '&type=locations' +
      '&lang='+ ga.Lang.getCode() +
      '&returnGeometry=true',
    this.handleGeocode_.bind(this),
    this.handleGeocodeError_.bind(this));
};

ga.Map.prototype.handleGeocode_ = function(response) {
  if (response['results'].length == 0) {
    alert("Geocoding failed. No result has been found.");
  }
  if (response['results'].length == 1) {
    this.recenterToResult_(response['results'][0]['attrs']);
  }
  if (response['results'].length > 1) {
    this.showGeocoderDialog_(response['results']);  
  }
};

ga.Map.prototype.handleGeocodeError_ = function() {
  alert("Geocoding failed. Sorry for inconvenience.");
};

/**
 * Recenter feature using api.geo.admin.ch
 * @param {String} layerId GeoAdmin id of the layer.
 * @param {String} featureId id of the feature.
 * @api stable
 */
ga.Map.prototype.recenterFeature = function(layerId, featureId) {
  ol.net.jsonp(
    this.serviceUrl + '/rest/services/api/MapServer/' +
      layerId + '/' + featureId +
      '?geometryFormat=geojson',
    this.handleRecenter_.bind(this), 
    this.handleRecenterError_.bind(this));
};

ga.Map.prototype.handleRecenter_ = function(response) {
  var feature = response['feature'];
  this.recenterToFeature_(feature);
};

ga.Map.prototype.handleRecenterError_ = function() {
  alert("Recentering failed. No feature found. Sorry for inconvenience.");
};

ga.Map.prototype.recenterToFeature_ = function(feature) {
  var extent = feature['bbox'];
  this.getView().fit(extent, /** @type {ol.Size} */ (this.getSize()));
  if (this.getView().getZoom() > 7) {
    this.getView().setZoom(7);
  }
};

/**
 * Highlight feature using api.geo.admin.ch
 * @param {String} layerId GeoAdmin id of the layer.
 * @param {String} featureId id of the feature.
 * @api stable
 */
ga.Map.prototype.highlightFeature = function(layerId, featureId) {
  ol.net.jsonp(
    this.serviceUrl + '/rest/services/api/MapServer/' +
      layerId + '/' + featureId + '&geometryFormat=geojson',
    this.handleHighlight_.bind(this), 
    this.handleHighlightError_.bind(this));
};

ga.Map.prototype.handleHighlight_ = function(response) {
  var features = [response['feature']];
  var parser = new ol.format.GeoJSON();
  var vectorSource = new ol.source.Vector({
    projection: 'EPSG:21781',
    features: parser.readFeatures({
      type: 'FeatureCollection',
      features: features
    })
  });
  var vector = new ol.layer.Vector({
    opacity: 0.75,
    source: vectorSource,
    style: function(feature, resolution) {
      return [new ol.style.Style({
        fill: new ol.style.Fill({color: '#ffff00'}),
        stroke: new ol.style.Stroke({color: '#ff8000', width: 3}),
        image: new ol.style.Circle({
          radius: 10,
          fill: new ol.style.Fill({color: '#ffff00'}),
          stroke: new ol.style.Stroke({color: '#ff8000', width: 3})
        })
      })];
    }
  });
  this.addLayer(vector);
};

ga.Map.prototype.handleHighlightError_ = function() {
  alert("Highlighting failed. No feature found. Sorry for inconvenience.");
};

ga.Map.prototype.showGeocoderDialog_ = function(results) {
  this.geocoderDialog_.setTextContent('<div id="geocoderList"></div>');
  this.geocoderDialog_.setVisible(true); 
  this.geocoderList_ = new goog.ui.Menu();
  var geocoderListContainer = goog.dom.getElement('geocoderList');
  for (var item in results) {
     this.geocoderList_.addChild(
       new goog.ui.MenuItem(results[item]['attrs']['label'].
        replace('<b>','').replace('</b>',''),
        results[item]['attrs']),true);  
  }
  this.geocoderList_.listen('action',
    this.handleResultSelection_,
    true,
    this);

  this.geocoderList_.render(geocoderListContainer); 
};

ga.Map.prototype.hideGeocoderDialog_ = function() {
  this.geocoderDialog_.setVisible(false);
};

ga.Map.prototype.handleResultSelection_ = function(e) {
  var resultItem = e.target.model_;
  this.recenterToResult_(resultItem);
  this.hideGeocoderDialog_();
};

ga.Map.prototype.recenterToResult_ = function(resultItem) {
  var extent = resultItem['geom_st_box2d'];
  extent = this.parseExtent_(extent);
  var origin = resultItem['origin'];
  var originZoom = {
    'address': '10',
    'parcel': '10',
    'gazetteer': '8'
  };
  if (originZoom.hasOwnProperty(origin)) {
    var zoom = parseInt(originZoom[origin],10);
    var center = [(extent[0] + extent[2]) / 2,
      (extent[1] + extent[3]) / 2];
    this.getView().setZoom(zoom);
    this.getView().setCenter(center);
    this.addCross_(center);
  } else {
    this.getView().fit(extent, /** @type {ol.Size} */ (this.getSize()));
  }
};

ga.Map.prototype.parseExtent_ = function(stringBox2D) {
  var extent = stringBox2D.replace('BOX(', '')
    .replace(')', '').replace(',', ' ')
    .split(' ');
  extent = [parseFloat(extent[0]),parseFloat(extent[1]),
    parseFloat(extent[2]),parseFloat(extent[3])];
  return(extent);
};

ga.Map.prototype.addCross_ = function(center) {
  this.geocoderCrossElement_ = goog.dom.createDom(goog.dom.TagName.DIV);
  goog.dom.classlist.addAll(this.geocoderCrossElement_, ['crosshair', 'cross']);
  this.removeCross_();
  this.geocoderOverlay_ = new ol.Overlay({
    element: this.geocoderCrossElement_,
    position: center
  });
  this.addOverlay(this.geocoderOverlay_);
};

ga.Map.prototype.removeCross_ = function() {
  if (this.geocoderOverlay_) {
    this.removeOverlay(this.geocoderOverlay_);
  }
};

/**
 * Disable the ga.Tooltip
 * @api stable
 */
ga.Map.prototype.enableTooltip = function() {
  if (!goog.isNull(this.gaTooltip_)) {
    this.gaTooltip_.enable();
  }
};

/**
 * Disable the ga.Tooltip
 * @api stable
 */
ga.Map.prototype.disableTooltip = function() {
  if (!goog.isNull(this.gaTooltip_)) {
    this.gaTooltip_.disable();
  }
};

/**
 * @classdesc
 * An `ol.View2D` which acts as an `ol.View` alias for backward
 *  compatibility reasons. Old API users might still use View2D
 *  and with this definition, those applications are not brokwn.
 *
 * @constructor
 * @extends {ol.View}
 * @param {olx.ViewOptions=} opt_options View options.
 * @api stable
 */
ol.View2D = function(opt_options) {
  ol.View.call(this, opt_options);
};
goog.inherits(ol.View2D, ol.View);
