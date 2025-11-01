<script lang="ts">
	import { goto } from '$app/navigation';
	
	const birds = [
		{ name: 'Common Yellowthroat', path: '/common-yellowthroat' },
		{ name: 'Loggerhead Shrike', path: '/loggerhead-shrike' },
		{ name: 'Lesser Goldfinch', path: '/lesser-goldfinch' },
		{ name: "Allen's Hummingbird", path: '/allens-hummingbird' },
		{ name: 'California Towhee', path: '/california-towhee' }
	];
	
	function handleBirdClick(path: string) {
		goto(path);
	}
</script>

<div class="min-h-screen flex flex-col">
	<!-- Header -->
	<header class="pt-6 px-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
				<div class="w-4 h-4 bg-[var(--forest-green)] rounded-full"></div>
			</div>
			<span class="text-white sans-serif text-lg">Santa Barbara Botanic Garden</span>
		</div>
		<hr class="border-t border-white opacity-30" />
	</header>

	<!-- Main Content -->
	<main class="flex-1 flex flex-col items-center justify-center px-8 py-12">
		<!-- Main Title -->
		<h1 class="serif-title text-white text-6xl md:text-7xl text-center mb-6">
			Can You Sing Like a Bird?
		</h1>
		
		<!-- Subtitle -->
		<p class="text-[var(--light-gray)] sans-serif text-lg md:text-xl text-center mb-16 max-w-2xl">
			How close can your call come to the real thing? Listen. Imitate. Compare.
		</p>
		
		<!-- Bird Selection -->
		<div class="flex flex-wrap justify-center gap-8 mb-16">
			{#each birds as bird}
				<button 
					onclick={() => handleBirdClick(bird.path)}
					class="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
				>
					<div class="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 border-2 border-white/30 mb-4 flex items-center justify-center overflow-hidden group-hover:border-white/60 transition-colors">
						<!-- Placeholder for bird image - replace with actual images -->
						<div class="text-white/50 text-4xl">🐦</div>
					</div>
					<span class="text-white sans-serif text-sm md:text-base text-center">{bird.name}</span>
				</button>
			{/each}
		</div>
		
		<!-- Call to Action -->
		<p class="text-white sans-serif text-lg text-center mb-4">
			Click a Bird to Begin.
		</p>
	</main>

	<!-- Footer Line -->
	<footer class="pb-6 px-8">
		<hr class="border-t border-white opacity-30" />
	</footer>
</div>
