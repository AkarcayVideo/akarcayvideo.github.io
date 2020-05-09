let LAST_INDEX = 0;

function GenerateImageLink(index) {
    const baseURL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/";
    return `${baseURL}/fotograflar/fotograf${index}.jpeg`;
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

function LoadVideos() {
    LAST_INDEX = 0;
}