define(['underscore','text!templates/MenuTemplate.html','radio','lang','fb','controllers/RegistrationController'],
    function(_,MenuTemplateString,radio,lang,fb,RegistrationController){

        var MenuView = function (model) {
            this.model = model;
            this.el = document.querySelector('#menu');
            this.lang = lang.lang;
            this.template =  _.template(MenuTemplateString);
            this.init();

        };

        MenuView.prototype = {
            
            init: function(){
              this.enable();
            },
            enable: function(){
                this.el.addEventListener('click', this.clickHandler.bind(this));
                this.el.addEventListener('change', this.menuChangeHandler.bind(this));
                return this
            },
            render: function(){
               this.el.classList.add('header-with-user');
               this.el.innerHTML = this.template({
                      cleanText: lang.buttonCleanText,
                      showText: lang.buttonShowText,
                      monthNames: lang.monthNames,
                      signInText: lang.signInText,
                      signInWithGoogleText: lang.signInWithGoogleText,
                      signUpText:lang.signUpText,
                      signOutText: lang.signOut,
                      user: fb.userData
                    
               });
               if(fb.userData && fb.userData.avatar)
               {
                 this.avatar = fb.userData.avatar.id;
               }
                if(fb.userData &&  fb.userData.backgrounds)
               {
                 this.background = fb.userData.backgrounds;
               }
               
                this.dataSettings = this.el.querySelector('.dateSettings');
                this.dataSettingsButton = this.el.querySelector('.dateButton');
                this.userSettings = this.el.querySelector('.user-settings');
                this.userProfile = this.el.querySelector('.user-profile');
                this.userProfilePhotos = this.el.querySelector('.user-profile-fotos');
                this.userBackgroundPhotos = this.el.querySelector('.user-backgrounds');
                this.avatarEl = this.el.querySelector('.user-img-button');
                radio.trigger('initWeather');
                radio.trigger('getNewWeather');

                return this
            },
            clickHandler: function(ev){
               var targetClasses = ev.target.className.split(' ');
               if (ev.target.id === 'showNewCalendar') {
                
                    radio.trigger('newData',this.model.year,this.model.month);
                    radio.trigger('render');
                }

                if (ev.target.id === 'cleanCalendar') {

                   radio.trigger('cleanCalendar',ev);
                }

                if (ev.target.id === 'lang-en' && ev.target.id !== this.lang || ev.target.id === 'lang-ru' && ev.target.id !== this.lang ) {
                    radio.trigger('changeLangContent',ev); 
                }

                if (targetClasses.length) {
                    if (targetClasses.indexOf('sign-in') !== -1) {
                          radio.trigger('sign-in');
                          this.signInwithEmail();
                    }
                    if (targetClasses.indexOf('sign-google-in') !== -1) {
                          radio.trigger('sign-google-in');
                    }
                    if (targetClasses.indexOf('sign-out') !== -1) {
                          radio.trigger('sign-out');
                    }
                    if (targetClasses.indexOf('sign-up') !== -1) {
                         this.registerHelper = new RegistrationController;
                          radio.trigger('sign-up-now');
                    }
                    if (targetClasses.indexOf('dateButtonImg') !== -1) {
                        this.showDateSettings();
                    }
                    if (targetClasses.indexOf('delete-date-settings') !== -1) {
                        this.hideDateSettings();
                    }
                    if (targetClasses.indexOf('settings-button-img') !== -1) {
                        this.hideAndShow(this.userSettings);
                    }
                    if (targetClasses.indexOf('return-user-settings') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('user-img-button') !== -1) {
                        this.hideAndShow(this.userProfile);
                    }
                    if (targetClasses.indexOf('return-user-profile') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('caption-user-photo') !== -1) {
                        this.hideAndShow(this.userProfilePhotos);
                        fb.setupReferensUserPhotos();
                    }
                    if (targetClasses.indexOf('return-user-profile-fotos') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('background-button') !== -1) {
                        this.hideAndShow(this.userBackgroundPhotos);
                        fb.setupReferensBackground();
                    }
                    if (targetClasses.indexOf('return-user-backgrounds') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('mini-img-photos') !== -1) {
                        this.setNewUserPhoto(ev,ev.target.src);
                    }
                    if (targetClasses.indexOf('mini-img-backgrounds') !== -1) {
                        this.setNewBackground(ev,ev.target.src);
                    }
                    if (targetClasses.indexOf('delete-user-picture') !== -1) {
                      var dataSrc = ev.target.previousSibling.attributes[1].nodeValue;
                      var dataId = ev.target.previousSibling.attributes[2].nodeValue;
                      this.chekPicture(dataId);
                      this.deletePicture(ev,ev.target.src,dataSrc);
                    }
                    

                }
                
            	
            },
            menuChangeHandler: function (ev) {

                event.stopPropagation();
                var targetClasses = ev.target.className.split(' ');
                if (ev.target.id === 'selectMonth') {
                    var selind = document.getElementById('selectMonth').options.selectedIndex;
                    var month = document.getElementById('selectMonth').options[selind].value;
                    month = parseInt(month) + 1;
                    radio.trigger('updateMonth',month);

                }

                if (ev.target.id === 'selectYear') {

                    var sel = document.getElementById('selectYear').options.selectedIndex;
                    var year = document.getElementById('selectYear').options[sel].value;
                    year = parseInt(year);
                    radio.trigger('updateYear',year);
                }
                if (targetClasses.length) {
                    if (targetClasses.indexOf('photos-download') !== -1) {
                            var folder = 'photos/';
                            this.imgDownload(ev,folder);
                    }
                }
                if (targetClasses.length) {
                    if (targetClasses.indexOf('background-download') !== -1) {
                            var folder = 'backgrounds/';
                            this.imgDownload(ev,folder);
                    }
                }
            },
            changeLang: function(){
                
                this.lang = lang.lang;
                this.render();

               return this
            },
            signInwithEmail: function(){
                
               this.email = this.el.querySelector('.email');
               this.password = this.el.querySelector('.password');

                 if(this.email.value ){
                     var email = this.email.value;
                 } else {
                    alert('Введите email!')
                 }
                 if(this.password.value ){
                     var password = this.password.value;
                 } else {
                    alert('Введите пароль!')
                 }
                     radio.trigger('signInWithEmail',email,password);
                     console.log(email,password);
  

            },
            showDateSettings: function () {
             
              this.dataSettings.classList.remove('noneDisplay');
              this.dataSettingsButton.classList.add('noneDisplay');
            },
            hideDateSettings: function () {
             
              this.dataSettings.classList.add('noneDisplay');
              this.dataSettingsButton.classList.remove('noneDisplay');
            },
            
            hideSettings: function () {
              
              var allSettings = document.getElementsByClassName('user-class');
              for(var i=0;i<allSettings.length;i++){
                  allSettings[i].classList.add('noneDisplay');

                }
            },
            
            hideAndShow: function (showEl) {
             
             this.hideSettings();
             showEl.classList.remove('noneDisplay');
              
            },
            imgDownload: function (ev,folder) {
             
                    var fileList = ev.target.files;
                    var file = fileList[0];
                    var id = fb.generateId();
                    fb.saveInStorage(id,file,folder);
                    console.log(id,file); 
            },
            newUserPhotos: function (snapshot,type) {
             if(type === 'photos'){
                var container = this.el.querySelector('.my-photos');
             } else if (type === 'backgrounds'){
                var container = this.el.querySelector('.my-backgrounds');
             }
                 
                  if(container){
                    container.innerHTML='';
                    for(var prop in snapshot){
                    var img = document.createElement('img');
                    var imgContainer = document.createElement('div');
                    var spanDelete = document.createElement('span');
                    spanDelete.classList.add('delete','delete-user-picture');

                    img.setAttribute('src', snapshot[prop].downloadURL);
                    img.setAttribute('data-src',snapshot[prop].puth);
                    img.setAttribute('data-id', prop);
                    img.classList.add('mini-img-'+type);
                    imgContainer.classList.add('mini-img');
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(spanDelete);
                    container.appendChild(imgContainer);
                  }
                  
                }
            },
            setNewUserPhoto: function (ev,src) {
                var puth = '/avatar';
                ev.target.classList.add('now-user-photo');
                var id = ev.target.attributes[2].nodeValue;
                var info ={
                  src : src,
                  id: id
                }
                fb.saveInfo(info,puth);

                this.avatar = id;
                var userPhoto = document.getElementsByClassName('user-img');
                if(userPhoto.length){
                  for(var i=0;i<userPhoto.length;i++){
                  userPhoto[i].setAttribute('src', src);
                }
                } else {
                  userPhoto.setAttribute('src', src);
                }

            },
            setNewBackground: function (ev,src) {
                var puth = '/backgrounds';
                this.background = ev.target.attributes[2].nodeValue;
                document.body.style.backgroundImage = 'url('+src+')';
                document.body.style.backgroundSize = 'cover';
                fb.saveInfo(src,puth);

            },
            chekPicture: function (id) {
               
                 if(id == this.avatar){
                  var puth = '/avatar'
                  fb.deleteInfoSettings(puth);
                  this.avatarEl.setAttribute('src','img/user_pic.jpg');
                 }else if(id == this.background){
                  var puth = '/backgrounds'
                  fb.deleteInfoSettings(puth);
                  document.body.style.backgroundImage = 'url("img/Light-Abstract-Wallpapers.jpg")';
                 }
            },
            deletePicture: function (ev,src,dataSrc) {
                var img = ev.target.parentElement;
                img.parentNode.removeChild(img);
                var puth = dataSrc;
                fb.deleteInfo(puth);
            }
          
        };

        return MenuView;
});