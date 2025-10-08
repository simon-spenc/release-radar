export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          Release Radar
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Automated documentation and release notes system
        </p>
        <a
          href="/dashboard/pending"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
