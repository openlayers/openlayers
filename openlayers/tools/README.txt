This directory contains tools used in the packaging or deployment of OpenLayers.

Javascript minimizing tools:

 * jsmin.c, jsmin.py:
   jsmin.py is a direct translation of the jsmin.c code into Python. jsmin.py
   will therefore run anyplace Python runs... but at significantly slower speed.
 
 * shrinksafe.py
   shrinksafe.py calls out to a third party javascript shrinking service. This 
   creates file sizes about 4% smaller (as of commit 501) of the OpenLayers 
   code. However, this also has the side effect of making you dependant on the 
   web service -- and since that service sometimes goes dead, it's risky to 
   depend on it.
