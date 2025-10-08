'use client';

import { useState } from 'react';
import { WhatIfResult } from '@/app/lib/capacity-utils';
import { cn } from '@/app/lib/utils';

interface WhatIfDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  daycareId: string;
  onSimulate: (params: {
    proposedStart: string;
    dateOfBirth: string;
    isProviderChild: boolean;
  }) => Promise<WhatIfResult>;
}

export default function WhatIfDrawer({
  isOpen,
  onClose,
  daycareId,
  onSimulate,
}: WhatIfDrawerProps) {
  const [proposedStart, setProposedStart] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isProviderChild, setIsProviderChild] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!proposedStart || !dateOfBirth) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const simulationResult = await onSimulate({
        proposedStart,
        dateOfBirth,
        isProviderChild,
      });
      setResult(simulationResult);
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProposedStart('');
    setDateOfBirth('');
    setIsProviderChild(false);
    setResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50',
          'transform transition-transform duration-300 ease-out',
          'max-h-[85vh] overflow-y-auto',
          'md:relative md:max-h-none md:rounded-2xl md:shadow-lg'
        )}
      >
        {/* Handle bar (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              What-If Calculator
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Simulate adding a new child to check capacity eligibility
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input form */}
          <div className="space-y-4">
            {/* Proposed start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Start Date
              </label>
              <input
                type="date"
                value={proposedStart}
                onChange={(e) => setProposedStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Child's date of birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Provider's child checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isProviderChild"
                checked={isProviderChild}
                onChange={(e) => setIsProviderChild(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isProviderChild"
                className="ml-2 text-sm text-gray-700"
              >
                This is my own child (provider's child)
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              disabled={loading || !proposedStart || !dateOfBirth}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium text-white transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-gray-900">Simulation Result</h4>

              {/* Can accept indicator */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2',
                  result.canAccept
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {result.canAccept ? '✅' : '❌'}
                  </span>
                  <span className={`font-bold text-lg ${result.canAccept ? 'text-green-900' : 'text-red-900'}`}>
                    {result.canAccept ? 'Can Accept' : 'Cannot Accept'}
                  </span>
                </div>
                {result.reason && (
                  <p className={`text-sm ${result.canAccept ? 'text-green-800' : 'text-red-800'}`}>{result.reason}</p>
                )}
              </div>

              {/* Capacity details */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total capacity */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Total Capacity</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {result.constraints.totalCapacity.current}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {result.constraints.totalCapacity.max}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.constraints.totalCapacity.available} available
                  </div>
                </div>

                {/* Under-2 capacity */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Under-2 Capacity</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {result.constraints.under2Capacity.current}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {result.constraints.under2Capacity.max}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.constraints.under2Capacity.available} available
                  </div>
                </div>
              </div>

              {/* Age requirements */}
              {(result.minDOBFor2YearsOld || result.minDOBFor4YearsOld) && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">
                    Age Requirements
                  </h5>
                  <div className="space-y-1 text-xs text-blue-800">
                    {result.minDOBFor2YearsOld && (
                      <div>
                        For under-2 slot: Child must be born after{' '}
                        {new Date(result.minDOBFor2YearsOld).toLocaleDateString()}
                      </div>
                    )}
                    {result.minDOBFor4YearsOld && (
                      <div>
                        To not count: Provider's child must be born before{' '}
                        {new Date(result.minDOBFor4YearsOld).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
