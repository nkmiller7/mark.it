const steps = [
    {
        number: "01",
        title: "Upload Data",
        description:
            "Owners upload financial images — stock charts, news headlines, earnings reports — ready for labeling.",
        icon: (
            <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
            </svg>
        ),
    },
    {
        number: "02",
        title: "Label Tasks",
        description:
            "Skilled contributors with financial domain expertise accurately label each data point.",
        icon: (
            <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
            </svg>
        ),
    },
    {
        number: "03",
        title: "Review & Deliver",
        description:
            "Expert reviewers verify quality and accuracy before delivering clean, structured datasets.",
        icon: (
            <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
            </svg>
        ),
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="bg-gray-50 py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        How It Works
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Three simple steps from raw data to ML-ready datasets.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 md:grid-cols-3">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="group relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <span className="text-xs font-bold tracking-wider text-blue-600">
                                STEP {step.number}
                            </span>
                            <div className="mt-4">{step.icon}</div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
