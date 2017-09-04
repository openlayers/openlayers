

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.style.Style');
goog.require('ol.style.Fill');
goog.require('ol.style.Circle');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');


describe('ol.style.Style', function() {

  var testFill = new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  });

  var testStroke = new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  });

  var testText = new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 3
    })
  });

  var testImage = new ol.style.Circle({
    radius: 5
  });

  describe('#clone', function() {

    it('creates a new ol.style.Style', function() {
      var original = new ol.style.Style();
      var clone = original.clone();
      expect(clone).to.be.an(ol.style.Style);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new ol.style.Style({
        geometry: new ol.geom.Point([0, 0, 0]),
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        image: new ol.style.Circle({
          radius: 5
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        }),
        text: new ol.style.Text({
          text: 'test'
        }),
        zIndex: 2
      });
      var clone = original.clone();
      expect(original.getGeometry().getCoordinates()).to.eql(clone.getGeometry().getCoordinates());
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getImage().getRadius()).to.eql(clone.getImage().getRadius());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
      expect(original.getText().getText()).to.eql(clone.getText().getText());
      expect(original.getZIndex()).to.eql(clone.getZIndex());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new ol.style.Style({
        geometry: new ol.geom .Point([0, 0, 0]),
        fill: new ol.style.Fill({
          color: '#319FD3'
        }),
        image: new ol.style.Circle({
          radius: 5
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        }),
        text: new ol.style.Text({
          text: 'test'
        })
      });
      var clone = original.clone();
      expect(original.getGeometry()).not.to.be(clone.getGeometry());
      expect(original.getFill()).not.to.be(clone.getFill());
      expect(original.getImage()).not.to.be(clone.getImage());
      expect(original.getStroke()).not.to.be(clone.getStroke());
      expect(original.getText()).not.to.be(clone.getText());

      clone.getGeometry().setCoordinates([1, 1, 1]);
      clone.getFill().setColor('#012345');
      clone.getImage().setScale(2);
      clone.getStroke().setColor('#012345');
      clone.getText().setText('other');
      expect(original.getGeometry().getCoordinates()).not.to.eql(clone.getGeometry().getCoordinates());
      expect(original.getFill().getColor()).not.to.eql(clone.getFill().getColor());
      expect(original.getImage().getScale()).not.to.eql(clone.getImage().getScale());
      expect(original.getStroke().getColor()).not.to.eql(clone.getStroke().getColor());
      expect(original.getText().getText()).not.to.eql(clone.getText().getText());
    });
  });

  describe('#setZIndex', function() {

    it('sets the zIndex', function() {
      var style = new ol.style.Style();

      style.setZIndex(0.7);
      expect(style.getZIndex()).to.be(0.7);
    });
  });

  describe('#getFill', function() {
    var style = new ol.style.Style({
      fill: testFill
    });

    it('returns the fill style of a style', function() {
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#setFill', function() {
    var style = new ol.style.Style();

    it('sets the fill style of a style', function() {
      style.setFill(testFill);
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#getImage', function() {
    var style = new ol.style.Style({
      image: testImage
    });

    it('returns the image style of a style', function() {
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#setImage', function() {
    var style = new ol.style.Style();

    it('sets the image style of a style', function() {
      style.setImage(testImage);
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#getStroke', function() {
    var style = new ol.style.Style({
      stroke: testStroke
    });

    it('returns the stroke style of a style', function() {
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#setStroke', function() {
    var style = new ol.style.Style();

    it('sets the stroke style of a style', function() {
      style.setStroke(testStroke);
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#getText', function() {
    var style = new ol.style.Style({
      text: testText
    });

    it('returns the text style of a style', function() {
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setText', function() {
    var style = new ol.style.Style();

    it('sets the text style of a style', function() {
      style.setText(testText);
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setGeometry', function() {
    var style = new ol.style.Style();

    it('creates a geometry function from a string', function() {
      var feature = new ol.Feature();
      feature.set('myGeom', new ol.geom.Point([0, 0]));
      style.setGeometry('myGeom');
      expect(style.getGeometryFunction()(feature))
          .to.eql(feature.get('myGeom'));
    });

    it('creates a geometry function from a geometry', function() {
      var geom = new ol.geom.Point([0, 0]);
      style.setGeometry(geom);
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });

    it('returns the configured geometry function', function() {
      var geom = new ol.geom.Point([0, 0]);
      style.setGeometry(function() {
        return geom;
      });
      expect(style.getGeometryFunction()())
          .to.eql(geom);
    });
  });

  describe('#getGeometry', function() {

    it('returns whatever was passed to setGeometry', function() {
      var style = new ol.style.Style();
      style.setGeometry('foo');
      expect(style.getGeometry()).to.eql('foo');
      var geom = new ol.geom.Point([1, 2]);
      style.setGeometry(geom);
      expect(style.getGeometry()).to.eql(geom);
      var fn = function() {
        return geom;
      };
      style.setGeometry(fn);
      expect(style.getGeometry()).to.eql(fn);
      style.setGeometry(null);
      expect(style.getGeometry()).to.eql(null);
    });

  });

});

describe('ol.style.Style.createFunction()', function() {
  var style = new ol.style.Style();

  it('creates a style function from a single style', function() {
    var styleFunction = ol.style.Style.createFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function() {
    var styleFunction = ol.style.Style.createFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    var original = function() {
      return [style];
    };
    var styleFunction = ol.style.Style.createFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      ol.style.Style.createFunction({bogus: 'input'});
    }).to.throwException();
  });

});
