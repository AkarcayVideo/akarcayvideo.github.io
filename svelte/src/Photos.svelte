<script>
    import { onMount } from "svelte";

    const IMAGE_BASE_URL = "https://raw.githubusercontent.com/AkarcayVideo/akarcayvideo.github.io/master/fotograflar";

    export let active;

    let columns = [];
    let photos = [];
    let photoPaths = [];
    let clientWidth = 0;
    let focusedImage = null;
    let focusedIndex = 0;
    let scrollY;
    let lastLoaded = 0;

    $: columnCount = clientWidth > 600 ? 2 : 1;
    $: columnCount && Draw();
    
    $: {
        if (active) {
            document.onscroll = ScrollEvent;
            document.ontouchmove = ScrollEvent;
        }
    }

    $: finished = lastLoaded >= photoPaths.length;

    onMount(async () => {
        const focusedImage = document.querySelector("#focused-image");
        document.body.appendChild(focusedImage);

        photoPaths = await GetImagePaths();
        LoadMore();
    })

    async function LoadImage(path) {
        const ref = imagesRef.child(path);
        const url = await ref.getDownloadURL();
        photos.push(url);
        photos = [...new Set(photos)].sort();
        await new Promise((res, rej) => { setTimeout(res, 1) })
        Draw();
    }

    async function LoadImages(from, to) {
        for (let i=from; i<to; i++) {
            await LoadImage(photoPaths[i]);
            lastLoaded = to;
        }
    }

    async function LoadMore() {
        // Load 2 more columns
        LoadImages(lastLoaded, lastLoaded + columnCount * 2);
    }

    function Draw() {
        columns = [];

        photos.forEach((photo, i) => {
            const col = i % columnCount;
            columns[col] = [...columns[col] || [], photo]
        })
    }

    function ScrollEvent () {
        if (!active || finished) { return }

        const DOC = document.documentElement;
        const top = DOC.scrollTop;
        const height = DOC.scrollHeight - DOC.clientHeight;

        const percent = top / height;
        percent >= 0.75 && LoadMore();
    }

    $: style = `grid-template-columns: repeat(${columnCount}, 1fr)`

    /* FOCUS SYSTEM */
    function Focus(photo) {
        if (clientWidth <= 600) { return }

        focusedIndex = parseInt(photo.split("/").pop().replace(".jpg", ""));
        focusedImage = photo;
        ScrollEnabled(false);
    }
    
    function FocusPrev() {
        const photo = `${IMAGE_BASE_URL}/${focusedIndex - 1}.jpg`;
        Focus(photo);
    }

    function FocusNext() {
        const photo = `${IMAGE_BASE_URL}/${focusedIndex + 1}.jpg`;
        Focus(photo);

        if (focusedIndex >= photos.length - 2 && !finished) {
            LoadMore();
        }
    }

    function LoseFocus(e) {
        if (e.target.id !== "focused-image") { return }

        focusedImage = "";
        ScrollEnabled(true);
    }

    /* ENABLE & DISABLE SCROLLING */
    let supportsPassive = false;
    window.addEventListener("test", null, Object.defineProperty({}, 'passive', { get: () => { supportsPassive = true; } }));
    const preventDefault = e => e.preventDefault();
    const wheelOpt = supportsPassive ? { passive: false } : false;
    const wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
    function ScrollEnabled(enabled) {
        if (enabled) {
            window.removeEventListener('DOMMouseScroll', preventDefault, false);
            window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
            window.removeEventListener('touchmove', preventDefault, wheelOpt);
        } else {
            window.addEventListener('DOMMouseScroll', preventDefault, false);
            window.addEventListener(wheelEvent, preventDefault, wheelOpt);
            window.addEventListener('touchmove', preventDefault, wheelOpt);
        }
    }
</script>

<main bind:clientWidth style="{style}">
    {#each columns as column}
    <div class="column">
        {#each column as photo}
        <img on:click={() => { Focus(photo) }} src={photo} alt="Resim" />
        {/each}
    </div>
    {/each}
</main>

<svelte:window bind:scrollY></svelte:window>

<div id="focused-image" style="display: {!!focusedImage ? "block" : "none"}; top: {scrollY}px" on:click={LoseFocus}>
    {#if focusedIndex > 1}
    <img id="arrow" class="prev" src="img/arrow.svg" alt="Previous" on:click={FocusPrev} />
    {/if}

    <img id="image" src={focusedImage} alt="Resim" />

    {#if focusedIndex < photos.length}
    <img id="arrow" class="next" src="img/arrow.svg" alt="Next" on:click={FocusNext} />
    {/if}
</div>

<style>
    :root { --gap: 15px }
    main {
		width: 100%;
        display: grid;
		gap: var(--gap);
    }
    main img {
        width: 100%;
        margin-top: var(--gap);
        box-shadow: 0 0 4px #aaa;
        cursor: pointer;
        animation: show 1s;
        animation-timing-function: ease-in-out;
        position: relative;
        background: #aaa;
    }
    main img:nth-child(1) { margin: 0 }
    main img:hover {
        transform: scale(1.03);
        box-shadow: 0 0 6px #000;
        z-index: 1;
    }
    main img:not([src]) { height: 200px }

    #focused-image {
        position: absolute;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0,0,0,0.8);
        backdrop-filter: blur(2px);
        z-index: 1;
        user-select: none;

        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    #focused-image #image {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: absolute;
        max-width: 80vw;
        max-height: 80vh;
        border: 2px solid white;
        border-radius: 10px;
    }
    #focused-image #arrow {
        width: 64px;
        height: 64px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        opacity: .7;
        transition: opacity .2s;
    }
    #focused-image #arrow:hover { opacity: 1; }
    #focused-image #arrow.prev { left: 50px; transform: rotate(180deg) }
    #focused-image #arrow.next { right: 50px }

    @media (max-width: 1100px) {
        #focused-image #arrow  {
            top: unset;
            transform: translateY(0);
            bottom: 50px;
            margin: 0 -100px;
        }
        #focused-image #arrow.prev { left: 50%;  transform: translateX(-50%) rotate(180deg); }
        #focused-image #arrow.next { right: 50%; transform: translateX(-50%); }
    }

    @keyframes show {
        from { opacity: 0 }
        to { opacity: 1 }
    }
</style>