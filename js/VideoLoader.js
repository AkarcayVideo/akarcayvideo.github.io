function DrawAllVideos(index) {
    const videoHolder = document.getElementById("videos");
    const link = `https://akarcayvideo.github.io/videolar/video${index}.jpg`;

    const DoesVideoExists = (url, callback) => {
        const request = new XMLHttpRequest();

        request.onreadystatechange = () => {
            if (request.readyState == 2)
                callback(request.status == 200);
        }

        request.open("GET", url, true);
        request.send(null);
    }

    DoesVideoExists(link, exists => {
        if (exists) {
            videoHolder.innerHTML += `<img src="${link}">`
            DrawAllVideos(index + 1);
        }
    })
}

DrawAllVideos(1);