import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Icon_ from '../src/ol/style/icon';
import _ol_style_Style_ from '../src/ol/style/style';


var rome = new _ol_Feature_({
  geometry: new _ol_geom_Point_(_ol_proj_.fromLonLat([12.5, 41.9]))
});

var london = new _ol_Feature_({
  geometry: new _ol_geom_Point_(_ol_proj_.fromLonLat([-0.12755, 51.507222]))
});

var madrid = new _ol_Feature_({
  geometry: new _ol_geom_Point_(_ol_proj_.fromLonLat([-3.683333, 40.4]))
});

rome.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: '#8959A8',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

london.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: '#4271AE',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

madrid.setStyle(new _ol_style_Style_({
  image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
    color: [113, 140, 0],
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));


var vectorSource = new _ol_source_Vector_({
  features: [rome, london, madrid]
});

var vectorLayer = new _ol_layer_Vector_({
  source: vectorSource
});

var rasterLayer = new _ol_layer_Tile_({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
    crossOrigin: ''
  })
});

var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([2.896372, 44.60240]),
    zoom: 3
  })
});
