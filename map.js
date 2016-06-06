(function() {
  "use strict";
  
  angular.module("IE.index")
  /**
   * Create directive called "crfMap" that is applied to module called "IE.index"
   */
  .directive("crfMap", crfMap)
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
          "<h6>Selecting for: {{member.needs[0].firstName}} {{member.needs[0].lastName}}</h6>" +
        "</div>",
      controller: "crfMapCtrl",
      controllerAs: "c", // alias for ctrl() used in the template html
      link: postLink
    };
    
    function postLink($scope, ele, attrs, ctrl) {
      $scope.$watch("member", function(newVal, oldVal) {
        if ($scope.member) {
          crfMapService.getProviders($scope.member.needs[0].details).then(function(response) {
            var providerData = response.features;          
            require(["esri/graphic", "esri/symbols/PictureMarkerSymbol", "esri/geometry/Point",], function(Graphic, PictureMarkerSymbol, Point) {
            
              $scope.map.graphics.clear();
              var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
              
              providerData.forEach(function(provider) {
                var graphic = new Graphic(new Point(provider.geometry.x, provider.geometry.y), pms);
                graphic.attributes = provider;
                $scope.map.graphics.add(graphic);
              });
            });
          });
        }
      });
        
      require(["esri/map"], 
      function getMap(Map) {
        $scope.map = new Map("map", crfMapService.attributes.options);

        $scope.map.on("click", function(evt) {
          if (!evt.graphic) {
            return;
          }
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
  
  crfMapCtrl.$inject = ["$scope", "crfMapService"];
  /* @ngInject */
  function crfMapCtrl($scope, crfMapService) {
    $scope.closeDetails = closeDetails;
    $scope.provider = provider;
    
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
                  ADR_LN_1_TXT: provider.Address,
                  // ADR_LN_2_TXT: // does not exist yet
                  CTY_NM: provider.City,
                  ST: provider.State,
                  ZIP: provider.Zip_Code,
                  // ZIP_EXT: // does not exist yet
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
  
  crfMapService.$inject = ["$compile", "$document", "$http", "$rootScope"];
  /* @ngInject */
  function crfMapService($compile, $document, $http, $rootScope) {
    var self = this;
    
    self.attributes = {
      options: {
        basemap: "topo",
        center: [-93.45536540319006, 44.85786213722895],
        zoom: 11
      },
      // resouresLayerUrl: "https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0/query"
      resouresLayerUrl: "https://healthstate.optum.com/arcgis/rest/services/crf/resources/MapServer/0/query"
    };
    self.getProviders = getProviders;
    
    function getProviders(details) {
      var where;
      
      if (details == null) {
        where = "";
      } else {
        var serviceType = [];
        
        details.forEach(function(detail) {
          serviceType.push(detail.filter);
        });
        var str = "ServiceType IN ('" + serviceType.join("', '") + "')";
        where = str;
      }
      var qs = {
        where: where,
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

      // return $http.get("https://map-stg.optum.com/arcgis/rest/services/Projects/OCRF_ResourceLocations/MapServer/0/query", { params: qs }).then(success, fail);
      return $http.get("https://healthstate.optum.com/arcgis/rest/services/crf/resources/MapServer/0/query", { params: qs }).then(success, fail);
      
      function success(response) {
        return response.data;
      }
      
      function fail(response) {
        return response.data;
      }
    }
  }
})();