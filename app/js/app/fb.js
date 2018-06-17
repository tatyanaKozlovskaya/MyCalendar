define(['firebase', 'module', 'radio', 'Error'], function (firebase, module, radio, myError) {
    var fairBase = {


        init: function () {
            firebase.initializeApp(module.config());
            this.user = false || firebase.auth().currentUser;
            this.userData;
            this.data = false;
            this.setupEvents();

        },
        setupEvents: function () {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    this.user = user;
                    this.dataBase(this.data, user.uid);

                } else if (user !== null) {
                    this.user = false;

                    radio.trigger('signInOrOut', this.user);
                } else {
                    radio.trigger('signInOrOut', this.user);
                }

            }.bind(this));

        },
        setupReferensUserPhotos: function () {
            var ref = firebase.database().ref('users/' + this.user.uid + '/images/photos');
            ref.on('value', function (snapshot) {

                radio.trigger('newUserPhotos', snapshot.val(), 'photos');
            });
        },
        setupReferensBackground: function () {
            var refBackground = firebase.database().ref('users/' + this.user.uid + '/images/backgrounds');
            refBackground.on('value', function (snapshot) {

                radio.trigger('newUserPhotos', snapshot.val(), 'backgrounds');
            });
        },
        signInWithGoogle: function () {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function (result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;
                this.user = user;
                this.data = {
                    name: user.displayName,
                    email: user.email
                }
            }.bind(this)).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            })
        },
        signOut: function (user) {
            var func = function () {
                firebase.auth().signOut().then(function () {

                }).catch(function (error) {

                });
                this.user = false;
                this.userData = false;
                console.log('user sign out', this.user);
            }.bind(this);

            setTimeout(func, 1000);
        },
        registerNewUser: function (email, password, data) {
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode == 'auth/weak-password') {
                    alert('The password is too weak.');
                } else {
                    alert(errorMessage);
                }
                console.log(error);
            });
            this.data = data;

        },
        signInWithEmail: function (email, password) {

            firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode === 'auth/wrong-password') {
                    alert('Wrong password.');
                } else {
                    alert(errorMessage);
                }

            });

        },
        dataBase: function (data, userId) {

            return firebase.database().ref('users/' + userId).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    console.log('user exist');
                } else {
                    console.log('new user');
                    firebase.database().ref('users/' + userId + '/').set(data);
                }
                this.getInfo(userId);

            }.bind(this));


        },
        returnName: function (userId) {

            return firebase.database().ref('users/' + userId).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    this.user.name = snapshot.val().name;
                }


            }.bind(this));


        },
        saveTasks: function (tasks) {
            if (this.user) {
                console.log(this.user);
                firebase.database().ref('users/' + this.user.uid + '/tasks').set(tasks);
            }

        },
        saveInfo: function (info, puth) {

            firebase.database().ref('users/' + this.user.uid + puth).set(info);

        },
        getTasks: function () {
            if (firebase.auth().currentUser !== null) {

                return firebase.database().ref('users/' + this.user.uid + '/tasks').once('value').then(function (snapshot) {
                    if (snapshot.val()) {
                        this.tasks = snapshot.val();

                    } else {
                        this.tasks = {};
                    }

                    radio.trigger('tasksGot', this.tasks);

                })
            }

        },
        getInfo: function (uid) {

            return firebase.database().ref('users/' + this.user.uid).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    this.userData = snapshot.val();

                } else {
                    return
                }

                radio.trigger('signInOrOut', this.user);
            }.bind(this))

        },
        deleteInfo: function (puth, id) {
            var storage = firebase.storage();
            var storageRef = storage.ref();
            var desertRef = storageRef.child(puth);
            // Delete the file
            desertRef.delete().then(function () {
                // File deleted successfully
            }).catch(function (error) {
                // Uh-oh, an error occurred!
            });
            var puthForBase = puth.split('.');
            puthForBase = puthForBase[0];
            var id = puthForBase[0].split('/');
            id = id[id.length];
            firebase.database().ref('users/' + this.user.uid + '/' + puthForBase).remove(id)


        },
        deleteInfoSettings: function (puth) {
            firebase.database().ref('users/' + this.user.uid + puth).remove();

        },
        generateId: function () {
            return 'id' + (new Date()).getTime();
        },
        saveInStorage: function (id, file, folder) {
            var fileType = file.name.split('.');
            fileType = fileType[1];
            console.log(fileType);
            if (fileType != 'jpg' && fileType != 'png' && fileType != 'jpeg') {
                myError.create('danger', 'Можно загружать только изображения в формате jpg, jpeg, png!');
                return
            }
            var puth = 'images/' + folder + id + '.' + fileType;
            var storage = firebase.storage();
            var storageRef = storage.ref();
            var uploadTask = storageRef.child(puth).put(file);
            uploadTask.on('state_changed', function (snapshot) {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        break;
                }
            }, function (er) {
                // Handle unsuccessful uploads
                error.create('danger', er);
            }, function () {
                // Handle successful uploads on complete
                // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                var downloadURL = uploadTask.snapshot.downloadURL;
                var dataUrl = {
                    puth: puth,
                    downloadURL: downloadURL
                }
                firebase.database().ref('users/' + this.user.uid + '/images/' + folder + id).set(dataUrl);
                myError.create('ok', 'Фотография загружена успешно!');


            }.bind(this));

        }


    };

    return fairBase
})
;