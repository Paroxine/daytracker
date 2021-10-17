import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-database.js";

//Global variables
var sw_start = 0; //Start of current stopwatch
var sw_running = false;
var sw_interval;

const vapp = new Vue({
    el: "#v-app",
    data: {
        activities: {}
    },
    methods: {
        updateActivities: function (activities) { //called by onValue(...) when the database is updates on /users/$uid/activity
            this.activities = activities;
            for (var act of Object.values(this.activities)) {
                const msinday = 24 * 60 * 60 * 1000;
                var startinday = (act.start) % msinday;
                var top = 100 * (startinday) / msinday;
                var height = 100 * (act.end - act.start) / msinday;
                act.style = {
                    "top": top + "%",
                    "height": height + "%"
                }
            }
        },
        editActivity: function(event) {
            var act = this.activities[event.target.id];
            editorModal.show();
        }
    }
});

const editorModal = new bootstrap.Modal(document.getElementById("editor-modal"))

const firebaseConfig = {
    apiKey: "AIzaSyAAKJWUFlMNQlOCJO6XnH4Gx68C9nXAVHI",
    authDomain: "daytracker-6f56d.firebaseapp.com",
    projectId: "daytracker-6f56d",
    storageBucket: "daytracker-6f56d.appspot.com",
    messagingSenderId: "695023647896",
    appId: "1:695023647896:web:3a7b20486aaadf2281e4ed",
    databaseURL: "https://daytracker-6f56d-default-rtdb.europe-west1.firebasedatabase.app/"
};

var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            $("#auth-overlay").hide(200);
            return false;
        }
    },
    signInSuccessUrl: '/',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', uiConfig);

firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        $("#auth-overlay").show(200);
    } else {
        onValue(ref(db, `/users/${user.uid}/activity/`), (snapshot) => {
            console.log("Data update for user " + user.uid)
            if (!snapshot.exists()) {
                console.log("Doesn't exist");
                return;
            }
            var activities = snapshot.val();
            console.log(activities);
            vapp.updateActivities(activities);
        })
    }
})

$("#start").click((event) => {
    if (!sw_running) {
        sw_start = Date.now();
        sw_running = true;
        sw_interval = setInterval(updateDuration, 9);
        $("#start-icon").removeClass("bi-play-fill");
        $("#start-icon").addClass("bi-stop-fill");
        $("#start").removeClass("start-green");
        $("#start").addClass("start-red");
    } else {
        var sw_stop = Date.now();
        sw_running = false;
        clearInterval(sw_interval);
        registerActivity(sw_start, sw_stop);
        $("#start-icon").removeClass("bi-stop-fill");
        $("#start-icon").addClass("bi-play-fill");
        $("#start").removeClass("start-red");
        $("#start").addClass("start-green");
        $("#duration").text("00:00:00");
    }
});

function updateDuration() { //update stopwatch display
    var ms = Date.now() - sw_start;
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var strhours = hours.toString().padStart(2, "0");
    var strminutes = (minutes % 60).toString().padStart(2, "0");
    var strseconds = (seconds % 60).toString().padStart(2, "0");
    $("#duration").text(`${strhours}:${strminutes}:${strseconds}`);
}

function registerActivity(start, end) { 
    var uid = firebase.auth().currentUser.uid;
    set(ref(db, "/users/" + uid + "/activity/" + start), {
        start: start,
        end: end
    });
}

