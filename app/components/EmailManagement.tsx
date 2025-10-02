'use client';

import React, { useState } from 'react';
import { Mail, Send, Settings, Bell, CheckCircle, X } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'booking_confirmation' | 'booking_update' | 'welcome' | 'reminder';
  enabled: boolean;
}

interface EmailSettings {
  emailNotifications: boolean;
  bookingUpdates: boolean;
  dailyDigest: boolean;
  marketingEmails: boolean;
}

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'settings' | 'test'>('templates');
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    emailNotifications: true,
    bookingUpdates: true,
    dailyDigest: false,
    marketingEmails: false,
  });

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Booking Confirmation',
      subject: 'Booking Confirmed - {{daycareName}}',
      type: 'booking_confirmation',
      enabled: true,
    },
    {
      id: '2',
      name: 'Booking Status Update',
      subject: 'Booking {{status}} - {{daycareName}}',
      type: 'booking_update',
      enabled: true,
    },
    {
      id: '3',
      name: 'Welcome Email',
      subject: 'Welcome to Daycare Connect!',
      type: 'welcome',
      enabled: true,
    },
    {
      id: '4',
      name: 'Booking Reminder',
      subject: 'Reminder: Upcoming Booking Tomorrow',
      type: 'reminder',
      enabled: false,
    },
  ]);

  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSettingChange = (setting: keyof EmailSettings, value: boolean) => {
    setEmailSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTemplate(null);
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;

    setTestStatus('sending');

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          data: {
            email: testEmail,
            name: 'Test User',
            userType: 'PROVIDER',
          },
        }),
      });

      if (response.ok) {
        setTestStatus('sent');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 3000);
      }
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const TemplatesTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
      <p className="text-gray-600">Manage your automated email templates</p>
      
      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {template.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`template-${template.id}`}
                    checked={template.enabled}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    readOnly
                  />
                  <label htmlFor={`template-${template.id}`} className="ml-2 text-sm text-gray-700">
                    Enabled
                  </label>
                </div>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Email Preferences</h3>
      <p className="text-gray-600">Configure when you want to receive email notifications</p>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-600">Receive email notifications for important events</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h4 className="font-medium text-gray-900">Booking Updates</h4>
            <p className="text-sm text-gray-600">Get notified when bookings are created or updated</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.bookingUpdates}
              onChange={(e) => handleSettingChange('bookingUpdates', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h4 className="font-medium text-gray-900">Daily Digest</h4>
            <p className="text-sm text-gray-600">Receive a daily summary of bookings and activity</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.dailyDigest}
              onChange={(e) => handleSettingChange('dailyDigest', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h4 className="font-medium text-gray-900">Marketing Emails</h4>
            <p className="text-sm text-gray-600">Receive updates about new features and tips</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.marketingEmails}
              onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const TestTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Test Email Delivery</h3>
      <p className="text-gray-600">Send a test email to verify your email configuration</p>
      
      <div className="bg-white p-6 rounded-lg border">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={sendTestEmail}
            disabled={!testEmail || testStatus === 'sending'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === 'sending' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test Email
              </>
            )}
          </button>

          {testStatus === 'sent' && (
            <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Test email sent successfully!
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-100 text-red-800 rounded-lg">
              <X className="h-4 w-4" />
              Failed to send test email. Check your email configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Email Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', name: 'Templates', icon: Mail },
            { id: 'settings', name: 'Settings', icon: Settings },
            { id: 'test', name: 'Test', icon: Send },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'test' && <TestTab />}
      </div>

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Email Template</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    defaultValue={editingTemplate.subject}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like {'{{daycareName}}'}, {'{{childName}}'}, {'{{status}}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body
                  </label>
                  <textarea
                    rows={10}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email template body..."
                    defaultValue={`Hello {{parentName}},\n\nThis is a sample email template for ${editingTemplate.name}.\n\nYou can customize this content to match your needs.\n\nBest regards,\nDaycare Connect Team`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-enabled"
                    defaultChecked={editingTemplate.enabled}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="edit-enabled" className="text-sm text-gray-700">
                    Enable this template
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement save functionality
                      alert('Email template editing will be implemented with backend API');
                      handleCloseEditModal();
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailManagement;