function ShowImageViewer(index) {
    const viewer = document.getElementById("content-viewer");
    const url = `${IMAGE_BASE_URL}/${index}.jpg`;
    viewer.style.display = "flex";

    LAST_SCROLL_POSITION = window.scrollY;
    ScrollLock(true);

    viewer.querySelector(".content").innerHTML = `<img src=${url}>`;

    const left = viewer.querySelector(".left");
    const right = viewer.querySelector(".right");
    left.style.visibility = index == 1 ? "hidden" : "visible";
    right.style.visibility = index == LAST_INDEX ? "hidden" : "visible";

    left.onclick = () => ShowImageViewer(index - 1);
    right.onclick = () => ShowImageViewer(index + 1);
}

function ScrollLock(lock) {

    const body = document.body;
    window.scrollTo(0, lock ? 0 : LAST_SCROLL_POSITION);
    body.style.height = lock ? "100vh" : "unset";
    body.style.overflowY = lock ? "hidden" : "visible";

}

// CLOSE CONTENT VIEWER
(function () {

    const viewer = document.getElementById("content-viewer");

    const Close = () => {
        viewer.style.display = "none";
        ScrollLock(false);
    }

    viewer.addEventListener("click", (e) => {

        const y = (e.clientY / window.innerHeight);
    
        // DESKTOP
        if (window.innerWidth >= 500) {
            if (y <= .3 || y >= .7) {
                Close();
            }
        }
        // MOBILE
        else if (y <= .5) { Close(); }

    });

})()