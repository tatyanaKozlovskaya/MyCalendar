define(['models/MenuModel', 'views/MenuView', 'controllers/WeatherController', 'radio', 'fb'],
    function (MenuModel, MenuView, WeatherController, radio, fb) {

        var MenuController = function () {

            this.model = new MenuModel();
            this.view = new MenuView(this.model);
            // this.weather = new WeatherController();
            this.init();
        };

        MenuController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.changeLangHandler = this.changeLang.bind(this);
                this.updateMonthHandler = this.updateMonth.bind(this);
                this.updateYearHandler = this.updateYear.bind(this);
                this.signInWithGoogleHandler = this.signInWithGoogle.bind(this);
                this.signInOrOutHandler = this.signInOrOut.bind(this);
                this.signOutHandler = this.signOut.bind(this);
                this.signInWithEmailHandler = this.signInWithEmail.bind(this);
                this.newUserPhotosHandler = this.newUserPhotos.bind(this);


                return this
            },
            enable: function () {

                radio.on('changeLang', this.changeLangHandler);
                radio.on('updateMonth', this.updateMonthHandler);
                radio.on('updateYear', this.updateYearHandler);
                radio.on('sign-google-in', this.signInWithGoogleHandler);
                radio.on('signInOrOut', this.signInOrOutHandler);
                radio.on('sign-out', this.signOutHandler);
                radio.on('signInWithEmail', this.signInWithEmailHandler);
                radio.on('newUserPhotos', this.newUserPhotosHandler);

                return this;
            },
            changeLang: function () {

                this.view.changeLang();
            },
            updateMonth: function (month) {

                this.model.updateMonth(month);
            },
            updateYear: function (year) {

                this.model.updateYear(year);
            },
            signInWithGoogle: function () {

                fb.signInWithGoogle();
            },
            signInOrOut: function () {

                this.view.render();
            },
            signOut: function () {
                fb.signOut();
            },
            signInWithEmail: function (email, password) {
                fb.signInWithEmail(email, password);
            },
            newUserPhotos: function (snapshot, type) {
                this.view.newUserPhotos(snapshot, type);
                console.log('new fotos');
            }

        };

        return MenuController;
    });