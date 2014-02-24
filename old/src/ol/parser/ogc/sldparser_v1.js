goog.provide('ol.parser.ogc.SLD_v1');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('ol.expr.Literal');
goog.require('ol.parser.XML');
goog.require('ol.parser.ogc.Filter_v1_0_0');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
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
  this.readers = {};
  this.readers[this.defaultNamespaceURI] = {
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
      rule.minResolution = this.getResolutionFromScaleDenominator_(
          parseFloat(this.getChildValue(node)));
    },
    'MaxScaleDenominator': function(node, rule) {
      rule.maxResolution = this.getResolutionFromScaleDenominator_(
          parseFloat(this.getChildValue(node)));
    },
    'TextSymbolizer': function(node, rule) {
      var config = {};
      this.readChildNodes(node, config);
      config.color = goog.isDef(config.fill) ? config.fill.fillColor :
          ol.parser.ogc.SLD_v1.defaults_.fontColor;
      delete config.fill;
      config.zIndex = this.featureTypeCounter;
      rule.symbolizers.push(
          new ol.style.Text(/** @type {olx.style.TextOptions} */(config))
      );
    },
    'Label': function(node, symbolizer) {
      var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
      var value = ogcreaders._expression.call(this, node);
      if (value) {
        symbolizer.text = value;
      }
    },
    'Font': function(node, symbolizer) {
      this.readChildNodes(node, symbolizer);
    },
    'Halo': function(node, symbolizer) {
      var obj = {};
      this.readChildNodes(node, obj);
      symbolizer.stroke = new ol.style.Stroke({
        color: goog.isDef(obj.fill.fillColor) ? obj.fill.fillColor :
            ol.parser.ogc.SLD_v1.defaults_.haloColor,
        width: goog.isDef(obj.haloRadius) ? obj.haloRadius * 2 :
            ol.parser.ogc.SLD_v1.defaults_.haloRadius,
        opacity: goog.isDef(obj.fill.fillOpacity) ? obj.fill.fillOpacity :
            ol.parser.ogc.SLD_v1.defaults_.haloOpacity
      });
    },
    'Radius': function(node, symbolizer) {
      var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
      var radius = ogcreaders._expression.call(this, node);
      goog.asserts.assertInstanceof(radius, ol.expr.Literal,
          'radius expected to be an ol.expr.Literal');
      if (goog.isDef(radius)) {
        symbolizer.haloRadius = radius.getValue();
      }
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
      var config = {};
      this.readChildNodes(node, config);
      config.zIndex = this.featureTypeCounter;
      if (goog.isDef(config.fill)) {
        var fill = {
          color: config.fill.fillColor.getValue(),
          opacity: goog.isDef(config.fill.fillOpacity) ?
              config.fill.fillOpacity :
              ol.parser.ogc.SLD_v1.defaults_.fillOpacity
        };
        rule.symbolizers.push(
            new ol.style.Fill(fill)
        );
        delete config.fill;
      }
      if (goog.isDef(config.stroke)) {
        var stroke = {
          color: config.stroke.strokeColor.getValue(),
          opacity: goog.isDef(config.stroke.strokeOpacity) ?
              config.stroke.strokeOpacity :
              ol.parser.ogc.SLD_v1.defaults_.strokeOpacity,
          width: goog.isDef(config.stroke.strokeWidth) ?
              config.stroke.strokeWidth :
              ol.parser.ogc.SLD_v1.defaults_.strokeWidth
        };
        rule.symbolizers.push(
            new ol.style.Stroke(stroke)
        );
        delete config.stroke;
      }

    },
    'PointSymbolizer': function(node, rule) {
      var config = {};
      this.readChildNodes(node, config);
      config.zIndex = this.featureTypeCounter;
      if (config.fill) {
        var fillConfig = {
          color: goog.isDef(config.fill.fillColor) ?
              config.fill.fillColor :
              ol.parser.ogc.SLD_v1.defaults_.fillColor,
          opacity: goog.isDef(config.fill.fillOpacity) ?
              config.fill.fillOpacity :
              ol.parser.ogc.SLD_v1.defaults_.fillOpacity
        };
        config.fill = new ol.style.Fill(fillConfig);
      }
      if (config.stroke) {
        var strokeConfig = {
          color: goog.isDef(config.stroke.strokeColor) ?
              config.stroke.strokeColor :
              ol.parser.ogc.SLD_v1.defaults_.strokeColor,
          width: goog.isDef(config.stroke.strokeWidth) ?
              config.stroke.strokeWidth :
              ol.parser.ogc.SLD_v1.defaults_.strokeWidth,
          opacity: goog.isDef(config.stroke.strokeOpacity) ?
              config.stroke.strokeOpacity :
              ol.parser.ogc.SLD_v1.defaults_.strokeOpacity
        };
        config.stroke = new ol.style.Stroke(strokeConfig);
      }
      var symbolizer;
      if (goog.isDef(config.externalGraphic)) {
        config.width = config.height = config.size;
        symbolizer = new ol.style.Icon(
            /** @type {olx.style.IconOptions} */(config));
      } else {
        symbolizer = new ol.style.Shape(config);
      }
      rule.symbolizers.push(symbolizer);
    },
    'Stroke': function(node, symbolizer) {
      var stroke = {};
      this.readChildNodes(node, stroke);
      symbolizer.stroke = stroke;
    },
    'Fill': function(node, symbolizer) {
      var fill = {};
      this.readChildNodes(node, fill);
      symbolizer.fill = fill;
    },
    'CssParameter': function(node, symbolizer) {
      var cssProperty = node.getAttribute('name');
      var symProperty = ol.parser.ogc.SLD_v1.cssMap_[cssProperty];
      if (symProperty) {
        var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
        symbolizer[symProperty] = ogcreaders._expression.call(this, node);
      }
    },
    'Graphic': function(node, symbolizer) {
      var graphic = {};
      // painter's order not respected here, clobber previous with next
      this.readChildNodes(node, graphic);
      // directly properties with names that match symbolizer properties
      var properties = [
        'stroke', 'fill', 'rotation', 'opacity'
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
      if (goog.isDef(graphic.graphicName)) {
        symbolizer.type = graphic.graphicName;
      }
      if (goog.isDef(graphic.size)) {
        var pointRadius = graphic.size / 2;
        if (isNaN(pointRadius)) {
          // likely a property name
          symbolizer.size = graphic.size;
        } else {
          symbolizer.size = graphic.size / 2;
        }
      }
      if (goog.isDef(graphic.href)) {
        symbolizer.url = graphic.href;
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
      var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
      obj.opacity = ogcreaders._expression.call(this, node);
    },
    'Size': function(node, obj) {
      var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
      obj.size = ogcreaders._expression.call(this, node);
    },
    'Rotation': function(node, obj) {
      var ogcreaders = this.readers[this.filter_.defaultNamespaceURI];
      obj.rotation = ogcreaders._expression.call(this, node);
    },
    'OnlineResource': function(node, obj) {
      obj.href = this.getAttributeNS(
          node, 'http://www.w3.org/1999/xlink', 'href'
          );
    },
    'Format': function(node, graphic) {
      graphic.graphicFormat = this.getChildValue(node);
    }
  };
  this.writers = {};
  this.writers[this.defaultNamespaceURI] = {
    'StyledLayerDescriptor': function(sld) {
      var node = this.createElementNS('sld:StyledLayerDescriptor');
      node.setAttribute('version', this.version);
      if (goog.isDef(sld.name)) {
        this.writeNode('Name', sld.name, null, node);
      }
      if (goog.isDef(sld.title)) {
        this.writeNode('Title', sld.title, null, node);
      }
      if (goog.isDef(sld.description)) {
        this.writeNode('Abstract', sld.description, null, node);
      }
      goog.object.forEach(sld.namedLayers, function(layer) {
        this.writeNode('NamedLayer', layer, null, node);
      }, this);
      return node;
    },
    'Name': function(name) {
      var node = this.createElementNS('sld:Name');
      node.appendChild(this.createTextNode(name));
      return node;
    },
    'Title': function(title) {
      var node = this.createElementNS('sld:Title');
      node.appendChild(this.createTextNode(title));
      return node;
    },
    'Abstract': function(description) {
      var node = this.createElementNS('sld:Abstract');
      node.appendChild(this.createTextNode(description));
      return node;
    },
    'NamedLayer': function(layer) {
      var node = this.createElementNS('sld:NamedLayer');
      this.writeNode('Name', layer.name, null, node);
      var i, ii;
      if (layer.namedStyles) {
        for (i = 0, ii = layer.namedStyles.length; i < ii; ++i) {
          this.writeNode('NamedStyle', layer.namedStyles[i], null, node);
        }
      }
      if (layer.userStyles) {
        for (i = 0, ii = layer.userStyles.length; i < ii; ++i) {
          this.writeNode('UserStyle', layer.userStyles[i], null, node);
        }
      }
      return node;
    },
    'NamedStyle': function(name) {
      var node = this.createElementNS('sld:NamedStyle');
      this.writeNode('Name', name, null, node);
      return node;
    },
    'UserStyle': function(style) {
      var node = this.createElementNS('sld:UserStyle');
      var name = style.getName(), title = style.getTitle();
      if (goog.isDef(name)) {
        this.writeNode('Name', name, null, node);
      }
      if (goog.isDef(title)) {
        this.writeNode('Title', title, null, node);
      }
      // TODO sorting by zIndex
      this.writeNode('FeatureTypeStyle', style, null, node);
      return node;
    },
    'FeatureTypeStyle': function(style) {
      var node = this.createElementNS('sld:FeatureTypeStyle');
      var rules = style.getRules();
      for (var i = 0, ii = rules.length; i < ii; ++i) {
        this.writeNode('Rule', rules[i], null, node);
      }
      var symbolizers = style.getSymbolizers();
      if (symbolizers.length > 0) {
        // wrap this in a Rule with an ElseFilter
        var rule = new ol.style.Rule({symbolizers: symbolizers});
        rule.elseFilter = true;
        this.writeNode('Rule', rule, null, node);
      }
      return node;
    },
    'Rule': function(rule) {
      var node = this.createElementNS('sld:Rule');
      var filter = rule.getFilter();
      var name = rule.getName(), title = rule.getTitle();
      if (goog.isDef(name)) {
        this.writeNode('Name', name, null, node);
      }
      if (goog.isDef(title)) {
        this.writeNode('Title', title, null, node);
      }
      if (rule.elseFilter === true) {
        this.writeNode('ElseFilter', null, null, node);
      } else if (filter) {
        this.writeNode('Filter', filter, this.filter_.defaultNamespaceURI,
            node);
      }
      var minResolution = rule.getMinResolution();
      if (minResolution > 0) {
        this.writeNode('MinScaleDenominator',
            this.getScaleDenominatorFromResolution_(minResolution),
            null, node);
      }
      var maxResolution = rule.getMaxResolution();
      if (maxResolution < Infinity) {
        this.writeNode('MaxScaleDenominator',
            this.getScaleDenominatorFromResolution_(maxResolution),
            null, node);
      }
      var type, symbolizer, symbolizers = rule.getSymbolizers();
      if (symbolizers) {
        for (var i = 0, ii = symbolizers.length; i < ii; ++i) {
          symbolizer = symbolizers[i];
          if (symbolizer instanceof ol.style.Text) {
            type = 'Text';
          } else if (symbolizer instanceof ol.style.Stroke) {
            type = 'Line';
          } else if (symbolizer instanceof ol.style.Fill) {
            type = 'Polygon';
          } else if (symbolizer instanceof ol.style.Shape ||
              symbolizer instanceof ol.style.Icon) {
            type = 'Point';
          }
          if (goog.isDef(type)) {
            this.writeNode(type + 'Symbolizer', symbolizer, null, node);
          }
        }
      }
      return node;
    },
    'PointSymbolizer': function(symbolizer) {
      var node = this.createElementNS('sld:PointSymbolizer');
      this.writeNode('Graphic', symbolizer, null, node);
      return node;
    },
    'Mark': function(symbolizer) {
      var node = this.createElementNS('sld:Mark');
      this.writeNode('WellKnownName', symbolizer.getType(), null, node);
      var fill = symbolizer.getFill();
      if (!goog.isNull(fill)) {
        this.writeNode('Fill', fill, null, node);
      }
      var stroke = symbolizer.getStroke();
      if (!goog.isNull(stroke)) {
        this.writeNode('Stroke', stroke, null, node);
      }
      return node;
    },
    'WellKnownName': function(name) {
      var node = this.createElementNS('sld:WellKnownName');
      node.appendChild(this.createTextNode(name));
      return node;
    },
    'Graphic': function(symbolizer) {
      var node = this.createElementNS('sld:Graphic');
      var size;
      if (symbolizer instanceof ol.style.Icon) {
        this.writeNode('ExternalGraphic', symbolizer, null, node);
        var opacity = symbolizer.getOpacity();
        goog.asserts.assertInstanceof(opacity, ol.expr.Literal,
            'Only ol.expr.Literal supported for graphicOpacity');
        this.writeNode('Opacity', opacity.getValue(), null, node);
        size = symbolizer.getWidth();
      } else if (symbolizer instanceof ol.style.Shape) {
        this.writeNode('Mark', symbolizer, null, node);
        size = symbolizer.getSize();
      }
      this.writeNode('Size', size, null, node);
      if (symbolizer instanceof ol.style.Icon) {
        var rotation = symbolizer.getRotation();
        goog.asserts.assertInstanceof(rotation, ol.expr.Literal,
            'Only ol.expr.Literal supported for rotation');
        this.writeNode('Rotation', rotation.getValue(), null, node);
      }
      return node;
    },
    'PolygonSymbolizer': function(symbolizer) {
      var node = this.createElementNS('sld:PolygonSymbolizer');
      this.writeNode('Fill', symbolizer, null, node);
      return node;
    },
    'Fill': function(symbolizer) {
      var node = this.createElementNS('sld:Fill');
      var fillColor = symbolizer.getColor();
      var msg = 'Only ol.expr.Literal supported for Fill properties';
      goog.asserts.assertInstanceof(fillColor, ol.expr.Literal, msg);
      this.writeNode('CssParameter', {
        value: fillColor.getValue(),
        key: 'fillColor'
      }, null, node);
      var fillOpacity = symbolizer.getOpacity();
      goog.asserts.assertInstanceof(fillOpacity, ol.expr.Literal, msg);
      this.writeNode('CssParameter', {
        value: fillOpacity.getValue(),
        key: 'fillOpacity'
      }, null, node);
      return node;
    },
    'TextSymbolizer': function(symbolizer) {
      var node = this.createElementNS('sld:TextSymbolizer');
      var text = symbolizer.getText();
      this.writeNode('Label', text, null, node);
      this.writeNode('Font', symbolizer, null, node);
      var stroke = symbolizer.getStroke();
      if (!goog.isNull(stroke)) {
        this.writeNode('Halo', stroke, null, node);
      }
      var color = symbolizer.getColor();
      goog.asserts.assertInstanceof(color, ol.expr.Literal,
          'font color should be ol.expr.Literal');
      this.writeNode('Fill', symbolizer, null, node);
      return node;
    },
    'Halo': function(symbolizer) {
      var node = this.createElementNS('sld:Halo');
      goog.asserts.assertInstanceof(symbolizer.getWidth(), ol.expr.Literal,
          'Only ol.expr.Literal supported for haloRadius');
      this.writeNode('Radius', symbolizer.getWidth().getValue() / 2, null,
          node);
      this.writeNode('Fill', symbolizer, null, node);
      return node;
    },
    'Radius': function(value) {
      var node = this.createElementNS('sld:Radius');
      node.appendChild(this.createTextNode(value));
      return node;
    },
    'LineSymbolizer': function(symbolizer) {
      var node = this.createElementNS('sld:LineSymbolizer');
      this.writeNode('Stroke', symbolizer, null, node);
      return node;
    },
    'Stroke': function(symbolizer) {
      var node = this.createElementNS('sld:Stroke');
      var strokeColor = symbolizer.getColor();
      var msg = 'SLD writing of stroke properties only supported ' +
          'for ol.expr.Literal';
      goog.asserts.assertInstanceof(strokeColor, ol.expr.Literal, msg);
      this.writeNode('CssParameter', {
        value: strokeColor.getValue(),
        key: 'strokeColor'
      }, null, node);
      var strokeOpacity = symbolizer.getOpacity();
      goog.asserts.assertInstanceof(strokeOpacity, ol.expr.Literal, msg);
      this.writeNode('CssParameter', {
        value: strokeOpacity.getValue(),
        key: 'strokeOpacity'
      }, null, node);
      var strokeWidth = symbolizer.getWidth();
      goog.asserts.assertInstanceof(strokeWidth, ol.expr.Literal, msg);
      this.writeNode('CssParameter', {
        value: strokeWidth.getValue(),
        key: 'strokeWidth'
      }, null, node);
      // TODO strokeDashstyle and strokeLinecap
      return node;
    },
    'CssParameter': function(obj) {
      // not handling ogc:expressions for now
      var name = ol.parser.ogc.SLD_v1.getCssProperty_(obj.key);
      if (goog.isDef(name)) {
        var node = this.createElementNS('sld:CssParameter');
        node.setAttribute('name', name);
        node.appendChild(this.createTextNode(obj.value));
        return node;
      }
    },
    'Label': function(label) {
      var node = this.createElementNS('sld:Label');
      this.filter_.writeOgcExpression(label, node);
      return node;
    },
    'Font': function(symbolizer) {
      var node = this.createElementNS('sld:Font');
      this.writeNode('CssParameter', {
        key: 'fontFamily',
        value: symbolizer.getFontFamily().getValue()
      }, null, node);
      this.writeNode('CssParameter', {
        key: 'fontSize',
        value: symbolizer.getFontSize().getValue()
      }, null, node);
      // TODO fontWeight and fontStyle
      return node;
    },
    'MinScaleDenominator': function(scale) {
      var node = this.createElementNS('sld:MinScaleDenominator');
      node.appendChild(this.createTextNode(scale));
      return node;
    },
    'MaxScaleDenominator': function(scale) {
      var node = this.createElementNS('sld:MaxScaleDenominator');
      node.appendChild(this.createTextNode(scale));
      return node;
    },
    'Size': function(value) {
      var node = this.createElementNS('sld:Size');
      this.filter_.writeOgcExpression(value, node);
      return node;
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
  for (var uri in this.filter_.writers) {
    for (var key in this.filter_.writers[uri]) {
      if (!goog.isDef(this.writers[uri])) {
        this.writers[uri] = {};
      }
      this.writers[uri][key] = goog.bind(this.filter_.writers[uri][key],
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
 */
ol.parser.ogc.SLD_v1.defaults_ = {
  fillOpacity: 1,
  strokeOpacity: 1,
  strokeWidth: 1,
  strokeColor: '#000000',
  haloColor: '#FFFFFF',
  haloOpacity: 1,
  haloRadius: 1,
  fillColor: '#808080',
  fontColor: '#000000'
};


/**
 * @private
 * @param {string} sym Symbolizer property.
 * @return {string|undefined} The css property that matches the symbolizer
 *     property.
 */
ol.parser.ogc.SLD_v1.getCssProperty_ = function(sym) {
  return goog.object.findKey(ol.parser.ogc.SLD_v1.cssMap_,
      function(value, key, obj) {
        return (sym === value);
      }
  );
};


/**
 * @private
 * @param {number} scaleDenominator The scale denominator to convert to
 * resolution.
 * @return {number} resolution.
 */
ol.parser.ogc.SLD_v1.prototype.getResolutionFromScaleDenominator_ =
    function(scaleDenominator) {
  var dpi = 25.4 / 0.28;
  var mpu = ol.METERS_PER_UNIT[this.units];
  return 1 / ((1 / scaleDenominator) * (mpu * 39.37) * dpi);
};


/**
 * @private
 * @param {number} resolution The resolution to convert to scale denominator.
 * @return {number} scale denominator.
 */
ol.parser.ogc.SLD_v1.prototype.getScaleDenominatorFromResolution_ =
    function(resolution) {
  var dpi = 25.4 / 0.28;
  var mpu = ol.METERS_PER_UNIT[this.units];
  return resolution * mpu * 39.37 * dpi;
};


/**
 * @param {string|Document|Element} data Data to read.
 * @param {olx.parser.SLDReadOptions=} opt_options Read options.
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


/**
 * @param {Object} style The style to write out.
 * @param {olx.parser.SLDWriteOptions=} opt_options Write options.
 * @return {string} The serialized SLD.
 */
ol.parser.ogc.SLD_v1.prototype.write = function(style, opt_options) {
  var units = 'm';
  if (goog.isDef(opt_options) && goog.isDef(opt_options.units)) {
    units = opt_options.units;
  }
  this.units = units;
  var root = this.writeNode('StyledLayerDescriptor', style);
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  var result = this.serialize(root);
  delete this.units;
  return result;
};
