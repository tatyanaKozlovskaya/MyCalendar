define(['underscore', 'text!templates/RegistrationTemplate.html', 'radio', 'lang'],
    function (_, RegistrationTemplateString, radio, lang) {

        var RegistrationView = function (model) {
            this.model = model;
            this.template = _.template(RegistrationTemplateString);
            this.init();

        };

        RegistrationView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el = document.querySelector('.form-sign-up');
                this.el.addEventListener('click', this.clickHandler.bind(this));
                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.length) {

                    if (targetClasses.indexOf('cancelRegister') !== -1) {

                        this.hide();
                    }
                    if (targetClasses.indexOf('register') !== -1) {
                        this.registerUser();
                        this.hide();
                    }

                }
            },
            show: function () {

                this.el.classList.add('is-active');
                this.el.innerHTML = this.template({
                    signUpText: lang.signUpText,
                    cancelText: lang.cancelText,
                    yourNameText: lang.yourNameText,
                    yourEmailText: lang.yourEmailText,
                    yourPasswordText: lang.yourPasswordText
                });
            },
            hide: function () {

                this.el.classList.remove('is-active');

            },
            registerUser: function () {

                this.name = this.el.querySelector('.registr-name');
                this.email = this.el.querySelector('.registr-email');
                this.password = this.el.querySelector('.registr-password');
                var data = {};
                if (this.name.value) {
                    data['name'] = this.name.value;
                } else {
                    alert('Введите имя!')
                }
                if (this.email.value) {
                    data['email'] = this.email.value;
                } else {
                    alert('Введите email!')
                }
                if (this.password.value) {
                    data['password'] = this.password.value;
                } else {
                    alert('Введите пароль!')
                }
                radio.trigger('registerNewUser', data.email, data.password, data);
                radio.trigger('signInWithEmail', data.email, data.password);
                this.name.value = '';
                this.email.value = '';
                this.password.value = '';
            }
        };
        return RegistrationView
    });