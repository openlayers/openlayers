goog.provide('ga.Map');

goog.require('goog.asserts');
goog.require('goog.net.Jsonp');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');

goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLine');
goog.require('ol.proj.EPSG21781');
goog.require('ol.source.State');
goog.require('ol.extent');
goog.require('ol.coordinate');

goog.require('ga.Tooltip');


/**
 * @class
 * The map is the core component of the GeoAdmin API. In its minimal configuration it
 * needs a view, one or more geoadmin layers, and a target container:
 *
 *     var map = new ga.Map({
 *       view: new ol.View2D({
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
 * @param {olx.MapOptions} options Map options.
 */
ga.Map = function(options) {

  var renderer = ol.RendererHint.CANVAS;

  if (goog.isDefAndNotNull(options.renderer)) {
    renderer = options.renderer;
  }
  options.renderer = renderer;

  var view = new ol.View2D({
    resolutions: [
      650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    ],
    projection: new ol.proj.EPSG21781(),
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

  goog.base(this, options);

  this.addControl(new ol.control.ScaleLine());

  // Create the geocoderDialog
  this.geocoderDialog_ = null;
  this.geocoderList_ = null;
  this.createGeocoderDialog_();

  var tooltip = new ga.Tooltip();
  tooltip.setMap(this);
  this.registerDisposable(tooltip);
};
goog.inherits(ga.Map, ol.Map);

/**
 * Geocode using api.geo.admin.ch
 * @param {String} text text to geocode.
 * @todo stability experimental
 */
ga.Map.prototype.geocode = function(text) {
  var jsonp = new goog.net.Jsonp(
    '//api3.geo.admin.ch/rest/services/api/SearchServer');
  var payload = { 'searchText': text,
                  'type': 'locations' };
  jsonp.send(payload, 
             goog.bind(this.handleGeocode_, this), 
             goog.bind(this.handleGeocodeError_, this));
};

ga.Map.prototype.handleGeocode_ = function(response) {
  if (response['results'].length == 0) {
    alert("Geocoding failed. No result has been found.");
  }
  if (response['results'].length == 1) {
    this.recenterToResult(response['results'][0]['attrs']);
  }
  if (response['results'].length > 1) {
    this.showGeocoderDialog_(response['results']);  
  }
};

ga.Map.prototype.handleGeocodeError_ = function(response) {
  alert("Geocoding failed. Sorry for inconvenience.");
};

ga.Map.prototype.recenter_ = function() {
};

ga.Map.prototype.createGeocoderDialog_ = function() {
  this.geocoderDialog_ = new goog.ui.Dialog();
  this.geocoderDialog_.setTitle('Geocoding result');
  this.geocoderList_ = new goog.ui.Menu();
  this.geocoderDialog_.setModal(true);
  this.geocoderDialog_.setButtonSet(null);
};

ga.Map.prototype.showGeocoderDialog_ = function(results) {
  this.geocoderDialog_.setContent('<div id="geocoderList"></div>');
  this.geocoderDialog_.setVisible(true); 
  var geocoderListContainer = goog.dom.getElement('geocoderList');
  this.geocoderList_.removeChildren();
  for (var item in results) {
     this.geocoderList_.addChild(
       new goog.ui.MenuItem(results[item]['attrs']['label'].
        replace('<b>','').replace('</b>',''),
        results[item]['attrs']),true);  
  }
  goog.events.listen(this.geocoderList_,
    'action',
    goog.bind(this.handleResultSelection_,this));
  this.geocoderList_.render(geocoderListContainer);
};

ga.Map.prototype.handleResultSelection_ = function(e) {
  var resultItem = e.target.model_;
  this.recenterToResult(resultItem);
  this.hideGeocoderDialog_();
};

ga.Map.prototype.recenterToResult = function(resultItem) {
  var extent = resultItem['geom_st_box2d'];
  extent = this.parseExtent(extent);
  var origin = resultItem['origin'];
  var originZoom = {
    address: 10,
    parcel: 10,
    sn25: 8
  };
  if (originZoom.hasOwnProperty(origin)) {
    var zoom = originZoom[origin];
    var center = [(extent[0] + extent[2]) / 2,
      (extent[1] + extent[3]) / 2];
    this.getView().getView2D().setZoom(zoom);
    this.getView().getView2D().setCenter(center);
  } else {
    this.getView().getView2D().fitExtent(extent,this.getSize());
  }
};

ga.Map.prototype.hideGeocoderDialog_ = function() {
  this.geocoderDialog_.setVisible(false);
};

ga.Map.prototype.parseExtent = function(stringBox2D) {
  var extent = stringBox2D.replace('BOX(', '')
    .replace(')', '').replace(',', ' ')
    .split(' ');
  extent = [parseFloat(extent[0]),parseFloat(extent[1]),
    parseFloat(extent[2]),parseFloat(extent[3])];
  return(extent);
};

