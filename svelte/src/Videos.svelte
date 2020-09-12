<script>
    import { onMount } from "svelte";

    export let pageName;
    export let active;

    let allVideos = [];
    let videos = [];
    let lastLoaded = 0;
    let finished = false;

    async function FetchVideos() {
        const videoList = await GetVideos(pageName);
        allVideos = videoList.split(",").map(id => `https://www.youtube.com/embed/${id}`);
        return allVideos;
    }

    onMount(async () => {
        await FetchVideos();
        LoadVideos(0, 10);
    });

    $: {
        if (active) {
            document.onscroll = ScrollEvent;
            document.ontouchmove = ScrollEvent;
        }
    }

    function LoadVideos(from, to) {
        for (let i=from; i<to; i++) {
            if (allVideos[i]) {
                videos[i] = allVideos[i];
            } else {
                finished = true;
            }
        }

        lastLoaded = to;
    }

    function ScrollEvent () {
        if (!active || finished) { return }

        const DOC = document.documentElement;
        const top = DOC.scrollTop;
        const height = DOC.scrollHeight - DOC.clientHeight;

        const percent = top / height;
        percent >= 0.75 && LoadVideos(lastLoaded, lastLoaded+10);
    }
</script>

<main>
    {#each videos as video}
    <iframe title="video" src={video} frameborder="0" allow="gyroscope; picture-in-picture" allowfullscreen></iframe>
    {/each}
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    iframe { width: 100%; height: 28vw; background-color: black; }

    @media (min-width: 800px) {
        iframe { max-height: 350px }
    }

    @media (max-width: 800px) {
        main { grid-template-columns: 1fr }
        iframe { height: 56vw }
    }
</style>