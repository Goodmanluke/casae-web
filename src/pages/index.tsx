import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 bg-gray-50">
      <Head>
        <title>Casae</title>
        <meta name="description" content="Casae real estate analysis" />
      </Head>
      <h1 className="text-4xl font-bold mb-4">Welcome to Casae</h1>
      <p className="text-lg text-gray-700 mb-4 text-center max-w-xl">
        Analyze property values and renovation potential in seconds. Start by entering an
        address and explore comps, renovation scenarios, and detailed reports.
      </p>
    </div>
  );
}
