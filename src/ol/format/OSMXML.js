/**
 * @module ol/format/OSMXML
 */
// FIXME add typedef for stack state objects
import {inherits} from '../index.js';
import _ol_array_ from '../array.js';
import _ol_Feature_ from '../Feature.js';
import FeatureFormat from '../format/Feature.js';
import _ol_format_XMLFeature_ from '../format/XMLFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import _ol_obj_ from '../obj.js';
import {get as getProjection} from '../proj.js';
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Feature format for reading data in the
 * [OSMXML format](http://wiki.openstreetmap.org/wiki/OSM_XML).
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @api
 */
var OSMXML = function() {
  _ol_format_XMLFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection('EPSG:4326');
};

inherits(OSMXML, _ol_format_XMLFeature_);


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
OSMXML.readNode_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var id = node.getAttribute('id');
  /** @type {ol.Coordinate} */
  var coordinates = [
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat'))
  ];
  state.nodes[id] = coordinates;

  var values = _ol_xml_.pushParseAndPop({
    tags: {}
  }, OSMXML.NODE_PARSERS_, node, objectStack);
  if (!_ol_obj_.isEmpty(values.tags)) {
    var geometry = new Point(coordinates);
    FeatureFormat.transformWithOptions(geometry, false, options);
    var feature = new _ol_Feature_(geometry);
    feature.setId(id);
    feature.setProperties(values.tags);
    state.features.push(feature);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
OSMXML.readWay_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  var values = _ol_xml_.pushParseAndPop({
    id: id,
    ndrefs: [],
    tags: {}
  }, OSMXML.WAY_PARSERS_, node, objectStack);
  var state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  state.ways.push(values);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
OSMXML.readNd_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.ndrefs.push(node.getAttribute('ref'));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
OSMXML.readTag_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.tags[node.getAttribute('k')] = node.getAttribute('v');
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
OSMXML.NAMESPACE_URIS_ = [
  null
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OSMXML.WAY_PARSERS_ = _ol_xml_.makeStructureNS(
    OSMXML.NAMESPACE_URIS_, {
      'nd': OSMXML.readNd_,
      'tag': OSMXML.readTag_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OSMXML.PARSERS_ = _ol_xml_.makeStructureNS(
    OSMXML.NAMESPACE_URIS_, {
      'node': OSMXML.readNode_,
      'way': OSMXML.readWay_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
OSMXML.NODE_PARSERS_ = _ol_xml_.makeStructureNS(
    OSMXML.NAMESPACE_URIS_, {
      'tag': OSMXML.readTag_
    });


/**
 * Read all features from an OSM source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
OSMXML.prototype.readFeatures;


/**
 * @inheritDoc
 */
OSMXML.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = this.getReadOptions(node, opt_options);
  if (node.localName == 'osm') {
    var state = _ol_xml_.pushParseAndPop({
      nodes: {},
      ways: [],
      features: []
    }, OSMXML.PARSERS_, node, [options]);
    // parse nodes in ways
    for (var j = 0; j < state.ways.length; j++) {
      var values = /** @type {Object} */ (state.ways[j]);
      /** @type {Array.<number>} */
      var flatCoordinates = [];
      for (var i = 0, ii = values.ndrefs.length; i < ii; i++) {
        var point = state.nodes[values.ndrefs[i]];
        _ol_array_.extend(flatCoordinates, point);
      }
      var geometry;
      if (values.ndrefs[0] == values.ndrefs[values.ndrefs.length - 1]) {
        // closed way
        geometry = new Polygon(null);
        geometry.setFlatCoordinates(GeometryLayout.XY, flatCoordinates,
            [flatCoordinates.length]);
      } else {
        geometry = new LineString(null);
        geometry.setFlatCoordinates(GeometryLayout.XY, flatCoordinates);
      }
      FeatureFormat.transformWithOptions(geometry, false, options);
      var feature = new _ol_Feature_(geometry);
      feature.setId(values.id);
      feature.setProperties(values.tags);
      state.features.push(feature);
    }
    if (state.features) {
      return state.features;
    }
  }
  return [];
};


/**
 * Read the projection from an OSM source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
OSMXML.prototype.readProjection;


/**
 * Not implemented.
 * @inheritDoc
 */
OSMXML.prototype.writeFeatureNode = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
OSMXML.prototype.writeFeaturesNode = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
OSMXML.prototype.writeGeometryNode = function(geometry, opt_options) {};
export default OSMXML;
