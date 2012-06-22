describe("ol.popup", function() {
    
    it("should be able to add it to a map", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map
        });
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.map()).toBeA(ol.Map);
    });

    it("should be able to place it at a specific location", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20])
        });
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.anchor()).toBeA(ol.Loc);
        expect(popup.anchor().x()).toBe(10);
        expect(popup.anchor().y()).toBe(20);
    });

    it("should be able to anchor it with a feature", function() {

        var map = ol.map();
        var feat = ol.feature();
        var point = ol.geom.point([21, 4]);
        feat.geometry(point);
        
        var popup = ol.popup({
            map: map,
            anchor: feat
        });
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
    });

    it("should be able to anchor it with a feature", function() {

        var map = ol.map();
        var feat = ol.feature();
        var point = ol.geom.point([21, 4]);
        feat.geometry(point);
        
        var popup = ol.popup({
            map: map
        }).anchor(feat);
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
    });

    it("should be able to associate it with a feature", function() {

        var map = ol.map();
        var feat = ol.feature();
        var point = ol.geom.point([21, 4]);
        feat.geometry(point);
        var popup = ol.popup({
            map: map
        });
        popup.anchor(feat);
        
        expect(popup).toBeA(ol.Popup);
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
    });

    /* 
     * not yet implemented
    it("should be able to set the placement automatically", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            placement: 'auto'
        });
        
        expect(popup).toBeA(ol.Popup);
        //expect?
    });
    */

    it("should be able to set the placement top of the location", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            placement: 'top'
        });
        
        expect(popup).toBeA(ol.Popup);
        //expect?
    });

    it("should be able to set the placement right of the location", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            placement: 'right'
        });
        
        expect(popup).toBeA(ol.Popup);
        //expect?
    });

    /*
    it("should be able to open and close a popup", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            content: 'test'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        var elems = goog.dom.getElementsByClass('ol-popup');
        expect(elems.length).toBe(1);
        expect(elems[0].innerHTML.indexOf('test')).toBe(0);
        
        popup.close();
        //expect(popup.container()).toBeNull();

    });

    it("should be able to open and close a popup with a feature argument", function() {

        var point = ol.geom.point([21, 4]);
        var feat = ol.feature().geometry(point).set('name','foo');
        var map = ol.map();
        var popup = ol.popup({
            map: map,
            template: '<p>{{name}}</p>'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open(feat);
        
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
        //expect?
        
        popup.close();
        //expect?

    });

    it("should be able to open with a new feature and the popup updates", function() {

        var point = ol.geom.point([21, 4]);
        var feat = ol.feature().geometry(point).set('name','foo');
        var map = ol.map();
        var popup = ol.popup({
            map: map,
            template: '<p>{{name}}</p>'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open(feat);
        
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
        //expect?
        
        var feat2 = ol.feature().geometry(ol.geom.point([-67,-80])).set('name','bar');
        popup.open(feat2)
        expect(popup.anchor().geometry().x()).toBe(-67);
        expect(popup.anchor().geometry().y()).toBe(-80);
        
        popup.close();
        //expect?

    });

    it("should be able to open and close a popup with a loc argument", function() {

        var map = ol.map();
        var popup = ol.popup({
            map: map,
            content: 'test'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open(ol.loc([15,3]));
        
        expect(popup.anchor()).toBeA(ol.Loc);
        expect(popup.anchor().x()).toBe(15);
        expect(popup.anchor().y()).toBe(3);
        
        popup.close();
        //expect?

    });

    it("should be able to set content in the popup", function() {

        var point = ol.geom.point([21, 4]);
        var feat = ol.feature().geometry(point);
        var map = ol.map();
        var popup = ol.popup({
            map: map,
            content: '<p>hello popup! #ol3</p>'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        //expect?
        
        popup.content('<p>content changed! #ol3</p>');
        //expect?
        
        popup.close();
        //expect?

    });

    it("should be able to set content based on a template and feature attributes", function() {

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
        
        popup.template();
         
        popup.close();
        //expect?

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
        
        popup.template();
         
        popup.close();
        //expect?

    });
*/

});

