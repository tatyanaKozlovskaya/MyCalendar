define(['radio', 'lang'],
    function (radio, lang) {


        var WeatherModel = function () {

            this.data = [];
            var date = new Date();
            this.day = date.getDate();
            this.month = date.getMonth();


        };

        WeatherModel.prototype = {

            getInfo: function () {

                var xhr = new XMLHttpRequest();
                if (lang.lang === 'lang-ru') {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=Minsk,by&units=metric&appid=8ddab454f07b89fb6e00c80bb8801f12&lang=ru', true);
                } else {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=Minsk,by&units=metric&appid=8ddab454f07b89fb6e00c80bb8801f12', true);
                }
                xhr.send();
                this.onReady(xhr);

            },
            onReady: function (xhr) {

                xhr.onreadystatechange = function () {

                    if (xhr.readyState !== 4) return;
                    if (xhr.status !== 200) {
                        alert(xhr.status + ': ' + xhr.statusText);
                    } else {
                        this.onReadyState4.bind(this)(xhr);
                    }

                }.bind(this);
            },
            onReadyState4: function (xhr) {

                var json = JSON.parse(xhr.responseText);
                console.log(json);
                if (json.list) {
                    var myData = [];

                    for (var i = 0; i < json.list.length; i++) {

                        if (json.list[i].dt_txt) {
                            var regexp = (/12:00:00/g);
                            if (json.list[i].dt_txt.search(regexp) >= 8) {
                                myData.push(json.list[i])
                            }

                        }
                    }
                    for (var a = 0; a < myData.length; a++) {
                        this.data.push({});
                        if (myData[a].dt_txt) {
                            var cutDate = myData[a].dt_txt.split(' ', 1);
                            cutDate = cutDate[0].split('-');
                            this.data[a].date = cutDate[2] + '.' + cutDate[1];
                        }
                        if (myData[a].main.temp) {
                            if (myData[a].main.temp > 0) {
                                this.data[a].temp = '+' + Math.round(myData[a].main.temp) + ' C';
                            } else if (myData[a].main.temp < 0) {
                                this.data[a].temp = Math.round(myData[a].main.temp) + ' C';
                            }

                        }
                        if (myData[a].weather[0].description) {
                            this.data[a].desc = myData[a].weather[0].description;
                        }
                        if (myData[a].weather[0].icon) {
                            this.data[a].icon = myData[a].weather[0].icon;
                        }
                    }
                } else {
                    if (json.name) {
                        if (json.name === 'Minsk' && lang.lang === 'lang-ru') {
                            this.city = 'Минск';
                        } else {
                            this.city = json.name;
                        }
                        this.data.length = 0;
                        this.data.push({});
                        this.data[0].date = lang.today + ': ' + this.day + ' ' + lang.monthNamesPart[this.month];
                    }
                    if (json.weather[0].icon) {

                        this.data[0].icon = json.weather[0].icon;
                    }
                    if (json.main.temp) {

                        if (json.main.temp > 0) {
                            this.data[0].temp = '+' + (Math.round(json.main.temp)) + ' C';
                        } else if (json.main.temp < 0) {
                            this.data[0].temp = (Math.round(json.main.temp)) + ' C';
                        }
                    }
                    if (json.weather[0].description) {

                        this.data[0].desc = json.weather[0].description;
                    }
                }
                radio.trigger('getWeather');


            },

            getWeatherThreeDays: function () {

                var xhr = new XMLHttpRequest();
                if (lang.lang === 'lang-ru') {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/forecast?q=Minsk&appid=8ddab454f07b89fb6e00c80bb8801f12&units=metric&lang=ru', true);
                } else {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/forecast?q=Minsk&appid=8ddab454f07b89fb6e00c80bb8801f12&units=metric', true);
                }
                xhr.send();
                this.onReady(xhr);
            }
        };

        return WeatherModel
    });