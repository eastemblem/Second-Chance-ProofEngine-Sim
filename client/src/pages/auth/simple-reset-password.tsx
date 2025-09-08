export default function SimpleResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-green-900 mb-4">✅ Reset Password Route Works!</h1>
        <p className="text-gray-600 mb-4">
          This is a simple test component to verify routing is working.
        </p>
        <p className="text-sm text-gray-500">
          URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Token: {typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || 'Not found' : 'N/A'}
        </p>
      </div>
    </div>
  );
}