'use client';

import { MonthlyForecast } from '@/app/lib/capacity-utils';
import { cn } from '@/app/lib/utils';

interface CapacityStripProps {
  forecast: MonthlyForecast[];
  onMonthClick?: (month: string) => void;
}

export default function CapacityStrip({ forecast, onMonthClick }: CapacityStripProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max px-4 md:px-0">
        {forecast.map((monthData) => {
          const date = new Date(monthData.month);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear();

          // Determine color based on available slots
          const hasFullCapacity = monthData.availableSlots <= 0;
          const hasLowCapacity = monthData.availableSlots > 0 && monthData.availableSlots <= 2;
          const hasEvents = monthData.eventsThisMonth.length > 0;

          return (
            <div
              key={monthData.month}
              onClick={() => onMonthClick?.(monthData.month)}
              className={cn(
                'flex-shrink-0 rounded-xl p-3 min-w-[100px] border-2 transition-all',
                'hover:shadow-md cursor-pointer',
                hasFullCapacity && 'bg-red-50 border-red-300',
                hasLowCapacity && !hasFullCapacity && 'bg-yellow-50 border-yellow-300',
                !hasFullCapacity && !hasLowCapacity && 'bg-green-50 border-green-300',
                hasEvents && 'ring-2 ring-blue-400 ring-offset-2'
              )}
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700">
                  {monthName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {year}
                </div>

                <div className="space-y-1">
                  {/* Total capacity */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Total:</span>
                    <span className={cn(
                      'font-bold',
                      hasFullCapacity && 'text-red-600',
                      hasLowCapacity && !hasFullCapacity && 'text-yellow-600',
                      !hasFullCapacity && !hasLowCapacity && 'text-green-600'
                    )}>
                      {monthData.totalCount}
                    </span>
                  </div>

                  {/* Under 2 capacity */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Under 2:</span>
                    <span className="font-semibold text-gray-700">
                      {monthData.under2Count}
                    </span>
                  </div>

                  {/* Available slots */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Open:</span>
                    <span className={cn(
                      'font-bold',
                      hasFullCapacity && 'text-red-600',
                      hasLowCapacity && !hasFullCapacity && 'text-yellow-600',
                      !hasFullCapacity && !hasLowCapacity && 'text-green-600'
                    )}>
                      {monthData.availableSlots}
                    </span>
                  </div>
                </div>

                {/* Event indicator */}
                {hasEvents && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-[10px] text-blue-600 font-medium">
                      {monthData.eventsThisMonth.length} event{monthData.eventsThisMonth.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
