define(function () {

    return error = {
        create: function (type, value) {

            switch (type) {
                case 'danger':
                    var divD = document.createElement('div');
                    divD.classList.add('notification', 'is-danger', 'errorNot');
                    divD.innerHTML = value;
                    var cont = document.querySelector('#menu');
                    cont.appendChild(divD);
                    setTimeout(this.delete, 1500, divD);

                    break;
                case 'ok':
                    console.log(value);
                    var divO = document.createElement('div');
                    divO.classList.add('notification', 'is-primary', 'errorNot');
                    divO.innerHTML = value;
                    var contO = document.querySelector('#menu');
                    contO.appendChild(divO);
                    setTimeout(this.delete, 1500, divO);
                    break;
            }
        },
        delete: function (el) {
            el.parentNode.removeChild(el);
        }

    }

});