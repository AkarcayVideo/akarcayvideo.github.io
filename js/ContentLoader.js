let LAST_INDEX = 0;
let LAST_SCROLL_POSITION = 0;

function GenerateImageLink(index) {
    const baseURL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/";
    return `${baseURL}/fotograflar/${index}.jpg`;
}

function LoadPhotos(index) {
    const link = GenerateImageLink(index);
    const parent = document.getElementById("content-holder");

    const GetRequestStatus = (url, callback) => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState == 2)
                callback(request.status == 200);
        }
        request.open("GET", url);
        request.send(null);
    }

    GetRequestStatus(link, exists => {
        if (exists) {

            const image = document.createElement("img");
            image.src = link;
            parent.appendChild(image);
            image.addEventListener("click", () => ShowImageViewer(index));
            LoadPhotos(index + 1);

        }
        else { LAST_INDEX = index - 1 }
    })
}

function LoadVideos(page) {
    const parent = document.getElementById("content-holder");
    const videos = VIDEOS[page];

    for (let i = 0; i < videos.length; i++) {

        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube.com/embed/" + videos[i];
        iframe.frameBorder = 0;
        iframe.allowFullscreen = true;
        parent.appendChild(iframe);

    }

    LAST_INDEX = VIDEOS[page].length;
}

function ShowImageViewer(index) {
    const viewer = document.getElementById("content-viewer");
    const link = GenerateImageLink(index);
    viewer.style.display = "flex";
    LAST_SCROLL_POSITION = window.scrollY;
    ScrollLock(true);

    const content = viewer.querySelector(".content");
    content.innerHTML = `<img src=${link}>`;

    const left = viewer.querySelector(".left");
    const right = viewer.querySelector(".right");
    left.style.visibility = index == 1 ? "hidden" : "visible";
    right.style.visibility = index == LAST_INDEX ? "hidden" : "visible";

    left.onclick = () => ShowImageViewer(index - 1);
    right.onclick = () => ShowImageViewer(index + 1);
}

function ScrollLock(lock) {

    const body = document.querySelector("body");

    if (lock) {

        window.scrollTo(0, 0);
        body.style.height = "100vh";
        body.style.overflowY = "hidden";

    } else {

        body.style.height = "unset";
        body.style.overflowY = "visible";
        window.scrollTo(0, LAST_SCROLL_POSITION);

    }

}

// CLOSE CONTENT VIEWER
(function () {

    const viewer = document.getElementById("content-viewer");

    viewer.addEventListener("click", (e) => {

        const y = (e.clientY / window.innerHeight);

        if (y <= .3 || y >= .7) {
            viewer.style.display = "none";
            ScrollLock(false);
        }

    });

})()