import React, { useState } from 'react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { user, userData, refreshUser, emailVerified, loading } = useAuth();
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    try {
      setSending(true);
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent. Please check your inbox.');
    } catch (e) {
      toast.error(e?.message || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
    } catch (e) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card text-center">Loading...</div>
      </div>
    );
  }

  if (emailVerified && userData?.role === 'student') {
    // If verified, let router redirect based on role when navigating elsewhere
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified</h1>
          <p className="text-gray-600">Your email is verified. You can now access all features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
        <p className="text-gray-700 mb-4">
          Hi {user?.displayName || 'there'}, we sent a verification link to <span className="font-medium">{user?.email}</span>.
          Please verify your email to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleResend} disabled={sending} className="btn-primary disabled:opacity-50">
            {sending ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary disabled:opacity-50">
            {refreshing ? 'Refreshing...' : 'I Verified — Refresh Status'}
          </button>
          <button onClick={handleSignOut} className="btn-secondary">Sign out</button>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Didn’t get the email? Check your spam folder or try resending.
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
