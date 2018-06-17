define(['radio'],
    function (radio) {

        var CalendarModel = function () {
            var todayDate = new Date();
            this.realMonth = todayDate.getMonth() + 1;// получаем месяц;
            this.year = todayDate.getFullYear();//получаем год;
            this.month = todayDate.getMonth() + 1;// получаем месяц;
            this.todayDay = todayDate.getDate(); //получаем число;
            this.dayOfWeek = function () { //получаем день недели
                var here = new Date(this.year, this.month - 1);
                return here.getDay();
            }.bind(this);
            this.sumDayOfMonth = function () { //считаем сколько дней в месяце
                var here = new Date(this.year, this.month - 1);
                here.setDate(32);
                return 32 - here.getDate();
            }.bind(this);

        };
        CalendarModel.prototype = {

            updateData: function (year, month) {
                var isthisMonth = 0;
                if (year && month) {
                    if (this.year === year && this.month === month) {
                        isthisMonth = 1;
                    }
                    this.year = year;
                    this.month = month;
                    radio.trigger('render');
                    if (isthisMonth === 1) {
                        radio.trigger('thisMonth');
                    }
                }
            },
            renderNext: function () {
                if (this.month < 12) {
                    ++this.month;
                    radio.trigger('render');
                } else {
                    ++this.year;
                    this.month = 1;
                    radio.trigger('render');
                }
            },
            renderPrev: function () {
                if (this.month > 1) {
                    --this.month;
                    radio.trigger('render');

                } else {
                    --this.year;
                    this.month = 12;
                    radio.trigger('render');

                }
            }
        };

        return CalendarModel;
    }
);