var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/geojson/countries.geojson',
    format: new ol.format.GeoJSON()
  })
});

var pointFeature = new ol.Feature(new ol.geom.Point([0, 0]));

var lineFeature = new ol.Feature(
    new ol.geom.LineString([[-1e7, 1e6], [-1e6, 3e6]]));

var vector2 = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [pointFeature, lineFeature]
  })
});

var select = new ol.interaction.Select();

var translate = new ol.interaction.Translate({
  features: select.getFeatures()
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, translate]),
  layers: [raster, vector, vector2],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
