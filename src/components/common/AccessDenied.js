import React from 'react';
import { Lock } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-100">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          You do not have permission to view this page. If you believe this is a mistake, please contact an administrator.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
