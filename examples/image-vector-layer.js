import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_ImageVector_ from '../src/ol/source/imagevector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Image_({
      source: new _ol_source_ImageVector_({
        source: new _ol_source_Vector_({
          url: 'data/geojson/countries.geojson',
          format: new _ol_format_GeoJSON_()
        }),
        style: new _ol_style_Style_({
          fill: new _ol_style_Fill_({
            color: 'rgba(255, 255, 255, 0.6)'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#319FD3',
            width: 1
          })
        })
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

var featureOverlay = new _ol_layer_Vector_({
  source: new _ol_source_Vector_(),
  map: map,
  style: new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: '#f00',
      width: 1
    }),
    fill: new _ol_style_Fill_({
      color: 'rgba(255,0,0,0.1)'
    })
  })
});

var highlight;
var displayFeatureInfo = function(pixel) {

  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  var info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
  } else {
    info.innerHTML = '&nbsp;';
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }

};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
