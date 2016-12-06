(function() {
		angular.module('gapi-firebase-auth', []).service('coreAuthService', ['$window', '$q', '$rootScope', function($window, $q, $rootScope) {
		return {
			coreLoader: {},
			clientsToLoad: [],
			documentApis: [],
			apiLoaded: false,
			discoveryDocuments: [],
			apiKey: '',
			clientId: '',
			scopes: 'profile email', //minimum scope
			
			isApiLoaded: function() {
				//can watch this return function using 
				//function() { coreAuthService.isApiLoaded(); }, function(oVal, nVal) { //doSomething });
				//rather than waiting for broadcast
					
				return this.apiLoaded;
			},
			setDiscoveryDocuments: function(urlObject) {
				this.discoveryDocuments = urlObject;
				return true;
			},
			setApiKey: function(apiKey) {
				this.apiKey = apiKey;
				return true;
			},
			setClientId: function(clientId) {
				this.clientId = clientId;
				return true;
			},
			setScopes: function(scopes){
				this.scopes = this.scopes + ' ' + scopes;
				return true;
			},
			
			loadGapi: function() {
				var deferred = $q.defer();
		        $window.handleClientLoad = function(){
					this.coreLoader = gapi.load('client:auth2', deferred.resolve());
		        }
				return deferred.promise;
			},
			loadGapiApis: function() {
				
				var authSrv = this;
				var promises = [];
				
				var loadDiscoveryDocument = function(documentUrl) {
					var deferred = $q.defer();
					var data = '';
					
					if(!documentUrl) {
						return deferred.resolve();
					}
					var fetchDiscoveryDocument = fetch(documentUrl).then(
				            function(resp){
								if(!resp.ok){
									return false;
								}
				          	  	return resp.json();
				       	 	}).then(function(json) {
								if(json){
									data = json;
									authSrv.clientsToLoad.push({client:json.name, version:json.version});
									return deferred.resolve(data);
								}
								console.log('Unable to load document '+documentUrl);
				          		return deferred.resolve();
							
							});
						return deferred.promise;
					}
				
				if(this.discoveryDocuments){
					angular.forEach(this.discoveryDocuments, function(value){
						console.log('Loading '+value);
						promises.push(loadDiscoveryDocument(value));
					});
					loadDiscoveryDocument();
				}
				return $q.all(promises);
			},
			clientLoader: function() {
				var authSrv = this;
				var promises = [];
				
				var loadClient = function(client, version){
					var deferred = $q.defer();
					
					return gapi.client.load(client, version, deferred.resolve());
				}
				
				angular.forEach(authSrv.clientsToLoad, function(value){
					promises.push(loadClient(value.client, value.version));
				});
				
				return $q.all(promises);
			},
			initGapiClient: function() {
				var deferred = $q.defer();
				var authSrv = this;
				
				gapi.client.init({
				            apiKey: this.apiKey,
				            discoveryDocs: this.discoveryDocuments,
				            clientId: this.clientId,
				            scope: this.scopes
				        }).then(function() {
				        	console.log('Gapi init', gapi);
						
							gapi.auth2.getAuthInstance().isSignedIn.listen(authSrv.updateSigninStatus());
							authSrv.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
							
							//Loads clients based on discoveryDocuments						
							authSrv.clientLoader().then(function() {
								deferred.resolve();
							});
							
				        });
				return deferred.promise;
			},
			updateSigninStatus: function(isSignedIn) {
				if (isSignedIn) {
					$rootScope.$broadcast('gapiAuthService:signedIn', {userSignedIn:true});
				} else {
					$rootScope.$broadcast('gapiAuthService:signedIn', {userSignedIn:false});
				}
			},
			initiateGapi: function() {
				var deferred = $q.defer();
				var authSrv = this;
				
				authSrv.loadGapi().then(function() { // Start init of GAPI client and auth
					$q.all([authSrv.coreLoader, authSrv.loadGapiApis()]).then(function(result){
						//Resolve and init client loader
						authSrv.initGapiClient(result).then(function() {
							//	API loaded, can now broadcast Api ready or resolve promise if
							// preferred course of usage
							$rootScope.$broadcast('gapiApi', {ready:true});
							//Set watchable variable
							authSrv.apiLoaded = true;
							deferred.resolve();
						});
					});
				});
				return deferred.promise;
			},
			
			login: function() {
				var authSrv = this;
				var deferred = $q.defer();
				gapi.auth2.getAuthInstance().signIn().then(function() {
					authSrv.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
					$q.all([gapi.auth2.getAuthInstance().currentUser.get(), authSrv.connectFirebaseUsers()]);
				});
				return deferred.promise;
			},
			logout: function() {
				var authSrv = this;
				var deferred = $q.defer();
				deferred.resolve(gapi.auth2.getAuthInstance().signOut());
				gapi.auth2.getAuthInstance().signOut().then(function() {
					authSrv.updateSigninStatus(false);
					deferred.resolve();
				});
				return deferred.promise;
			},
			getToken: function() {
				var deferred = $q.defer();
				deferred.resolve(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token);
				return deferred.promise;
			},
			getGoogleUser: function(){
				var deferred = $q.defer();
				deferred.resolve(gapi.auth2.getAuthInstance().currentUser.get());
				return deferred.promise;
			},
			
			//Firebase 
			
			connectFirebaseUsers: function() {
				console.log("Checking Firebase");
				
				var authSrv = this;
				
				var isUserEqual = function (googleUser, firebaseUser) {
				  if (firebaseUser) {
					  console.log('isEqual', googleUser.getBasicProfile().getId());
				    var providerData = firebaseUser.providerData;
				    for (var i = 0; i < providerData.length; i++) {
				      if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
				          providerData[i].uid === googleUser.getId()) {
				        // We don't need to reauth the Firebase connection.
				        return false;
				      }
				    }
				  }
				  return true;
				}
				
				var deferred = $q.defer();
				
				var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
				    unsubscribe();
				    // Check if we are already signed-in Firebase with the correct user.
					var googleUser = {};
					authSrv.getGoogleUser().then(function(googleUser){
						console.log(googleUser.getAuthResponse());
					    if (isUserEqual(googleUser, firebaseUser)) {
					      // Build Firebase credential with the Google ID token.
							var credential = '';
							authSrv.getToken().then(function(result) {
		  				      credential = firebase.auth.GoogleAuthProvider.credential(result);
						      firebase.auth().signInWithCredential(credential).then(function() {
									  deferred.resolve();
							  });
							});

					    } else {
							console.log('User already signed in with Firebase.');
							deferred.resolve();
					    }
					});
					return deferred.promise;
				});
			}
		}
	}]);
})();