// This file is part of Natural Docs, which is Copyright (C) 2003-2005 Greg Valure
// Natural Docs is licensed under the GPL

//
//  Browser Styles
// ____________________________________________________________________________

var agt=navigator.userAgent.toLowerCase();
var browserType;
var browserVer;

if (agt.indexOf("opera") != -1)
    {
    browserType = "Opera";

    if (agt.indexOf("opera 5") != -1 || agt.indexOf("opera/5") != -1)
        {  browserVer = "Opera5";  }
    else if (agt.indexOf("opera 6") != -1 || agt.indexOf("opera/6") != -1)
        {  browserVer = "Opera6";  }
    else if (agt.indexOf("opera 7") != -1 || agt.indexOf("opera/7") != -1)
        {  browserVer = "Opera7";  }
    }

else if (agt.indexOf("khtml") != -1 || agt.indexOf("konq") != -1 || agt.indexOf("safari") != -1)
    {
    browserType = "KHTML";
    }

else if (agt.indexOf("msie") != -1)
    {
    browserType = "IE";

    if (agt.indexOf("msie 4") != -1)
        {  browserVer = "IE4";  }
    else if (agt.indexOf("msie 5") != -1)
        {  browserVer = "IE5";  }
    else if (agt.indexOf("msie 6") != -1)
        {  browserVer = "IE6";  }
    }

else if (agt.indexOf("gecko") != -1)
    {
    browserType = "Gecko";
    }

// Opera already taken care of.
else if (agt.indexOf("mozilla") != -1 && agt.indexOf("compatible") == -1 && agt.indexOf("spoofer") == -1 &&
           agt.indexOf("webtv") == -1 && agt.indexOf("hotjava") == -1)
    {
    browserType = "Netscape";

    if (agt.indexOf("mozilla/4") != -1)
        {  browserVer = "Netscape4";  }
    }


//
//  Menu
// ____________________________________________________________________________


function ToggleMenu(id)
    {
    if (!window.document.getElementById)
        {  return;  };

    var display = window.document.getElementById(id).style.display;

    if (display == "none")
        {  display = "block";  }
    else
        {  display = "none";  }

    window.document.getElementById(id).style.display = display;
    }


//
//  Tooltips
// ____________________________________________________________________________


var tooltipTimer = 0;

function ShowTip(event, tooltipID, linkID)
    {
    if (tooltipTimer)
        {  clearTimeout(tooltipTimer);  };

    var docX = event.clientX + window.pageXOffset;
    var docY = event.clientY + window.pageYOffset;

    var showCommand = "ReallyShowTip('" + tooltipID + "', '" + linkID + "', " + docX + ", " + docY + ")";

    // KHTML cant handle showing on a timer right now.

    if (browserType != "KHTML")
        {  tooltipTimer = setTimeout(showCommand, 1000);  }
    else
        {  eval(showCommand);  };
    }

function ReallyShowTip(tooltipID, linkID, docX, docY)
    {
    tooltipTimer = 0;

    var tooltip;
    var link;

    if (document.getElementById)
        {
        tooltip = document.getElementById(tooltipID);
        link = document.getElementById(linkID);
        }
    else if (document.all)
        {
        tooltip = eval("document.all['" + tooltipID + "']");
        link = eval("document.all['" + linkID + "']");
        }

    if (tooltip)
        {
        var left = 0;
        var top = 0;

        // Not everything supports offsetTop/Left/Width, and some, like Konqueror and Opera 5, think they do but do it badly.

        if (link && link.offsetWidth != null && browserType != "KHTML" && browserVer != "Opera5")
            {
            var item = link;
            while (item != document.body)
                {
                left += item.offsetLeft;
                item = item.offsetParent;
                }

            item = link;
            while (item != document.body)
                {
                top += item.offsetTop;
                item = item.offsetParent;
                }
            top += link.offsetHeight;
            }

        // The fallback method is to use the mouse X and Y relative to the document.  We use a separate if and test if its a number
        // in case some browser snuck through the above if statement but didn't support everything.

        if (!isFinite(top) || top == 0)
            {
            left = docX;
            top = docY;
            }

        // Some spacing to get it out from under the cursor.

        top += 10;

        // Make sure the tooltip doesnt get smushed by being too close to the edge, or in some browsers, go off the edge of the
        // page.  We do it here because Konqueror does get offsetWidth right even if it doesnt get the positioning right.

        if (tooltip.offsetWidth != null)
            {
            var width = tooltip.offsetWidth;
            var docWidth = document.body.clientWidth;

            if (left + width > docWidth)
                {  left = docWidth - width - 1;  }
            }

        // Opera 5 chokes on the px extension, so it can use the Microsoft one instead.

        if (tooltip.style.left != null && browserVer != "Opera5")
            {
            tooltip.style.left = left + "px";
            tooltip.style.top = top + "px";
            }
        else if (tooltip.style.pixelLeft != null)
            {
            tooltip.style.pixelLeft = left;
            tooltip.style.pixelTop = top;
            }

        tooltip.style.visibility = "visible";
        }
    }

function HideTip(tooltipID)
    {
    if (tooltipTimer)
        {
        clearTimeout(tooltipTimer);
        tooltipTimer = 0;
        }

    var tooltip;

    if (document.getElementById)
        {  tooltip = document.getElementById(tooltipID); }
    else if (document.all)
        {  tooltip = eval("document.all['" + tooltipID + "']");  }

    if (tooltip)
        {  tooltip.style.visibility = "hidden";  }
    }


//
//  Event Handlers
// ____________________________________________________________________________


function NDOnLoad()
    {
    if (browserType == "IE")
        {
        var scrollboxes = document.getElementsByTagName('blockquote');

        if (scrollboxes.item(0))
            {
            var width = scrollboxes.item(0).parentNode.offsetWidth - scrollboxes.item(0).offsetLeft;

            var i = 0;
            var item;

            while (item = scrollboxes.item(i))
                {
                item.style.width = width;
                i++;
                };

            window.onresize=NDOnResize;
            };
        };
    }


var resizeTimer = 0;

function NDOnResize()
    {
    if (browserType == "IE")
        {
        if (resizeTimer != 0)
            {  clearTimeout(resizeTimer);  };

        resizeTimer = setTimeout(NDDoResize, 500);
        };
    };

function NDDoResize()
    {
    var scrollboxes = document.getElementsByTagName('blockquote');

    var i;
    var item;

    i = 0;
    while (item = scrollboxes.item(i))
        {
        item.style.width = "100px";
        i++;
        };

    var width = scrollboxes.item(0).parentNode.offsetWidth - scrollboxes.item(0).offsetLeft;

    i = 0;
    while (item = scrollboxes.item(i))
        {
        item.style.width = width;
        i++;
        };

    clearTimeout(resizeTimer);
    resizeTimer = 0;
    }
