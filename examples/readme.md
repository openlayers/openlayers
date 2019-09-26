# Code examples

The `.html` files in this folder are built by applying the templates in the `templates` folder. Examples have [YAML front-matter](http://www.metalsmith.io) headers with the following properties:

* layout: The template from the `templates` directory to use for this example
* title: The title of the example
* shortdesc: A short description for the example index
* docs: Documentation of the example. Can be markdown.
* tags: Tags for the example index
* resources: Additional js or css resources required by the example. This is a YAML list of URLs.
* experimental: if true, a warning will appear on the example page mentioning the fact that it uses features not part of the API.
