import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Turn Financial Noise into{' '}
            <span className="text-blue-600">Signal</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
            Crowdsourced, expert-driven labeling for financial machine learning.
            Transform raw charts, headlines, and market data into high-quality
            training datasets.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition"
            >
              Start Labeling
            </Link>
            <Link
              to="/signup"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Upload Dataset
            </Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="relative mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-gray-500">AAPL</span>
              </div>
              <span className="text-xs text-gray-400">Live</span>
            </div>
            <svg viewBox="0 0 300 120" className="w-full" fill="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 80 Q30 75 60 60 T120 50 T180 30 T240 45 T300 20"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 80 Q30 75 60 60 T120 50 T180 30 T240 45 T300 20 V120 H0 Z"
                fill="url(#chartGradient)"
              />
            </svg>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Bullish
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Support Level
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Buy Signal
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
