let LAST_INDEX = 0;

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

            console.log(link);
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