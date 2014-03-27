var raster = new ol.layer.Tile({
  style: 'Aerial',
  source: new ol.source.MapQuest({
    layer: 'sat'
  })
});

var source = new ol.source.GeoJSON({
  projection: 'EPSG:3857',
  url: 'data/geojson/countries.geojson'
});

var vector = new ol.layer.Vector({
  source: source
});

var select = new ol.interaction.Select({});

var modify = new ol.interaction.Modify({
  features: select.getFeatures()
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, modify]),
  layers: [raster, vector],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
