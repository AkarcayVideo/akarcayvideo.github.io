const firebaseConfig = {
    apiKey: "AIzaSyBG2iPaAP6I-ZmYbI419bd0SIbLW5k9oqw",
    authDomain: "akarcayvideo-backup.firebaseapp.com",
    databaseURL: "https://akarcayvideo-backup.firebaseio.com",
    projectId: "akarcayvideo-backup",
    storageBucket: "akarcayvideo-backup.appspot.com",
    messagingSenderId: "283416167653",
    appId: "1:283416167653:web:32ec6ab0077a2b8ff7c00c",
    measurementId: "G-PG6Y35636F"
}
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const database = firebase.database();
const storage = firebase.storage().ref();
const imagesRef = storage.child('images');

async function GetVideos(page) {
    const snapshot = await database.ref('/' + page).once('value');
    return snapshot.val();
}
async function GetImagePaths() {
    const list = await imagesRef.listAll();
    const paths = list.items.map(item => item.location.path.replace("images/", ""));
    return paths;
}