goog.provide('ol.test.style.Style');

describe('ol.style.Style', function() {

  describe('#apply()', function() {

    it('applies a style to a feature', function() {

      var style = new ol.style.Style({
        rules: [
          new ol.style.Rule({
            filter: 'foo == "bar"',
            symbolizers: [
              new ol.style.Shape({
                size: 4,
                fillColor: '#BADA55'
              })
            ]
          })
        ]
      });
      var feature = new ol.Feature();
      feature.set('foo', 'bar');
      expect(style.apply(feature).length).to.be(1);
      expect(style.apply(feature)[0].fillColor).to.be('#BADA55');
      feature.set('foo', 'baz');
      expect(style.apply(feature).length).to.be(0);
    });

  });

  describe('ol.style.Style.applyDefaultStyle()', function() {
    var feature = new ol.Feature();

    it('returns an empty array for features without geometry', function() {
      expect(ol.style.Style.applyDefaultStyle(feature).length).to.be(0);
    });

    it('returns an array with the Shape default for points', function() {
      feature.setGeometry(new ol.geom.Point([0, 0]));
      var symbolizers = ol.style.Style.applyDefaultStyle(feature);
      expect(symbolizers.length).to.be(1);
      expect(symbolizers[0]).to.be.a(ol.style.ShapeLiteral);
      expect(symbolizers[0].equals(ol.style.ShapeDefaults)).to.be(true);
    });

    it('returns an array with the Line default for lines', function() {
      feature.setGeometry(new ol.geom.LineString([[0, 0], [1, 1]]));
      expect(ol.style.Style.applyDefaultStyle(feature)[0]
          .equals(ol.style.LineDefaults)).to.be(true);
    });

    it('returns an array with the Polygon default for polygons', function() {
      feature.setGeometry(new ol.geom.Polygon([[[0, 0], [1, 1], [0, 0]]]));
      expect(ol.style.Style.applyDefaultStyle(feature)[0]
          .equals(ol.style.PolygonDefaults)).to.be(true);
    });

  });

  describe('#reduceLiterals', function() {

    it('collapses stroke or fill only literals where possible', function() {
      var literals = [
        new ol.style.PolygonLiteral({
          fillColor: '#ff0000',
          fillOpacity: 0.5
        }),
        new ol.style.PolygonLiteral({
          strokeColor: '#00ff00',
          strokeOpacity: 0.6,
          strokeWidth: 3
        })
      ];

      var reduced = ol.style.Style.reduceLiterals(literals);
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
          strokeWidth: 3
        }),
        new ol.style.PolygonLiteral({
          strokeColor: '#0000ff',
          strokeOpacity: 0.7,
          strokeWidth: 1
        })
      ];

      var reduced = ol.style.Style.reduceLiterals(literals);
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
          strokeWidth: 3
        }),
        new ol.style.PolygonLiteral({
          fillColor: '#ff0000',
          fillOpacity: 0.5
        }),
        new ol.style.TextLiteral({
          color: '#ffffff',
          fontFamily: 'Arial',
          fontSize: 11,
          text: 'Test',
          opacity: 0.5
        })
      ];

      var reduced = ol.style.Style.reduceLiterals(literals);
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


  })

});

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.Style');
goog.require('ol.style.TextLiteral');
