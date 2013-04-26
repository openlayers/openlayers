function com_test_getRenderedDimensions(t) {
    t.plan(17);
    var content = (new Array(100)).join("foo ");
    
    // test with fixed width
    var fw = OpenLayers.Util.getRenderedDimensions(content, {w: 20});
    t.eq(fw.w, 20, "got the fixed width");
    
    // test with fixed height
    var fh = OpenLayers.Util.getRenderedDimensions(content, {h: 15});
    t.eq(fh.h, 15, "got the fixed height");        
    
    var size = OpenLayers.Util.getRenderedDimensions("<p>Content</p>");
    var bigger = OpenLayers.Util.getRenderedDimensions("<p>Content</p>", null, {displayClass: 'test_getRenderedDimensions'});
    var overflow = OpenLayers.Util.getRenderedDimensions("<p style='overflow:auto'>Content</p>");
    var width = OpenLayers.Util.getRenderedDimensions("<p>Content</p>", new OpenLayers.Size(250, null));
    var height = OpenLayers.Util.getRenderedDimensions("<p>Content</p>", new OpenLayers.Size(null, 40));
    t.ok((size.w + 40) == bigger.w && (size.h + 40) == bigger.h, "bigger Pass:  " + size + ", " + bigger);
    t.ok(size.w == overflow.w && size.h == overflow.h, "overflow Pass:  " + size + ", " + overflow);
    t.ok(width.w == 250 && width.h == size.h, "width Pass:  " + size + ", " + width);
    t.ok(height.h == 40 && height.w == size.w, "height Pass:  " + size + ", " + height);
    
    content = (new Array(10)).join("foo foo foo <br>");
    var testName,
        finalSize,
        initialSize = OpenLayers.Util.getRenderedDimensions(content, null);
    // containerElement option on absolute position with width and height
    testName = "Absolute with w&h: ";
    var optionAbsDiv ={
        containerElement: document.getElementById("absoluteDiv")
    };
    finalSize = OpenLayers.Util.getRenderedDimensions(content, null, optionAbsDiv);
    t.ok(initialSize.w > 0 && initialSize.h > 0, "Has initial size (requires visible test_iframe)");
    t.eq(finalSize.w, initialSize.w, 
                testName + "initial width " + initialSize.w + "px is maintained");
     t.eq(finalSize.h, initialSize.h, 
                testName + "initial height " + initialSize.h + "px is maintained");
    testName = "Absolute with w&h (set height): ";
    finalSize = OpenLayers.Util.getRenderedDimensions(content, {h: 15}, optionAbsDiv);
    t.eq(finalSize.h, 15, testName + "got the fixed height to 15px");
    t.eq(finalSize.w, initialSize.w, 
                testName + "initial width " + initialSize.w + "px is maintained");
    testName = "Absolute with w&h (set width): ";
    finalSize = OpenLayers.Util.getRenderedDimensions(content, {w: 20}, optionAbsDiv);
    t.eq(finalSize.w, 20, testName + "got the fixed width to 20px");
    // containerElement option on absolute position without width and height
    testName = "Absolute without w&h: ";
    var optionAbsDiv00 ={
        containerElement: document.getElementById("absoluteDiv00")
    };
    finalSize = OpenLayers.Util.getRenderedDimensions(content, null, optionAbsDiv00);
    t.eq(finalSize.w, initialSize.w, 
                testName + "initial width " + initialSize.w + "px is maintained");
    t.eq(finalSize.h, initialSize.h, 
                testName + "initial height " + initialSize.h + "px is maintained");
    testName = "Absolute without w&h (set height): ";
    finalSize = OpenLayers.Util.getRenderedDimensions(content, {h: 15}, optionAbsDiv00);
    t.eq(finalSize.h, 15, testName + "got the fixed height to 15px");
    t.eq(finalSize.w, initialSize.w, 
                testName + "initial width " + initialSize.w + "px is maintained");
    testName = "Absolute without w&h (set width): ";
    finalSize = OpenLayers.Util.getRenderedDimensions(content, {w: 20}, optionAbsDiv00);
    t.eq(finalSize.w, 20, testName + "got the fixed width to 20px");
}
