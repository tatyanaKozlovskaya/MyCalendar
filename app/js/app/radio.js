define(function () {
    /**
     * Radio
     * @constructor
     */
    var Radio = function () {
        this.topics = {}
    };

    /**
     * Radio methods
     * @type {{on: Radio.on, trigger: Radio.trigger}}
     */
    Radio.prototype = {
        on: function (topic, listener) {
            // create the topic if not yet created
            if (!this.topics[topic]) {
                this.topics[topic] = [];
            }

            // add the listener
            this.topics[topic].push(listener);
        },

        trigger: function (topic, data1, data2, data3) {
            // return if the topic doesn't exist, or there are no listeners
            if (!this.topics[topic] || this.topics[topic].length < 1) {
                return;
            }

            // send the event to all listeners
            this.topics[topic].map(function (listener) {
                listener(data1, data2, data3);
            });
        },

        off: function (topic, listener) {

            // delete the listener

            var a = this.topics[topic].indexOf(listener);
            this.topics[topic].splice(a, 1);

            // delete the topic if there are not listeners
            if (!this.topics[topic].length < 1) {
                delete this.topics.topic
            }
        },

        once: function (topic, listener) {

            var func = function () {

                listener();
                this.off(topic, func)

            }.bind(this);

            this.on(topic, func);


        }
    };

    var radio = new Radio();
    return radio

});