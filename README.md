CRF Map Directive POC
=====================

This project is built using:

* AngularJS
* ArcGIS

First time setup
----------------

This project is dependent on AngularJS and ArcGIS. Add the following to your index:

```
<link rel="stylesheet"" href="https://js.arcgis.com/3.16/esri/css/esri.css">
<script src="https://js.arcgis.com/3.16/"></script>
<script src="map.directive.js"></script>
```

### SETUP

Start by cloning the repository to your local machine. If you don't have a personal branch, run:

```
git checkout [name of branch]
git checkout -b [name of your branch]
```

Then run bower to get AngularJS

```bower install```

### Including in HTML

`<crf-map member="" cb=""></crf-map>`

### Directive Properties

#### member
> **Type:** Object

#### cb
> Callback function that returns the member and provider data object from the directive