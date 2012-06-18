describe("ol.Location", function() {

    it("allows flexible construction", function() {
        var loc;

        // nowhere
        loc = ol.loc();
        expect(loc instanceof ol.Location).toBe(true);
        
        // obj config
        loc = ol.loc({x: 10, y: 20});
        
        expect(loc.x()).toBe(10);
        expect(loc.y()).toBe(20);
        
        // array config
        loc = ol.loc([30, 40]);

        expect(loc.x()).toBe(30);
        expect(loc.y()).toBe(40);
        
    });

    it("accounts for the third dimension", function() {
        var loc;
        
        // obj config
        loc = ol.loc({x: 10, y: 20, z: 30});
        
        expect(loc.z()).toBe(30);
        
        // array config
        loc = ol.loc([40, 50, 60]);
        
        expect(loc.z()).toBe(60);

    });
    
    it("is mutable", function() {
        
        var loc = ol.loc({x: 10, y: 20, z: 15});
        
        loc.z(30);
        expect(loc.x()).toBe(10);
        expect(loc.y()).toBe(20);
        expect(loc.z()).toBe(30);

    });
    
    it("has no default projection", function() {

        var loc = ol.loc({x: 1, y: 2});
        
        expect(loc.projection()).toBeUndefined();
        
    });
    
    it("allows projection to be set", function() {
        var proj;

        // at construction
        var loc = ol.loc({x: 1, y: 2, projection: "EPSG:4326"});

        proj = loc.projection();
        expect(proj instanceof ol.Projection).toBe(true);
        expect(proj.code()).toBe("EPSG:4326");
        
        // after construction
        loc.projection("EPSG:3857");
        expect(loc.projection().code()).toBe("EPSG:3857");
        
        // setting projection does not transform coordinates
        expect(loc.x()).toBe(1);
        expect(loc.y()).toBe(2);

    });
    
    it("can be transformed (to mercator)", function() {

        var loc = ol.loc({x: 10, y: 20, projection: "EPSG:4326"});
        var trans = loc.transform("EPSG:3857");
        
        expect(trans instanceof ol.Location).toBe(true);
        expect(trans.projection().code()).toBe("EPSG:3857");
        expect(trans.x().toFixed(3)).toBe("1113194.908");
        expect(trans.y().toFixed(3)).toBe("2273030.927");
        
        expect(loc.x().toFixed(3)).toBe("10.000");
        expect(loc.y().toFixed(3)).toBe("20.000");
        
    });

    it("can be transformed (to geographic)", function() {

        var loc = ol.loc({x: 1113195, y: 2273031, projection: "EPSG:3857"});
        var trans = loc.transform("EPSG:4326");
        
        expect(trans instanceof ol.Location).toBe(true);
        expect(trans.projection().code()).toBe("EPSG:4326");
        expect(trans.x().toFixed(3)).toBe("10.000");
        expect(trans.y().toFixed(3)).toBe("20.000");
        
    });
    
    it("should not be transformable if it has no projection", function() {
        var loc = ol.loc([1, 2]);
        expect(function() {
            loc.transform("EPSG:4326");
        }).toThrow();
    });
    
    it("is destroyable", function() {
        
        var loc = ol.loc([1, 2]);
        loc.destroy();

        expect(loc.config).toBeUndefined();

        expect(function() {
            loc.x();
        }).toThrow();
        
    });
    
});
