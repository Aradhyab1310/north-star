import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-2">404 – Page not found</h1>
      <p className="mb-4 text-zinc-600">Try heading back to the dashboard.</p>
      <Link className="rounded-md border px-3 py-2" href="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  );
}
