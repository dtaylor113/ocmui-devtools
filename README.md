## Setup

### Chrome Browser

1. Enter URL: chrome://extensions/.  Click on "Load Unpacked"

2. Select the plugin directory: **/ocmui-devtools/sol-sc-explorer**

* You might want to keep this open in a seperate tab as you can disable and remove the plugin from _chrome://extensions/_.

### FireFox Browser

1. Enter URL: [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).  Click on "Load Temporary Add-on..."
2. Select the manifest file in the plugin directory: **/uhc-portal/dev-tools/sol-sc-explorer**

You should see:

* You might want to keep this open in a seperate tab as you can disable and remove the plugin from _about:debugging#/runtime/this-firefox_.

## Usage
- Once the sol-sc-explorer plugin is loaded you can navigate to any webpage under `https://prod.foo.redhat.com:1337/openshift/` (that OCM UI builds) and hover over any html element in the browser to instantly see it's related React source code.
- Press L key to toogle focus selection on/off. This allows you to lock selection and move mouse to bottom source code panel without triggering other source code lookups.
- You can resize the bottom panel by dragging it's top border.
