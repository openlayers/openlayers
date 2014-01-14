goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.parser.ogc.SLD');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');


var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/countries.sld', true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    var map = new ol.Map({
      controls: ol.control.defaults().extend([
        new ol.control.ScaleLine()
      ]),
      layers: [raster],
      renderer: ol.RendererHint.CANVAS,
      target: 'map',
      view: new ol.View2D({
        center: [0, 0],
        zoom: 1
      })
    });
    var units = map.getView().getView2D().getProjection().getUnits();
    var sld = new ol.parser.ogc.SLD().read(xhr.responseText, {
      units: units
    });
    var style = sld.namedLayers['countries'].userStyles[0];
    var vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        parser: new ol.parser.GeoJSON(),
        url: 'data/countries.geojson'
      }),
      style: style
    });
    map.getLayers().push(vector);
  }
};
xhr.send();
