// NOCOMPILE
// this example uses topolis and toastr for which we don't have an externs file.

import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import LineString from '../src/ol/geom/LineString.js';
import Polygon from '../src/ol/geom/Polygon.js';
import Draw from '../src/ol/interaction/Draw.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Style from '../src/ol/style/Style.js';
import Stroke from '../src/ol/style/Stroke.js';
import Fill from '../src/ol/style/Fill.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';
import MousePosition from '../src/ol/control/MousePosition.js';

var raster = new TileLayer({
  source: new OSM()
});

var nodes = new VectorSource({wrapX: false});
var nodesLayer = new VectorLayer({
  source: nodes,
  style: function(f) {
    var style = new Style({
      image: new _ol_style_Circle_({
        radius: 8,
        fill: new Fill({color: 'rgba(255, 0, 0, 0.2)'}),
        stroke: new Stroke({color: 'red', width: 1})
      }),
      text: new _ol_style_Text_({
        text: f.get('node').id.toString(),
        fill: new Fill({color: 'red'}),
        stroke: new Stroke({
          color: 'white',
          width: 3
        })
      })
    });
    return [style];
  }
});

var edges = new VectorSource({wrapX: false});
var edgesLayer = new VectorLayer({
  source: edges,
  style: function(f) {
    var style = new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 1
      }),
      text: new _ol_style_Text_({
        text: f.get('edge').id.toString(),
        fill: new Fill({color: 'blue'}),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var faces = new VectorSource({wrapX: false});
var facesLayer = new VectorLayer({
  source: faces,
  style: function(f) {
    var style = new Style({
      stroke: new Stroke({
        color: 'black',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(0, 255, 0, 0.2)'
      }),
      text: new _ol_style_Text_({
        font: 'bold 12px sans-serif',
        text: f.get('face').id.toString(),
        fill: new Fill({color: 'green'}),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var map = new Map({
  layers: [raster, facesLayer, edgesLayer, nodesLayer],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 16
  })
});

var topo = topolis.createTopology();

topo.on('addnode', nodeToFeature);
topo.on('removenode', function(e) {
  removeElementFeature(nodes, e);
});
topo.on('addedge', edgeToFeature);
topo.on('modedge', function(e) {
  var feature = edges.getFeatureById(e.id);
  feature.setGeometry(new LineString(e.coordinates));
});
topo.on('removeedge', function(e) {
  removeElementFeature(edges, e);
});
topo.on('addface', faceToFeature);
topo.on('removeface', function(e) {
  removeElementFeature(faces, e);
});

function removeElementFeature(source, element) {
  var feature = source.getFeatureById(element.id);
  source.removeFeature(feature);
}

function nodeToFeature(node) {
  var feature = new Feature({
    geometry: new Point(node.coordinate),
    node: node
  });
  feature.setId(node.id);
  nodes.addFeature(feature);
}

function edgeToFeature(edge) {
  var feature = new Feature({
    geometry: new LineString(edge.coordinates),
    edge: edge
  });
  feature.setId(edge.id);
  edges.addFeature(feature);
}

function faceToFeature(face) {
  var coordinates = topo.getFaceGeometry(face);
  var feature = new Feature({
    geometry: new Polygon(coordinates),
    face: face
  });
  feature.setId(face.id);
  faces.addFeature(feature);
}

function createNode(topo, coord) {
  var node;
  var existingEdge = topo.getEdgeByPoint(coord, 5)[0];
  if (existingEdge) {
    node = topo.modEdgeSplit(existingEdge, coord);
  } else {
    node = topo.addIsoNode(coord);
  }
  return node;
}

function onDrawend(e) {
  var edgeGeom = e.feature.getGeometry().getCoordinates();
  var startCoord = edgeGeom[0];
  var endCoord = edgeGeom[edgeGeom.length - 1];
  var start, end;
  try {
    start = topo.getNodeByPoint(startCoord);
    end = topo.getNodeByPoint(endCoord);
    var edgesAtStart = topo.getEdgeByPoint(startCoord, 5);
    var edgesAtEnd = topo.getEdgeByPoint(endCoord, 5);
    var crossing = topo.getEdgesByLine(edgeGeom);
    if (crossing.length === 1 && !start && !end && edgesAtStart.length === 0 && edgesAtEnd.length === 0) {
      topo.remEdgeNewFace(crossing[0]);
      start = crossing[0].start;
      if (start.face) {
        topo.removeIsoNode(start);
      }
      end = crossing[0].end;
      if (end.face) {
        topo.removeIsoNode(end);
      }
      return;
    }
    if (!start) {
      start = createNode(topo, startCoord);
      edgeGeom[0] = start.coordinate;
    }
    if (!end) {
      end = createNode(topo, endCoord);
      edgeGeom[edgeGeom.length - 1] = end.coordinate;
    }
    topo.addEdgeNewFaces(start, end, edgeGeom);
  } catch (e) {
    toastr.warning(e.toString());
  }
}

var draw = new Draw({
  type: 'LineString'
});
draw.on('drawend', onDrawend);
map.addInteraction(draw);
var snap = new Snap({
  source: edges
});
map.addInteraction(snap);
map.addControl(new MousePosition());
