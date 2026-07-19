export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-xs uppercase tracking-[0.35em] text-bone-muted">
        The ravens are gathering
      </p>
      <h1 className="font-display text-5xl font-semibold tracking-wide text-gold sm:text-7xl">
        RAVENSPIRE
      </h1>
      <p className="mt-6 max-w-md text-base text-bone-muted sm:text-lg">
        See every chain. Fear no rug. Rule your realm.
      </p>
      <a
        href="/home"
        className="mt-10 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-gold-deep"
      >
        Enter the realm
      </a>
    </main>
  );
}
