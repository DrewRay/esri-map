(function() {
  "use strict";
  
  /**
   * Create directive called "crfMap" that is applied to module called "IE.index"
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
            $scope.featureLayer.setDefinitionExpression(defExp);
          }
        });
      }
      
      require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/graphic", "esri/geometry/Point"], 
      function getMap(Map, FeatureLayer, SimpleFillSymbol, Color, SimpleRenderer, PictureMarkerSymbol, InfoTemplate, Graphic, Point) {
        var template = new InfoTemplate();
        $scope.map = new Map("map", crfMapService.attributes.options);
        $scope.featureLayer = new FeatureLayer("https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0", {
          id: "resources",
          infoTemplate: template,
          outFields: ["*"]
        });
        
        var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
        var renderer = new SimpleRenderer(pms);
        $scope.featureLayer.setSelectionSymbol(pms);
        $scope.featureLayer.setRenderer(renderer);
        
        $scope.map.addLayer($scope.featureLayer);
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
    $scope.closeDetails = closeDetails;
    $scope.map = crfMapService.attributes;
    $scope.mapData = crfMapService.mapData;
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
      }    
    };
    self.geocode = geocode;
    self.getProviderById = getProviderById;
    self.getProviders = getProviders;
    self.mapData = mapData;
    
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

    function mapData(serviceType) {
      if (serviceType == "CCAP") {
        return serviceType = "Child Care";
      }

      if (serviceType == "TANF") {
        return serviceType = "Job Placement Services";
      }

      if (serviceType == "LiHEAP") {
        return serviceType = "Utility Assistance";
      }

      if (serviceType == "QHP" || serviceType == "CHIP" || serviceType == "Medicaid") {
        return serviceType = "Medical";
      }

      return serviceType;
    }
  }
})();
