describe("ol.Popup", function() {
    
    it("should be able to add it to a map", function() {

        var map = new ol.Map();
        var popup = new ol.Popup(map);
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.getMap()).toBeA(ol.Map);
    });

    it("should be able to place it at a specific location", function() {

        var map = new ol.Map();
        var popup = new ol.Popup(map, new ol.Loc(10,20));
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.getAnchor()).toBeA(ol.Loc);
        expect(popup.getAnchor().x()).toBe(10);
        expect(popup.getAnchor().y()).toBe(20);
    });

    it("should be able to anchor it with a feature", function() {

        var feat = new ol.Feature();
        feat.setGeometry(new ol.geom.Point(21, 4));
        var map = new ol.Map();
        var popup = new ol.Popup(map, feat);
        
        expect(popup).toBeA(ol.Popup);
        var anchor = popup.getAnchor();
        expect(anchor).toBeA(ol.Feature);
        var geom = anchor.getGeometry();
        expect(geom.getX()).toBe(21);
        expect(geom.getY()).toBe(4);
    });

    /*
    it("should be able to set the placement top of the location", function() {

        var map = new ol.Map();
        var popup = new ol.Popup(map, new ol.Loc(10,20),'top');
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        var elems = goog.dom.getElementsByClass('ol-popup-top');
        expect(elems.length).toBe(1);
        elems = goog.dom.getElementsByClass('ol-popup-close');
        expect(elems.length).toBe(1);
        popup.close();
    });

    it("should be able to change the placement", function() {

        var map = new ol.Map();
        var popup = new ol.Popup(map, new ol.Loc(10,20),'top',false);
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        var elems = goog.dom.getElementsByClass('ol-popup-top');
        expect(elems.length).toBe(1);
        elems = goog.dom.getElementsByClass('ol-popup-close');
        expect(elems.length).toBe(0);
        
        popup.setPlacement('right');
        elems = goog.dom.getElementsByClass('ol-popup-top');
        expect(elems.length).toBe(0);
        elems = goog.dom.getElementsByClass('ol-popup-right');
        expect(elems.length).toBe(1);
        
        popup.close();
    });

    it("should be able to use a user provided container", function() {

        var point = ol.geom.point([21, 4]);
        var feat = ol.feature().geometry(point).set('name', 'foo');
        var map = ol.map();
        var popup = ol.popup({
            map: map,
            template: '<p>hello popup template! #ol3 feature name: {{name}}</p>'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open(feat);     
         //expect?
        
        pop.template();
         
        popup.close();
        expect(goog.dom.getElementsByClass('ol-popup')).toBeNull();
    });
*/

});

