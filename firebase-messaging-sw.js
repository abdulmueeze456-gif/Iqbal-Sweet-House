/* =========================================
   IQBAL SWEET HOUSE
   Firebase Cloud Messaging Service Worker
========================================= */


importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);


importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);


firebase.initializeApp({

    apiKey:
        "AIzaSyA-hR_0wDdfi8IplhiC34KQYg0iEJ0qPJY",

    authDomain:
        "iqbal-sweet-house.firebaseapp.com",

    projectId:
        "iqbal-sweet-house",

    storageBucket:
        "iqbal-sweet-house.firebasestorage.app",

    messagingSenderId:
        "991959394451",

    appId:
        "1:991959394451:web:f4e16d2d6f37de81648566"

});


const messaging =
    firebase.messaging();


messaging.onBackgroundMessage(
    function (payload) {

        console.log(
            "[firebase-messaging-sw.js] Background message:",
            payload
        );


        const title =
            payload.notification?.title ||
            "Iqbal Sweet House";


        const options = {

            body:
                payload.notification?.body ||
                "New notification received.",

            icon:
                "/favicon.ico",

            data: {

                url:
                    payload.data?.url ||
                    "/admin.html"

            }

        };


        self.registration.showNotification(
            title,
            options
        );

    }
);


self.addEventListener(
    "notificationclick",
    function (event) {

        event.notification.close();


        const targetUrl =
            event.notification?.data?.url ||
            "/admin.html";


        event.waitUntil(

            clients.matchAll({

                type: "window",

                includeUncontrolled: true

            })

            .then(function (clientList) {

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client &&
                        client.url.includes(
                            "/admin.html"
                        )
                    ) {

                        return client.focus();

                    }

                }


                if (clients.openWindow) {

                    return clients.openWindow(
                        targetUrl
                    );

                }

            })

        );

    }
);