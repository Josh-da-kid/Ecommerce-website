<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button, Input } from '$lib/components/ui';
  import { login } from '$lib/stores/auth';
  import { toasts } from '$lib/stores/toast';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    const result = await login(email, password);
    
    if (result.success) {
      toasts.show('success', 'Welcome back!');
      goto('/');
    } else {
      error = result.error || 'Login failed';
    }
    
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Login - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16 flex items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl p-8 shadow-lg">
      <h1 class="text-3xl font-bold font-[var(--font-playfair)] text-text-primary text-center mb-8">
        Welcome Back
      </h1>

      <form onsubmit={handleSubmit} class="space-y-6">
        {#if error}
          <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        {/if}

        <Input
          type="email"
          label="Email"
          bind:value={email}
          placeholder="your@email.com"
          required
        />

        <Input
          type="password"
          label="Password"
          bind:value={password}
          placeholder="••••••••"
          required
        />

        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded border-border" />
            <span class="text-text-secondary">Remember me</span>
          </label>
          <a href="/forgot-password" class="text-accent hover:underline">Forgot password?</a>
        </div>

        <Button type="submit" variant="primary" size="lg" class="w-full" loading={isLoading}>
          Sign In
        </Button>
      </form>

      <p class="text-center text-text-secondary mt-6">
        Don't have an account?
        <a href="/register" class="text-accent hover:underline">Sign up</a>
      </p>
    </div>
  </div>
</div>
