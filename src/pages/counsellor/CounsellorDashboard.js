import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointments } from '../../firebase/firestore';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  FileText,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const CounsellorDashboard = () => {
  const { user, userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Appointments' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const result = await getAppointments(user.uid, 'counsellor');
      if (result.success) {
        setAppointments(result.data);
      } else {
        toast.error('Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Error loading appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSessionTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-green-600" />;
      case 'in-person':
        return <MapPin className="w-5 h-5 text-purple-600" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    const matchesDate = !selectedDate || appointment.appointmentDate === selectedDate;
    return matchesStatus && matchesDate;
  });

  const stats = [
    {
      title: 'Total Appointments',
      value: appointments.length,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: appointments.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed',
      value: appointments.filter(a => a.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'This Week',
      value: appointments.filter(a => {
        const appointmentDate = new Date(a.appointmentDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return appointmentDate >= weekAgo;
      }).length,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      // In a real app, you'd call an update function here
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      toast.success('Appointment status updated successfully!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Error updating appointment status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Counsellor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {userData?.displayName || 'Counsellor'}. Manage your appointments and support students.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Counsellor Access</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedDate('');
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
          <div className="text-sm text-gray-600">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">
              {selectedStatus !== 'all' || selectedDate ? 
                'Try adjusting your filters' : 
                'No appointments scheduled yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {appointment.studentName}
                      </h4>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.appointmentTime}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {getSessionTypeIcon(appointment.sessionType)}
                          <span className="capitalize">{appointment.sessionType} Session</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Reason: </span>
                          <span className="text-gray-600 capitalize">{appointment.reason}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Urgency: </span>
                          <span className={`capitalize ${
                            appointment.urgency === 'high' ? 'text-red-600' :
                            appointment.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {appointment.urgency}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Previous Counseling: </span>
                          <span className="text-gray-600 capitalize">{appointment.previousCounseling}</span>
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-700 text-sm">Notes: </span>
                        <p className="text-gray-600 text-sm mt-1">{appointment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Mark Complete
                      </button>
                    )}
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Crisis Support</h3>
              <p className="text-sm text-gray-600">Emergency resources and protocols</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Session Notes</h3>
              <p className="text-sm text-gray-600">Access and update session documentation</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">View your performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounsellorDashboard;
