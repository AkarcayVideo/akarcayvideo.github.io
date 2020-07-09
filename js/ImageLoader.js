let LAST_SCROLL_POSITION = 0;
let LAST_INDEX = 0;

const IMAGE_BASE_URL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/fotograflar";
const parent = document.getElementById("content-holder");

function CreateImage(url, index) {
    const image = document.createElement("img");
    image.src = url;
    parent.appendChild(image);
    image.addEventListener("click", () => ShowImageViewer(index));
    return image;
}

function LoadImage(index) {
    const url = `${IMAGE_BASE_URL}/${index}.jpg`;

    fetch(url).then(response => {

        if (response.ok) {
            CreateImage(url, index);
            LAST_INDEX = index;
        }

    })
}

window.addEventListener('scroll', function() {
    const progress = window.scrollY / (document.body.scrollHeight-window.innerHeight);

    if (progress > .9) {
        LoadImage(LAST_INDEX + 1);
    }
});