define(['underscore', 'text!templates/CalendarTemplate.html', 'radio', 'lang', 'fb'],
    function (_, CalendarTemplateString, radio, lang, fb) {

        var CalendarView = function (model) {
            this.model = model;
            this.el = document.querySelector('#container');
            this.monthNamesPart = lang.monthNamesPart;
            this.dayNames = lang.dayNames;
            this.template = _.template(CalendarTemplateString);

            this.init();

        };

        CalendarView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el.addEventListener('click', this.clickHandler.bind(this));
                this.el.addEventListener('mouseover', this.mouseOverHandler.bind(this));
                this.el.addEventListener('changeLang', this.cahangeLang);
                return this
            },
            clickHandler: function (ev) {

                var target = ev.target;
                while (target !== this.el) {
                    if (target.tagName === "TD") {
                        if (target.childNodes && target.childNodes[0] && target.childNodes[0].data) {
                            var day = target.childNodes[0].data;
                            var date = [day, this.model.month, this.model.year];
                            radio.trigger('clickTd', date);
                        }
                        return;
                    }
                    if (target.tagName === 'SPAN') {

                        var dayForKey = ev.target.parentElement.parentElement.parentElement.childNodes[0].data;
                        var key = dayForKey + '-' + this.model.month + '-' + this.model.year;
                        radio.trigger('deleteTask', ev, key);
                        return;

                    }
                    if (target.tagName === 'BUTTON') {
                        var targetClasses = ev.target.className.split(' ');
                        if (targetClasses.length) {
                            if (targetClasses.indexOf('next') !== -1) {
                                radio.trigger('nextMonth');
                            }
                            if (targetClasses.indexOf('prev') !== -1) {
                                radio.trigger('prevMonth');
                            }
                        }
                        return;
                    }
                    target = target.parentNode;
                }
            },
            calendar: function () {

                var dateInHead = this.model.year + " | " + lang.monthNames[this.model.month - 1];
                var idTable = this.model.year + "-" + this.model.month;
                this.el.innerHTML = this.template({
                    dateInHead: dateInHead,
                    idTable: idTable,
                    dayNames: this.dayNames,
                    sumDayOfMonth: this.model.sumDayOfMonth(),
                    dayOfWeek: this.model.dayOfWeek() - 1,
                    count: 0,
                    countOfDays: 1,
                    date: '-' + this.model.month + '-' + this.model.year,
                    youNeedAutorisation: lang.youNeedAutorisation,
                    nowYouCan: lang.nowYouCan,
                    user: fb.user
                });
                this.light();
                radio.trigger('newTable');

                return this
            },
            changeLang: function () {

                this.monthNames = lang.monthNames;
                this.monthNamesPart = lang.monthNamesPart;
                this.dayNames = lang.dayNames;
                this.calendar();
            },
            light: function () {

                var todayMonth = document.getElementsByTagName('td'); //подсвечиваем сегодняшнее число
                for (var a = 0; a < todayMonth.length; a++) {
                    if (todayMonth[a].childNodes[0]) {
                        if (this.model.month === this.model.realMonth && todayMonth[a].childNodes[0].data === this.model.todayDay + '') {
                            todayMonth[a].classList.add("td-today");
                        }
                    }
                }
            },
            mouseOverHandler: function (ev) { //при наведении на ячейку она подсвечивается

                if (ev.target.tagName === 'TD') {
                    ev.target.classList.add("td-illumination");
                }
                ev.target.addEventListener('mouseleave', function (ev) {//при покидании ячейки она становится обычной
                    if (ev.target.tagName === 'TD') {
                        ev.target.classList.remove("td-illumination");
                    }
                })
            },
            cleanCalendar: function () {

                radio.trigger('cleanTasksFromMonth', this.model.month, this.model.year);
                this.calendar();

            }
        };
        return CalendarView;
    }
);