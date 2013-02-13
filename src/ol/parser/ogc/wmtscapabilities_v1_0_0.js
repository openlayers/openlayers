goog.provide('ol.parser.ogc.WMTSCapabilities_v1_0_0');
goog.require('goog.dom.xml');
goog.require('ol.Coordinate');
goog.require('ol.Projection');
goog.require('ol.parser.XML');
goog.require('ol.parser.ogc.OWSCommon_v1_1_0');



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.WMTSCapabilities_v1_0_0 = function() {
  this.readers = {
    'http://www.opengis.net/wmts/1.0': {
      'Capabilities': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'Contents': function(node, obj) {
        obj['contents'] = {};
        obj['contents']['layers'] = [];
        obj['contents']['tileMatrixSets'] = {};
        this.readChildNodes(node, obj['contents']);
      },
      'Layer': function(node, obj) {
        var layer = {
          'styles': [],
          'formats': [],
          'dimensions': [],
          'tileMatrixSetLinks': []
        };
        layer['layers'] = [];
        this.readChildNodes(node, layer);
        obj['layers'].push(layer);
      },
      'Style': function(node, obj) {
        var style = {};
        style['isDefault'] = (node.getAttribute('isDefault') === 'true');
        this.readChildNodes(node, style);
        obj['styles'].push(style);
      },
      'Format': function(node, obj) {
        obj['formats'].push(this.getChildValue(node));
      },
      'TileMatrixSetLink': function(node, obj) {
        var tileMatrixSetLink = {};
        this.readChildNodes(node, tileMatrixSetLink);
        obj['tileMatrixSetLinks'].push(tileMatrixSetLink);
      },
      'TileMatrixSet': function(node, obj) {
        // node could be child of wmts:Contents or wmts:TileMatrixSetLink
        // duck type wmts:Contents by looking for layers
        if (obj['layers']) {
          // TileMatrixSet as object type in schema
          var tileMatrixSet = {
            'matrixIds': []
          };
          this.readChildNodes(node, tileMatrixSet);
          obj['tileMatrixSets'][tileMatrixSet['identifier']] = tileMatrixSet;
        } else {
          // TileMatrixSet as string type in schema
          obj['tileMatrixSet'] = this.getChildValue(node);
        }
      },
      'TileMatrix': function(node, obj) {
        var tileMatrix = {
          'supportedCRS': obj.supportedCRS
        };
        this.readChildNodes(node, tileMatrix);
        obj['matrixIds'].push(tileMatrix);
      },
      'ScaleDenominator': function(node, obj) {
        obj['scaleDenominator'] = parseFloat(this.getChildValue(node));
      },
      'TopLeftCorner': function(node, obj) {
        var topLeftCorner = this.getChildValue(node);
        var coords = topLeftCorner.split(' ');
        var axisOrientation =
            ol.Projection.getFromCode(obj['supportedCRS']).getAxisOrientation();
        obj['topLeftCorner'] = ol.Coordinate.fromProjectedArray(
            [parseFloat(coords[0]), parseFloat(coords[1])], axisOrientation);
      },
      'TileWidth': function(node, obj) {
        obj['tileWidth'] = parseInt(this.getChildValue(node), 10);
      },
      'TileHeight': function(node, obj) {
        obj['tileHeight'] = parseInt(this.getChildValue(node), 10);
      },
      'MatrixWidth': function(node, obj) {
        obj['matrixWidth'] = parseInt(this.getChildValue(node), 10);
      },
      'MatrixHeight': function(node, obj) {
        obj['matrixHeight'] = parseInt(this.getChildValue(node), 10);
      },
      'ResourceURL': function(node, obj) {
        obj['resourceUrl'] = obj['resourceUrl'] || {};
        var resourceType = node.getAttribute('resourceType');
        if (!obj['resourceUrls']) {
          obj['resourceUrls'] = [];
        }
        var resourceUrl = obj['resourceUrl'][resourceType] = {
          'format': node.getAttribute('format'),
          'template': node.getAttribute('template'),
          'resourceType': resourceType
        };
        obj['resourceUrls'].push(resourceUrl);
      },
      'WSDL': function(node, obj) {
        obj['wsdl'] = {};
        obj['wsdl']['href'] = this.getAttributeNS(node,
            'http://www.w3.org/1999/xlink', 'href');
        // TODO: other attributes of <WSDL> element
      },
      'ServiceMetadataURL': function(node, obj) {
        obj['serviceMetadataUrl'] = {};
        obj['serviceMetadataUrl']['href'] =
            this.getAttributeNS(node, 'http://www.w3.org/1999/xlink', 'href');
        // TODO: other attributes of <ServiceMetadataURL> element
      },
      'LegendURL': function(node, obj) {
        obj['legend'] = {};
        obj['legend']['href'] = this.getAttributeNS(node,
            'http://www.w3.org/1999/xlink', 'href');
        obj['legend']['format'] = node.getAttribute('format');
      },
      'Dimension': function(node, obj) {
        var dimension = {'values': []};
        this.readChildNodes(node, dimension);
        obj['dimensions'].push(dimension);
      },
      'Default': function(node, obj) {
        obj['default'] = this.getChildValue(node);
      },
      'Value': function(node, obj) {
        obj['values'].push(this.getChildValue(node));
      }
    }
  };
  var ows = new ol.parser.ogc.OWSCommon_v1_1_0();
  this.readers['http://www.opengis.net/ows/1.1'] =
      ows.readers['http://www.opengis.net/ows/1.1'];
  goog.base(this);
};
goog.inherits(ol.parser.ogc.WMTSCapabilities_v1_0_0, ol.parser.XML);


/**
 * @param {string|Document|Element} data Data to read.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.WMTSCapabilities_v1_0_0.prototype.read = function(data) {
  if (typeof data == 'string') {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {};
  this.readNode(data, obj);
  return obj;
};
