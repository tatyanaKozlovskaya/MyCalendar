define(['underscore', 'text!templates/ModalTemplate.html', 'radio', 'lang'],
    function (_, ModalTemplateString, radio, lang) {

        var ModalView = function (model) {
            this.model = model;
            this.el = document.querySelector('#modal');
            this.template = _.template(ModalTemplateString);
            this.init();

        };

        ModalView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el.addEventListener('click', this.clickHandler.bind(this));

                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.length) {
                    if (targetClasses.indexOf('cancel') !== -1) {
                        this.hide();
                    }
                    if (targetClasses.indexOf('is-success') !== -1) {
                        this.saveTask();
                        this.hide();
                    }
                }
            },
            show: function () {

                this.el.classList.add('is-active');
                this.el.innerHTML = this.template({
                    date: lang.modalTitle + this.model.day + ' ' + lang.monthNamesPart[this.model.month - 1] + ' ' + this.model.year,
                    timeText: lang.timeText,
                    saveText: lang.save,
                    cancelText: lang.cancel,
                });
            },
            hide: function () {

                this.el.classList.remove('is-active');

            },
            saveTask: function () {

                this.input = this.el.querySelector('#eventTask');
                this.time = this.el.querySelector('#time');
                if (this.input.value) {
                    var value = this.input.value;
                    var timeIndex = this.time.options.selectedIndex;
                    var time = this.time.options[timeIndex].label;
                    var key = this.model.day + '-' + this.model.month + '-' + this.model.year;
                    radio.trigger('saveTask', value, key, time);
                    radio.trigger('render');
                    this.input.value = '';

                }
            }
        };

        return ModalView;
    });