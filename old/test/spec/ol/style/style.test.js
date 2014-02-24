goog.provide('ol.test.style.Style');

describe('ol.style.Style', function() {

  describe('constructor', function() {

    it('creates a style instance given rules', function() {
      var style = new ol.style.Style({
        rules: [
          new ol.style.Rule({
            filter: 'foo == "bar"',
            symbolizers: [
              new ol.style.Fill({
                color: '#ff0000'
              })
            ]
          })
        ]
      });
      expect(style).to.be.a(ol.style.Style);
    });

    it('creates a style instance given only "else" symbolizers', function() {
      var style = new ol.style.Style({
        symbolizers: [
          new ol.style.Fill({
            color: '#ff0000'
          })
        ]
      });
      expect(style).to.be.a(ol.style.Style);
    });

  });

  describe('#createLiterals()', function() {

    it('creates symbolizer literals for a feature', function() {
      var style = new ol.style.Style({
        rules: [
          new ol.style.Rule({
            filter: 'foo == "bar"',
            symbolizers: [
              new ol.style.Shape({
                size: 4,
                fill: new ol.style.Fill({
                  color: ol.expr.parse('fillColor')
                })
              })
            ]
          })
        ]
      });
      var feature = new ol.Feature({
        fillColor: '#BADA55',
        geometry: new ol.geom.Point([1, 2])
      });
      feature.set('foo', 'bar');

      var literals = style.createLiterals(feature, 1);
      expect(literals).to.have.length(1);
      expect(literals[0].fillColor).to.be('#BADA55');

      feature.set('foo', 'baz');
      expect(style.createLiterals(feature, 1)).to.have.length(0);
    });

    it('uses the "else" symbolizers when no rules are provided', function() {
      var style = new ol.style.Style({
        symbolizers: [
          new ol.style.Stroke({
            color: '#ff0000'
          })
        ]
      });

      var feature = new ol.Feature({
        geometry: new ol.geom.LineString([[1, 2], [3, 4]])
      });

      var literals = style.createLiterals(feature, 1);
      expect(literals).to.have.length(1);
      expect(literals[0].color).to.be('#ff0000');
    });

    it('uses the "else" symbolizers when no rules apply', function() {
      var style = new ol.style.Style({
        rules: [
          new ol.style.Rule({
            filter: 'name == "match"',
            symbolizers: [
              new ol.style.Stroke({
                color: '#ff00ff'
              })
            ]
          })
        ],
        // these are the "else" symbolizers
        symbolizers: [
          new ol.style.Stroke({
            color: '#00ff00'
          })
        ]
      });

      var feature = new ol.Feature({
        geometry: new ol.geom.LineString([[1, 2], [3, 4]])
      });

      var literals = style.createLiterals(feature, 1);
      expect(literals).to.have.length(1);
      expect(literals[0].color).to.be('#00ff00');

      feature = new ol.Feature({
        name: 'match',
        geometry: new ol.geom.LineString([[1, 2], [3, 4]])
      });
      literals = style.createLiterals(feature, 1);
      expect(literals).to.have.length(1);
      expect(literals[0].color).to.be('#ff00ff');
    });

  });

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var style = new ol.style.Style({
      symbolizers: [
        new ol.style.Stroke({
          width: 2,
          color: ol.expr.parse('colorProperty'),
          opacity: 1
        })
      ]
    });
    var features;

    it('groups equal symbolizers', function() {
      features = [
        new ol.Feature({
          g: new ol.geom.LineString([[-10, -10], [10, 10]]),
          colorProperty: '#BADA55'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[-10, 10], [10, -10]]),
          colorProperty: '#013'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[10, -10], [-10, -10]]),
          colorProperty: '#013'
        })
      ];

      var groups = style.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups.length).to.be(2);
      expect(groups[0][0].length).to.be(1);
      expect(groups[0][1].color).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].color).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: ol.expr.parse('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]]),
        colorProperty: '#BADA55'
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features.push(featureWithSymbolizers, anotherFeatureWithSymbolizers);

      var groups = style.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups).to.have.length(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].width).to.be(3);

    });

    it('sorts groups by zIndex', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1,
        zIndex: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]])
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features = [featureWithSymbolizers, anotherFeatureWithSymbolizers];

      var groups = style.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups).to.have.length(2);
      expect(groups[0][1].zIndex).to.be(0);
      expect(groups[1][1].zIndex).to.be(1);
    });

  });

  describe('ol.style.getDefault()', function() {
    var style = ol.style.getDefault();

    it('is a ol.style.Style instance', function() {
      expect(style).to.be.a(ol.style.Style);
    });

    describe('#createLiterals()', function() {

      it('returns an empty array for features without geometry', function() {
        var feature = new ol.Feature();
        expect(style.createLiterals(feature, 1))
            .to.have.length(0);
      });

      it('returns an array with the Shape default for points', function() {
        var feature = new ol.Feature();
        feature.setGeometry(new ol.geom.Point([0, 0]));

        var literals = style.createLiterals(feature, 1);
        expect(literals).to.have.length(1);

        var literal = literals[0];
        expect(literal).to.be.a(ol.style.ShapeLiteral);
        expect(literal.type).to.be(ol.style.ShapeDefaults.type);
        expect(literal.fillColor).to.be(ol.style.FillDefaults.color);
        expect(literal.fillOpacity).to.be(ol.style.FillDefaults.opacity);
        expect(literal.strokeColor).to.be(ol.style.StrokeDefaults.color);
        expect(literal.strokeOpacity).to.be(ol.style.StrokeDefaults.opacity);
        expect(literal.strokeWidth).to.be(ol.style.StrokeDefaults.width);
      });

      it('returns an array with the Line default for lines', function() {
        var feature = new ol.Feature();
        feature.setGeometry(new ol.geom.LineString([[0, 0], [1, 1]]));

        var literals = style.createLiterals(feature, 1);
        expect(literals).to.have.length(1);

        var literal = literals[0];
        expect(literal).to.be.a(ol.style.LineLiteral);
        expect(literal.color).to.be(ol.style.StrokeDefaults.color);
        expect(literal.opacity).to.be(ol.style.StrokeDefaults.opacity);
        expect(literal.width).to.be(ol.style.StrokeDefaults.width);
      });

      it('returns an array with the Polygon default for polygons', function() {
        var feature = new ol.Feature();
        feature.setGeometry(new ol.geom.Polygon([[[0, 0], [1, 1], [0, 0]]]));

        var literals = style.createLiterals(feature, 1);
        expect(literals).to.have.length(1);

        var literal = literals[0];
        expect(literal).to.be.a(ol.style.PolygonLiteral);
        expect(literal.fillColor).to.be(ol.style.FillDefaults.color);
        expect(literal.fillOpacity).to.be(ol.style.FillDefaults.opacity);
        expect(literal.strokeColor).to.be(ol.style.StrokeDefaults.color);
        expect(literal.strokeOpacity).to.be(ol.style.StrokeDefaults.opacity);
        expect(literal.strokeWidth).to.be(ol.style.StrokeDefaults.width);
      });

    });

  });

  describe('#reduceLiterals_', function() {

    it('collapses stroke or fill only literals where possible', function() {
      var literals = [
        new ol.style.PolygonLiteral({
          fillColor: '#ff0000',
          fillOpacity: 0.5,
          zIndex: 0
        }),
        new ol.style.PolygonLiteral({
          strokeColor: '#00ff00',
          strokeOpacity: 0.6,
          strokeWidth: 3,
          zIndex: 0
        })
      ];

      var reduced = ol.style.Style.reduceLiterals_(literals);
      expect(reduced).to.have.length(1);

      var poly = reduced[0];
      expect(poly.fillColor).to.be('#ff0000');
      expect(poly.fillOpacity).to.be(0.5);
      expect(poly.strokeColor).to.be('#00ff00');
      expect(poly.strokeOpacity).to.be(0.6);
      expect(poly.strokeWidth).to.be(3);
    });

    it('leaves complete polygon literals alone', function() {
      var literals = [
        new ol.style.PolygonLiteral({
          fillColor: '#ff0000',
          fillOpacity: 0.5,
          strokeColor: '#00ff00',
          strokeOpacity: 0.6,
          strokeWidth: 3,
          zIndex: 0
        }),
        new ol.style.PolygonLiteral({
          strokeColor: '#0000ff',
          strokeOpacity: 0.7,
          strokeWidth: 1,
          zIndex: 0
        })
      ];

      var reduced = ol.style.Style.reduceLiterals_(literals);
      expect(reduced).to.have.length(2);

      var first = reduced[0];
      expect(first.fillColor).to.be('#ff0000');
      expect(first.fillOpacity).to.be(0.5);
      expect(first.strokeColor).to.be('#00ff00');
      expect(first.strokeOpacity).to.be(0.6);
      expect(first.strokeWidth).to.be(3);

      var second = reduced[1];
      expect(second.fillColor).to.be(undefined);
      expect(second.fillOpacity).to.be(undefined);
      expect(second.strokeColor).to.be('#0000ff');
      expect(second.strokeOpacity).to.be(0.7);
      expect(second.strokeWidth).to.be(1);
    });

    it('leaves other literals alone', function() {
      var literals = [
        new ol.style.PolygonLiteral({
          strokeColor: '#00ff00',
          strokeOpacity: 0.6,
          strokeWidth: 3,
          zIndex: 0
        }),
        new ol.style.PolygonLiteral({
          fillColor: '#ff0000',
          fillOpacity: 0.5,
          zIndex: 0
        }),
        new ol.style.TextLiteral({
          color: '#ffffff',
          fontFamily: 'Arial',
          fontSize: 11,
          fontWeight: 'normal',
          text: 'Test',
          opacity: 0.5,
          zIndex: 0
        })
      ];

      var reduced = ol.style.Style.reduceLiterals_(literals);
      expect(reduced).to.have.length(2);

      var first = reduced[0];
      expect(first.fillColor).to.be('#ff0000');
      expect(first.fillOpacity).to.be(0.5);
      expect(first.strokeColor).to.be('#00ff00');
      expect(first.strokeOpacity).to.be(0.6);
      expect(first.strokeWidth).to.be(3);

      var second = reduced[1];
      expect(second.color).to.be('#ffffff');
      expect(second.fontFamily).to.be('Arial');
      expect(second.fontSize).to.be(11);
      expect(second.text).to.be('Test');
      expect(second.opacity).to.be(0.5);
    });


  });

});

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.style');
goog.require('ol.style.Fill');
goog.require('ol.style.LineLiteral');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.Stroke');
goog.require('ol.style.StrokeDefaults');
goog.require('ol.style.Style');
goog.require('ol.style.TextLiteral');
