export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to T3 Fire
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Get started by editing{" "}
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Next.js 15</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The React framework for production with App Router
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Firebase Auth</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Secure authentication and user management
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">shadcn/ui</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Beautiful and customizable UI components
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}