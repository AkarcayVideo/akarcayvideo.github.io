const parent = document.getElementById("content-holder");

function LoadVideos(page) {
    const videos = VIDEOS[page];

    for (let i = 0; i < videos.length; i++) {

        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube.com/embed/" + videos[i];
        iframe.frameBorder = 0;
        iframe.allowFullscreen = true;
        parent.appendChild(iframe);

    }
}