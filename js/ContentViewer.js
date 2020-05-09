function ShowImageViewer(index) {
    const viewer = document.getElementById("content-viewer");
    const link = GenerateImageLink(index);
    viewer.style.display = "flex";
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

/*
function ShowVideoViewer(index, videos) {
    const viewer = document.getElementById("content-viewer");
    viewer.style.display = "flex";
    ScrollLock(true);

    const content = viewer.querySelector(".content");
    content.innerHTML = `<iframe src="${videos[index]}" frameborder="0"></iframe>`

    const left = viewer.querySelector(".left");
    const right = viewer.querySelector(".right");
    left.style.visibility = index == 1 ? "hidden" : "visible";
    right.style.visibility = index == videos.length ? "hidden" : "visible";

    left.onclick = () => ShowVideoViewer(index - 1, videos);
    right.onclick = () => ShowVideoViewer(index + 1, videos);
}
*/

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

function ScrollLock(lock) {

    const body = document.querySelector("body");

    if (lock) {

        window.scrollTo(0, 0);
        body.style.height = "100vh";
        body.style.overflowY = "hidden";

    } else {

        body.style.height = "unset";
        body.style.overflowY = "visible";

    }

}