goog.require('ol.source.Vector');
goog.provide('ol.test.source.XAPI');
goog.require('ol.source.XAPI');

describe('ol.source.XAPI', function() {

    var extent = [14.39811708927129, 50.07493521431255,
                  14.450817131995263, 50.086633811917075];

    describe('ol.source.XAPI', function() {
        it('creates an instance', function() {
            var source = new ol.source.XAPI({});
              expect(source).to.be.a(ol.source.XAPI);
              expect(source).to.be.a(ol.source.Vector);
        });
    });

    describe('#getUrl', function() {
        it('prepares xapi url based on given extent', function() {
            var source = new ol.source.XAPI({});
            var url = source.getUrl(extent);
            expect(url).to.equal(
                'http://xapi.openstreetmap.org/api/0.6/*[bbox=' +
                extent.join(',') + ']');
        });

        it('prepares url based on different url then defeault', function() {
            var source = new ol.source.XAPI({
                url: 'http://api.openstreetmap.fr/xapi?',
                type: 'node'});
            var url = source.getUrl(extent);
            expect(url).to.equal(
                'http://api.openstreetmap.fr/xapi?node[bbox=' +
                extent.join(',') + ']');
        });

        it('adds different parameters to url', function() {
            var source = new ol.source.XAPI({
                url: 'http://api.openstreetmap.fr/xapi?'
            });
            var url = source.getUrl(extent, {
                man_made: 'surveillance'
            });
            expect(url).to.equal(
                'http://api.openstreetmap.fr/xapi?*[bbox=' +
                extent.join(',') + '][man_made=surveillance]');
        });
    });


    /* can't test remote resvers
     * works by hand
    describe('#prepareFeatures', function() {
        it('loads and parses data from url', function() {

            var source = new ol.source.XAPI({
                url: 'http://api.openstreetmap.fr/xapi/?',
                type: 'node'
            });

            var layer = new ol.layer.Vector({
                source: source
            });

            source.prepareFeatures(layer, extent, undefined,
                function() {
                    expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
                    expect(goog.object.getCount(
                        layer.featureCache_.getFeaturesObject())).to.be(179);
                });
            });
        });
    */
});
