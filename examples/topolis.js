// NOCOMPILE
// this example uses topolis and toastr for which we don't have an externs file.

goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Snap');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');
goog.require('ol.style.Fill');
goog.require('ol.style.Circle');
goog.require('ol.style.Text');
goog.require('ol.control.MousePosition');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var nodes = new ol.source.Vector({wrapX: false});
var nodesLayer = new ol.layer.Vector({
  source: nodes,
  style: function(f) {
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.2)'}),
        stroke: new ol.style.Stroke({color: 'red', width: 1})
      }),
      text: new ol.style.Text({
        text: f.get('node').id.toString(),
        fill: new ol.style.Fill({color: 'red'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 3
        })
      })
    });
    return [style];
  }
});

var edges = new ol.source.Vector({wrapX: false});
var edgesLayer = new ol.layer.Vector({
  source: edges,
  style: function(f) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        width: 1
      }),
      text: new ol.style.Text({
        text: f.get('edge').id.toString(),
        fill: new ol.style.Fill({color: 'blue'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var faces = new ol.source.Vector({wrapX: false});
var facesLayer = new ol.layer.Vector({
  source: faces,
  style: function(f) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'black',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 255, 0, 0.2)'
      }),
      text: new ol.style.Text({
        font: 'bold 12px sans-serif',
        text: f.get('face').id.toString(),
        fill: new ol.style.Fill({color: 'green'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var map = new ol.Map({
  layers: [raster, facesLayer, edgesLayer, nodesLayer],
  target: 'map',
  view: new ol.View({
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
  feature.setGeometry(new ol.geom.LineString(e.coordinates));
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
  var feature = new ol.Feature({
    geometry: new ol.geom.Point(node.coordinate),
    node: node
  });
  feature.setId(node.id);
  nodes.addFeature(feature);
}

function edgeToFeature(edge) {
  var feature = new ol.Feature({
    geometry: new ol.geom.LineString(edge.coordinates),
    edge: edge
  });
  feature.setId(edge.id);
  edges.addFeature(feature);
}

function faceToFeature(face) {
  var coordinates = topo.getFaceGeometry(face);
  var feature = new ol.Feature({
    geometry: new ol.geom.Polygon(coordinates),
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

var draw = new ol.interaction.Draw({
  type: 'LineString'
});
draw.on('drawend', onDrawend);
map.addInteraction(draw);
var snap = new ol.interaction.Snap({
  source: edges
});
map.addInteraction(snap);
map.addControl(new ol.control.MousePosition());
