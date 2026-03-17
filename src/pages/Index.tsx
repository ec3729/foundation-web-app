import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xl space-y-6">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Welcome to your new project
          </h1>
          <p className="text-lg text-muted-foreground">
            A clean slate, ready for whatever you want to build.
          </p>
          <Button size="lg" className="mt-2">
            Get Started
          </Button>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
};

export default Index;
