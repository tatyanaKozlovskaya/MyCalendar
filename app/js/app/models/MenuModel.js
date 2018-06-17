define(function () {


    var MenuModel = function () {
        this.month = 1;
        this.year = 1990;

    };

    MenuModel.prototype = {

        updateMonth: function (month) {
            this.month = month;
        },
        updateYear: function (year) {
            this.year = year;
        }

    };
    return MenuModel;
});
