import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { createAppointment } from '../firebase/firestore';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageCircle, 
  CheckCircle,
  AlertCircle,
  Phone,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';

const Booking = () => {
  const { userData } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCounsellor, setSelectedCounsellor] = useState('');
  const [selectedType, setSelectedType] = useState('video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Mock counsellors data
  const counsellors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialization: 'Anxiety & Stress Management',
      experience: '8 years',
      rating: 4.9,
      availableSlots: ['09:00', '10:00', '14:00', '15:00']
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialization: 'Depression & Mood Disorders',
      experience: '12 years',
      rating: 4.8,
      availableSlots: ['11:00', '13:00', '16:00', '17:00']
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialization: 'Academic Stress & Career Counseling',
      experience: '6 years',
      rating: 4.9,
      availableSlots: ['09:30', '11:30', '14:30', '16:30']
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      specialization: 'Relationship & Social Issues',
      experience: '10 years',
      rating: 4.7,
      availableSlots: ['10:30', '12:30', '15:30', '17:30']
    }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const sessionTypes = [
    {
      id: 'video',
      name: 'Video Call',
      description: 'Secure video session via our platform',
      icon: Video,
      duration: '50 minutes'
    },
    {
      id: 'phone',
      name: 'Phone Call',
      description: 'Audio-only session for privacy',
      icon: Phone,
      duration: '50 minutes'
    },
    {
      id: 'in-person',
      name: 'In-Person',
      description: 'Face-to-face session at counseling center',
      icon: User,
      duration: '50 minutes'
    }
  ];

  const getAvailableSlots = () => {
    if (!selectedCounsellor || !selectedDate) return [];
    const counsellor = counsellors.find(c => c.id === selectedCounsellor);
    return counsellor ? counsellor.availableSlots : [];
  };

  const onSubmit = async (data) => {
    if (!selectedDate || !selectedTime || !selectedCounsellor) {
      toast.error('Please select date, time, and counsellor');
      return;
    }

    setIsSubmitting(true);
    try {
      const counsellor = counsellors.find(c => c.id === selectedCounsellor);
      const appointmentData = {
        studentId: userData.uid,
        studentName: userData.displayName,
        studentEmail: userData.email,
        counsellorId: selectedCounsellor,
        counsellorName: counsellor.name,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        sessionType: selectedType,
        duration: '50 minutes',
        status: 'pending',
        reason: data.reason,
        urgency: data.urgency,
        previousCounseling: data.previousCounseling,
        notes: data.notes
      };

      const result = await createAppointment(appointmentData);
      if (result.success) {
        toast.success('Appointment booked successfully! You will receive a confirmation email shortly.');
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setSelectedCounsellor('');
        setSelectedType('video');
      } else {
        toast.error('Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Counseling Session</h1>
        <p className="text-gray-600">
          Schedule a confidential session with one of our qualified mental health professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Session Details</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Session Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sessionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedType === type.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">{type.name}</p>
                            <p className="text-sm text-gray-600">{type.description}</p>
                            <p className="text-xs text-gray-500">{type.duration}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Counsellor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select a Counsellor
                </label>
                <div className="space-y-3">
                  {counsellors.map((counsellor) => (
                    <button
                      key={counsellor.id}
                      type="button"
                      onClick={() => setSelectedCounsellor(counsellor.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedCounsellor === counsellor.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{counsellor.name}</h3>
                          <p className="text-sm text-gray-600">{counsellor.specialization}</p>
                          <p className="text-xs text-gray-500">{counsellor.experience} experience</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-gray-900">{counsellor.rating}</span>
                            <span className="text-yellow-500">★</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                  required
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {getAvailableSlots().map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-sm border rounded-lg transition-colors ${
                          selectedTime === time
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason for Session */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Session
                </label>
                <select
                  {...register('reason', { required: 'Please select a reason' })}
                  className="input-field"
                >
                  <option value="">Select a reason</option>
                  <option value="anxiety">Anxiety & Stress</option>
                  <option value="depression">Depression & Mood</option>
                  <option value="academic">Academic Stress</option>
                  <option value="relationships">Relationship Issues</option>
                  <option value="career">Career Guidance</option>
                  <option value="other">Other</option>
                </select>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  {...register('urgency', { required: 'Please select urgency level' })}
                  className="input-field"
                >
                  <option value="">Select urgency</option>
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Would like to meet soon</option>
                  <option value="high">High - Need to meet this week</option>
                </select>
                {errors.urgency && (
                  <p className="mt-1 text-sm text-red-600">{errors.urgency.message}</p>
                )}
              </div>

              {/* Previous Counseling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you received counseling before?
                </label>
                <select
                  {...register('previousCounseling', { required: 'Please select an option' })}
                  className="input-field"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes, I have received counseling before</option>
                  <option value="no">No, this is my first time</option>
                </select>
                {errors.previousCounseling && (
                  <p className="mt-1 text-sm text-red-600">{errors.previousCounseling.message}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field"
                  placeholder="Any additional information you'd like to share..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedTime || !selectedCounsellor}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
            {selectedCounsellor && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {counsellors.find(c => c.id === selectedCounsellor)?.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {counsellors.find(c => c.id === selectedCounsellor)?.specialization}
                    </p>
                  </div>
                </div>

                {selectedDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedTime}</p>
                      <p className="text-xs text-gray-600">50 minutes</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  {selectedType === 'video' && <Video className="w-5 h-5 text-gray-400" />}
                  {selectedType === 'phone' && <Phone className="w-5 h-5 text-gray-400" />}
                  {selectedType === 'in-person' && <User className="w-5 h-5 text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {sessionTypes.find(t => t.id === selectedType)?.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {sessionTypes.find(t => t.id === selectedType)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedCounsellor && (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Select a counsellor and time to see your booking summary
                </p>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 card bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Privacy & Confidentiality</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your session is completely confidential. Only your assigned counsellor will have access to your information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
