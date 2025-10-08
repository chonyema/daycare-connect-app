'use client';

import { Child } from '@prisma/client';
import { ageInYears, ageInMonths } from '@/app/lib/capacity-utils';
import { cn } from '@/app/lib/utils';

interface ChildRosterTableProps {
  children: Child[];
  onChildClick?: (child: Child) => void;
}

export default function ChildRosterTable({ children, onChildClick }: ChildRosterTableProps) {
  const today = new Date();

  // Sort children: active first, then by age (youngest first)
  const sortedChildren = [...children].sort((a, b) => {
    // Active children come first
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    // Then sort by age (youngest first)
    return new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime();
  });

  const formatAge = (dob: Date) => {
    const years = ageInYears(dob, today);
    const months = ageInMonths(dob, today) % 12;

    if (years === 0) {
      return `${months}mo`;
    } else if (months === 0) {
      return `${years}y`;
    } else {
      return `${years}y ${months}mo`;
    }
  };

  const getAgeCategory = (dob: Date) => {
    const years = ageInYears(dob, today);
    if (years < 2) return 'Under 2';
    if (years < 4) return '2-3 years';
    if (years < 13) return 'School age';
    return '13+';
  };

  const getAgeCategoryColor = (dob: Date) => {
    const years = ageInYears(dob, today);
    if (years < 2) return 'bg-purple-100 text-purple-700';
    if (years < 4) return 'bg-blue-100 text-blue-700';
    if (years < 13) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No children enrolled yet</p>
        <p className="text-sm mt-2">Add children to start tracking capacity</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Name
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Age
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
              Category
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
              DOB
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
              Enrolled
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedChildren.map((child) => (
            <tr
              key={child.id}
              onClick={() => onChildClick?.(child)}
              className={cn(
                'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                onChildClick && 'cursor-pointer',
                !child.isActive && 'opacity-60'
              )}
            >
              {/* Name */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {child.fullName}
                  </span>
                  {child.isProviderChild && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Own
                    </span>
                  )}
                </div>
                {child.parentName && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {child.parentName}
                  </div>
                )}
              </td>

              {/* Age */}
              <td className="py-3 px-4">
                <span className="text-sm font-semibold text-gray-700">
                  {formatAge(child.dateOfBirth)}
                </span>
              </td>

              {/* Age Category (hidden on mobile) */}
              <td className="py-3 px-4 hidden md:table-cell">
                <span
                  className={cn(
                    'inline-block text-xs px-2 py-1 rounded-full font-medium',
                    getAgeCategoryColor(child.dateOfBirth)
                  )}
                >
                  {getAgeCategory(child.dateOfBirth)}
                </span>
              </td>

              {/* Date of Birth (hidden on mobile) */}
              <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">
                {new Date(child.dateOfBirth).toLocaleDateString()}
              </td>

              {/* Enrollment Date (hidden on tablet and below) */}
              <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">
                {new Date(child.enrollmentStart).toLocaleDateString()}
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                {child.isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                ) : child.actualExit ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                    Exited
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary footer */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {children.filter((c) => c.isActive).length}
            </div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {children.filter((c) => c.isActive && ageInYears(c.dateOfBirth, today) < 2).length}
            </div>
            <div className="text-xs text-gray-600">Under 2</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {children.filter((c) => c.isActive && ageInYears(c.dateOfBirth, today) >= 2 && ageInYears(c.dateOfBirth, today) < 4).length}
            </div>
            <div className="text-xs text-gray-600">2-3 Years</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">
              {children.filter((c) => c.isProviderChild && c.isActive).length}
            </div>
            <div className="text-xs text-gray-600">Own Children</div>
          </div>
        </div>
      </div>
    </div>
  );
}
