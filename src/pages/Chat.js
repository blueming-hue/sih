import React, { useState } from 'react';
import {
  MessageCircle,
  Users,
  Heart
} from 'lucide-react';

import AnonymousChat from '../components/chat/AnonymousChat';
import GroupChatrooms from '../components/chat/GroupChatrooms';
import VolunteerChat from '../components/chat/VolunteerChat';

const Chat = () => {
  const [activeTab, setActiveTab] = useState('anonymous');

  const tabs = [
    {
      id: 'anonymous',
      name: 'Anonymous 1:1',
      icon: MessageCircle,
      description: 'Connect with a peer anonymously',
      component: AnonymousChat
    },
    {
      id: 'groups',
      name: 'Group Chatrooms',
      icon: Users,
      description: 'Join topic-based support groups',
      component: GroupChatrooms
    },
    {
      id: 'volunteers',
      name: 'Volunteer Chat',
      icon: Heart,
      description: 'Talk to trained student volunteers',
      component: VolunteerChat
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Support</h1>
        <p className="text-gray-600">
          Connect with peers and volunteers for mental health support
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[70vh]">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat Type</h3>
              <p className="text-gray-600">Choose how you'd like to connect with others</p>
            </div>
          </div>
        )}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Anonymous 1:1</h3>
          </div>
          <p className="text-sm text-gray-600">
            Get randomly matched with another student for private, anonymous conversations.
            Your identity remains completely confidential.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Group Chatrooms</h3>
          </div>
          <p className="text-sm text-gray-600">
            Join topic-specific chatrooms to connect with others facing similar challenges.
            Share experiences and support each other.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Volunteer Chat</h3>
          </div>
          <p className="text-sm text-gray-600">
            Connect with trained student volunteers who can provide guidance and support.
            Available for one-on-one conversations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;