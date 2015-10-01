goog.provide('ol.format.GML2');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol.extent');
goog.require('ol.format.GMLBase');
goog.require('ol.format.XSD');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @classdesc
 * Feature format for reading and writing data in the GML format,
 * version 2.1.2.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options Optional configuration object.
 * @extends {ol.format.GMLBase}
 * @api
 */
ol.format.GML2 = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (opt_options ? opt_options : {});

  goog.base(this, options);

  this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS][
      'featureMember'] =
      ol.xml.makeArrayPusher(ol.format.GMLBase.prototype.readFeaturesInternal);

  /**
   * @inheritDoc
   */
  this.schemaLocation = options.schemaLocation ?
      options.schemaLocation : ol.format.GML2.schemaLocation_;

};
goog.inherits(ol.format.GML2, ol.format.GMLBase);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.GML2.schemaLocation_ = ol.format.GMLBase.GMLNS +
    ' http://schemas.opengis.net/gml/2.1.2/feature.xsd';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
ol.format.GML2.prototype.readFlatCoordinates_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var context = objectStack[0];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var containerSrs = context['srsName'];
  var containerDimension = node.parentNode.getAttribute('srsDimension');
  var axisOrientation = 'enu';
  if (containerSrs) {
    var proj = ol.proj.get(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  var coords = s.split(/[\s,]+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = 2;
  if (node.getAttribute('srsDimension')) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('srsDimension'));
  } else if (node.getAttribute('dimension')) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('dimension'));
  } else if (containerDimension) {
    dim = ol.format.XSD.readNonNegativeIntegerString(containerDimension);
  }
  var x, y, z;
  var flatCoordinates = [];
  for (var i = 0, ii = coords.length; i < ii; i += dim) {
    x = parseFloat(coords[i]);
    y = parseFloat(coords[i + 1]);
    z = (dim === 3) ? parseFloat(coords[i + 2]) : 0;
    if (axisOrientation.substr(0, 2) === 'en') {
      flatCoordinates.push(x, y, z);
    } else {
      flatCoordinates.push(y, x, z);
    }
  }
  return flatCoordinates;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Extent|undefined} Envelope.
 */
ol.format.GML2.prototype.readBox_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Box', 'localName should be Box');
  var flatCoordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      this.BOX_PARSERS_, node, objectStack, this);
  return ol.extent.createOrUpdate(flatCoordinates[1][0],
      flatCoordinates[1][1], flatCoordinates[1][3],
      flatCoordinates[1][4]);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML2.prototype.innerBoundaryIsParser_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'innerBoundaryIs',
      'localName should be innerBoundaryIs');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings),
        'flatLinearRings should be an array');
    goog.asserts.assert(flatLinearRings.length > 0,
        'flatLinearRings should have an array length larger than 0');
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML2.prototype.outerBoundaryIsParser_ =
    function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'outerBoundaryIs',
      'localName should be outerBoundaryIs');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings),
        'flatLinearRings should be an array');
    goog.asserts.assert(flatLinearRings.length > 0,
        'flatLinearRings should have an array length larger than 0');
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_ = Object({
  'http://www.opengis.net/gml' : {
    'coordinates': ol.xml.makeReplacer(
        ol.format.GML2.prototype.readFlatCoordinates_)
  }
});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML2.prototype.FLAT_LINEAR_RINGS_PARSERS_ = Object({
  'http://www.opengis.net/gml' : {
    'innerBoundaryIs': ol.format.GML2.prototype.innerBoundaryIsParser_,
    'outerBoundaryIs': ol.format.GML2.prototype.outerBoundaryIsParser_
  }
});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML2.prototype.BOX_PARSERS_ = Object({
  'http://www.opengis.net/gml' : {
    'coordinates': ol.xml.makeArrayPusher(
        ol.format.GML2.prototype.readFlatCoordinates_)
  }
});


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML2.prototype.GEOMETRY_PARSERS_ = Object({
  'http://www.opengis.net/gml' : {
    'Point': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPoint),
    'MultiPoint': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPoint),
    'LineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLineString),
    'MultiLineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiLineString),
    'LinearRing' : ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLinearRing),
    'Polygon': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPolygon),
    'MultiPolygon': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPolygon),
    'Box': ol.xml.makeReplacer(ol.format.GML2.prototype.readBox_)
  }
});
