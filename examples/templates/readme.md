This folder contains example templates. These templates are used to build the examples in the `examples/` folder. The resulting examples are written to the `build/examples` folder.

The examples are transpiled to es5. If the name of an example starts with `es2015-`, transpilation will be bypassed. This allows for showing es2015+ features in examples.

At the bottom of each example generated in the `build/examples` folder, a modified version of its source code is shown. That modified version can be run standalone and is usually used as starting point for users to extend examples into their own application.
