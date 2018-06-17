define(['radio'],
    function (radio) {
        'use strict';
        var Content = function Content() {

            this.el = document.querySelector('#content');
            this.lang = 'lang-ru';
            this.handlers()
                .enable()
                .changeLang();

        };
        Content.prototype = {

            handlers: function () {
                this.changeLangHandler = this.changeLang.bind(this);

                return this
            },
            enable: function () {

                radio.on('changeLangContent', this.changeLangHandler);

                return this;
            },
            changeLang: function (ev) {

                var xhr = new XMLHttpRequest();
                if (ev && ev.target.id === 'lang-en') {
                    xhr.open('GET', 'data/lang_en.json', true);
                } else {
                    xhr.open('GET', 'data/lang_ru.json', true);
                }
                xhr.send();

                xhr.onreadystatechange = function () {

                    if (xhr.readyState !== 4) return;

                    if (xhr.status !== 200) {
                        alert(xhr.status + ': ' + xhr.statusText);
                    } else {
                        var json = JSON.parse(xhr.responseText);
                        this.monthNames = json.monthNames.split(',');
                        this.monthNamesPart = json.monthNamesPart.split(',');
                        this.dayNames = json.dayNames.split(',');
                        this.modalTitle = json.modalTitle;
                        this.save = json.save;
                        this.cancel = json.cancel;
                        this.buttonShowText = json.buttonShow;
                        this.buttonCleanText = json.buttonClean;
                        this.lang = json.lang;
                        this.today = json.today;
                        this.show3days = json.show3days;
                        this.show1day = json.show1day;
                        this.timeText = json.timeText;
                        this.signInText = json.signInText;
                        this.signInWithGoogleText = json.signInWithGoogleText;
                        this.youNeedAutorisation = json.youNeedAutorisation;
                        this.signOut = json.signOut;
                        this.nowYouCan = json.nowYouCan;
                        this.signUpText = json.signUpText;
                        this.cancelText = json.cancelText,
                            this.yourNameText = json.yourNameText,
                            this.yourEmailText = json.yourEmailText,
                            this.yourPasswordText = json.yourPasswordText

                        radio.trigger('changeLang');
                    }
                }.bind(this)

            }

        };

        var lang = new Content;
        return lang;

    });