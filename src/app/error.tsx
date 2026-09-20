"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="crash">
      <h1>Let's try that again.</h1>
      <p>
        Something interrupted this page. Your saved data is still on the server.
      </p>
      <button className="button primary" onClick={reset}>
        Reload the page
      </button>
    </main>
  );
}
