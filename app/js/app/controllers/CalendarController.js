define(['views/CalendarView', 'models/CalendarModel', 'controllers/TaskController', 'controllers/ModalController', 'radio'],
    function (CalendarView, CalendarModel, TaskController, ModalController, radio) {

        var CalendarController = function () {

            this.model = new CalendarModel();
            this.view = new CalendarView(this.model);
            this.taskHelper = new TaskController();
            this.modalWindow = new ModalController();
            this.init();
        };

        CalendarController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.newDataHandler = this.newData.bind(this);
                this.renderHandler = this.render.bind(this);
                this.thisMonthHandler = this.thisMonth.bind(this);
                this.nextMonthHandler = this.nextMonth.bind(this);
                this.prevMonthHandler = this.prevMonth.bind(this);
                this.changeLangHandler = this.changeLang.bind(this);
                this.cleanCalendarHandler = this.cleanCalendar.bind(this);
                this.signInOrOutHandler = this.signInOrOut.bind(this);

                return this
            },
            enable: function () {

                radio.on('newData', this.newDataHandler);
                radio.on('render', this.renderHandler);
                radio.on('thisMonth', this.thisMonthHandler);
                radio.on('nextMonth', this.nextMonthHandler);
                radio.on('prevMonth', this.prevMonthHandler);
                radio.on('changeLang', this.changeLangHandler);
                radio.on('cleanCalendar', this.cleanCalendarHandler);
                radio.on('signInOrOut', this.signInOrOutHandler);


                return this;
            },
            newData: function (year, month) {

                this.model.updateData(year, month);
            },
            render: function () {

                this.view.calendar();
            },
            thisMonth: function () {

                this.view.light();
            },
            nextMonth: function () {

                this.model.renderNext();
            },
            prevMonth: function () {

                this.model.renderPrev();
            },
            changeLang: function () {

                this.view.changeLang();
            },
            cleanCalendar: function (ev) {

                this.view.cleanCalendar(ev);
            },
            signInOrOut: function () {

                this.view.calendar();
            }
        };
        return CalendarController;
    }
);