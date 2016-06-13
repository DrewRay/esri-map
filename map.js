(function() {
  "use strict";
  
  angular.module("IE.crfMap", [
    // "esri.map",
    // "ui.bootstrap",
    // "rzModule"
  ]);
  /**
   * Create directive called "crfMap" that is applied to module called "IE.index"
   */
  angular.module("IE.crfMap").directive("crfMap", crfMap)
  .controller("crfMapCtrl", crfMapCtrl)
  .service("crfMapService", crfMapService);

  crfMap.$inject = ["$compile", "$document", "$rootScope", "crfMapService"];
  /* @ngInject */
  function crfMap($compile, $document, $rootScope, crfMapService) {
    return {
      restrict: "E",
      scope: {
        member: "=", // two way string binding
        callback: "&" // callback function
      },
      template: 
        "<div id='container'>" +
          "<div id='map'></div>" +
          // "<img id='travel' src='img/radius_pin_small.png' ng-click='travelRadius(member)'>" +
          // "<div id='travel' ng-class='{\"travel-minimized\": !travelRadiusVisible}' tooltip-placement='bottom' uib-tooltip='Travel Radius' tooltip-enable='!travelRadiusVisible'>" +
          //   "<div ng-class='{\"spinner\": travelSlider.options.disabled}'></div>" +
          //   "<div id='travel-inner'>" +
          //     "<img ng-if='travelType == \"walk\"' ng-class='{\"travel-type-icon-walk\":!travelSlider.options.disabled, \"travel-type-icon-walk-disabled\":travelSlider.options.disabled}' src='/img/walk_on.png'  alt='placeholder'>" +
          //     "<img ng-if='travelType != \"walk\"' ng-class='{\"travel-type-icon-walk\":!travelSlider.options.disabled, \"travel-type-icon-walk-disabled\":travelSlider.options.disabled}' src='/img/walk_off.png' alt='placeholder' ng-click='loadTravelRadius(\"walk\")'>" +
          //     "<img ng-if='travelType == \"drive\"' ng-class='{\"travel-type-icon\":!travelSlider.options.disabled, \"travel-type-icon-disabled\":travelSlider.options.disabled}' src='/img/drive_on.png' alt='placeholder'>" +
          //     "<img ng-if='travelType != \"drive\"' ng-class='{\"travel-type-icon\":!travelSlider.options.disabled, \"travel-type-icon-disabled\":travelSlider.options.disabled}' src='/img/drive_off.png' alt='placeholder' ng-click='loadTravelRadius(\"drive\")'>" +
          //     "<rzslider rz-slider-model='travelSlider.value' rz-slider-options='travelSlider.options'></rzslider>" +
          //     "<img ng-class='{\"travel-toggle-icon\":!travelSlider.options.disabled,\"travel-toggle-icon-disabled\":travelSlider.options.disabled}' src='/img/radius_pin.png' alt='placeholder' ng-click='toggleTravelRadiusVisibility()'></img>" +
          //   "</div>" +
          // "</div>" +
          "<div id='listview' ng-if='show'>" +
            "<div class='listview-header'>" +
              "<span class='listview-name'>{{attrs.Name}}</span><span ng-click='closeDetails(false)' class='cux-icon-close'></span>" +
            "</div><br/>" +
            "Category: {{attrs.ServiceCategory}}<br/>" +
            "Service Type: {{attrs.ServiceType}}<br/><br/>" +
            "Address: {{attrs.AddressSingle}}<br/>" +
            "Phone: {{attrs.Phone || None}}<br/>" +
            "Email: {{attrs.Email || None}}<br/>" +
            "Hours: {{attrs.Hours || None}}<br/>" +
            "Website: {{attrs.Website || None}}<br/>" +
            "Tags: {{attrs.SearchTags}}<br/><br/>" +
            "<button ng-click='provider(attrs)'>Select Provider</button>" +
          "</div>" +
          // "<h6>Selecting for: {{member.needs[0].firstName}} {{member.needs[0].lastName}}</h6>" +
        "</div>",
      controller: "crfMapCtrl",
      controllerAs: "c", // alias for ctrl() used in the template html
      link: postLink
    };
    
    function postLink($scope, ele, attrs, ctrl) {
      $scope.$watch("member", function(newVal, oldVal) {
        if ($scope.member) {
          $scope.show = false;
          crfMapService.getProviders($scope.member.needs[0].details).then(function(response) {
            var providerData = response.features;          
            require(["esri/graphic", "esri/symbols/PictureMarkerSymbol", "esri/geometry/Point"],
            function(Graphic, PictureMarkerSymbol, Point) {
              $scope.map.graphics.clear();
              var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
              providerData.forEach(function(provider) {
                var graphic = new Graphic(new Point(provider.geometry.x, provider.geometry.y), pms);
                graphic.attributes = provider;
                $scope.map.graphics.add(graphic);
              });
            });
          });
          $scope.centerMap($scope.member.needs[0].addresses[0]);
        }
      });
        
      require(["esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", 
      "esri/geometry/Point", "esri/graphic", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", 
      "esri/tasks/ServiceAreaTask", "esri/symbols/SimpleFillSymbol", "esri/symbols/PictureMarkerSymbol", "esri/layers/FeatureLayer"], 
      function(Map, SimpleMarkerSymbol, SimpleLineSymbol, Color, Point, Graphic, FeatureSet, ServiceAreaParameters, ServiceAreaTask, SimpleFillSymbol, PictureMarkerSymbol, FeatureLayer) {
        $scope.map = new Map("map", crfMapService.attributes.options);
        // var travelRadiusLayer = new FeatureLayer("https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0", {
        //   id: "travelRadius"
        // });
        // $scope.map.addLayer(travelRadiusLayer);
        $scope.map.on("click", function(evt) {
          if (!evt.graphic) {
            return;
          }
          
          var lastPoint = $scope.map.graphics.graphics[$scope.map.graphics.graphics.length - 1];
          var clickedPoint = evt.graphic;
          if (lastPoint.symbol.url == "img/pin_selected-blue.png") {
            //replace old graphic with original image
            var oldPms = new PictureMarkerSymbol("img/pin_default.png", 18, 25);
            var oldGraphic = new Graphic(new Point(lastPoint.geometry.x, lastPoint.geometry.y), oldPms);
            oldGraphic.attributes = lastPoint.attributes.attributes;
            $scope.map.graphics.add(oldGraphic);
            
            // remove last object in graphis array
            $scope.map.graphics.remove(lastPoint);
          }
          
          //add new graphic in its place
          var clickedPms = new PictureMarkerSymbol("img/pin_selected-blue.png", 18, 25);
          var clickedGraphic = new Graphic(new Point(clickedPoint.geometry.x, clickedPoint.geometry.y), clickedPms);
          clickedGraphic.attributes = evt.graphic;
          $scope.map.graphics.add(clickedGraphic);
          
          showDetails([evt.graphic], evt.graphic.attributes, true);
        });
        
        function showDetails(features, attrs, show) {
          var scope = $rootScope.$new(true);
          scope.selectProvider = selectProvider;
          scope.showDetails = showDetails;
          
          $scope.attrs = attrs.attributes;
          $scope.show = show;
          
          if(!$rootScope.$$phase) {
            $rootScope.$digest();
          }
          
          function selectProvider(provider) {
            $scope.provider(provider);
          }
        }
      });
    }
  }
  
  crfMapCtrl.$inject = ["$scope", "$timeout", "crfMapService"];
  /* @ngInject */
  function crfMapCtrl($scope, $timeout, crfMapService) {
    // var self = this;
    
    $scope.centerMap = centerMap;
    $scope.closeDetails = closeDetails;
    $scope.map = crfMapService.attributes;
    $scope.provider = provider;
    $scope.travelRadius = travelRadius;
    
    function centerMap(address) {
      
      var memberPoint = crfMapService.geocode(address).then(success, fail);
      
      function center(pt) {
        $timeout(function() {
          $scope.map.centerAndZoom(pt, 11);
        });
      }
      
      function success(res) {
        $scope.member.point = res.point;
        center(res.point);
      }
      
      function fail(res) {
      }
    }
    
    function closeDetails(show) {
      $scope.show = show;
    }   
    
    function provider(provider) {
      var requestedData = {
        transactionId: $scope.member.transactionId,
        needs: [
          {
            clientId: $scope.member.needs[0].clientId,
            // name: $scope.member.needs[0].name,
            firstName: $scope.member.needs[0].firstName,
            lastName: $scope.member.needs[0].lastName,
            addresses: $scope.member.needs[0].addresses,
            details: [
              {
                detailId: $scope.member.needs[0].details[0].detailId,
                program: $scope.member.needs[0].details[0].filter, //todo: filter or program?
                provider: {
                  id: provider.OBJECTID,
                  name: provider.Name,
                  address: provider.AddressSingle,
                  ADR_ID: "ADR_ID_TEST",
                  ADR_LN_1_TXT: provider.Address,
                  ADR_LN_2_TXT: "ADR_LN_2_TXT_TEST",
                  CTY_NM: provider.City,
                  ST: provider.State,
                  ZIP: provider.Zip_Code,
                  ZIP_EXT: "ZIP_EXT",
                  FGN_PRVC_NM: "FGN_PRVC_NM",
                  FGN_PST_CD: "FGN_PST_CD",
                  CNTY: "CNTRY",
                  ADR_TYP_CD: "ADR_TYP_CD",
                  IN_JAIL_OR_INST_BY_THS_ST: "IN_JAIL_OR_INST_BY_THS_ST",
                  ADR_SPEC_CD: "ADR_SPEC_CD",
                  JAIL_OR_INST_ADR_FLG: "JAIL_OR_INST_ADR_FLG",
                  phone: provider.Phone,
                  website: provider.Website,
                  geometry: provider.geometry
                }
              }
            ]
          }
        ]
      };      
      $scope.callback()(requestedData);        
    }
    
    function travelRadius(member) {
      centerMap(member.needs[0].addresses[0]);
      crfMapService.travelRadius(member, $scope.map);
    }
  }
  
  crfMapService.$inject = ["$compile", "$document", "$http", "$q", "$rootScope"];
  /* @ngInject */
  function crfMapService($compile, $document, $http, $q, $rootScope) {
    var self = this;
    
    self.attributes = {
      id: "map",
      options: {
        basemap: "topo",
        center: [-93.45536540319006, 44.85786213722895],
        zoom: 11
      },
      resourcesLayerUrl: "https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0",
      resourcesOptions: {
        id: "resources",
        outFields: ["*"]
      },      
      travelRadiusOptions: {
        id: "travelRadius",
        address: "13625 Technology Dr, Eden Prairie, MN 55346",
        lastTravelType: undefined,
        lastTravelMinutes: undefined,
        visible: false
      }      
    };
    self.geocode = geocode;
    self.getMap = getMap;
    self.getProviders = getProviders;
    self.loadTravelRadius = loadTravelRadius;
    self.travelRadius = travelRadius;
    
    /**
     * Geocode address.
     */
    function geocode(address, extentMulti) {
      var deferred = $q.defer();
      
      if (address instanceof Object) {
        address = address.ADR_LN_1_TXT + " " + address.ADR_LN_2_TXT + ", " + address.CTY_NM + ", " + address.ST + " " + address.ZIP;
      }
      
      if (typeof address !== "string") {
        deferred.reject();
        return;
      }
      
      require(["esri/tasks/locator"], function(Locator) {
        var locator = new Locator("https://healthstate.optum.com/arcgis/rest/services/Street_Addresses/GeocodeServer");
        var locatorParams = {};
        
        if (extentMulti && map.extent) {
          locatorParams.searchExtent = map.extent.expand(extentMulti);
        }
        locatorParams.address = {
          "Single Line Input": address
        };
        
        // geocode address to location X/Y
        locator.addressToLocations(locatorParams, function(res) {
          if (res.length === 0) {
            deferred.reject();
            return;
          }
          
          deferred.resolve({
            point: res[0].location,
            address: address
          });
        });
      });
      
      return deferred.promise;
    }
    
    /**
     * Return the deferred map.
     */
    function getMap() {
      console.log("self.attributes.id", self.attributes.id);
      return esriRegistry.get(self.attributes.id);
    }    
    
    function getProviders(details) {
      var objectIds;
      var serviceType = [];
      var where;
      
      if (details[0].allowUpdate == true) {
        objectIds = "";
      } else {
        objectIds = details[0].providerId;
      }
      
      details.forEach(function(detail) {
        serviceType.push(detail.filter);
      });
      
      var str = "ServiceType IN ('" + serviceType.join("', '") + "')";
      where = str;

      var qs = {
        where: where,
        objectIds: objectIds,
        outFields: "*",
        returnGeometry: true,
        returnIdsOnly: false,
        returnCountOnly: false,
        returnZ: false,
        returnM: false,
        returnDistinctValues: false,
        returnTrueCurves: false,
        resultRecordCount: 100,
        f: "pjson"
      };

      return $http.get("https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0/query", { params: qs }).then(success, fail);
      
      function success(response) {
        return response.data;
      }
      
      function fail(response) {
        return response.data;
      }
    }
    
    /**
     * Populate the travel radius graphics layer.
     */
    function loadTravelRadius(travelType, minutes, address) {
      console.log("loadTravelRadius", travelType, minutes, address);
      var deferred = $q.defer();
      
      if (!address || address === "") {
        address = self.attributes.travelRadiusOptions.address;
      }
      
      if (!minutes) {
        minutes = self.attributes.travelRadiusOptions.lastTravelMinutes;
      }
      
      if (minutes === 0) {
        deferred.resolve();
        return;
      }
      
      if (travelType === "walk") {
        minutes = minutes / 7;
      }
      
      if (!travelType) {
        travelType = self.attributes.travelRadiusOptions.lastTravelType;
      }
      
      self.getMap().then(function(map) {
        esriLoader.require(["esri/Color", "esri/tasks/FeatureSet", "esri/graphic", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask"],
        function(Color, FeatureSet, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, ServiceAreaParameters, ServiceAreaTask) {
          var travelRadiusLayer = map.getLayer(self.attributes.travelRadiusOptions.id);
          
          if (!travelRadiusLayer) {
            deferred.resolve();
            return;
          }
          
          self.geocode(address).then(geocodeSuccess, geocodeFail);
          
          function geocodeSuccess(res) {
            self.attributes.travelRadiusOptions.lastTravelType = travelType;
            self.attributes.travelRadiusOptions.lastTravelMinutes = minutes;
            self.attributes.travelRadiusOptions.address = res.address;
            
            var pointSymbol = new SimpleMarkerSymbol("diamond", 20,
              new SimpleLineSymbol("solid", new Color([88, 116, 152]), 2),
              new Color([88, 116, 152, 0.45])
            );
            var location = new Graphic(res.point, pointSymbol);

            var features = [];
            features.push(location);

            var facilities = new FeatureSet();
            facilities.features = features;
            
            var serviceAreaParams = new ServiceAreaParameters();
            serviceAreaParams.outSpatialReference = map.spatialReference;
            serviceAreaParams.defaultBreaks = [minutes];
            serviceAreaParams.returnFacilities = false;
            serviceAreaParams.facilities = facilities;
            
            var serviceAreaTask = new ServiceAreaTask("https://healthstate.optum.com/arcgis/rest/services/Routing/ServiceAreas/NAServer/GenerateServiceAreas");
            
            serviceAreaTask.solve(serviceAreaParams, function(solveResult) {
              var polygonSymbol = new SimpleFillSymbol(
                "solid"
                , new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2)
                , new Color([232, 104, 80, 0.25])
              );
              solveResult.serviceAreaPolygons.forEach(function(serviceArea) {
                serviceArea.setSymbol(polygonSymbol);
                travelRadiusLayer.clear();
                travelRadiusLayer.add(serviceArea);
                travelRadiusLayer.add(location);
              });
              
              map.centerAt(res.point);
              deferred.resolve();
            });
          }
          
          function geocodeFail() {
            deferred.reject();
            return;
          }
        });
      });
      
      return deferred.promise;
    }    
    
    function travelRadius(member, map) {
      require(["esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", 
      "esri/geometry/Point", "esri/graphic", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask", "esri/symbols/SimpleFillSymbol", "esri/layers/FeatureLayer"],
      function(SimpleMarkerSymbol, SimpleLineSymbol, Color, Point, Graphic, FeatureSet, ServiceAreaParameters, ServiceAreaTask, SimpleFillSymbol, FeatureLayer) {
        var pointSymbol = new SimpleMarkerSymbol("diamond", 20,
          new SimpleLineSymbol("solid", new Color([88, 116, 152]), 2),
          new Color([88, 116, 152, 0.45])
        );
        
        var location = new Graphic(member.point, pointSymbol);
        map.graphics.add(location);
        
        var features = [];
        features.push(location);
        
        var facilities = new FeatureSet();
        facilities.features = features;
        
        var serviceAreaParams = new ServiceAreaParameters();
        serviceAreaParams.outSpatialReference = map.spatialReference;          
        serviceAreaParams.defaultBreaks= [10];
        serviceAreaParams.returnFacilities = false;
        serviceAreaParams.facilities = facilities;

        var serviceAreaTask = new ServiceAreaTask("https://healthstate.optum.com/arcgis/rest/services/Routing/ServiceAreas/NAServer/GenerateServiceAreas");

        //solve 
        serviceAreaTask.solve(serviceAreaParams, function(solveResult){
          var polygonSymbol = new SimpleFillSymbol(
            "solid",  
            new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2),
            new Color([232, 104, 80, 0.25])
          );
          solveResult.serviceAreaPolygons.forEach(function(serviceArea){
            serviceArea.setSymbol(polygonSymbol);
            console.log("map", map);
            map.graphics.add(serviceArea);
          });
          
        }, function(err){
        });
      });
    }
  }  
})();