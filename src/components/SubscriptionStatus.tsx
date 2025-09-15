import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionStatusProps {
  userId: string;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ userId }) => {
  const router = useRouter();
  const {
    subscription,
    loading,
    isPremium,
    isPro,
    isTrialing,
    error
  } = useSubscription(userId);

  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/subscription/status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStatusData(data);
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (isPremium) return 'text-emerald-600 bg-emerald-50';
    if (isPro) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = () => {
    if (isPremium) return 'Premium Subscriber';
    if (isPro) return 'Pro Subscriber';
    return 'No Active Subscription';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {subscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-900">
              {statusData?.subscription?.daysRemaining || 0}
            </div>
            <div className="text-sm text-gray-600">Days Remaining</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-900">
              {subscription.status?.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-900">
              {statusData?.subscription?.currentPeriodEnd 
                ? new Date(statusData.subscription.currentPeriodEnd).toLocaleDateString()
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600">Next Billing</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/plans')}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          {subscription ? 'Manage Plans' : 'View Plans'}
        </button>
        <button
          onClick={() => router.push('/billing')}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
        >
          Billing & Invoices
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
