import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createForumPost,
  subscribeForumPosts,
  likeForumPost,
  unlikeForumPost,
  addForumComment,
  subscribeForumComments
} from '../firebase/firestore';
import { 
  MessageCircle, 
  Heart, 
  MessageSquare, 
  Plus, 
  Filter,
  Search,
  Users,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'academic_stress', name: 'Academic Stress' },
    { id: 'anxiety', name: 'Anxiety' },
    { id: 'depression', name: 'Depression' },
    { id: 'sleep', name: 'Sleep Issues' },
    { id: 'relationships', name: 'Relationships' },
    { id: 'general', name: 'General Support' }
  ];

  // Real-time subscription for posts
  useEffect(() => {
    setLoading(true);
    const category = selectedCategory === 'all' ? null : selectedCategory;
    const unsub = subscribeForumPosts(
      category,
      (items) => {
        setPosts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Forum subscription error', err);
        toast.error('Failed to load forum posts');
        setLoading(false);
      },
      100
    );
    return () => unsub && unsub();
  }, [selectedCategory]);

  const handleCreatePost = async (postData) => {
    try {
      const result = await createForumPost({
        ...postData,
        userId: user.uid,
        username: `AnonymousStudent${Math.floor(Math.random() * 1000)}`
      });

      if (result.success) {
        toast.success('Post created successfully!');
        setShowCreatePost(false);
      } else {
        toast.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post');
    }
  };

  const toggleLike = async (post) => {
    try {
      if (!user?.uid) return;
      const liked = Array.isArray(post.likedBy) && post.likedBy.includes(user.uid);
      if (liked) {
        await unlikeForumPost(post.id, user.uid);
      } else {
        await likeForumPost(post.id, user.uid);
      }
    } catch (e) {
      toast.error('Failed to update like');
    }
  };

  // Comments state per postId
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [newComment, setNewComment] = useState('');

  // Subscribe to comments for the expanded post
  useEffect(() => {
    if (!expandedPostId) return;
    const unsub = subscribeForumComments(
      expandedPostId,
      (items) => {
        setCommentsMap((prev) => ({ ...prev, [expandedPostId]: items }));
      },
      (err) => console.error('Comments subscription error', err),
      200
    );
    return () => unsub && unsub();
  }, [expandedPostId]);

  const handleAddComment = async (postId) => {
    try {
      if (!newComment.trim()) return;
      await addForumComment(postId, {
        userId: user.uid,
        username: `Anon${(user?.uid || '').slice(0, 6)}`,
        content: newComment.trim()
      });
      setNewComment('');
      setExpandedPostId(postId); // keep open
    } catch (e) {
      toast.error('Failed to add comment');
    }
  };

  const relativeTime = (date) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      const diffMs = Date.now() - d.getTime();
      const sec = Math.floor(diffMs / 1000);
      if (sec < 60) return `${sec}s ago`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
      const day = Math.floor(hr / 24);
      if (day < 7) return `${day}d ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Support Forum</h1>
            <p className="text-gray-600">
              Connect with fellow students in a safe, anonymous environment
            </p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-gray-600">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{new Set(posts.map(p => p.userId)).size}</p>
              <p className="text-gray-600">Active Posters</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{
                posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0)
              }</p>
              <p className="text-gray-600">Supportive Interactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
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

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Posts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search posts..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to start a conversation!'}
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="btn-primary"
            >
              Create First Post
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {categories.find(c => c.id === post.category)?.name || post.category}
                    </span>
                    <span className="text-sm text-gray-500">by {post.username}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(post)}
                    className={`flex items-center space-x-1 ${Array.isArray(post.likedBy) && user?.uid && post.likedBy.includes(user.uid) ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition-colors`}
                    aria-label="Like post"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label="Show comments"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments || 0}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{relativeTime(post.createdAt)}</span>
                </div>
              </div>

              {/* Comments section */}
              {expandedPostId === post.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="space-y-3">
                    {(commentsMap[post.id] || []).map((c) => (
                      <div key={c.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                          {c.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{c.username || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{relativeTime(c.createdAt)}</span>
                          </div>
                          <p className="text-gray-800 text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a supportive reply..."
                      className="input-field flex-1"
                    />
                    <button onClick={() => handleAddComment(post.id)} className="btn-primary">Reply</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          categories={categories}
        />
      )}
    </div>
  );
};

// Create Post Modal Component
const CreatePostModal = ({ onClose, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What's on your mind?"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {categories.filter(c => c.id !== 'all').map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your thoughts, experiences, or ask for advice..."
                rows={6}
                className="input-field"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Forum;
