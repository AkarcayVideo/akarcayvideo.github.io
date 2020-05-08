function LoadContent(index, parentId, folderName, fileName, fileExtension) {
    const baseURL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/icerik";
    const link = `${baseURL}/${folderName}/${fileName}${index}.${fileExtension}`;
    const parent = document.getElementById(parentId);

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

            if (fileExtension == "jpeg" || fileExtension == "jpg") {
                parent.innerHTML += `<img src="${link}">`;
            }
            else if (fileExtension == "mp4") {
                parent.innerHTML += `
                <video controls>
                    <source src="${link}" type="video/mp4">
                </video>
                `;
            }
            else { console.log("File extension not implemented.") }

            LoadContent(index + 1, parentId, folderName, fileName, fileExtension);
        }
    })
}