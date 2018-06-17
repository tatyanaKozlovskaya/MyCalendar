define(['models/WeatherModel','views/WeatherView','radio'],
  function(WeatherModel,WeatherView,radio){
    var WeatherController = function () {
        
        this.model = new WeatherModel();
       
        
        this.init();
    };

    WeatherController.prototype = {

    	init: function () {

          this.handlers().enable();

    	},
    	handlers:function () {
          this.getWeatherfirstHandler = this.getWeatherfirst.bind(this);
          this.getWeatherHandler = this.getWeather.bind(this);
          this.weatherThreeDaysHandler = this.weatherThreeDays.bind(this);
          this.getWeatherInfoHandler = this.getWeatherInfo.bind(this);
          this.changeLangHandler = this.changeLang.bind(this);
          
          return this
    	},
    	enable: function () {
          radio.once('initWeather', this.getWeatherfirstHandler);
          radio.on('getNewWeather', this.getWeatherInfoHandler);
          radio.on('weatherThreeDays', this.weatherThreeDaysHandler);
          radio.on('getWeather', this.getWeatherHandler);
          radio.on('changeLang', this.changeLangHandler);
         
          return this;
        },
       getWeatherfirst: function (){
           this.view = new WeatherView(this.model);
         
      },
      getWeatherInfo: function (){
         
          this.model.getInfo();
         
      },
      getWeather: function (){
          
          this.view.getWeather();
         
      },
      weatherThreeDays: function (){

          this.model.getWeatherThreeDays();
         
      },
      changeLang: function (){
           if(this.view){
            this.view.changeLang();
           }
          
         
      }
    };

    return WeatherController;
});