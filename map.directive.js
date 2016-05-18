/**
 * Create directive called "crfMap" that is applied to module called "IE.index"
 */
angular.module("IE.index").directive("crfMap", crfMap);

crfMap.$inject = ["$compile", "$document", "$rootScope"];
/* @ngInject */
function crfMap($compile, $document, $rootScope) {
  return {
    restrict: "E",
    scope: {
      member: "=", // two way string binding
      callback: "&" // callback function
    },
    controller: ctrl, // using ctrl() from below
    controllerAs: "c", // alias for ctrl() used in the template html
    link: postLink,
    template:
      "<div id='map' width='100%;'></div>" +
        "<h3>Member that was sent to Directive from Page controller<br/>" + 
        "<h5>{{member.needs[0].name}}</h5>" +
      "</div>" 
  };
  
  function ctrl($scope) {
    var vm = $scope;

    $scope.provider = provider;
    vm.providerData = [
      {
        id: 1234,
        name: "The Well Clinic",
        street: "1111 One Street",
        city: "Eden Prairie",
        state: "MN",
        zip: "55346",
        phone: "952-111-1111",
        website: "www.provider1.com",
        geometry: {
          y: -122.38,
          x: 37.75
        }
      },
      {
        id: 1234,
        name: "Gullickson Labs",
        street: "22 Two Ave",
        city: "Minneapolis",
        state: "MN",
        zip: "55665",
        phone: "952-222-2222",
        website: "www.provider2.com",
        geometry: {
          y: -122.45,
          x: 37.67
        }
      },
      {
        id: 1234,
        name: "Johnson West",
        street: "1234 Main St",
        city: "St. Paul",
        state: "MN",
        zip: "55555",
        phone: "952-333-3333",
        website: "www.provider3.com",
        geometry: {
          y: -122.45,
          x: 37.78
        }
      }
    ];
    
    function provider(provider) {
      var requestedData = {
        transactionId: $scope.member.transactionId,
        needs: [
          {
            clientId: $scope.member.needs[0].clientId,
            name: $scope.member.needs[0].name,
            addresses: $scope.member.needs[0].addresses,
            details: [
              {
                detailId: $scope.member.needs[0].details[0].detailId,
                program: $scope.member.needs[0].details[0].program,
                provider: provider
              }
            ]
          }
        ]
      };
      
      $scope.callback()(requestedData);        
    }
  }
  
  function postLink($scope, ele, attrs, ctrl) {
    require(["esri/map", "esri/geometry/Point", "esri/symbols/PictureMarkerSymbol", "esri/graphic", "dojo/_base/array", "dojo/domReady!"], 
    function(Map, Point, PictureMarkerSymbol, Graphic, arrayUtils) {
      map = new Map("map", {
        basemap: "topo",
        center: [-122.45, 37.75],
        zoom: 11
      });
      
      map.on("load", mapLoaded);
      map.on("click", function(evt) {
        if (!evt.graphic) {
          return;
        }
        showPopup([evt.graphic], evt.graphic.attributes, evt.mapPoint);
      });
      
      function mapLoaded() {
        var providers = $scope.providerData;
        var pms = new PictureMarkerSymbol("https://rawgit.com/savtwo/esri-map/master/pin_default.png", 18, 25);
        
        arrayUtils.forEach(providers, function(provider) {
          var graphic = new Graphic(new Point(provider.geometry.y, provider.geometry.x), pms);
          graphic.attributes = provider;
          map.graphics.add(graphic);
        });
      }
      
      function showPopup(features, attrs, point) {
        var title = "Provider: " + attrs.name;
        var content = "" +
          "<div>" +
            attrs.street + " " + attrs.city + " " + attrs.state + " " + attrs.zip + "<br/>" +
            attrs.phone + "<br/>" +
            attrs.website + "<br/><br/>" +
            "<button ng-click='selectProvider(attrs)'>Select Provider</button>" +
          "</div>";
          
        var scope = $rootScope.$new(true);
        scope.selectProvider = selectProvider;
        scope.attrs = attrs;
        
        var compiled = $compile(content)(scope);

        map.infoWindow.setFeatures(features);
        map.infoWindow.setTitle(title);
        map.infoWindow.setContent(content);
        map.infoWindow.show(point);
        
        var contentPane = $document.find(".esriPopup .contentPane");
        var contentElement = angular.element(contentPane);
        
        contentElement.html("");
        contentElement.append(compiled);
        
        function selectProvider(provider) {
          $scope.provider(provider);
        }
      }
    });
  }
}
