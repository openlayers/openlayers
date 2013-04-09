goog.provide('ol.parser.ogc.WMSCapabilities_v1_1');

goog.require('goog.object');
goog.require('ol.parser.ogc.WMSCapabilities_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1}
 */
ol.parser.ogc.WMSCapabilities_v1_1 = function() {
  goog.base(this);
  var bboxreader = this.readers['http://www.opengis.net/wms']['BoundingBox'];
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'WMT_MS_Capabilities': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'Keyword': function(node, obj) {
      if (obj['keywords']) {
        obj['keywords'].push({'value': this.getChildValue(node)});
      }
    },
    'DescribeLayer': function(node, obj) {
      obj['describelayer'] = {'formats': []};
      this.readChildNodes(node, obj['describelayer']);
    },
    'GetLegendGraphic': function(node, obj) {
      obj['getlegendgraphic'] = {'formats': []};
      this.readChildNodes(node, obj['getlegendgraphic']);
    },
    'GetStyles': function(node, obj) {
      obj['getstyles'] = {'formats': []};
      this.readChildNodes(node, obj['getstyles']);
    },
    'PutStyles': function(node, obj) {
      obj['putstyles'] = {'formats': []};
      this.readChildNodes(node, obj['putstyles']);
    },
    'UserDefinedSymbolization': function(node, obj) {
      var userSymbols = {
        'supportSLD': parseInt(node.getAttribute('SupportSLD'), 10) == 1,
        'userLayer': parseInt(node.getAttribute('UserLayer'), 10) == 1,
        'userStyle': parseInt(node.getAttribute('UserStyle'), 10) == 1,
        'remoteWFS': parseInt(node.getAttribute('RemoteWFS'), 10) == 1
      };
      obj['userSymbols'] = userSymbols;
    },
    'LatLonBoundingBox': function(node, obj) {
      obj['llbbox'] = [
        parseFloat(node.getAttribute('minx')),
        parseFloat(node.getAttribute('miny')),
        parseFloat(node.getAttribute('maxx')),
        parseFloat(node.getAttribute('maxy'))
      ];
    },
    'BoundingBox': function(node, obj) {
      var bbox = bboxreader.apply(this, arguments);
      bbox['srs'] = node.getAttribute('SRS');
      obj['bbox'][bbox['srs']] = bbox;
    },
    'ScaleHint': function(node, obj) {
      var min = parseFloat(node.getAttribute('min'));
      var max = parseFloat(node.getAttribute('max'));
      var rad2 = Math.pow(2, 0.5);
      var dpi = (25.4 / 0.28);
      var ipm = 39.37;
      if (min !== 0) {
        obj['maxScale'] = parseFloat((min / rad2) * ipm * dpi);
      }
      if (max != Infinity) {
        obj['minScale'] = parseFloat((max / rad2) * ipm * dpi);
      }
    },
    'Dimension': function(node, obj) {
      var name = node.getAttribute('name').toLowerCase();
      var dim = {
        'name': name,
        'units': node.getAttribute('units'),
        'unitsymbol': node.getAttribute('unitSymbol')
      };
      obj['dimensions'][dim.name] = dim;
    },
    'Extent': function(node, obj) {
      var name = node.getAttribute('name').toLowerCase();
      if (name in obj['dimensions']) {
        var extent = obj['dimensions'][name];
        extent['nearestVal'] =
            node.getAttribute('nearestValue') === '1';
        extent['multipleVal'] =
            node.getAttribute('multipleValues') === '1';
        extent['current'] = node.getAttribute('current') === '1';
        extent['default'] = node.getAttribute('default') || '';
        var values = this.getChildValue(node);
        extent['values'] = values.split(',');
      }
    }
  });
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1,
    ol.parser.ogc.WMSCapabilities_v1);
