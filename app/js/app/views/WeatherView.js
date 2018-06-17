define(['underscore', 'text!templates/WeatherTemplate.html', 'radio', 'lang'],
    function (_, WeatherTemplateString, radio, lang) {

        var WeatherView = function (model) {
            this.model = model;
            this.el = document.querySelector('.weather');
            this.template = _.template(WeatherTemplateString);
            this.days = 1;
            this.init();

        };

        WeatherView.prototype = {

            init: function () {
                this.enable()
            },
            enable: function () {
                this.el.addEventListener('click', this.clickHandler.bind(this));

                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.indexOf('oneDayButton') !== -1) {
                    event.stopImmediatePropagation()
                    this.days = 1;
                    radio.trigger('getNewWeather');

                }
                if (targetClasses.indexOf('threeDaysButton') !== -1) {
                    event.stopImmediatePropagation()
                    this.days = 3;
                    radio.trigger('weatherThreeDays');

                }
            },
            getWeather: function () {
                this.el = document.querySelector('.weather');
                this.init();
                if (this.model.data.length <= 1) {
                    var data = [this.model.data[0]]
                } else {
                    var data = [this.model.data[0], this.model.data[1], this.model.data[2]]
                }
                this.el.innerHTML = this.template({
                    cityName: this.model.city,
                    show3DaysText: lang.show3days,
                    showTodayText: lang.show1day,
                    dataWeather: data

                });
                this.buttons();

            },

            buttons: function () {

                this.button3 = this.el.querySelector('.threeDaysButton');
                this.button1 = this.el.querySelector('.oneDayButton');
                if (this.days === 1) {
                    this.button3.classList.remove('noneDisplay');
                    this.button1.classList.add('noneDisplay');
                    this.el.classList.remove('threeDays');
                    this.el.classList.add('oneDay');
                }
                if (this.days === 3) {
                    this.button1.classList.remove('noneDisplay');
                    this.button3.classList.add('noneDisplay');
                    this.el.classList.add('threeDays');
                    this.el.classList.remove('oneDay');
                }

            },
            changeLang: function () {
                this.days = 1;
            }

        };

        return WeatherView;
    });