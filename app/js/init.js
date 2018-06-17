requirejs.config({
	baseUrl: 'js/app',
	paths: {
       underscore: '../lib/underscore',
        app: 'app',
       text: '../lib/text',
       firebase: 'https://www.gstatic.com/firebasejs/4.1.2/firebase'
	},
	config: {
        'fb': {
            apiKey: "AIzaSyANcKsMAXn5Y23R8oLu1BC1Bq1G9rp2M0U",
            authDomain: "my-calendar-f0730.firebaseapp.com",
            databaseURL: "https://my-calendar-f0730.firebaseio.com",
            projectId: "my-calendar-f0730",
            storageBucket: "my-calendar-f0730.appspot.com",
            messagingSenderId: "178079106285"
        }
    },
    shim: {
        firebase: {
            exports: 'firebase'
        }        
    }
});
requirejs(['app'], function (app) {
	app.init();
});