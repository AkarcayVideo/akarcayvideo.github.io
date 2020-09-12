<script>
    export let page;
</script>

<nav>
    <span on:click={() => { page = 0 }} class:active={ page == 0 }>Anasayfa   </span>
    <span on:click={() => { page = 1 }} class:active={ page == 1 }>Fotoğraflar</span>
    <span on:click={() => { page = 2 }} class:active={ page == 2 }>Nostalji   </span>
    <span on:click={() => { page = 3 }} class:active={ page == 3 }>Düğün      </span>
    <span on:click={() => { page = 4 }} class:active={ page == 4 }>Klipler    </span>
    <span on:click={() => { page = 5 }} class:active={ page == 5 }>Canlı Yayın</span>
</nav>

<style>
    nav {
        width: 600px;
        max-width: 75vw;
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
    }
    span {
        padding: 10px;
        display: inline-block;
        font-size: 1.3em;
        cursor: pointer;
    }
    span:not(.active) { color: #aaa }
    span:not(.active):hover { color: #555 }
    span.active { color: blue }

    @media (max-width: 750px) {
        nav { flex-direction: column }
    }
</style>