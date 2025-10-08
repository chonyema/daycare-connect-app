'use client';

import { useState, useEffect } from 'react';
import { Child } from '@prisma/client';
import { MonthlyForecast, WhatIfResult } from '@/app/lib/capacity-utils';
import CapacityStrip from './CapacityStrip';
import WhatIfDrawer from './WhatIfDrawer';
import ChildRosterTable from './ChildRosterTable';
import { MobileCard } from '../mobile/MobilePageWrapper';

interface CapacityPlannerProps {
  daycareId: string;
}

export default function CapacityPlanner({ daycareId }: CapacityPlannerProps) {
  const [forecast, setForecast] = useState<MonthlyForecast[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Fetch forecast data
  useEffect(() => {
    fetchForecast();
  }, [daycareId]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/capacity/forecast?daycareId=${daycareId}&months=12`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch forecast');
      }

      const data = await response.json();
      setForecast(data.forecast);

      // Extract children from daycare data if available
      // Note: You may need to fetch children separately via another endpoint
      // For now, we'll use an empty array
      // TODO: Add GET /api/capacity/children endpoint
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatIfSimulation = async (params: {
    proposedStart: string;
    dateOfBirth: string;
    isProviderChild: boolean;
  }): Promise<WhatIfResult> => {
    const response = await fetch('/api/capacity/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daycareId,
        ...params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Simulation failed');
    }

    const data = await response.json();
    return data.simulation;
  };

  const handleMonthClick = (month: string) => {
    setSelectedMonth(month);
    // TODO: Show detailed view of month's events
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading capacity forecast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-bold text-red-900 mb-2">Error Loading Forecast</h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchForecast}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with What-If button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Capacity Planner</h2>
          <p className="text-sm text-gray-600 mt-1">
            12-month forecast with age-based capacity tracking
          </p>
        </div>
        <button
          onClick={() => setWhatIfOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          What-If Calculator
        </button>
      </div>

      {/* Capacity Strip */}
      <MobileCard className="!p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Monthly Capacity Overview
        </h3>
        <CapacityStrip forecast={forecast} onMonthClick={handleMonthClick} />
      </MobileCard>

      {/* Selected Month Details */}
      {selectedMonth && (
        <MobileCard>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {new Date(selectedMonth).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            {forecast
              .filter((m) => m.month === selectedMonth)
              .map((month) => (
                <div key={month.month} className="space-y-3">
                  {/* Capacity summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Total Count</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {month.totalCount}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Under 2</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {month.under2Count}
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  {month.eventsThisMonth.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Events This Month
                      </h4>
                      <div className="space-y-2">
                        {month.eventsThisMonth.map((event, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded-lg"
                          >
                            <span className="text-lg">
                              {event.type === 'BIRTHDAY_2' && '🎂'}
                              {event.type === 'BIRTHDAY_4' && '🎂'}
                              {event.type === 'EXIT' && '👋'}
                              {event.type === 'ENROLLMENT' && '👶'}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {event.description}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            <button
              onClick={() => setSelectedMonth(null)}
              className="mt-4 w-full py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </MobileCard>
      )}

      {/* Child Roster */}
      <MobileCard>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Roster
          </h3>
          <ChildRosterTable children={children} />
        </div>
      </MobileCard>

      {/* What-If Drawer */}
      <WhatIfDrawer
        isOpen={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        daycareId={daycareId}
        onSimulate={handleWhatIfSimulation}
      />
    </div>
  );
}
