(function() {
  "use strict";
  
  /**
   * Create directive called "crfMap" that is applied to module called "IE.crfMap"
   */
  angular.module("IE.crfMap", [])
  .directive("crfMap", crfMap)
  .controller("crfMapCtrl", crfMapCtrl)
  .service("crfMapService", crfMapService);

  crfMap.$inject = ["$compile", "$document", "$rootScope", "crfMapService"];
  /* @ngInject */
  function crfMap($compile, $document, $rootScope, crfMapService) {
    return {
      restrict: "E",
      scope: {
        member: "=",
        crfProvider: "=",
        callback: "&"
      },
      template: 
        "<div id='container'>" +
          "<div id='map'></div>" +
          "<div id='travel' ng-class='travelOptions.selected ? \"travel-open\" : \"travel-closed\"' title='20 mins'>" +
            "<img ng-click='travelOptions.selected = !travelOptions.selected' ng-if='travelOptions.selected == false' src='https://rawgit.com/savtwo/esri-map/master/radius_pin_small.png' width='40' height='40'>" +
            "<img id='travel-icons' ng-click='loadTravelRadius(map, member, 20, \"drive\")' ng-if='travelOptions.selected == true' src='https://rawgit.com/savtwo/esri-map/master/drive_off.png'>" +
            "<img id='travel-icons' ng-click='loadTravelRadius(map, member, 20, \"walk\")' ng-if='travelOptions.selected == true' src='https://rawgit.com/savtwo/esri-map/master/walk_off.png' height='32'>" +
            "<img ng-click='travelOptions.selected = !travelOptions.selected; clearTravelRadius(map)' ng-if='travelOptions.selected == true' src='https://rawgit.com/savtwo/esri-map/master/radius_pin_small.png' width='40' height='40'>" +
          "</div>" +
          "<div id='listview' ng-if='show'>" +
            "<div class='listview-header'>" +
              "<span class='listview-name'>{{attrs.Name}}</span><span ng-click='closeDetails(false)' class='close-list'>X</span>" +
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
        "</div>",
      controller: "crfMapCtrl",
      controllerAs: "c",
      link: postLink
    };
    
    function postLink($scope, ele, attrs, ctrl) {
      $scope.$watchGroup(["crfProvider", "member"], function(newVal, oldVal) {
        var newMember = $scope.member;
        var newProvider = $scope.crfProvider;
        
        if (newMember && !newProvider) {
          var defExp = crfMapService.getProviders(newMember.needs[0].details);
          $scope.centerMap(newMember.needs[0].addresses[0]);
          $scope.show = false;

          createFeatureLayer(defExp);
        }
        
        if (newProvider) {
          var address = newProvider.ADR_LN_1_TXT + ", " + newProvider.CTY_NM + ", " + newProvider.ST + " " + newProvider.ZIP;
          var defExp = crfMapService.getProviders(newMember.needs[0].details);
          $scope.centerMap(address);
          $scope.show = true;

          crfMapService.getProviderById(newProvider).then(function(response) {
            var layer = $scope.map.getLayer("resources");
            $scope.attrs = response.features[0].attributes;
            newProvider.geometry = response.features[0].geometry;

            require(["esri/tasks/query"], function(Query) {
              var query = new Query();
              query.objectIds = [newProvider.id];
              query.outFields = ["*"];

              layer.queryFeatures(query, function(results) {
                var res = results.features[0];

                if (!res) {
                  return;
                }

                if (res.geometry.x == "NaN" || res.geometry.y == "NaN") {
                  return;
                }

                showBack($scope.map, res);
              });
            });
          });
          
          createFeatureLayer(defExp);
        }
        
        if (newProvider && newMember.provider == null) {
          $scope.centerMap(newMember.needs[0].addresses[0]);
          $scope.show = false;
        }
      });

      function createFeatureLayer(defExp) {
        require(["esri/graphic", "esri/symbols/PictureMarkerSymbol", "esri/geometry/Point", "esri/tasks/FeatureSet", 
        "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer"], 
        function(Graphic, PictureMarkerSymbol, Point, FeatureSet, FeatureLayer, SimpleFillSymbol, Color, SimpleRenderer) {
          if ($scope.map.graphics) {
            $scope.map.graphics.clear();
            $scope.map.getLayer("travelRadius").clear();
            $scope.resourcesLayer.setDefinitionExpression(defExp);
          }
        });
      }
      
      require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/graphic", "esri/geometry/Point", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask", "esri/layers/GraphicsLayer"], 
      function getMap(Map, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SimpleRenderer, PictureMarkerSymbol, InfoTemplate, Graphic, Point, FeatureSet, ServiceAreaParameters, ServiceAreaTask, GraphicsLayer) {
        var template = new InfoTemplate();
        $scope.map = new Map("map", crfMapService.attributes.options);
        
        // resourcesLayer properties
        $scope.resourcesLayer = new FeatureLayer("https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0", {
          id: "resources",
          infoTemplate: template,
          outFields: ["*"]
        });

        var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
        var renderer = new SimpleRenderer(pms);
        $scope.resourcesLayer.setSelectionSymbol(pms);
        $scope.resourcesLayer.setRenderer(renderer);

        // travelRadiusLayer properties
        var travelRadiusLayer = new GraphicsLayer({
          id: "travelRadius",
          address: "13625 Technology Dr, Eden Prairie, MN 55346"
        });

        // adding layers to map
        $scope.map.addLayer($scope.resourcesLayer);
        $scope.map.addLayer(travelRadiusLayer, 0);
        
        $scope.map.on("click", function(evt) {
          if (!evt.graphic) {
            return;
          }

          showDetails(evt.graphic, true);
        });
      });

      function showBack(map, feature) {
        var $scope = $rootScope.$new(true);
        
        var el = $compile()($scope);
        map.infoWindow.setFeatures([feature]);
        map.infoWindow.show(feature.geometry);

        var contentPane = $document.find(".esriPopup .contentPane");
        var contentElement = angular.element(contentPane);

        contentElement.html("");
        contentElement.append(el);
      }      

      function showDetails(feature, show) {
        var scope = $rootScope.$new(true);
        scope.selectProvider = selectProvider;
        scope.showDetails = showDetails;
        
        $scope.attrs = feature.attributes;
        $scope.show = show;
        
        if(!$rootScope.$$phase) {
          $rootScope.$digest();
        }
        
        function selectProvider(provider) {
          $scope.provider(provider);
        }
      }
    }
  }
  
  crfMapCtrl.$inject = ["$scope", "$timeout", "crfMapService"];
  /* @ngInject */
  function crfMapCtrl($scope, $timeout, crfMapService) {
    $scope.centerMap = centerMap;
    $scope.clearTravelRadius = crfMapService.clearTravelRadius;
    $scope.closeDetails = closeDetails;
    $scope.loadTravelRadius = crfMapService.loadTravelRadius;
    $scope.map = crfMapService.attributes;
    $scope.mapData = crfMapService.mapData;
    $scope.provider = provider;
    $scope.travelOptions = {
      selected: false
    };
    
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
            firstName: $scope.member.needs[0].firstName,
            lastName: $scope.member.needs[0].lastName,
            addresses: $scope.member.needs[0].addresses,
            details: [
              {
                detailId: $scope.member.needs[0].details[0].detailId,
                program: $scope.member.needs[0].details[0].filter,
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
    self.clearTravelRadius = clearTravelRadius;
    self.geocode = geocode;
    self.getMap = getMap;
    self.getProviderById = getProviderById;
    self.getProviders = getProviders;
    self.loadTravelRadius = loadTravelRadius;
    self.mapLoaded = mapLoaded;

    function clearTravelRadius(map) {
        var travelRadiusLayer = map.getLayer(self.attributes.travelRadiusOptions.id);
        travelRadiusLayer.clear();
    }
    
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
        var locator = new Locator("https://healthstate.optum.com/arcgis/rest/services/USA/GeocodeServer");
        var locatorParams = {};
        
        if (extentMulti && map.extent) {
          locatorParams.searchExtent = map.extent.expand(extentMulti);
        }
        locatorParams.address = {
          "SingleLine": address
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
      return esriRegistry.get(self.attributes.id);
    }
    
    function getProviderById(provider) {
      var qs = {
        where: "1=1",
        objectIds: provider.id,
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
    
    function getProviders(details) {
      var serviceType = [];
      var qs = {};
      var defExp;
      
      if (details[0].allowUpdate == false && details[0].providerId) {
        var str = "ObjectId = " + details[0].providerId;
        qs.objectIds = str;
      }
      
      details.forEach(function(detail) {
        serviceType.push(mapData(detail.filter));
      });
      
      var str = "ServiceType IN ('" + serviceType.join("', '") + "')";
      qs.where = str;

      if (qs.objectIds) {
        defExp = qs.where + " AND " + qs.objectIds;
      } else {
        defExp = qs.where;
      }
      
      return defExp;
    }

    function loadTravelRadius(map, member, minutes, travelType) {
      require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/graphic", "esri/geometry/Point", "esri/tasks/FeatureSet", "esri/tasks/ServiceAreaParameters", "esri/tasks/ServiceAreaTask", "esri/layers/GraphicsLayer"], 
      function(Map, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SimpleRenderer, PictureMarkerSymbol, InfoTemplate, Graphic, Point, FeatureSet, ServiceAreaParameters, ServiceAreaTask, GraphicsLayer) {
        if(typeof member.point == "undefined") {
          window.alert("Member's address could not be located.");
          return;
        }
        
        var travelRadiusLayer = map.getLayer(self.attributes.travelRadiusOptions.id);

        if (travelType == 'walk') {
          minutes = minutes / 4; 
        }

        var pointSymbol = new SimpleMarkerSymbol("diamond", 20,
          new SimpleLineSymbol("solid", new Color([88, 116, 152]), 2),
          new Color([88, 116, 152, 0.45])
        );
        
        var location = new Graphic(member.point, pointSymbol);
        
        var features = [];
        features.push(location);
        
        var facilities = new FeatureSet();
        facilities.features = features;
        
        var serviceAreaParams = new ServiceAreaParameters();
        serviceAreaParams.outSpatialReference = map.spatialReference;          
        serviceAreaParams.defaultBreaks= [minutes];
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
            travelRadiusLayer.clear();
            travelRadiusLayer.add(serviceArea);
            travelRadiusLayer.add(location);
          });
          map.addLayer(travelRadiusLayer);
        }, function(err){
          console.log(err.message);
        });
      });
    }

    /**
     * Fire when the resources map is loaded.
     */
    function mapLoaded(map) {
      addTravelLayer();
      hidePopupOnClick();
			
      function addTravelLayer() {
        esriLoader.require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
          var travelRadiusLayer = new GraphicsLayer({
            id: self.attributes.travelRadiusOptions.id
          });
          
          $q.all([self.attributes.resourcesDeferred.promise, self.attributes.suggestedDeferred.promise]).then(function() {
            map.addLayer(travelRadiusLayer, 1);
            travelRadiusLayer.setVisibility(self.attributes.travelRadiusOptions.visible);
      
            travelRadiusLayer.on("click", function(evt) {
              // travel radius polygon has attributes, but the central point does not.
              if (evt.graphic.attributes) {
                map.infoWindow.hide();
                return;
              }
              
              showAddressPopup(evt.graphic.geometry);
            });
          });
        });
      }
			
      /**
       * Hide the map's popup window is not clicked on a graphic.
       */
      function hidePopupOnClick() {
        map.on("click", function(evt) {
          if (evt.graphic) {
            return;
          }

          map.infoWindow.hide();
        });
      }
    }

    function mapData(serviceType) {
      if (serviceType == "CCAP") {
        return serviceType = "Child Care";
      }

      if (serviceType == "TANF" || serviceType == "SNAP") {
        return serviceType = "Job Placement Services";
      }

      if (serviceType == "LiHEAP") {
        return serviceType = "Utility Assistance";
      }

      if (serviceType == "QHP" || serviceType == "CHIP" || serviceType == "MEDI" || serviceType == "Medicaid") {
        return serviceType = "Medical";
      }

      return serviceType;
    }
  }
})();
