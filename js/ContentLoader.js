function LoadContent(index, folderName, fileName, fileExtension) {
    const baseURL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/icerik";
    const link = `${baseURL}/${folderName}/${fileName}${index}.${fileExtension}`;
    const parent = document.getElementById("content-holder");

    const LoadIfExists = (url, callback) => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState == 2)
                callback(request.status == 200);
        }
        request.open("GET", url, true);
        request.send(null);
    }

    LoadIfExists(link, exists => {
        if (exists) {

            let element = null;

            if (fileExtension == "jpeg" || fileExtension == "jpg") {

                const image = document.createElement("img");
                image.src = link;
                element = image;

            }
            else if (fileExtension == "mp4") {

                const video = document.createElement("video");
                video.controls = true;
                const source = document.createElement("source");
                source.src = link;
                source.type = "video/mp4";

                video.appendChild(source);
                element = video;

            }
            else { console.log("File extension not implemented.") }

            if (element) {
                parent.appendChild(element);
                element.addEventListener("click", () => ShowContentViewer(link, fileExtension));
            }

            LoadContent(index + 1, folderName, fileName, fileExtension);
        }
    })
}

function ShowContentViewer(link, extension) {
    const viewer = document.getElementById("content-viewer");
    viewer.style.display = "flex";

    const content = viewer.querySelector(".content");

    if (extension == "jpeg" || extension == "jpg") {
        content.innerHTML = `<img src=${link}>`;
    }
    else if (extension == "mp4") {
        content.innerHTML = `<video controls><source src=${link} type="video/mp4"></source></video>`;
    }
}

// CLOSE CONTENT VIEWER
(function () {

    const viewer = document.getElementById("content-viewer");

    viewer.addEventListener("click", (e) => {

        const y = (e.clientY / window.innerHeight);

        if (y <= .25 || y >= .75) {
            viewer.style.display = "none";
        }

    });

})()