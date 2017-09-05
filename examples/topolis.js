// NOCOMPILE
// this example uses topolis and toastr for which we don't have an externs file.

import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_geom_LineString_ from '../src/ol/geom/linestring';
import _ol_geom_Polygon_ from '../src/ol/geom/polygon';
import _ol_interaction_Draw_ from '../src/ol/interaction/draw';
import _ol_interaction_Snap_ from '../src/ol/interaction/snap';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Text_ from '../src/ol/style/text';
import _ol_control_MousePosition_ from '../src/ol/control/mouseposition';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var nodes = new _ol_source_Vector_({wrapX: false});
var nodesLayer = new _ol_layer_Vector_({
  source: nodes,
  style: function(f) {
    var style = new _ol_style_Style_({
      image: new _ol_style_Circle_({
        radius: 8,
        fill: new _ol_style_Fill_({color: 'rgba(255, 0, 0, 0.2)'}),
        stroke: new _ol_style_Stroke_({color: 'red', width: 1})
      }),
      text: new _ol_style_Text_({
        text: f.get('node').id.toString(),
        fill: new _ol_style_Fill_({color: 'red'}),
        stroke: new _ol_style_Stroke_({
          color: 'white',
          width: 3
        })
      })
    });
    return [style];
  }
});

var edges = new _ol_source_Vector_({wrapX: false});
var edgesLayer = new _ol_layer_Vector_({
  source: edges,
  style: function(f) {
    var style = new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'blue',
        width: 1
      }),
      text: new _ol_style_Text_({
        text: f.get('edge').id.toString(),
        fill: new _ol_style_Fill_({color: 'blue'}),
        stroke: new _ol_style_Stroke_({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var faces = new _ol_source_Vector_({wrapX: false});
var facesLayer = new _ol_layer_Vector_({
  source: faces,
  style: function(f) {
    var style = new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'black',
        width: 1
      }),
      fill: new _ol_style_Fill_({
        color: 'rgba(0, 255, 0, 0.2)'
      }),
      text: new _ol_style_Text_({
        font: 'bold 12px sans-serif',
        text: f.get('face').id.toString(),
        fill: new _ol_style_Fill_({color: 'green'}),
        stroke: new _ol_style_Stroke_({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var map = new _ol_Map_({
  layers: [raster, facesLayer, edgesLayer, nodesLayer],
  target: 'map',
  view: new _ol_View_({
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
  feature.setGeometry(new _ol_geom_LineString_(e.coordinates));
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
  var feature = new _ol_Feature_({
    geometry: new _ol_geom_Point_(node.coordinate),
    node: node
  });
  feature.setId(node.id);
  nodes.addFeature(feature);
}

function edgeToFeature(edge) {
  var feature = new _ol_Feature_({
    geometry: new _ol_geom_LineString_(edge.coordinates),
    edge: edge
  });
  feature.setId(edge.id);
  edges.addFeature(feature);
}

function faceToFeature(face) {
  var coordinates = topo.getFaceGeometry(face);
  var feature = new _ol_Feature_({
    geometry: new _ol_geom_Polygon_(coordinates),
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

var draw = new _ol_interaction_Draw_({
  type: 'LineString'
});
draw.on('drawend', onDrawend);
map.addInteraction(draw);
var snap = new _ol_interaction_Snap_({
  source: edges
});
map.addInteraction(snap);
map.addControl(new _ol_control_MousePosition_());
