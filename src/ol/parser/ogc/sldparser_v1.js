goog.provide('ol.parser.ogc.SLD_v1');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('ol.parser.XML');
goog.require('ol.parser.ogc.Filter_v1_0_0');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');



/**
 * Read Styled Layer Descriptor (SLD).
 *
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.SLD_v1 = function() {
  this.defaultNamespaceURI = 'http://www.opengis.net/sld';
  this.readers = {
    'http://www.opengis.net/sld': {
      'StyledLayerDescriptor': function(node, sld) {
        sld.version = node.getAttribute('version');
        this.readChildNodes(node, sld);
      },
      'Name': function(node, obj) {
        obj.name = this.getChildValue(node);
      },
      'Title': function(node, obj) {
        obj.title = this.getChildValue(node);
      },
      'Abstract': function(node, obj) {
        obj.description = this.getChildValue(node);
      },
      'NamedLayer': function(node, sld) {
        var layer = {
          userStyles: [],
          namedStyles: []
        };
        this.readChildNodes(node, layer);
        sld.namedLayers[layer.name] = layer;
      },
      'NamedStyle': function(node, layer) {
        layer.namedStyles.push(
            this.getChildValue(node.firstChild)
        );
      },
      'UserStyle': function(node, layer) {
        var obj = {rules: []};
        this.featureTypeCounter = -1;
        this.readChildNodes(node, obj);
        layer.userStyles.push(new ol.style.Style(obj));
      },
      'IsDefault': function(node, style) {
        if (this.getChildValue(node) === '1') {
          style.isDefault = true;
        }
      },
      'FeatureTypeStyle': function(node, style) {
        ++this.featureTypeCounter;
        var obj = {
          rules: style.rules
        };
        this.readChildNodes(node, obj);
      },
      'Rule': function(node, obj) {
        var config = {symbolizers: []};
        this.readChildNodes(node, config);
        var rule = new ol.style.Rule(config);
        obj.rules.push(rule);
      },
      'ElseFilter': function(node, rule) {
        rule.elseFilter = true;
      },
      'MinScaleDenominator': function(node, rule) {
        rule.minResolution = this.getResolutionFromScale_(
            parseFloat(this.getChildValue(node)));
      },
      'MaxScaleDenominator': function(node, rule) {
        rule.maxResolution = this.getResolutionFromScale_(
            parseFloat(this.getChildValue(node)));
      },
      'TextSymbolizer': function(node, rule) {
        var config = {};
        this.readChildNodes(node, config);
        config.zIndex = this.featureTypeCounter;
        rule.symbolizers.push(
            new ol.style.Text(/** @type {ol.style.TextOptions} */(config))
        );
      },
      'LabelPlacement': function(node, symbolizer) {
        this.readChildNodes(node, symbolizer);
      },
      'PointPlacement': function(node, symbolizer) {
        var config = {};
        this.readChildNodes(node, config);
        config.labelRotation = config.rotation;
        delete config.rotation;
        var labelAlign,
            x = symbolizer.labelAnchorPointX,
            y = symbolizer.labelAnchorPointY;
        if (x <= 1 / 3) {
          labelAlign = 'l';
        } else if (x > 1 / 3 && x < 2 / 3) {
          labelAlign = 'c';
        } else if (x >= 2 / 3) {
          labelAlign = 'r';
        }
        if (y <= 1 / 3) {
          labelAlign += 'b';
        } else if (y > 1 / 3 && y < 2 / 3) {
          labelAlign += 'm';
        } else if (y >= 2 / 3) {
          labelAlign += 't';
        }
        config.labelAlign = labelAlign;
        goog.object.extend(symbolizer, config);
      },
      'AnchorPoint': function(node, symbolizer) {
        this.readChildNodes(node, symbolizer);
      },
      'AnchorPointX': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var labelAnchorPointX = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (labelAnchorPointX) {
          symbolizer.labelAnchorPointX = labelAnchorPointX;
        }
      },
      'AnchorPointY': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var labelAnchorPointY = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (labelAnchorPointY) {
          symbolizer.labelAnchorPointY = labelAnchorPointY;
        }
      },
      'Displacement': function(node, symbolizer) {
        this.readChildNodes(node, symbolizer);
      },
      'DisplacementX': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var labelXOffset = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (labelXOffset) {
          symbolizer.labelXOffset = labelXOffset;
        }
      },
      'DisplacementY': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var labelYOffset = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (labelYOffset) {
          symbolizer.labelYOffset = labelYOffset;
        }
      },
      'LinePlacement': function(node, symbolizer) {
        this.readChildNodes(node, symbolizer);
      },
      'PerpendicularOffset': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var labelPerpendicularOffset = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (labelPerpendicularOffset) {
          symbolizer.labelPerpendicularOffset = labelPerpendicularOffset;
        }
      },
      'Label': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var value = ogcreaders._expression.call(this, node);
        if (value) {
          symbolizer.text = value;
        }
      },
      'Font': function(node, symbolizer) {
        this.readChildNodes(node, symbolizer);
      },
      'Halo': function(node, symbolizer) {
        // halo has a fill, so send fresh object
        var obj = {};
        this.readChildNodes(node, obj);
        symbolizer.haloRadius = obj.haloRadius;
        symbolizer.haloColor = obj['fillColor'];
        symbolizer.haloOpacity = obj['fillOpacity'];
      },
      'Radius': function(node, symbolizer) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var radius = ogcreaders._expression.call(this, node);
        if (goog.isDef(radius)) {
          symbolizer.haloRadius = radius;
        }
      },
      'RasterSymbolizer': function(node, rule) {
        var config = {};
        this.readChildNodes(node, config);
        config.zIndex = this.featureTypeCounter;
        /* TODO
        rule.symbolizers.push(
          new OpenLayers.Symbolizer.Raster(config)
        );
        */
      },
      'Geometry': function(node, obj) {
        obj.geometry = {};
        this.readChildNodes(node, obj.geometry);
      },
      'ColorMap': function(node, symbolizer) {
        symbolizer.colorMap = [];
        this.readChildNodes(node, symbolizer.colorMap);
      },
      'ColorMapEntry': function(node, colorMap) {
        var q = node.getAttribute('quantity');
        var o = node.getAttribute('opacity');
        colorMap.push({
          color: node.getAttribute('color'),
          quantity: q !== null ? parseFloat(q) : undefined,
          label: node.getAttribute('label') || undefined,
          opacity: o !== null ? parseFloat(o) : undefined
        });
      },
      'LineSymbolizer': function(node, rule) {
        var config = {};
        this.readChildNodes(node, config);
        config.zIndex = this.featureTypeCounter;
        rule.symbolizers.push(
            new ol.style.Stroke(config)
        );
      },
      'PolygonSymbolizer': function(node, rule) {
        var config = {
          fill: false,
          stroke: false
        };
        this.readChildNodes(node, config);
        config.zIndex = this.featureTypeCounter;
        if (config.fill === true) {
          var fill = {
            color: config['fillColor'],
            opacity: config['fillOpacity']
          };
          rule.symbolizers.push(
              new ol.style.Fill(fill)
          );
        }
        if (config.stroke === true) {
          var stroke = {
            color: config['strokeColor'],
            opacity: config['strokeOpacity'],
            width: config['strokeWidth']
          };
          rule.symbolizers.push(
              new ol.style.Stroke(stroke)
          );
        }

      },
      'PointSymbolizer': function(node, rule) {
        var config = {
          fill: null,
          stroke: null,
          graphic: null
        };
        this.readChildNodes(node, config);
        config.zIndex = this.featureTypeCounter;
        // TODO shape or icon?
        rule.symbolizers.push(
            new ol.style.Shape(config)
        );
      },
      'Stroke': function(node, symbolizer) {
        symbolizer.stroke = true;
        this.readChildNodes(node, symbolizer);
      },
      'Fill': function(node, symbolizer) {
        symbolizer.fill = true;
        this.readChildNodes(node, symbolizer);
      },
      'CssParameter': function(node, symbolizer) {
        var cssProperty = node.getAttribute('name');
        var symProperty = ol.parser.ogc.SLD_v1.cssMap_[cssProperty];
        // for labels, fill should map to fontColor and fill-opacity
        // to fontOpacity
        if (symbolizer.label) {
          if (cssProperty === 'fill') {
            symProperty = 'fontColor';
          } else if (cssProperty === 'fill-opacity') {
            symProperty = 'fontOpacity';
          }
        }
        if (symProperty) {
          // Limited support for parsing of OGC expressions
          var ogcreaders = this.readers['http://www.opengis.net/ogc'];
          var value = ogcreaders._expression.call(this, node);
          // always string, could be an empty string
          if (value) {
            symbolizer[symProperty] = value;
          }
        }
      },
      'Graphic': function(node, symbolizer) {
        symbolizer.graphic = true;
        var graphic = {};
        // painter's order not respected here, clobber previous with next
        this.readChildNodes(node, graphic);
        // directly properties with names that match symbolizer properties
        var properties = [
          'stroke', 'strokeColor', 'strokeWidth', 'strokeOpacity',
          'strokeLinecap', 'fill', 'fillColor', 'fillOpacity',
          'graphicName', 'rotation', 'graphicFormat'
        ];
        var prop, value;
        for (var i = 0, ii = properties.length; i < ii; ++i) {
          prop = properties[i];
          value = graphic[prop];
          if (goog.isDef(value)) {
            symbolizer[prop] = value;
          }
        }
        // set other generic properties with specific graphic property names
        if (goog.isDef(graphic.opacity)) {
          symbolizer.graphicOpacity = graphic.opacity;
        }
        if (goog.isDef(graphic.size)) {
          var pointRadius = graphic.size / 2;
          if (isNaN(pointRadius)) {
            // likely a property name
            symbolizer.graphicWidth = graphic.size;
          } else {
            symbolizer.pointRadius = graphic.size / 2;
          }
        }
        if (goog.isDef(graphic.href)) {
          symbolizer.externalGraphic = graphic.href;
        }
        if (goog.isDef(graphic.rotation)) {
          symbolizer.rotation = graphic.rotation;
        }
      },
      'ExternalGraphic': function(node, graphic) {
        this.readChildNodes(node, graphic);
      },
      'Mark': function(node, graphic) {
        this.readChildNodes(node, graphic);
      },
      'WellKnownName': function(node, graphic) {
        graphic.graphicName = this.getChildValue(node);
      },
      'Opacity': function(node, obj) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var opacity = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (opacity) {
          obj.opacity = opacity;
        }
      },
      'Size': function(node, obj) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var size = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (size) {
          obj.size = size;
        }
      },
      'Rotation': function(node, obj) {
        var ogcreaders = this.readers['http://www.opengis.net/ogc'];
        var rotation = ogcreaders._expression.call(this, node);
        // always string, could be empty string
        if (rotation) {
          obj.rotation = rotation;
        }
      },
      'OnlineResource': function(node, obj) {
        obj.href = this.getAttributeNS(
            node, 'http://www.w3.org/1999/xlink', 'href'
            );
      },
      'Format': function(node, graphic) {
        graphic.graphicFormat = this.getChildValue(node);
      }
    }
  };
  this.filter_ = new ol.parser.ogc.Filter_v1_0_0();
  for (var uri in this.filter_.readers) {
    for (var key in this.filter_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      this.readers[uri][key] = goog.bind(this.filter_.readers[uri][key],
          this.filter_);
    }
  }
  goog.base(this);
};
goog.inherits(ol.parser.ogc.SLD_v1, ol.parser.XML);


/**
 * @private
 */
ol.parser.ogc.SLD_v1.cssMap_ = {
  'stroke': 'strokeColor',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-dasharray': 'strokeDashstyle',
  'fill': 'fillColor',
  'fill-opacity': 'fillOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle'
};


/**
 * @private
 * @param {number} scaleDenominator The scale denominator to convert to
 * resolution.
 * @return {number} resolution.
 */
ol.parser.ogc.SLD_v1.prototype.getResolutionFromScale_ =
    function(scaleDenominator) {
  var dpi = 25.4 / 0.28;
  var mpu = ol.METERS_PER_UNIT[this.units];
  return 1 / ((1 / scaleDenominator) * (mpu * 39.37) * dpi);
};


/**
 * @param {string|Document|Element} data Data to read.
 * @param {ol.parser.SLDReadOptions=} opt_options Read options.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.SLD_v1.prototype.read = function(data, opt_options) {
  var units = 'm';
  if (goog.isDef(opt_options) && goog.isDef(opt_options.units)) {
    units = opt_options.units;
  }
  this.units = units;
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {namedLayers: {}};
  this.readNode(data, obj);
  delete this.units;
  return obj;
};
