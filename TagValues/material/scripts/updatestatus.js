/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />

//quick enhancement to add the length to objects, not just arrays
// Object.prototype._length = function () {
//   return Object.keys(this).length;
// };

(function () {
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago']);
  app.config(['$httpProvider',
    function ($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      //$httpProvider.defaults.cache = true;
      //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);

  app.directive('selectOnClick', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function () {
          if (!$window.getSelection().toString()) {
            // Required for mobile Safari
            this.setSelectionRange(0, this.value.length)
          }
        });
      }
    };
  }]);

  app.filter('encodeURIComponent', function () {
    return window.encodeURIComponent;
  });

  app.directive('piVal', function () {
    return {
      restrict: 'E',
      template: '<span ng-class="">{{data.selectedPlant.Attributes[\'Ping status\'].Value.Value}}</span>'
    };
  });

  app.factory("PIWebCalls", ['$resource', function PIWebCallsFactory($resource) {
    return {
      reformatArray: function reformatArray(arr) {
        var obj = arr.reduce(function (obj, item) {
          obj[item.Name] = item;
          return obj;
        }, {});
        return obj;
      },
      plantsCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/elements?searchFullHierarchy=true&templateName=Plant"),
      elementAttrValuesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/:webid/value?templateName=:templateName"),
      interfacesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/elements/:webid/elements?templateName=Interface"),
      updateValueCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/value")

    };
  }]);

  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', 'PIWebCalls', function ($scope, $http, $resource, $filter, localStorageService, PIWebCalls) {


    var defaultPlantText = 'Select a plant';
    $scope.errors = [];
    $scope.clearErrors = function () {
      $scope.errors = [];
    };
    //function to refresh the plant list
    $scope.getPlants = function () {
      $scope.data = { plants: [], selectedPlant: {} };
      //get the list of plants 
      PIWebCalls.plantsCall.get({}, function (resp) {
        //console.log(resp);
        $scope.data.plants = resp.Items;//$filter('filter')(resp.Items, { name: 'Plant ID*' });
        $scope.data.selectedPlant.Name = defaultPlantText;
      });
    };
    //now call it for the initial setup
    $scope.getPlants();

    //when a plant is selected from the drop down, get data about plant
    $scope.getPlantData = function () {
      //check that an actual plant was selected
      if ($scope.data.selectedPlant.both !== defaultPlantText) {
        var selectedPlantArray = $scope.data.selectedPlant.both.split(','); //should be [Name,WebId]
        $scope.data.selectedPlant.Name = selectedPlantArray[0];
        $scope.data.selectedPlant.WebId = selectedPlantArray[1];
        //get attributes
        PIWebCalls.elementAttrValuesCall.get({
          webid: $scope.data.selectedPlant.WebId,
          templateName: 'Plant'
        }, function (resp) {
          //console.log(resp);
          $scope.data.selectedPlant.Attributes = PIWebCalls.reformatArray(resp.Items);
        });

        //get children interfaces
        PIWebCalls.interfacesCall.get({
          webid: $scope.data.selectedPlant.WebId,
          templateName: 'Interface'
        }, function (resp) {
          //console.log(resp);
          $scope.data.selectedPlant.interfaces = resp.Items;
          angular.forEach($scope.data.selectedPlant.interfaces, function (intrf, index) {
            //intrf
            //console.log(intrf);
            PIWebCalls.elementAttrValuesCall.get({
              webid: intrf.WebId,
              templateName: 'Interface'
            }, function (resp) {
              //console.log(reformatAttrArray(resp.Items));
              intrf.Attributes = PIWebCalls.reformatArray(resp.Items);

            });
          });

        });
      }
    };

    $scope.updateValue = function (WebId, newValue) {
      PIWebCalls.updateValueCall.save({ webid: WebId },
        {
          "Timestamp": "*",
          "Value": newValue,
          "Good": "true",
          "Questionable": "false"
        },
        function (resp) {
          console.log("success", resp);
          //if successful, update the values
          $scope.getPlantData();
        },
        function (errResp) {
          console.log("error:", errResp);
          $scope.errors.push(errResp);
        }
      );

    };

  }]);
})();