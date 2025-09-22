import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Calendar, 
  Users, 
  BookOpen, 
  Shield, 
  Heart,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'AI-Guided First-Aid Chatbot',
      description: 'Get immediate support and coping strategies for stress, anxiety, and sleep issues with our intelligent chatbot.',
      color: 'text-blue-600'
    },
    {
      icon: Calendar,
      title: 'Confidential Booking System',
      description: 'Book appointments with professional counsellors while maintaining complete anonymity and privacy.',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Peer Support Forum',
      description: 'Connect with fellow students in a safe, moderated environment for mutual support and understanding.',
      color: 'text-purple-600'
    },
    {
      icon: BookOpen,
      title: 'Resource Hub',
      description: 'Access videos, guides, and relaxation audios in multiple languages for comprehensive mental health support.',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Your data is protected with end-to-end encryption and strict confidentiality protocols.',
      color: 'text-red-600'
    },
    {
      icon: Heart,
      title: 'Personal Journal',
      description: 'Maintain a private digital journal to track your mental health journey and progress.',
      color: 'text-pink-600'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Students Helped' },
    { number: '500+', label: 'Counsellors' },
    { number: '24/7', label: 'AI Support' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const benefits = [
    'Complete anonymity and privacy protection',
    'AI-powered immediate support and guidance',
    'Professional counselling services',
    'Peer support community',
    'Multilingual resources and content',
    'Mobile-responsive design for accessibility'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent animate-glow">
                MINDLY
              </span>
              <div className="text-2xl md:text-4xl font-semibold text-gray-700 mt-4 space-y-2">
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <span className="inline-block animate-float bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Mental Health
                  </span>
                  <span className="text-primary-600 font-bold animate-pulse">
                    INsights
                  </span>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <span className="inline-block animate-float-delay bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Digital support
                  </span>
                  <span className="text-primary-600 font-bold animate-pulse">
                    Learning Youth
                  </span>
                </div>
              </div>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in">
              Get immediate AI assistance, professional counselling, and peer support in a safe, confidential environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center hover:scale-105 transition-transform duration-200"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-lg px-8 py-3 hover:scale-105 transition-transform duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides multiple layers of support to ensure you have access to the help you need, when you need it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-12 h-12 ${feature.color} mb-4`}>
                    <Icon className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We understand the unique challenges faced by college students and have designed our platform 
                with your specific needs in mind.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Mental Health Matters
                </h3>
                <p className="text-gray-600 mb-6">
                  Take the first step towards better mental health. Our platform is designed to provide 
                  you with the support and resources you need to thrive in college and beyond.
                </p>
                <Link
                  to="/register"
                  className="btn-primary inline-flex items-center"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have already found support and guidance through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Create Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
