const roles = [
  {
    title: 'Owners',
    tagline: 'Get clean, structured datasets',
    description:
      'Upload your financial images and let our expert workforce label them with precision. Focus on building models, not cleaning data.',
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    ),
    color: 'bg-blue-50',
  },
  {
    title: 'Labelers',
    tagline: 'Earn by applying your financial knowledge',
    description:
      'Put your expertise in charts, technicals, and market analysis to work. Complete labeling tasks and earn on your own schedule.',
    icon: (
      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
      </svg>
    ),
    color: 'bg-green-50',
  },
  {
    title: 'Reviewers',
    tagline: 'Ensure accuracy and maintain quality',
    description:
      'Validate labeled data for correctness and consistency. Your expertise ensures only the best datasets are delivered.',
    icon: (
      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    color: 'bg-purple-50',
  },
];

export default function UserRoles() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Built for Every Role
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Whether you own data, label it, or review it - mark.it has you covered.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.title}
              className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow duration-300"
            >
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${role.color}`}>
                {role.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                {role.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-blue-600">
                {role.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
