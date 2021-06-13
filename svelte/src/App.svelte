<script>
	import Nav from './Nav.svelte';
	import Videos from './Videos.svelte';
	import Photos from './Photos.svelte';
	import Live from './Live.svelte';
	import Radio from './Radio.svelte';

	let page = 0;
</script>

<div id="banner"></div>
<Nav bind:page />

<div id="pages">
	<div class="page" class:active={ page === 0 }><Videos active={ page === 0 } pageName={"anasayfa"} /></div>
	<div class="page" class:active={ page === 1 }><Photos active={ page === 1 } /></div>
	<div class="page" class:active={ page === 2 }><Videos active={ page === 2 } pageName={"nostalji"} /></div>
	<div class="page" class:active={ page === 3 }><Videos active={ page === 3 } pageName={"dugun"} /></div>
	<div class="page" class:active={ page === 4 }><Videos active={ page === 4 } pageName={"klipler"} /></div>
	<div class="page" class:active={ page === 5 }><Live /></div>
	<div class="page" class:active={ page === 6 }><Radio /></div>
</div>

<style>
	#banner {
		width: 100vw;
		height: 300px;
		background-image: url("img/banner.jpg");
		background-position: center;
		background-size: cover;
		position: relative;
	}
	#banner::after {
		content: "";
		width: 100vw;
		height: 4px;
		background-color: #5555ff;
		box-shadow: 0 0 5px #5555ff;
		position: absolute;
		bottom: -2px;
	}
	#pages {
		width: 1500px;
		max-width: 85vw;
		margin-top: 60px;
		position: relative;
	}
	.page { position: absolute; width: 100%; margin-bottom: 50px; }
	.page:not(.active) { opacity: 0; max-height: calc(100vh - 300px); overflow-y: hidden }
	.page.active { opacity: 1; z-index: 1; }
</style>