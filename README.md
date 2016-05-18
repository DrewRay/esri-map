CRF Map Directive POC
=====================

This project is built using:

* AngularJS
* jquery
* ArcGIS

### SETUP

This project is dependent on AngularJS, jquery, and ArcGIS. Add the following to your header:

```
<link rel="stylesheet" href="https://js.arcgis.com/3.16/esri/css/esri.css">
<script src="https://js.arcgis.com/3.16/"></script>
<script src="https://rawgit.com/savtwo/esri-map/master/map.directive.js"></script>
```

### Including in HTML

`<crf-map member="" callback=""></crf-map>`

### Directive Properties

#### member
> **Type:** Object

#### callback
> Callback function that returns the member and provider data object from the directive