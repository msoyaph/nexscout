/**
 * Data Deletion Status Page
 * 
 * This page allows users to check the status of their data deletion request
 * using the confirmation code provided by Facebook.
 * 
 * URL: /data-deletion-status?code=<confirmation_code>
 */

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DataDeletionStatusPage() {
  // Get confirmation code from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const confirmationCode = urlParams.get('code');
  
  const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading');
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationCode) {
      setStatus('not_found');
      return;
    }

    loadDeletionStatus();
  }, [confirmationCode]);

  async function loadDeletionStatus() {
    if (!confirmationCode) return;

    try {
      const { data, error: queryError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('confirmation_code', confirmationCode)
        .maybeSingle();

      if (queryError) {
        console.error('[DataDeletionStatus] Error loading status:', queryError);
        setError('Failed to load deletion status. Please try again.');
        setStatus('error');
        return;
      }

      if (!data) {
        setStatus('not_found');
        return;
      }

      setDeletionRequest(data);
      setStatus('found');
    } catch (error: any) {
      console.error('[DataDeletionStatus] Unexpected error:', error);
      setError(error.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  }

  function getStatusIcon() {
    if (status === 'loading') {
      return <Clock className="size-12 text-blue-500 animate-spin" />;
    }
    
    if (status === 'not_found' || status === 'error') {
      return <XCircle className="size-12 text-red-500" />;
    }

    if (deletionRequest?.status === 'completed') {
      return <CheckCircle className="size-12 text-green-500" />;
    }

    if (deletionRequest?.status === 'processing') {
      return <Clock className="size-12 text-amber-500 animate-pulse" />;
    }

    return <AlertCircle className="size-12 text-amber-500" />;
  }

  function getStatusMessage() {
    if (status === 'loading') {
      return 'Loading deletion status...';
    }

    if (status === 'not_found') {
      return 'Deletion request not found. Please check your confirmation code.';
    }

    if (status === 'error') {
      return error || 'An error occurred while loading the status.';
    }

    if (deletionRequest?.status === 'completed') {
      return 'Your data deletion request has been completed. All associated data has been removed from our systems.';
    }

    if (deletionRequest?.status === 'processing') {
      return 'Your data deletion request is being processed. This may take up to 24 hours.';
    }

    if (deletionRequest?.status === 'pending') {
      return 'Your data deletion request has been received and is pending processing.';
    }

    if (deletionRequest?.status === 'failed') {
      return `Data deletion failed: ${deletionRequest.error_message || 'Unknown error'}. Please contact support.`;
    }

    return 'Unknown status';
  }

  function getStatusColor() {
    if (status === 'not_found' || status === 'error') {
      return 'text-red-600';
    }

    if (deletionRequest?.status === 'completed') {
      return 'text-green-600';
    }

    if (deletionRequest?.status === 'processing') {
      return 'text-amber-600';
    }

    return 'text-blue-600';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Data Deletion Status
          </h1>

          {confirmationCode && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Confirmation Code:</p>
              <p className="text-xs font-mono bg-gray-100 px-3 py-2 rounded text-gray-800">
                {confirmationCode}
              </p>
            </div>
          )}

          <div className={`mb-6 ${getStatusColor()}`}>
            <p className="text-lg font-semibold mb-2">
              {deletionRequest?.status === 'completed' ? 'Completed' :
               deletionRequest?.status === 'processing' ? 'Processing' :
               deletionRequest?.status === 'pending' ? 'Pending' :
               deletionRequest?.status === 'failed' ? 'Failed' :
               status === 'not_found' ? 'Not Found' :
               'Loading...'}
            </p>
            <p className="text-sm text-gray-600">
              {getStatusMessage()}
            </p>
          </div>

          {deletionRequest && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Provider:</span>
                  <span className="capitalize">{deletionRequest.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Requested:</span>
                  <span>
                    {new Date(deletionRequest.requested_at).toLocaleDateString()}
                  </span>
                </div>
                {deletionRequest.completed_at && (
                  <div className="flex justify-between">
                    <span className="font-medium">Completed:</span>
                    <span>
                      {new Date(deletionRequest.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-4">
              If you have any questions about your data deletion request, please contact our support team.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

