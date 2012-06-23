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

        var container = document.createElement('div');
        container.setAttribute('id', 'map');
        document.documentElement.appendChild(container);
        var map = ol.map({
            renderTo: 'map',
            layers: [ol.layer.osm()],
            center: [0, 0],
            zoom: 1
        });
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            placement: 'top',
            content: 'foo bar'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        var elems = document.getElementsByClassName('ol-popup-top');
        expect(elems.length).toBe(1);
        
        popup.close();
        elems = document.getElementsByClassName('ol-popup-top');
        expect(elems.length).toBe(0);       
        
        map.destroy();
        document.documentElement.removeChild(container);
    });


    it("should be able to open and close a popup", function() {

        var container = document.createElement('div');
        container.setAttribute('id', 'map');
        document.documentElement.appendChild(container);
        var map = ol.map({
            renderTo: 'map',
            layers: [ol.layer.osm()],
            center: [0, 0],
            zoom: 1
        });
        var popup = ol.popup({
            map: map,
            anchor: ol.loc([10,20]),
            content: 'foo bar'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open();
        var elems = document.getElementsByClassName('ol-popup');
        expect(elems.length).toBe(1);
        
        popup.close();
        elems = document.getElementsByClassName('ol-popup');
        expect(elems.length).toBe(0);       
        
        map.destroy();
        document.documentElement.removeChild(container);
    });


    it("should result in an error to open a popup without an anchor or content", function() {

        var container = document.createElement('div');
        container.setAttribute('id', 'map');
        document.documentElement.appendChild(container);
        var map = ol.map({
            renderTo: 'map',
            layers: [ol.layer.osm()],
            center: [0, 0],
            zoom: 1
        });
        var popup = ol.popup({
            map: map
        });
        
        expect(popup).toBeA(ol.Popup);
        expect(function(){popup.open()}).toThrow();
        
        popup.content('foo = bar');
        expect(function(){popup.open()}).toThrow();
        
        popup.anchor(ol.loc([10,20]));
        expect(function(){popup.open()}).not.toThrow();
        
        popup.close();
        map.destroy();
        document.documentElement.removeChild(container);
    });

    it("should be able to open and close a popup with a feature argument", function() {

        var container = document.createElement('div');
        container.setAttribute('id', 'map');
        document.documentElement.appendChild(container);
        var map = ol.map({
            renderTo: 'map',
            layers: [ol.layer.osm()],
            center: [0, 0],
            zoom: 1
        });
        var point = ol.geom.point([21, 4]);
        var feat = ol.feature().geometry(point).set('name','foo');
        
        var popup = ol.popup({
            map: map,
            template: '<p>{{name}}</p>'
        });
        
        expect(popup).toBeA(ol.Popup);
        popup.open(feat);
        
        expect(popup.anchor()).toBeA(ol.Feature);
        expect(popup.anchor().geometry().x()).toBe(21);
        expect(popup.anchor().geometry().y()).toBe(4);
        var elems = document.getElementsByClassName('ol-popup');
        expect(elems.length).toBe(1);
        expect(elems[0].innerHTML).toContain('name'); //TODO check for template replacement when implemented
        
        feat.set('name','bar');
        popup.open(feat)
        expect(elems[0].innerHTML).toContain('name'); //TODO check for template replacement when implemented
        
        popup.content('testing');
        popup.open(feat)
        expect(elems[0].innerHTML).toContain('testing'); //TODO check for template replacement when implemented
        
        popup.close();
        map.destroy();
        document.documentElement.removeChild(container);

    });

    /*
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

