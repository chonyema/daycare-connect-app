'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Filter, Search, Eye, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityFilter !== 'all') params.append('entity', entityFilter);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/activity?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor all system activity and user actions
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value="all">All Actions</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DELETED">User Deleted</option>
            <option value="STAFF_CREATED">Staff Created</option>
            <option value="STAFF_UPDATED">Staff Updated</option>
            <option value="STAFF_DELETED">Staff Deleted</option>
            <option value="LOGIN">Login</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={250}>Last 250</option>
            <option value={500}>Last 500</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading activity logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {log.description || 'No description'}
                      </div>
                      {log.entity && (
                        <div className="text-xs text-gray-500">
                          {log.entity} {log.entityId && `(${log.entityId.slice(0, 8)}...)`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.ipAddress || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.user.name || 'Unknown'} ({selectedLog.user.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.description || 'No description'}
                </p>
              </div>

              {selectedLog.entity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedLog.entity} {selectedLog.entityId && `(ID: ${selectedLog.entityId})`}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="mt-1 text-sm text-gray-900 break-all">
                  {selectedLog.userAgent || 'N/A'}
                </p>
              </div>

              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-1 text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
