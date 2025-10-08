'use client';

import { useState, useEffect } from 'react';
import MobilePageWrapper from '../components/mobile/MobilePageWrapper';
import CapacityPlanner from '../components/capacity/CapacityPlanner';

export default function TestCapacityPage() {
  const [daycares, setDaycares] = useState<any[]>([]);
  const [selectedDaycareId, setSelectedDaycareId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDaycares();
  }, []);

  const fetchDaycares = async () => {
    try {
      const response = await fetch('/api/provider/daycares');
      if (!response.ok) {
        throw new Error('Failed to fetch daycares');
      }
      const data = await response.json();
      setDaycares(data);
      if (data.length > 0) {
        setSelectedDaycareId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobilePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading daycares...</p>
          </div>
        </div>
      </MobilePageWrapper>
    );
  }

  if (error) {
    return (
      <MobilePageWrapper>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </MobilePageWrapper>
    );
  }

  if (daycares.length === 0) {
    return (
      <MobilePageWrapper>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2">No Daycares Found</h3>
          <p className="text-sm text-yellow-700">
            You need to create a daycare first to test capacity planning.
          </p>
        </div>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 -mx-4 -mt-4 px-4 py-6 md:rounded-t-lg">
          <h1 className="text-2xl font-bold text-white mb-2">
            🧮 Capacity Planning Test
          </h1>
          <p className="text-blue-100 text-sm">
            Test the age-rules capacity planning feature
          </p>
        </div>

        {/* Daycare Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Daycare
          </label>
          <select
            value={selectedDaycareId}
            onChange={(e) => setSelectedDaycareId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {daycares.map((daycare) => (
              <option key={daycare.id} value={daycare.id}>
                {daycare.name} ({daycare.jurisdiction} - {daycare.isLicensed ? 'Licensed' : 'Unlicensed'})
              </option>
            ))}
          </select>

          {selectedDaycareId && (
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>ID:</strong> {selectedDaycareId}</p>
              <p><strong>Jurisdiction:</strong> {daycares.find(d => d.id === selectedDaycareId)?.jurisdiction || 'Not set'}</p>
              <p><strong>Licensed:</strong> {daycares.find(d => d.id === selectedDaycareId)?.isLicensed ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>

        {/* API Test Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🔗 Direct API Test
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Forecast Endpoint:</p>
              <a
                href={`/api/capacity/forecast?daycareId=${selectedDaycareId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 break-all underline"
              >
                GET /api/capacity/forecast?daycareId={selectedDaycareId}
              </a>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Test What-If Simulation:
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/capacity/what-if', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        daycareId: selectedDaycareId,
                        proposedStart: '2025-11-01',
                        dateOfBirth: '2023-06-15',
                        isProviderChild: false,
                      }),
                    });
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (err: any) {
                    alert('Error: ' + err.message);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Test What-If API (1.5yr old child)
              </button>
            </div>
          </div>
        </div>

        {/* Capacity Planner Component */}
        {selectedDaycareId && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Capacity Planner UI
            </h2>
            <CapacityPlanner daycareId={selectedDaycareId} />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📝 Testing Instructions:
          </h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Select a daycare from the dropdown above</li>
            <li>Click the forecast API link to see raw JSON data</li>
            <li>Click "Test What-If API" to test the simulation endpoint</li>
            <li>Use the Capacity Planner UI below to test the components</li>
            <li>Note: You'll need to add children to the database to see real forecasts</li>
          </ol>
        </div>

        {/* Add Test Child Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            ➕ Quick Add Test Children
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Add 6 sample children with diverse ages to test capacity planning
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!confirm('Add 6 sample children to this daycare?')) return;

                try {
                  const response = await fetch('/api/capacity/test-children', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ daycareId: selectedDaycareId }),
                  });
                  const data = await response.json();

                  if (response.ok) {
                    alert(`✅ ${data.message}\n\nChildren added:\n${data.children.map((c: any) => `- ${c.fullName} (${c.age})${c.isProviderChild ? ' - Provider\'s child' : ''}`).join('\n')}`);
                    window.location.reload(); // Reload to show new data
                  } else {
                    alert(`❌ Error: ${data.error}`);
                  }
                } catch (err: any) {
                  alert('Error: ' + err.message);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1"
            >
              Add Sample Children
            </button>

            <button
              onClick={async () => {
                if (!confirm('Delete ALL children from this daycare? This cannot be undone!')) return;

                try {
                  const response = await fetch('/api/capacity/test-children', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ daycareId: selectedDaycareId }),
                  });
                  const data = await response.json();

                  if (response.ok) {
                    alert(`✅ ${data.message}`);
                    window.location.reload(); // Reload to show updated data
                  } else {
                    alert(`❌ Error: ${data.error}`);
                  }
                } catch (err: any) {
                  alert('Error: ' + err.message);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Sample children ages:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>7 months old (under 2)</li>
              <li>1.5 years old (under 2)</li>
              <li>1y 8mo old (under 2)</li>
              <li>Just turned 2</li>
              <li>3 years old</li>
              <li>4 years old (provider's child - won't count)</li>
            </ul>
          </div>
        </div>
      </div>
    </MobilePageWrapper>
  );
}
