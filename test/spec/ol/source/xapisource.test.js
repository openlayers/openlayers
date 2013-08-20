goog.provide('ol.test.source.XAPI');
goog.require('ol.source.XAPI');

describe('ol.source.XAPI', function() {
    describe('ol.source.XAPI', function() {
        it('creates an instance', function() {
            var source = new ol.source.XAPI({});
              expect(source).to.be.a(ol.source.XAPI);
              expect(source).to.be.a(ol.source.Vector);
        });
    });

   // describe('#prepareFeatures', function() {
   //     it('loads and parses data from url', function(done) {
   //         var source = new ol.source.XAPI({
   //             url: "http://api.openstreetmap.fr/xapi"
   //         }); 
   //         var layer = new ol.layer.Vector({
   //             source: source
   //         });
   //         source.prepareFeatures(layer,[
});

