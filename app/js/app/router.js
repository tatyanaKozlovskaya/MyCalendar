define(function () {
    var Router = function (config) {
        this.routs = config;
        this.init();

    };

    Router.prototype = {
        init: function () {
            window.addEventListener('hashchange', this.hashHandler.bind(this));
        },
        hashHandler: function (ev) {
            var nameOld = ev.oldURL.split('#');
            if (nameOld.length === 1) {
                nameOld = "";
            } else {
                nameOld = nameOld[nameOld.length - 1];
            }
            var nameNew = ev.newURL.split('#');
            nameNew = nameNew[nameNew.length - 1];
            var newRoute = this.routs.find(function (route) {
                return (route.name === window.location.hash)

            });
            var oldRoute = this.routs.find(function (route) {
                return (route.name === '#' + nameOld)

            });

            Promise.resolve()
                .then(oldRoute.onLeave)
                .then(newRoute.onEnter)
        }

    };

    return Router

});

