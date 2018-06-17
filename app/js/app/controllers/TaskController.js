define(['models/TaskModel', 'views/TaskView', 'radio'],
    function (TaskModel, TaskView, radio) {

        var TaskController = function () {

            this.model = new TaskModel();
            this.view = new TaskView(this.model);

            this.init();
        };

        TaskController.prototype = {

            init: function () {

                this.handlers().enable().getTasks();

            },
            handlers: function () {
                this.saveTaskHandler = this.saveTask.bind(this);
                this.deleteTaskHandler = this.deleteTask.bind(this);
                this.getTasksHandler = this.getTasks.bind(this);
                this.saveTasksLocalHandler = this.saveTasksLocal.bind(this);
                this.saveTasksAndCleanHandler = this.saveTasksAndClean.bind(this);
                this.newTableHandler = this.newTable.bind(this);
                this.cleanCalendarHandler = this.cleanTasksFromMonth.bind(this);
                this.tasksGotHandler = this.tasksGot.bind(this);

                return this
            },
            enable: function () {

                radio.on('saveTask', this.saveTaskHandler);
                radio.on('deleteTask', this.deleteTaskHandler);
                radio.on('signInOrOut', this.getTasksHandler);
                radio.on('pageHide', this.saveTasksLocalHandler);
                radio.on('sign-out', this.saveTasksAndCleanHandler);
                radio.on('newTable', this.newTableHandler);
                radio.on('cleanTasksFromMonth', this.cleanCalendarHandler);
                radio.on('tasksGot', this.tasksGotHandler);

                return this;
            },
            saveTask: function (value, key, time) {

                this.model.saveTask(value, key, time);
            },
            deleteTask: function (ev, key) {

                this.model.deleteTask(ev, key);
                this.view.deleteTask(ev);
            },
            getTasks: function () {

                this.model.getTasksfromLocalStorage();

            },
            saveTasksLocal: function () {

                this.model.saveTasksInLocalStorage();
            },
            saveTasksAndClean: function () {

                this.model.saveTasksInLocalStorage();
                this.model.cleanTasks();
            },
            newTable: function () {

                this.view.renderTasks();
            },
            cleanTasksFromMonth: function (month, year) {

                this.model.cleanCalendar(month, year);
            },
            tasksGot: function (tasks) {

                this.model.tasksGot(tasks);
                this.view.renderTasks();
            }
        };

        return TaskController;
    });