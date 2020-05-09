const GenerateLink = (index, folderName, fileName, fileExtension) => {
    const baseURL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/icerik";
    return `${baseURL}/${folderName}/${fileName}${index}.${fileExtension}`;
}

const GetRequestStatus = (url, callback) => {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        if (request.readyState == 2)
            callback(request.status == 200);
    }
    request.open("GET", url);
    request.send(null);
}

function LoadContent(index, folderName, fileName, fileExtension) {
    const link = GenerateLink(index, folderName, fileName, fileExtension);
    const parent = document.getElementById("content-holder");

    GetRequestStatus(link, exists => {
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
                element.addEventListener("click", () => {
                    ShowContentViewer(index, folderName, fileName, fileExtension)
                });
            }

            LoadContent(index + 1, folderName, fileName, fileExtension);
        }
    })
}

function ShowContentViewer(index, folderName, fileName, fileExtension) {
    const viewer = document.getElementById("content-viewer");
    const link = GenerateLink(index, folderName, fileName, fileExtension);
    viewer.style.display = "flex";

    const content = viewer.querySelector(".content");

    if (fileExtension == "jpeg" || fileExtension == "jpg") {
        content.innerHTML = `<img src=${link}>`;
    }
    else if (fileExtension == "mp4") {
        content.innerHTML = `
            <video controls>
                <source src=${link} type="video/mp4">
            </source></video>
        `;
    }

    const left = viewer.querySelector(".left");
    const right = viewer.querySelector(".right");
    const rightLink = GenerateLink(index + 1, folderName, fileName, fileExtension);
    left.style.visibility = index == 1 ? "hidden" : "visible";

    GetRequestStatus(rightLink, exists => {
        right.style.visibility = exists ? "visible" : "hidden";
    })

    left.addEventListener("click", () => {
        ShowContentViewer(index - 1, folderName, fileName, fileExtension);
    });
    right.addEventListener("click", () => {
        ShowContentViewer(index + 1, folderName, fileName, fileExtension);
    });
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