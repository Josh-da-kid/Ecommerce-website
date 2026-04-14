<script lang="ts">
	import { onMount } from 'svelte';

	let container: HTMLDivElement;
	let frameId: number;
	let mouseX = 0;
	let mouseY = 0;

	let cleanup: (() => void) | null = null;

	onMount(async () => {
		const THREE = await import('three');

		let scene: THREE.Scene;
		let camera: THREE.PerspectiveCamera;
		let renderer: THREE.WebGLRenderer;
		let particles: THREE.Points;

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 30;

		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setClearColor(0x000000, 0);
		container.appendChild(renderer.domElement);

		const geometry = new THREE.BufferGeometry();
		const count = 2000;
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);

		for (let i = 0; i < count * 3; i += 3) {
			positions[i] = (Math.random() - 0.5) * 100;
			positions[i + 1] = (Math.random() - 0.5) * 100;
			positions[i + 2] = (Math.random() - 0.5) * 100;

			colors[i] = 0.8 + Math.random() * 0.2;
			colors[i + 1] = 0.7 + Math.random() * 0.2;
			colors[i + 2] = 0.4 + Math.random() * 0.2;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 0.15,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending
		});

		particles = new THREE.Points(geometry, material);
		scene.add(particles);

		function animate() {
			frameId = requestAnimationFrame(animate);

			particles.rotation.x += 0.0003;
			particles.rotation.y += 0.0005;

			particles.rotation.x += (mouseY * 0.0001 - particles.rotation.x) * 0.05;
			particles.rotation.y += (mouseX * 0.0001 - particles.rotation.y) * 0.05;

			renderer.render(scene, camera);
		}

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}

		function onMouseMove(event: MouseEvent) {
			mouseX = event.clientX - window.innerWidth / 2;
			mouseY = event.clientY - window.innerHeight / 2;
		}

		animate();
		window.addEventListener('resize', onWindowResize);
		document.addEventListener('mousemove', onMouseMove);

		cleanup = () => {
			if (frameId) cancelAnimationFrame(frameId);
			if (renderer) renderer.dispose();
			window.removeEventListener('resize', onWindowResize);
			document.removeEventListener('mousemove', onMouseMove);
		};

		return cleanup;
	});
</script>

<div bind:this={container} class="absolute inset-0 z-0"></div>

<style>
	div :global(canvas) {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
