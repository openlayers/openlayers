var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/countries.geojson'
  }),
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.25)'
    }),
    stroke: new ol.style.Stroke({
      color: '#6666ff'
    })
  })
});

var select = new ol.interaction.Select({
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.5)'
    })
  })
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select]),
  layers: [raster, vector],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
