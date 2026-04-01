'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [error, setError] = useState(null);

  const scanForDeals = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deals');
      const data = await res.json();

      if (data.success) {
        setDeals(data.deals);
        setLastScanned(new Date().toLocaleTimeString());
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reach the API. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanForDeals();
    const interval = setInterval(scanForDeals, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400">CarFlip Tracker</h1>
            <p className="text-gray-400 mt-1">Scanning CarMax listings for Carvana flip opportunities</p>
          </div>
          <div className="text-right">
            <button
              onClick={scanForDeals}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
            {lastScanned && (
              <p className="text-gray-500 text-sm mt-2">Last scanned: {lastScanned}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Deals Found</p>
            <p className="text-2xl font-bold text-green-400">{deals.length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Best Spread</p>
            <p className="text-2xl font-bold text-green-400">
              {deals.length > 0 ? '$' + deals[0].projectedSpread.toLocaleString() : '--'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Avg Spread</p>
            <p className="text-2xl font-bold text-green-400">
              {deals.length > 0
                ? '$' + Math.round(deals.reduce((sum, d) => sum + d.projectedSpread, 0) / deals.length).toLocaleString()
                : '--'}
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl animate-pulse">Scanning CarMax listings...</p>
          </div>
        )}

        {!loading && deals.length === 0 && !error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No deals found above your threshold.</p>
            <p className="text-sm mt-2">Try lowering DEAL_THRESHOLD in .env.local</p>
          </div>
        )}

        {!loading && deals.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="text-left p-4">Vehicle</th>
                  <th className="text-left p-4">Miles</th>
                  <th className="text-left p-4">CarMax Price</th>
                  <th className="text-left p-4">Est. Carvana Offer</th>
                  <th className="text-left p-4">Projected Spread</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.vin} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold">{deal.year} {deal.make} {deal.model}</p>
                      <p className="text-gray-400 text-sm">{deal.trim}</p>
                    </td>
                    <td className="p-4 text-gray-300">{deal.miles?.toLocaleString()} mi</td>
                    <td className="p-4 text-gray-300">${deal.carmaxPrice?.toLocaleString()}</td>
                    <td className="p-4 text-blue-400">${deal.estimatedCarvanaOffer?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-semibold">
                        +${deal.projectedSpread?.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                        <a href={deal.listingUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">CarMax</a>
                        <a href={'https://www.carvana.com/sell-my-car/' + deal.vin} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">Carvana</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}