// FIXME add typedef for stack state objects
import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_XMLFeature_ from '../format/xmlfeature';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_obj_ from '../obj';
import _ol_proj_ from '../proj';
import _ol_xml_ from '../xml';

/**
 * @classdesc
 * Feature format for reading data in the
 * [OSMXML format](http://wiki.openstreetmap.org/wiki/OSM_XML).
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @api
 */
var _ol_format_OSMXML_ = function() {
  _ol_format_XMLFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get('EPSG:4326');
};

_ol_.inherits(_ol_format_OSMXML_, _ol_format_XMLFeature_);


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_OSMXML_.readNode_ = function(node, objectStack) {
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
  }, _ol_format_OSMXML_.NODE_PARSERS_, node, objectStack);
  if (!_ol_obj_.isEmpty(values.tags)) {
    var geometry = new _ol_geom_Point_(coordinates);
    _ol_format_Feature_.transformWithOptions(geometry, false, options);
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
_ol_format_OSMXML_.readWay_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var id = node.getAttribute('id');
  var values = _ol_xml_.pushParseAndPop({
    ndrefs: [],
    tags: {}
  }, _ol_format_OSMXML_.WAY_PARSERS_, node, objectStack);
  var state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  /** @type {Array.<number>} */
  var flatCoordinates = [];
  for (var i = 0, ii = values.ndrefs.length; i < ii; i++) {
    var point = state.nodes[values.ndrefs[i]];
    _ol_array_.extend(flatCoordinates, point);
  }
  var geometry;
  if (values.ndrefs[0] == values.ndrefs[values.ndrefs.length - 1]) {
    // closed way
    geometry = new _ol_geom_Polygon_(null);
    geometry.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, flatCoordinates,
        [flatCoordinates.length]);
  } else {
    geometry = new _ol_geom_LineString_(null);
    geometry.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, flatCoordinates);
  }
  _ol_format_Feature_.transformWithOptions(geometry, false, options);
  var feature = new _ol_Feature_(geometry);
  feature.setId(id);
  feature.setProperties(values.tags);
  state.features.push(feature);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_OSMXML_.readNd_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.ndrefs.push(node.getAttribute('ref'));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_OSMXML_.readTag_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.tags[node.getAttribute('k')] = node.getAttribute('v');
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_format_OSMXML_.NAMESPACE_URIS_ = [
  null
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OSMXML_.WAY_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OSMXML_.NAMESPACE_URIS_, {
      'nd': _ol_format_OSMXML_.readNd_,
      'tag': _ol_format_OSMXML_.readTag_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OSMXML_.PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OSMXML_.NAMESPACE_URIS_, {
      'node': _ol_format_OSMXML_.readNode_,
      'way': _ol_format_OSMXML_.readWay_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_OSMXML_.NODE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_OSMXML_.NAMESPACE_URIS_, {
      'tag': _ol_format_OSMXML_.readTag_
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
_ol_format_OSMXML_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_OSMXML_.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = this.getReadOptions(node, opt_options);
  if (node.localName == 'osm') {
    var state = _ol_xml_.pushParseAndPop({
      nodes: {},
      features: []
    }, _ol_format_OSMXML_.PARSERS_, node, [options]);
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
_ol_format_OSMXML_.prototype.readProjection;


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_OSMXML_.prototype.writeFeatureNode = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_OSMXML_.prototype.writeFeaturesNode = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_OSMXML_.prototype.writeGeometryNode = function(geometry, opt_options) {};
export default _ol_format_OSMXML_;
