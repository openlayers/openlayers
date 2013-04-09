goog.provide('ol.parser.ogc.WMSCapabilities_v1');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.WMSCapabilities_v1 = function() {
  this.defaultNamespaceURI = 'http://www.opengis.net/wms';
  this.errorProperty = 'service';
  this.readers = {
    'http://www.opengis.net/wms': {
      'Service': function(node, obj) {
        obj['service'] = {};
        this.readChildNodes(node, obj['service']);
      },
      'Name': function(node, obj) {
        obj['name'] = this.getChildValue(node);
      },
      'Title': function(node, obj) {
        obj['title'] = this.getChildValue(node);
      },
      'Abstract': function(node, obj) {
        obj['abstract'] = this.getChildValue(node);
      },
      'BoundingBox': function(node, obj) {
        var bbox = {};
        bbox['bbox'] = [
          parseFloat(node.getAttribute('minx')),
          parseFloat(node.getAttribute('miny')),
          parseFloat(node.getAttribute('maxx')),
          parseFloat(node.getAttribute('maxy'))
        ];
        var res = {
          x: parseFloat(node.getAttribute('resx')),
          y: parseFloat(node.getAttribute('resy'))
        };
        if (! (isNaN(res.x) && isNaN(res.y))) {
          bbox['res'] = res;
        }
        // return the bbox so that descendant classes can set the
        // CRS and SRS and add it to the obj
        return bbox;
      },
      'OnlineResource': function(node, obj) {
        obj['href'] = this.getAttributeNS(node, 'http://www.w3.org/1999/xlink',
            'href');
      },
      'ContactInformation': function(node, obj) {
        obj['contactInformation'] = {};
        this.readChildNodes(node, obj['contactInformation']);
      },
      'ContactPersonPrimary': function(node, obj) {
        obj['personPrimary'] = {};
        this.readChildNodes(node, obj['personPrimary']);
      },
      'ContactPerson': function(node, obj) {
        obj['person'] = this.getChildValue(node);
      },
      'ContactOrganization': function(node, obj) {
        obj['organization'] = this.getChildValue(node);
      },
      'ContactPosition': function(node, obj) {
        obj['position'] = this.getChildValue(node);
      },
      'ContactAddress': function(node, obj) {
        obj['contactAddress'] = {};
        this.readChildNodes(node, obj['contactAddress']);
      },
      'AddressType': function(node, obj) {
        obj['type'] = this.getChildValue(node);
      },
      'Address': function(node, obj) {
        obj['address'] = this.getChildValue(node);
      },
      'City': function(node, obj) {
        obj['city'] = this.getChildValue(node);
      },
      'StateOrProvince': function(node, obj) {
        obj['stateOrProvince'] = this.getChildValue(node);
      },
      'PostCode': function(node, obj) {
        obj['postcode'] = this.getChildValue(node);
      },
      'Country': function(node, obj) {
        obj['country'] = this.getChildValue(node);
      },
      'ContactVoiceTelephone': function(node, obj) {
        obj['phone'] = this.getChildValue(node);
      },
      'ContactFacsimileTelephone': function(node, obj) {
        obj['fax'] = this.getChildValue(node);
      },
      'ContactElectronicMailAddress': function(node, obj) {
        obj['email'] = this.getChildValue(node);
      },
      'Fees': function(node, obj) {
        var fees = this.getChildValue(node);
        if (fees && fees.toLowerCase() != 'none') {
          obj['fees'] = fees;
        }
      },
      'AccessConstraints': function(node, obj) {
        var constraints = this.getChildValue(node);
        if (constraints && constraints.toLowerCase() != 'none') {
          obj['accessConstraints'] = constraints;
        }
      },
      'Capability': function(node, obj) {
        obj['capability'] = {};
        obj['capability']['nestedLayers'] = [];
        obj['capability']['layers'] = [];
        this.readChildNodes(node, obj['capability']);
      },
      'Request': function(node, obj) {
        obj['request'] = {};
        this.readChildNodes(node, obj['request']);
      },
      'GetCapabilities': function(node, obj) {
        obj['getcapabilities'] = {};
        obj['getcapabilities']['formats'] = [];
        this.readChildNodes(node, obj['getcapabilities']);
      },
      'Format': function(node, obj) {
        if (goog.isArray(obj['formats'])) {
          obj['formats'].push(this.getChildValue(node));
        } else {
          obj['format'] = this.getChildValue(node);
        }
      },
      'DCPType': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'HTTP': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'Get': function(node, obj) {
        obj['get'] = {};
        this.readChildNodes(node, obj['get']);
      },
      'Post': function(node, obj) {
        obj['post'] = {};
        this.readChildNodes(node, obj['post']);
      },
      'GetMap': function(node, obj) {
        obj['getmap'] = {};
        obj['getmap']['formats'] = [];
        this.readChildNodes(node, obj['getmap']);
      },
      'GetFeatureInfo': function(node, obj) {
        obj['getfeatureinfo'] = {};
        obj['getfeatureinfo']['formats'] = [];
        this.readChildNodes(node, obj['getfeatureinfo']);
      },
      'Exception': function(node, obj) {
        obj['exception'] = {};
        obj['exception']['formats'] = [];
        this.readChildNodes(node, obj['exception']);
      },
      'Layer': function(node, obj) {
        var parentLayer, capability;
        if (obj['capability']) {
          capability = obj['capability'];
          parentLayer = obj;
        } else {
          capability = obj;
        }
        var attrNode = node.getAttributeNode('queryable');
        var queryable = (attrNode && attrNode.specified) ?
            node.getAttribute('queryable') : null;
        attrNode = node.getAttributeNode('cascaded');
        var cascaded = (attrNode && attrNode.specified) ?
            node.getAttribute('cascaded') : null;
        attrNode = node.getAttributeNode('opaque');
        var opaque = (attrNode && attrNode.specified) ?
            node.getAttribute('opaque') : null;
        var noSubsets = node.getAttribute('noSubsets');
        var fixedWidth = node.getAttribute('fixedWidth');
        var fixedHeight = node.getAttribute('fixedHeight');
        var parent = parentLayer || {};
        var layer = {
          'nestedLayers': [],
          'styles': parentLayer ? [].concat(parentLayer['styles']) : [],
          'srs': {},
          'metadataURLs': [],
          'bbox': {},
          'llbbox': parent['llbbox'],
          'dimensions': {},
          'authorityURLs': {},
          'identifiers': {},
          'keywords': [],
          'queryable': (queryable && queryable !== '') ?
              (queryable === '1' || queryable === 'true') :
              (parent['queryable'] || false),
          'cascaded': (cascaded !== null) ? parseInt(cascaded, 10) :
              (parent['cascaded'] || 0),
          'opaque': opaque ?
              (opaque === '1' || opaque === 'true') :
              (parent['opaque'] || false),
          'noSubsets': (noSubsets !== null) ?
              (noSubsets === '1' || noSubsets === 'true') :
              (parent['noSubsets'] || false),
          'fixedWidth': (fixedWidth !== null) ?
              parseInt(fixedWidth, 10) : (parent['fixedWidth'] || 0),
          'fixedHeight': (fixedHeight !== null) ?
              parseInt(fixedHeight, 10) : (parent['fixedHeight'] || 0),
          'minScale': parent['minScale'],
          'maxScale': parent['maxScale'],
          'attribution': parent['attribution']
        };
        if (parentLayer) {
          goog.object.extend(layer['srs'], parent['srs']);
          goog.object.extend(layer['bbox'], parent['bbox']);
          goog.object.extend(layer['dimensions'], parent['dimensions']);
          goog.object.extend(layer['authorityURLs'], parent['authorityURLs']);
        }
        obj['nestedLayers'].push(layer);
        layer['capability'] = capability;
        this.readChildNodes(node, layer);
        delete layer['capability'];
        if (layer['name']) {
          var parts = layer['name'].split(':'),
              request = capability['request'],
              gfi = request['getfeatureinfo'];
          if (parts.length > 0) {
            layer['prefix'] = parts[0];
          }
          capability['layers'].push(layer);
          if (!goog.isDef(layer['formats'])) {
            layer['formats'] = request['getmap']['formats'];
          }
          if (!goog.isDef(layer['infoFormats']) && gfi) {
            layer['infoFormats'] = gfi['formats'];
          }
        }
      },
      'Attribution': function(node, obj) {
        obj['attribution'] = {};
        this.readChildNodes(node, obj['attribution']);
      },
      'LogoURL': function(node, obj) {
        obj['logo'] = {
          'width': node.getAttribute('width'),
          'height': node.getAttribute('height')
        };
        this.readChildNodes(node, obj['logo']);
      },
      'Style': function(node, obj) {
        var style = {};
        obj['styles'].push(style);
        this.readChildNodes(node, style);
      },
      'LegendURL': function(node, obj) {
        var legend = {
          'width': node.getAttribute('width'),
          'height': node.getAttribute('height')
        };
        obj['legend'] = legend;
        this.readChildNodes(node, legend);
      },
      'MetadataURL': function(node, obj) {
        var metadataURL = {'type': node.getAttribute('type')};
        obj['metadataURLs'].push(metadataURL);
        this.readChildNodes(node, metadataURL);
      },
      'DataURL': function(node, obj) {
        obj['dataURL'] = {};
        this.readChildNodes(node, obj['dataURL']);
      },
      'FeatureListURL': function(node, obj) {
        obj['featureListURL'] = {};
        this.readChildNodes(node, obj['featureListURL']);
      },
      'AuthorityURL': function(node, obj) {
        var name = node.getAttribute('name');
        var authority = {};
        this.readChildNodes(node, authority);
        obj['authorityURLs'][name] = authority['href'];
      },
      'Identifier': function(node, obj) {
        var authority = node.getAttribute('authority');
        obj['identifiers'][authority] = this.getChildValue(node);
      },
      'KeywordList': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'SRS': function(node, obj) {
        obj['srs'][this.getChildValue(node)] = true;
      }
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1, ol.parser.XML);


/**
 * @param {string|Document|Element} data Data to read.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.WMSCapabilities_v1.prototype.read = function(data) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {};
  this.readNode(data, obj);
  return obj;
};
