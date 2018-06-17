define(['models/ModalModel', 'views/ModalView', 'radio'],
    function (ModalModel, ModalView, radio) {

        var ModalController = function () {

            this.model = new ModalModel();
            this.view = new ModalView(this.model);

            this.init();
        };

        ModalController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.showHandler = this.show.bind(this);

                return this
            },
            enable: function () {


                radio.on('clickTd', this.showHandler);

                return this;
            },
            show: function (date) {

                this.model.updateData(date);
                this.view.show()
            }
        };

        return ModalController
    });