define(function () {

    var TaskView = function (model) {
        this.model = model;

    };

    TaskView.prototype = {

        deleteTask: function (ev) {

            var ul = ev.target.parentNode.parentNode;
            var ulChild = ul.children;
            ul.removeChild(ev.target.parentNode);
            if (ulChild.length < 1) {
                ul.parentNode.removeChild(ul);
            }
        },
        renderTasks: function () {

            var days = document.getElementsByTagName('td');
            for (var i = 0; i < days.length; i++) {

                var key = days[i].id;

                if (this.model.tasks[key]) {

                    var td = document.getElementById(key);
                    var ul = td.children;
                    if (ul.length < 1) {
                        ul = document.createElement('ul');
                        td.appendChild(ul);
                    } else {
                        ul = td.children[0];
                    }
                    function compareTime(taskA, taskB) {
                        return (+taskA.time.split(':')[0]) - (+taskB.time.split(':')[0]);
                    }

                    var sortTasks = this.model.tasks[key].sort(compareTime);
                    for (var a = 0; a < this.model.tasks[key].length; a++) {


                        var li = document.createElement('li');
                        li.classList.add('notification', 'is-primary');
                        var close = document.createElement('span');
                        var taskTime = document.createElement('span');
                        taskTime.classList.add('timeSpan');
                        taskTime.innerHTML = this.model.tasks[key][a].time + '';

                        li.appendChild(taskTime);
                        li.innerHTML += this.model.tasks[key][a].value + '';
                        li.appendChild(close);
                        close.classList.add('delete');
                        ul.appendChild(li);
                    }

                }
            }
        }
    };

    return TaskView;
});