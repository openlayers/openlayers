// total counters
Test.AnotherWay._openlayers_sum_total_detail_ok=0;
Test.AnotherWay._openlayers_sum_total_detail_fail=0;
Test.AnotherWay._startTime = null;

// method overwrites
//
// behaviour (timing)
Test.AnotherWay._old_run_all_onclick = Test.AnotherWay._run_all_onclick;
Test.AnotherWay._run_all_onclick = function(){
    Test.AnotherWay._startTime = (new Date()).getTime();
    Test.AnotherWay.reset_running_time();
    Test.AnotherWay._old_run_all_onclick.apply(this, arguments);
};

Test.AnotherWay._old_run_selected_onclick = Test.AnotherWay._run_selected_onclick;
Test.AnotherWay._run_selected_onclick = function(){
    Test.AnotherWay._startTime = (new Date()).getTime();
    Test.AnotherWay.reset_running_time();
    Test.AnotherWay._old_run_selected_onclick.apply(this, arguments);
};

Test.AnotherWay._old_run_one_onclick = Test.AnotherWay._run_one_onclick;
Test.AnotherWay._run_one_onclick = function(){
    Test.AnotherWay._startTime = (new Date()).getTime();
    Test.AnotherWay.reset_running_time();
    Test.AnotherWay._old_run_one_onclick.apply(this, arguments);
};

// test page loading
Test.AnotherWay.old_load_next_page = Test.AnotherWay._load_next_page;
Test.AnotherWay._load_next_page = function(){
    document.getElementById("test_iframe_el").style.display = "none";
    Test.AnotherWay.update_running_time();    
    Test.AnotherWay.old_load_next_page.apply(this, arguments);
};


Test.AnotherWay._add_test_page_url = function(test_url, convention){
    var table = document.getElementById("testtable");
    var record_select = document.getElementById("record_select");
    var index = Test.AnotherWay._g_test_page_urls.length;
    
    // trim spaces.
    if (test_url.match("^(\\s*)(.*\\S)(\\s*)$")) {
        test_url = RegExp.$2;
    }
    
    Test.AnotherWay._g_test_page_urls[index] = {
        url: test_url,
        convention: convention
    };
    var row = table.insertRow(-1);
    
    var cell;
    var cell_child;
    var link;
    
    cell = row.insertCell(-1);
    cell_child = document.createElement("input");
    cell_child.type = "checkbox";
    cell_child.id = "checkbox" + index;
    cell_child.checked = 'checked';
    cell_child.defaultChecked = 'checked';
    cell.appendChild(cell_child);
    
    cell = row.insertCell(-1);
    cell.setAttribute("width", "75%");
     
    // make the URL a clickable link that opens in a new window
    // start changes 
    link = document.createElement("a");
    link.href=test_url;
    link.target='_blank';
    link.title='Opens testfile in a new window.';
    link.appendChild(document.createTextNode(test_url));    
    cell.appendChild(link);
    // end changes
    
    cell = row.insertCell(-1);
    cell_child = document.createElement("input");
    cell_child.type = "button";
    cell_child.id = "test" + index;
    cell_child.value = " run ";
    cell_child.onclick = Test.AnotherWay._run_one_onclick;
    cell.appendChild(cell_child);
    
    cell = row.insertCell(-1);
    cell.setAttribute("width", "8em");
    cell_child = document.createElement("span");
    cell.appendChild(cell_child);
    
    var option = document.createElement("option");
    option.appendChild(document.createTextNode(test_url));
    record_select.appendChild(option);
};

Test.AnotherWay.old_set_iframe_location = Test.AnotherWay._set_iframe_location;
Test.AnotherWay._set_iframe_location = function(iframe, loc, outside_path_correction){
    var optionPos = loc.indexOf( "?" ),
        option;
    if (optionPos != -1) {
        option = loc.substring(optionPos+1);
        loc = loc.substring(0, optionPos);
    }
    if (option === "visible") {
        document.getElementById("test_iframe_el").style.display = "";
    }
    return Test.AnotherWay.old_set_iframe_location.call(this, iframe, loc, outside_path_correction);
};

// new methods
Test.AnotherWay.update_running_time = function() {
    var now = (new Date()).getTime();
    var floor = Math.floor;
    var elapsed = now - Test.AnotherWay._startTime;
    var zeroPad = function(num, length){
        var len = -1 * (length || 2);
        return ('00000' + num).slice(len);  
    };
    var ms = zeroPad(elapsed%1000, 3);
    var seconds=zeroPad(floor((elapsed/1000)%60));
    var minutes=zeroPad(floor((elapsed/60000)%60));
    
    document.getElementById('running-time').innerHTML = 'Elapsed time ' + minutes + ':' + seconds + ':' + ms +' (m:s:ms).';
};

Test.AnotherWay.reset_running_time = function(){
    document.getElementById('running-time').innerHTML = '';
};

// quickfilter
Test.AnotherWay.bindQuicksearchListener = function(){
    var input = document.getElementById('quickfilter');
    if (input.addEventListener) {
        input.addEventListener('keyup', Test.AnotherWay.quicksearch);
    } else if (input.attachEvent) {
        input.attachEvent('onkeyup', Test.AnotherWay.quicksearch);
    } else {
        // remove the input field
        input.parentNode.removeChild(input);
    }
};
Test.AnotherWay.quicksearchThrottleTimeOut = null;
Test.AnotherWay.quicksearch = function(){
    if (Test.AnotherWay.quicksearchThrottleTimeOut) {
        window.clearTimeout(Test.AnotherWay.quicksearchThrottleTimeOut);
    }
    Test.AnotherWay.quicksearchThrottleTimeOut = window.setTimeout(function(){
        var input = document.getElementById('quickfilter');
        Test.AnotherWay.filterTestList(input.value);
    }, 300);
};

Test.AnotherWay.filterTestList = function(str){
    Test.AnotherWay.unfilterTestList();
    var re = new RegExp(str, 'i');
    var candidates  = document.querySelectorAll('#testtable tr a');
    for (var idx = 0, len = candidates.length; idx<len; idx++) {
        var tr = candidates[idx].parentNode.parentNode;
        var html = candidates[idx].innerHTML;
        if (re.test(html)) {
            tr.className = 'isShown';
        } else {
            tr.className = 'isHidden';
        }
    }
    
};

Test.AnotherWay.unfilterTestList = function() {
    if ( document.querySelectorAll ) {
        var hidden = document.querySelectorAll('.isHidden');
        for (var idx = 0, len = hidden.length; idx < len; idx++) {
            hidden[idx].className = 'isShown';
        }
    }
};

// bind our quicksearch init method to body onload.
(function(win) {
    if (win.addEventListener) {
        win.addEventListener('load', Test.AnotherWay.bindQuicksearchListener);
    } else if (win.attachEvent) {
        win.attachEvent('onload', Test.AnotherWay.bindQuicksearchListener);
    } else {
        win.onload = function(){
            Test.AnotherWay.bindQuicksearchListener();
        };
    }
})(window);
