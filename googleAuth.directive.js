angular.module('myApp').directive('googleAuthentication', ['$window', 'coreAuthService', function(firebase, Auth, appUserManager, $window, coreAuthService) {
	
	var googleAuthController = ['$rootScope', '$scope', function($rootScope, $scope) {
		
		$scope.auth = Auth;
		$scope.$on('gapiAuthService:signedIn', function(event, args) {
			$scope.signInButton = args.userSignedIn;
		});

		$scope.googleSignIn = function() {
		// Fires the login and connects with the Firebase database if necessary

			coreAuthService.login().then(function(googleUser) {
					//Stores the user locally so we can use their credentials elsewhere
					//Better if you can use a service for this, but for eg. we will store on rootScope
					$rootScope.currentUser = googleUser;
					coreAuthService.getToken().then(function(result) {
						$rootScope.accessToken = result;
					});
			});
			
		}
		
		$scope.googleSignOut = function() {
			coreAuthService.logout().then(function() {
				$rootScope.currentUser = null;
				$rootScope.accessToken = null;
			});
		}
		
	}];
	
	return {
		templateUrl: '/app/auth/googleAuth.tpl.html',
		controller: googleAuthController,
		controllerAs: 'googleAuthCtrl',
	}
}]);