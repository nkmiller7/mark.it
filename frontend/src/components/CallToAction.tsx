import { Link } from 'react-router-dom';

export default function CallToAction() {
  return (
    <section className="bg-blue-600 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Build Better Financial Models
        </h2>
        <p className="mt-4 text-lg text-blue-100">
          Join the platform that turns raw financial data into ML-ready, expert-labeled datasets.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition"
        >
          Get Started with mark.it
        </Link>
      </div>
    </section>
  );
}
