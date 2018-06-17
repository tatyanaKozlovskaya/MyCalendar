define(['controllers/CalendarController', 'controllers/MenuController', 'controllers/TaskController', 'radio', 'fb', 'lang', 'router'],
    function (CalendarController, MenuController, TaskController, radio, fb, lang, Router) {
        'use strict';

        return {
            handlers: function () {

                this.initOtherHandler = this.initOther.bind(this);

            },
            enable: function () {

                radio.once('signInOrOut', this.initOtherHandler);
            },

            init: function () {
                this.handlers();
                this.enable();

                fb.init();

                radio.trigger('onload');

                this.pagehide();
            },
            pagehide: function () {

                window.addEventListener('pagehide', this.windowHandler);
            },
            initOther: function () {
                this.menu = new MenuController();
                this.calendar = new CalendarController();
                this.routerConfig();
                lang.handlers().enable().changeLang();

            },
            windowHandler: function () {

                radio.trigger('pageHide');
            },
            routerConfig: function () {
                var config = [{
                    name: '#',
                    onLeave: function () {
                        var cal = document.querySelector('#container');
                        cal.classList.add('noneDisplay');
                    },
                    onEnter: function () {
                        var cal = document.querySelector('#container');
                        cal.classList.remove('noneDisplay');
                    }
                },
                    {
                        name: '#ToDoList',
                        onLeave: function () {
                            var toDo = document.querySelector('#to-do-list');
                            toDo.classList.add('noneDisplay');
                        },
                        onEnter: function () {
                            var toDo = document.querySelector('#to-do-list');
                            toDo.classList.remove('noneDisplay');
                        }
                    },
                    {
                        name: '#Calendar',
                        onLeave: function () {
                            var cal = document.querySelector('#container');
                            cal.classList.add('noneDisplay');
                        },
                        onEnter: function () {
                            var cal = document.querySelector('#container');
                            cal.classList.remove('noneDisplay');
                        }
                    }];
                var router = new Router(config);
            }
        }
    }
);