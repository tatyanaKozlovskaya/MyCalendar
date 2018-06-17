define(function () {

    var RegistrationModel = function () {


    };

    RegistrationModel.prototype = {

        userData: function (email, password, name) {

            this.userEmail = email;
            this.userPassword = password;
            this.userName = name;

        }

    };

    return RegistrationModel;
});