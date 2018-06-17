define(function () {

    var ModalModel = function () {

    };

    ModalModel.prototype = {

        updateData: function (date) {

            if (date.length === 3) {
                this.day = date[0];
                this.month = date[1];
                this.year = date[2];
            }
        }

    };

    return ModalModel;
});