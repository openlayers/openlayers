goog.provide('ol.parser.ogc.WMSCapabilities_v1_3_0');

goog.require('goog.object');
goog.require('ol.parser.ogc.WMSCapabilities_v1');



/**
 * @constructor
 * @extends {ol.parser.ogc.WMSCapabilities_v1}
 */
ol.parser.ogc.WMSCapabilities_v1_3_0 = function() {
  goog.base(this);
  var bboxreader = this.readers['http://www.opengis.net/wms']['BoundingBox'];
  goog.object.extend(this.readers['http://www.opengis.net/wms'], {
    'WMS_Capabilities': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'LayerLimit': function(node, obj) {
      obj['layerLimit'] = parseInt(this.getChildValue(node), 10);
    },
    'MaxWidth': function(node, obj) {
      obj['maxWidth'] = parseInt(this.getChildValue(node), 10);
    },
    'MaxHeight': function(node, obj) {
      obj['maxHeight'] = parseInt(this.getChildValue(node), 10);
    },
    'BoundingBox': function(node, obj) {
      var bbox = bboxreader.apply(this, arguments);
      bbox['srs'] = node.getAttribute('CRS');
      obj['bbox'][bbox['srs']] = bbox;
    },
    'CRS': function(node, obj) {
      // CRS is the synonym of SRS
      this.readers['http://www.opengis.net/wms']['SRS'].apply(this, arguments);
    },
    'EX_GeographicBoundingBox': function(node, obj) {
      // replacement of LatLonBoundingBox
      obj['llbbox'] = [];
      this.readChildNodes(node, obj['llbbox']);
    },
    'westBoundLongitude': function(node, obj) {
      obj[0] = this.getChildValue(node);
    },
    'eastBoundLongitude': function(node, obj) {
      obj[2] = this.getChildValue(node);
    },
    'southBoundLatitude': function(node, obj) {
      obj[1] = this.getChildValue(node);
    },
    'northBoundLatitude': function(node, obj) {
      obj[3] = this.getChildValue(node);
    },
    'MinScaleDenominator': function(node, obj) {
      obj['maxScale'] = parseFloat(this.getChildValue(node)).toPrecision(16);
    },
    'MaxScaleDenominator': function(node, obj) {
      obj['minScale'] = parseFloat(this.getChildValue(node)).toPrecision(16);
    },
    'Dimension': function(node, obj) {
      // dimension has extra attributes: default, multipleValues,
      // nearestValue, current which used to be part of Extent. It now
      // also contains the values.
      var name = node.getAttribute('name').toLowerCase();
      var dim = {
        'name': name,
        'units': node.getAttribute('units'),
        'unitsymbol': node.getAttribute('unitSymbol'),
        'nearestVal': node.getAttribute('nearestValue') === '1',
        'multipleVal': node.getAttribute('multipleValues') === '1',
        'default': node.getAttribute('default') || '',
        'current': node.getAttribute('current') === '1',
        'values': this.getChildValue(node).split(',')
      };
      // Theoretically there can be more dimensions with the same
      // name, but with a different unit. Until we meet such a case,
      // let's just keep the same structure as the WMS 1.1
      // GetCapabilities parser uses. We will store the last
      // one encountered.
      obj['dimensions'][dim['name']] = dim;
    },
    'Keyword': function(node, obj) {
      var keyword = {'value': this.getChildValue(node),
        'vocabulary': node.getAttribute('vocabulary')};
      if (obj['keywords']) {
        obj['keywords'].push(keyword);
      }
    }
  });
  this.readers['sld'] = {
    'UserDefinedSymbolization': function(node, obj) {
      var readers = this.readers['http://www.opengis.net/wms'];
      readers.UserDefinedSymbolization.apply(this, arguments);
      // add the two extra attributes
      var value = node.getAttribute('InlineFeature');
      obj['userSymbols']['inlineFeature'] = parseInt(value, 10) == 1;
      value = node.getAttribute('RemoteWCS');
      obj['userSymbols']['remoteWCS'] = parseInt(value, 10) == 1;
    },
    'DescribeLayer': function(node, obj) {
      var readers = this.readers['http://www.opengis.net/wms'];
      readers.DescribeLayer.apply(this, arguments);
    },
    'GetLegendGraphic': function(node, obj) {
      var readers = this.readers['http://www.opengis.net/wms'];
      readers.GetLegendGraphic.apply(this, arguments);
    }
  };
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_3_0,
    ol.parser.ogc.WMSCapabilities_v1);
