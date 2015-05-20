goog.provide('ol.test.ImageUrlFunction');

describe('ol.ImageUrlFunction', function() {

  describe('#createFromParamsFunction', function() {

    it('is a defined function', function() {
      expect(ol.ImageUrlFunction.createFromParamsFunction).to.not.be(undefined);
      expect(ol.ImageUrlFunction.createFromParamsFunction).to.be.a(Function);
    });

    it('returns a function that throws when called (no arguments)', function() {
      var got = ol.ImageUrlFunction.createFromParamsFunction();
      expect(function() {
        got();
      }).to.throwException();
    });

    it('returns a function that doesn\'t throw when called (valid arguments)',
        function() {
          var baseUrl = 'foo',
              params = {foo: 'bar'},
              paramsFunction = sinon.spy(),
              got = ol.ImageUrlFunction.createFromParamsFunction(baseUrl,
                  params, paramsFunction);

          expect(function() {
            got();
          }).to.not.throwException();
        }
    );

    it('passes given baseUrl to given paramsFunction', function() {
      var baseUrl = 'foo',
          params = {foo: 'bar'},
          spy = sinon.spy(),
          got = ol.ImageUrlFunction.createFromParamsFunction(baseUrl, params,
              spy);

      got();

      expect(spy.called).to.be(true);
      expect(spy.calledOnce).to.be(true);
      expect(spy.calledWith(baseUrl)).to.be(true);
    });

    it('passes given params to given paramsFunction', function() {
      var baseUrl = 'foo',
          params = {foo: 'bar'},
          spy = sinon.spy(),
          got = ol.ImageUrlFunction.createFromParamsFunction(baseUrl, params,
              spy);

      got();

      expect(spy.called).to.be(true);
      expect(spy.calledOnce).to.be(true);
      expect(spy.calledWith(baseUrl, params)).to.be(true);
    });

    it('passes five params to given paramsFunction', function() {
      var baseUrl = 'foo',
          params = {foo: 'bar'},
          extent = [1, 2, 3, 4],
          size = [47, 11],
          projection = ol.proj.get('CRS:84'),
          spy = sinon.spy(),
          firstArgs,
          got = ol.ImageUrlFunction.createFromParamsFunction(baseUrl, params,
              spy);

      got(extent, size, projection);
      firstArgs = spy.args[0];

      expect(spy.called).to.be(true);
      expect(spy.calledOnce).to.be(true);

      expect(firstArgs.length).to.be(5);
      expect(firstArgs).to.eql([baseUrl, params, extent, size, projection]);
    });

  });

  describe('#nullImageUrlFunction', function() {

    it('is a defined function', function() {
      expect(ol.ImageUrlFunction.nullImageUrlFunction).to.not.be(undefined);
      expect(ol.ImageUrlFunction.nullImageUrlFunction).to.be.a(Function);
    });

    it('always returns undefined', function() {
      var got = ol.ImageUrlFunction.nullImageUrlFunction();
      expect(got).to.be(undefined);
    });

  });

});

goog.require('ol.proj');
goog.require('ol.ImageUrlFunction');
