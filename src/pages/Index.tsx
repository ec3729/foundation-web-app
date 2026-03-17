const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to Your App
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          A clean starting point. Build something amazing from here.
        </p>
        <button className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Get Started
        </button>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Your App. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
