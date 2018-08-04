/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />

(function () {
    var app = angular.module('myapp', ['ngResource']);
    app.config(['$httpProvider',
        function ($httpProvider) {
            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.withCredentials = true;
            //$httpProvider.defaults.cache = true;
            //delete $httpProvider.defaults.headers.common['X-Requested-With'];
        }
    ]);
    app.controller('appController', ['$scope', '$http', '$resource', '$filter', function ($scope, $http, $resource, $filter) {
        //https://muntse-s-08817.europe.shell.com/piwebapi/streams/P0Zwm3Ai1HVUiBciNvrmWsBQ25wAAAU1RDQVBJQ09MTFxQOTk5VEVTVFNJTlVTT0lE/value
        $scope.sinusoidVal = $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/P0Zwm3Ai1HVUiBciNvrmWsBQ25wAAAU1RDQVBJQ09MTFxQOTk5VEVTVFNJTlVTT0lE/value");

        $scope.fetchValue = function () {
            try {
                $scope.sinusoidVal.get({}, function (resp) {
                    //console.log(resp);
                    $scope.Value = resp;//$filter('filter')(resp.Items, { name: 'Plant ID*' });
                    $scope.fetchedAt = Date.now();
                    $scope.errors = [];
                }, function (resp) {
                    //there was an error
                    $scope.errors = resp;
                    $scope.Value = null;
                });

            } catch (error) {
                $scope.errors = error;
            }
        };

        try {
            $scope.fetchValue();
        } catch (error) {
            $scope.errors = error;
        }

        $scope.stringify = function(obj)
        {
            return JSON.stringify(obj,undefined,2);
        };

    }]);
})();