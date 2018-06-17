define(['fb'], function (fb) {


    var TaskModel = function () {

        this.tasks = {};
    };

    TaskModel.prototype = {

        saveTask: function (value, key, time) {

            if (this.tasks[key]) {
                this.tasks[key].push({value: value, time: time});
            } else {
                this.tasks[key] = [{value: value, time: time}];
            }
        },
        deleteTask: function (ev, key) {

            var li = ev.target.parentNode.innerText;
            var index = this.tasks[key].indexOf(li);
            this.tasks[key].splice([index], 1);

        },
        getTasksfromLocalStorage: function () {

            fb.getTasks();
        },
        tasksGot: function (tasks) {

            this.tasks = tasks;
        },
        saveTasksInLocalStorage: function () {

            fb.saveTasks(this.tasks);
        },
        cleanTasks: function () {

            this.tasks = {};
        },
        cleanCalendar: function (month, year) {
            for (var d = 0; d < 32; d++) {
                var key = d + '-' + month + '-' + year;
                if (this.tasks[key]) {
                    delete this.tasks[key]
                }
            }
        }
    };

    return TaskModel
});