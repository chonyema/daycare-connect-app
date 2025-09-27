'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Mail,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  Users,
  Filter,
  X,
  AlertTriangle,
  Send,
  FileText,
  MessageSquare,
  Award,
  Calendar,
  Settings
} from 'lucide-react';

interface BulkWaitlistActionsProps {
  selectedEntries: string[];
  totalEntries: number;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: string, data?: any) => Promise<void>;
  onBulkCommunication: (type: string, data: any) => Promise<void>;
  isLoading: boolean;
}

const BulkWaitlistActions: React.FC<BulkWaitlistActionsProps> = ({
  selectedEntries,
  totalEntries,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  onBulkCommunication,
  isLoading
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [showPositionAdjust, setShowPositionAdjust] = useState(false);
  const [communicationType, setCommunicationType] = useState<'email' | 'sms' | 'notification'>('email');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [positionAdjustment, setPositionAdjustment] = useState(0);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const allSelected = selectedEntries.length === totalEntries && totalEntries > 0;
  const someSelected = selectedEntries.length > 0;

  const bulkActions = [
    {
      id: 'move-up',
      label: 'Move Up in Queue',
      icon: ChevronUp,
      color: 'text-green-600 hover:bg-green-50',
      description: 'Increase priority/move up positions',
      requiresConfirm: true
    },
    {
      id: 'move-down',
      label: 'Move Down in Queue',
      icon: ChevronDown,
      color: 'text-orange-600 hover:bg-orange-50',
      description: 'Decrease priority/move down positions',
      requiresConfirm: true
    },
    {
      id: 'pause',
      label: 'Pause Entries',
      icon: Pause,
      color: 'text-yellow-600 hover:bg-yellow-50',
      description: 'Temporarily pause waitlist entries',
      requiresConfirm: true
    },
    {
      id: 'resume',
      label: 'Resume Entries',
      icon: Play,
      color: 'text-blue-600 hover:bg-blue-50',
      description: 'Reactivate paused entries',
      requiresConfirm: false
    },
    {
      id: 'priority-boost',
      label: 'Priority Boost',
      icon: Award,
      color: 'text-purple-600 hover:bg-purple-50',
      description: 'Add priority points to selected entries',
      requiresConfirm: true
    },
    {
      id: 'remove',
      label: 'Remove from Waitlist',
      icon: Trash2,
      color: 'text-red-600 hover:bg-red-50',
      description: 'Permanently remove entries',
      requiresConfirm: true,
      destructive: true
    }
  ];

  const communicationTemplates = [
    {
      id: 'position-update',
      subject: 'Waitlist Position Update',
      content: 'Hi {parentName},\n\nWe wanted to update you on {childName}\'s waitlist position at {daycareName}.\n\nCurrent position: #{position}\nEstimated wait time: {estimatedWait}\n\nThank you for your patience.\n\nBest regards,\n{daycareName} Team'
    },
    {
      id: 'document-reminder',
      subject: 'Document Submission Reminder',
      content: 'Hi {parentName},\n\nThis is a friendly reminder that we still need some documents for {childName}\'s waitlist application.\n\nPlease log into your parent portal to complete your application.\n\nThank you!\n{daycareName} Team'
    },
    {
      id: 'general-update',
      subject: 'Waitlist Update',
      content: 'Hi {parentName},\n\nWe have an update regarding {childName}\'s waitlist status at {daycareName}.\n\n[Your message here]\n\nBest regards,\n{daycareName} Team'
    }
  ];

  const handleBulkAction = async (actionId: string) => {
    if (bulkActions.find(a => a.id === actionId)?.requiresConfirm) {
      setConfirmAction(actionId);
    } else {
      await onBulkAction(actionId);
      setShowActions(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction) {
      const actionData: any = {};

      if (confirmAction === 'move-up' || confirmAction === 'move-down') {
        actionData.adjustment = positionAdjustment;
      }

      await onBulkAction(confirmAction, actionData);
      setConfirmAction(null);
      setShowActions(false);
    }
  };

  const handleSendCommunication = async () => {
    if (!messageSubject || !messageContent) {
      alert('Please provide both subject and message content');
      return;
    }

    await onBulkCommunication(communicationType, {
      subject: messageSubject,
      content: messageContent,
      selectedEntries
    });

    setShowCommunication(false);
    setMessageSubject('');
    setMessageContent('');
  };

  const loadTemplate = (template: any) => {
    setMessageSubject(template.subject);
    setMessageContent(template.content);
  };

  if (!someSelected) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            Select All ({totalEntries})
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Select entries to enable bulk actions
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
          >
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            {selectedEntries.length} selected
          </button>

          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              Bulk Actions
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Bulk Actions</h3>
                  <p className="text-sm text-gray-600">{selectedEntries.length} entries selected</p>
                </div>

                <div className="p-2">
                  {bulkActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleBulkAction(action.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${action.color} ${
                        action.destructive ? 'border border-red-200' : ''
                      }`}
                    >
                      <action.icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs opacity-75">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowActions(false)}
                    className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Communication */}
          <button
            onClick={() => setShowCommunication(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            Communicate
          </button>

          {/* Export */}
          <button
            onClick={() => onBulkAction('export')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold">Confirm Bulk Action</h3>
            </div>

            <p className="text-gray-600 mb-4">
              You are about to perform "{bulkActions.find(a => a.id === confirmAction)?.label}" on {selectedEntries.length} waitlist entries.
            </p>

            {(confirmAction === 'move-up' || confirmAction === 'move-down') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position adjustment (number of positions)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={positionAdjustment}
                  onChange={(e) => setPositionAdjustment(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of positions"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                  bulkActions.find(a => a.id === confirmAction)?.destructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Modal */}
      {showCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bulk Communication</h3>
                  <p className="text-gray-600">Send message to {selectedEntries.length} families</p>
                </div>
                <button
                  onClick={() => setShowCommunication(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Communication Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'email', label: 'Email', icon: Mail },
                    { value: 'sms', label: 'SMS', icon: MessageSquare },
                    { value: 'notification', label: 'In-App', icon: Send }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setCommunicationType(type.value as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                        communicationType === type.value
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Templates
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {communicationTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm">{template.subject}</div>
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {template.content.substring(0, 100)}...
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter message subject"
                />
              </div>

              {/* Message Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your message content..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available variables: {'{parentName}'}, {'{childName}'}, {'{daycareName}'}, {'{position}'}, {'{estimatedWait}'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCommunication(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCommunication}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send to {selectedEntries.length} families
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkWaitlistActions;