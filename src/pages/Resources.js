import React, { useState, useEffect } from 'react';
import { getResources } from '../firebase/firestore';
import { logResourceViewed } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  Play, 
  Headphones, 
  FileText, 
  Search, 
  ExternalLink,
  Download,
  Eye,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Resources = () => {
  const { userData } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'academic_stress', name: 'Academic Stress' },
    { id: 'anxiety', name: 'Anxiety' },
    { id: 'depression', name: 'Depression' },
    { id: 'sleep', name: 'Sleep Issues' },
    { id: 'relationships', name: 'Relationships' },
    { id: 'general', name: 'General Wellness' }
  ];

  const types = [
    { id: 'all', name: 'All Types' },
    { id: 'article', name: 'Articles' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio Guides' },
    { id: 'guide', name: 'Guides' }
  ];

  useEffect(() => {
    loadResources();
  }, [selectedCategory]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const result = await getResources(selectedCategory === 'all' ? null : selectedCategory);
      if (result.success) {
        setResources(result.data);
      } else {
        toast.error('Failed to load resources');
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Error loading resources');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'audio':
        return <Headphones className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-600';
      case 'audio':
        return 'bg-purple-100 text-purple-600';
      case 'article':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-green-100 text-green-600';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesType && matchesSearch;
  });

  const handleResourceClick = async (resource) => {
    try {
      if (userData?.uid) {
        await logResourceViewed({
          userId: userData.uid,
          resourceId: resource.id,
          resourceType: resource.type || null,
          title: resource.title || null
        });
      }
    } catch (e) {
      // Silently ignore logging failures on UI click
      console.warn('Failed to log resource view', e);
    } finally {
      toast.success(`Opening ${resource.title}`);
      // If your resource has a URL, open it in a new tab
      if (resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Hub</h1>
        <p className="text-gray-600">
          Access videos, articles, and guides to support your mental health journey
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
              <p className="text-gray-600">Total Resources</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Play className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.type === 'video').length}
              </p>
              <p className="text-gray-600">Videos</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Headphones className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.type === 'audio').length}
              </p>
              <p className="text-gray-600">Audio Guides</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.type === 'article').length}
              </p>
              <p className="text-gray-600">Articles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Resources
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or description..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No resources available in this category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleResourceClick(resource)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                </div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  {categories.find(c => c.id === resource.category)?.name || resource.category}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {resource.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {resource.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{resource.views || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {resource.createdAt?.toDate ? 
                      resource.createdAt.toDate().toLocaleDateString() : 
                      new Date(resource.createdAt).toLocaleDateString()
                    }
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium">
                  <ExternalLink className="w-4 h-4" />
                  <span>Open</span>
                </button>
                {resource.type === 'audio' && (
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Featured Resources */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Managing Exam Stress
                </h3>
                <p className="text-gray-600 mb-3">
                  A comprehensive video guide with practical techniques for managing stress during exam periods.
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Watch Now →
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Headphones className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sleep Meditation
                </h3>
                <p className="text-gray-600 mb-3">
                  Guided meditation audio to help you relax and fall asleep peacefully.
                </p>
                <button className="text-green-600 hover:text-green-700 font-medium">
                  Listen Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
