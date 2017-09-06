import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_format_IGC_ from '../src/ol/format/igc';
import _ol_geom_LineString_ from '../src/ol/geom/linestring';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var colors = {
  'Clement Latour': 'rgba(0, 0, 255, 0.7)',
  'Damien de Baesnt': 'rgba(0, 215, 255, 0.7)',
  'Sylvain Dhonneur': 'rgba(0, 165, 255, 0.7)',
  'Tom Payne': 'rgba(0, 255, 255, 0.7)',
  'Ulrich Prinz': 'rgba(0, 215, 255, 0.7)'
};

var styleCache = {};
var styleFunction = function(feature) {
  var color = colors[feature.get('PLT')];
  var style = styleCache[color];
  if (!style) {
    style = new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: color,
        width: 3
      })
    });
    styleCache[color] = style;
  }
  return style;
};

var vectorSource = new _ol_source_Vector_();

var igcUrls = [
  'data/igc/Clement-Latour.igc',
  'data/igc/Damien-de-Baenst.igc',
  'data/igc/Sylvain-Dhonneur.igc',
  'data/igc/Tom-Payne.igc',
  'data/igc/Ulrich-Prinz.igc'
];

function get(url, callback) {
  var client = new XMLHttpRequest();
  client.open('GET', url);
  client.onload = function() {
    callback(client.responseText);
  };
  client.send();
}

var igcFormat = new _ol_format_IGC_();
for (var i = 0; i < igcUrls.length; ++i) {
  get(igcUrls[i], function(data) {
    var features = igcFormat.readFeatures(data,
        {featureProjection: 'EPSG:3857'});
    vectorSource.addFeatures(features);
  });
}

var time = {
  start: Infinity,
  stop: -Infinity,
  duration: 0
};
vectorSource.on('addfeature', function(event) {
  var geometry = event.feature.getGeometry();
  time.start = Math.min(time.start, geometry.getFirstCoordinate()[2]);
  time.stop = Math.max(time.stop, geometry.getLastCoordinate()[2]);
  time.duration = time.stop - time.start;
});


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_({
        attributions: [
          'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
          _ol_source_OSM_.ATTRIBUTION
        ],
        url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
            '?apikey=0e6fc415256d4fbb9b5166a718591d71'
      })
    }),
    new _ol_layer_Vector_({
      source: vectorSource,
      style: styleFunction
    })
  ],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
    center: [703365.7089403362, 5714629.865071137],
    zoom: 9
  })
});


var point = null;
var line = null;
var displaySnap = function(coordinate) {
  var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  var info = document.getElementById('info');
  if (closestFeature === null) {
    point = null;
    line = null;
    info.innerHTML = '&nbsp;';
  } else {
    var geometry = closestFeature.getGeometry();
    var closestPoint = geometry.getClosestPoint(coordinate);
    if (point === null) {
      point = new _ol_geom_Point_(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    var date = new Date(closestPoint[2] * 1000);
    info.innerHTML =
        closestFeature.get('PLT') + ' (' + date.toUTCString() + ')';
    var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];
    if (line === null) {
      line = new _ol_geom_LineString_(coordinates);
    } else {
      line.setCoordinates(coordinates);
    }
  }
  map.render();
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displaySnap(coordinate);
});

map.on('click', function(evt) {
  displaySnap(evt.coordinate);
});

var stroke = new _ol_style_Stroke_({
  color: 'rgba(255,0,0,0.9)',
  width: 1
});
var style = new _ol_style_Style_({
  stroke: stroke,
  image: new _ol_style_Circle_({
    radius: 5,
    fill: null,
    stroke: stroke
  })
});
map.on('postcompose', function(evt) {
  var vectorContext = evt.vectorContext;
  vectorContext.setStyle(style);
  if (point !== null) {
    vectorContext.drawGeometry(point);
  }
  if (line !== null) {
    vectorContext.drawGeometry(line);
  }
});

var featureOverlay = new _ol_layer_Vector_({
  source: new _ol_source_Vector_(),
  map: map,
  style: new _ol_style_Style_({
    image: new _ol_style_Circle_({
      radius: 5,
      fill: new _ol_style_Fill_({
        color: 'rgba(255,0,0,0.9)'
      })
    })
  })
});

document.getElementById('time').addEventListener('input', function() {
  var value = parseInt(this.value, 10) / 100;
  var m = time.start + (time.duration * value);
  vectorSource.forEachFeature(function(feature) {
    var geometry = /** @type {ol.geom.LineString} */ (feature.getGeometry());
    var coordinate = geometry.getCoordinateAtM(m, true);
    var highlight = feature.get('highlight');
    if (highlight === undefined) {
      highlight = new _ol_Feature_(new _ol_geom_Point_(coordinate));
      feature.set('highlight', highlight);
      featureOverlay.getSource().addFeature(highlight);
    } else {
      highlight.getGeometry().setCoordinates(coordinate);
    }
  });
  map.render();
});
