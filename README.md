# Gapi / Firebase Auth for AngularJS
This is a simple module written to handle authentication with GAPI and Firebase. You need to:

* Create a new Firebase and Google Apps project
* In your Firebase app, select Authentication->Signin Method->Google and turn on
* In the Google Dev console, create your credentials and API key (you can choose to restrict these if you want)
* Back in Firebase, under Web SDK settings in the Google Auth panel opened before, put your Google ClientID and Web Secret

* Add Firebase and AngularFire to your project
``` html
	
	<!-- firebase -->
	
	<script src="https://www.gstatic.com/firebasejs/3.6.1/firebase.js"></script>
	<script src="https://cdn.firebase.com/libs/angularfire/2.1.0/angularfire.min.js"></script>
	<script>
	  // Initialize Firebase
	  var config = {
	    apiKey: "yourApiKey",
	    authDomain: "yourAuthDomain",
	    databaseURL: "yourDbURL",
	    storageBucket: "yourBucket",
	    messagingSenderId: "yourId"
	  };
	  firebase.initializeApp(config);
	</script>
	
```

* Inject firebase and Gapi into your Angular module
``` javascript
angular.module('myApp', ['ngRoute', 'firebase', 'gapi-firebase-auth'])

```

* In the .run module, add this:
```javascript
	
	.run(['coreAuthService', function(coreAuthService) {
		
		coreAuthService.setDiscoveryDocuments(
			{drive:'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
			gmail: 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'});
			
			//You can add other discovery documents using the discovery service: https://developers.google.com/discovery/v1/reference/apis/list#try-it

		coreAuthService.setClientId('google-client-id');
		coreAuthService.setApiKey('google-api-key');
		
		//Set your scopes - the basic Auth ones are already set for you in coreAuthService
		coreAuthService.setScopes('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly');
		
		//Run the main initialiser and load GAPI clients
		coreAuthService.initiateGapi().then(function() {
			
			//You can add more here from the docs
			gapi.client.load('calendar', 'v3');
			gapi.client.load('gmail', 'v1');
		});
	}]);
	
```

## Authentication
In the Google Auth directive, there is an example of firing the login() function, which signs in your user and connects them with firebase. To use, you will need to add it to your project in your own way - it's just an example.