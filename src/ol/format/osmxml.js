// FIXME add typedef for stack state objects
goog.provide('ol.format.OSMXML');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.xml');


/**
 * @classdesc
 * Feature format for reading data in the
 * [OSMXML format](http://wiki.openstreetmap.org/wiki/OSM_XML).
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @api
 */
ol.format.OSMXML = function() {
  ol.format.XMLFeature.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get('EPSG:4326');
};
ol.inherits(ol.format.OSMXML, ol.format.XMLFeature);


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.OSMXML.readNode_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var id = node.getAttribute('id');
  /** @type {ol.Coordinate} */
  var coordinates = [
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat'))
  ];
  state.nodes[id] = coordinates;

  var values = ol.xml.pushParseAndPop({
    tags: {}
  }, ol.format.OSMXML.NODE_PARSERS_, node, objectStack);
  if (!ol.obj.isEmpty(values.tags)) {
    var geometry = new ol.geom.Point(coordinates);
    ol.format.Feature.transformWithOptions(geometry, false, options);
    var feature = new ol.Feature(geometry);
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
ol.format.OSMXML.readWay_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  var values = ol.xml.pushParseAndPop({
    id: id,
    ndrefs: [],
    tags: {}
  }, ol.format.OSMXML.WAY_PARSERS_, node, objectStack);
  var state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  state.ways.push(values);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.OSMXML.readNd_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.ndrefs.push(node.getAttribute('ref'));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.OSMXML.readTag_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.tags[node.getAttribute('k')] = node.getAttribute('v');
};


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.OSMXML.NAMESPACE_URIS_ = [
  null
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OSMXML.WAY_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OSMXML.NAMESPACE_URIS_, {
      'nd': ol.format.OSMXML.readNd_,
      'tag': ol.format.OSMXML.readTag_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OSMXML.PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OSMXML.NAMESPACE_URIS_, {
      'node': ol.format.OSMXML.readNode_,
      'way': ol.format.OSMXML.readWay_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.OSMXML.NODE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.OSMXML.NAMESPACE_URIS_, {
      'tag': ol.format.OSMXML.readTag_
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
ol.format.OSMXML.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.OSMXML.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = this.getReadOptions(node, opt_options);
  if (node.localName == 'osm') {
    var state = ol.xml.pushParseAndPop({
      nodes: {},
      ways: [],
      features: []
    }, ol.format.OSMXML.PARSERS_, node, [options]);
    // parse nodes in ways
    for (var j = 0; j < state.ways.length; j++) {
      var values = /** @type {Object} */ (state.ways[j]);
      /** @type {Array.<number>} */
      var flatCoordinates = [];
      for (var i = 0, ii = values.ndrefs.length; i < ii; i++) {
        var point = state.nodes[values.ndrefs[i]];
        ol.array.extend(flatCoordinates, point);
      }
      var geometry;
      if (values.ndrefs[0] == values.ndrefs[values.ndrefs.length - 1]) {
        // closed way
        geometry = new ol.geom.Polygon(null);
        geometry.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates,
            [flatCoordinates.length]);
      } else {
        geometry = new ol.geom.LineString(null);
        geometry.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
      }
      ol.format.Feature.transformWithOptions(geometry, false, options);
      var feature = new ol.Feature(geometry);
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
ol.format.OSMXML.prototype.readProjection;


/**
 * Not implemented.
 * @inheritDoc
 */
ol.format.OSMXML.prototype.writeFeatureNode = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
ol.format.OSMXML.prototype.writeFeaturesNode = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
ol.format.OSMXML.prototype.writeGeometryNode = function(geometry, opt_options) {};
