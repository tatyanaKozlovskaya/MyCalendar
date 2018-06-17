define(['models/RegistrationModel', 'views/RegistrationView', 'radio', 'fb'],
    function (RegistrationModel, RegistrationView, radio, fb) {

        var RegistrationController = function () {

            this.model = new RegistrationModel();
            this.view = new RegistrationView(this.model);

            this.init();
        };

        RegistrationController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.signUpNowHandler = this.signUpNow.bind(this);
                this.registerNewUserHandler = this.registerNewUser.bind(this);

                return this
            },
            enable: function () {


                radio.on('sign-up-now', this.signUpNowHandler);
                radio.on('registerNewUser', this.registerNewUserHandler);


                return this;
            },
            signUpNow: function () {

                this.view.show()
            },
            registerNewUser: function (email, password, data) {

                fb.registerNewUser(email, password, data);
            }
        };

        return RegistrationController
    });