/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />

//quick enhancement to add the length to objects, not just arrays
// Object.prototype._length = function () {
//   return Object.keys(this).length;
// };

(function () {
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago','ngMaterial']);
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
      updateValueCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/value"),
      getValuesAdHocCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/value"),
      openIssuesEventFramesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/eventframes?templateName=Interface Issue&searchMode=InProgress")

    };
  }]);

  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', 'PIWebCalls', function ($scope, $http, $resource, $filter, localStorageService, PIWebCalls) {


    var defaultPlantText = 'Select a plant';
    $scope.errors = [];
    $scope.clearErrors = function () {
      $scope.errors = [];
    };

    $scope.isLoading = false;
    $scope.startedLoading = function () {
      $scope.isLoading = true;
    };
    $scope.finishedLoading = function () {
      $scope.isLoading = false;
    };

    $scope.isUpdating = false;
    $scope.startedUpdating = function () {
      $scope.isUpdating = true;
    };
    $scope.finishedUpdating = function () {
      $scope.isUpdating = false;
    };

    $scope.getLabelClassesFromStatusText = function (statusText) {
      //{'label label-warning':(!intrf.Attributes['Status Summary'].Value.Value.startsWith('Update required') && !intrf.Attributes['Status Summary'].Value.Value.startsWith('All Good') &&!intrf.Attributes['Status Summary'].Value.Value.startsWith('Alert ')),'label label-success':(intrf.Attributes['Status Summary'].Value.Value.startsWith('All Good')),'label label-danger':(intrf.Attributes['Status Summary'].Value.Value.startsWith('Alert')),'label label-info':(intrf.Attributes['Status Summary'].Value.Value.startsWith('Update req'))}
      //{'label label-warning':(intrf.Attributes['Status/Note'].Value.Value.Value !== 0 && intrf.Attributes['Status/Note'].Value.Value.Value !== 4 ),'label label-success':(intrf.Attributes['Status/Note'].Value.Value.Value === 0),'label label-danger':(intrf.Attributes['Status/Note'].Value.Value.Value === 4)}
      //{'label label-warning':(data.selectedPlant.Attributes['Status/Note'].Value.Value.Value !== 0 && data.selectedPlant.Attributes['Status/Note'].Value.Value.Value !== 4 ),'label label-success':(data.selectedPlant.Attributes['Status/Note'].Value.Value.Value === 0),'label label-danger':(data.selectedPlant.Attributes['Status/Note'].Value.Value.Value === 4)}
      if (statusText == null || typeof(statusText) !== 'string') {
        return "";
      }
      var classString = 'label label-';
      if (statusText.startsWith('All Good') || statusText.startsWith('Good') || statusText.startsWith('Ok-')) {
        return classString + 'success'; //green
      }
      if (statusText.startsWith('Update re')) {
        return classString + 'info'; //blue
      }
      if (statusText.startsWith('Alert') || statusText.startsWith('Problem')) {
        return classString + 'danger'; //red
      }

      //for everything else: Transitioning to opc, idle, maintenance, shutdown
      //use orange 
      return classString + 'warning';
    };

    //function to refresh the plant list
    $scope.getPlants = function () {
      $scope.data = { plants: [], selectedPlant: {} };
      //get the list of plants 
      $scope.startedUpdating();
      PIWebCalls.plantsCall.get({}, function (resp) {
        //console.log(resp);
        $scope.data.plants = resp.Items;//$filter('filter')(resp.Items, { name: 'Plant ID*' });
        $scope.data.plantsAsNames = PIWebCalls.reformatArray(resp.Items);
        $scope.data.selectedPlant.Name = defaultPlantText;
        $scope.finishedUpdating();
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting plants": resp });
        $scope.finishedUpdating();
      });
    };
    //now call it for the initial setup
    $scope.getPlants();

    //funciton to refresh the interfaces count
    $scope.getInterfaceAlertsCount = function () {
      $scope.data.lastUpdated = Date.now();
      var webIdsOfCounts = [];
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ1AcBAAU1RDQVBJQ09MTFxTVENBSU5URVJGQUNFUy1BTEVSVCBDT1VOVA");//alert
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ0gcBAAU1RDQVBJQ09MTFxTVENBSU5URVJGQUNFUy1HT09EIENPVU5U");//good
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ1QcBAAU1RDQVBJQ09MTFxTVENBSU5URVJGQUNFUy1VUERBVEUgQ09VTlQ");//update
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ0wcBAAU1RDQVBJQ09MTFxTVENBSU5URVJGQUNFUy1XQVJOSU5HIENPVU5U");//warning
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ3AQBAAU1RDQVBJQ09MTFxVRkwgRk9SIEdDIERBVEEgVE8gT0QuU1RBVFVTU1VNTUFSWQ");//GC status OD
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQ2wQBAAU1RDQVBJQ09MTFxVRkwgRk9SIEdDIERBVEEgVE8gUENELlNUQVRVU1NVTU1BUlk");//GC status PCD
      webIdsOfCounts.push("P0Zwm3Ai1HVUiBciNvrmWsBQSwUBAAU1RDQVBJQ09MTFxBRiBBTkFMWVRJQ1MgU0VSVklDRS5TVEFUVVNTVU1NQVJZ");//AF Status
      PIWebCalls.getValuesAdHocCall.get({
        time: "*",
        'webId[]': webIdsOfCounts
      }, function (resp) {
        $scope.data.InterfaceIssues = PIWebCalls.reformatArray(resp.Items);
        $scope.finishedUpdating();
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting interface count values": resp });
        $scope.finishedUpdating();
      });
    };
    //now call it
    $scope.getInterfaceAlertsCount();
    $scope.prefs = { autoRefresh: true };
    //and set the autorefresh
    var i = setInterval(function () {
      if ($scope.prefs.autoRefresh) {
        $scope.getInterfaceAlertsCount();
      }
    }, 300000);
    $scope.totalIssues = function () {
      if ($scope.data && $scope.data.InterfaceIssues) {
        return $scope.data.InterfaceIssues['STCAInterfaces-Warning Count'].Value.Value + $scope.data.InterfaceIssues['STCAInterfaces-Alert Count'].Value.Value + $scope.data.InterfaceIssues['STCAInterfaces-Warning Count'].Value.Value;
      }
      return 0;
    };
    //get the event frames of issues
    $scope.getInterfaceIssuesEF = function () {
      $scope.startedUpdating();
      $scope.data.selectedPlant = { interfaces: [], interfaceIssues: true };
      PIWebCalls.openIssuesEventFramesCall.get({}, function (resp) {
        if (resp.Items.length) {
          angular.forEach(resp.Items, function (eventFrame, index) {
            //extract the webId of the interface to save a web call 
            var interfaceElementwebId = eventFrame.Links.PrimaryReferencedElement.replace("https://muntse-s-08817.europe.shell.com/piwebapi/elements/", "");
            PIWebCalls.elementAttrValuesCall.get({
              webid: interfaceElementwebId,
              templateName: 'Interface'
            }, function (resp) {
              //console.log(reformatAttrArray(resp.Items));
              $scope.data.selectedPlant.interfaces.push({ Name: eventFrame.Name, Attributes: PIWebCalls.reformatArray(resp.Items) });
              $scope.finishedUpdating();
            }, function (resp) {
              //there was an error
              $scope.errors.push({ "Error with getting interfaces info": resp });
              $scope.finishedUpdating();
            });
          });
        }
        $scope.finishedUpdating();
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting interface issues": resp });
        $scope.finishedUpdating();
      });
    };

    //when a plant is selected from the drop down, get data about plant
    $scope.getPlantData = function () {
      //check that an actual plant was selected
      $scope.data.selectedPlant.interfaceIssues = false;
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
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with getting plant data": resp });
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

            }, function (resp) {
              //there was an error
              $scope.errors.push({ "Error with getting interfaces info": resp });
            });
          });

        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with getting interfaces": resp });
        });
      }
    };

    $scope.updateValue = function (WebId, newValue) {
      $scope.startedUpdating();
      PIWebCalls.updateValueCall.save({ webid: WebId },
        {
          "Timestamp": "*",
          "Value": newValue,
          "Good": "true",
          "Questionable": "false"
        },
        function (resp) {
          //console.log("success", resp);
          //if successful, update the values
          $scope.finishedUpdating();
          $scope.getPlantData();
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with getting values": resp });
          $scope.finishedUpdating();
        });
    };

  }]);
})();