import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { getLatestBlogPosts, formatDate } from '../utils/blogData';
import './BlogWidget.css';

const BlogWidget = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const posts = getLatestBlogPosts(2);
        setBlogPosts(posts);
      } catch (error) {
        console.error('Error fetching recent posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  const handleBlogClick = (slug) => {
    // Navigate to the blog post (keeping static HTML for SEO)
    window.location.href = `/blog/post/${slug}.html`;
  };

  const handleViewAllBlogs = () => {
    // Navigate to the React blog page instead of static blog
    window.location.href = '/blog/';
  };

  if (loading) {
    return (
      <div className="blog-widget">
        <div className="widget-header">
          <h3 className="widget-title">
            <BookOpen size={16} />
            Latest Blog Posts
          </h3>
        </div>
        <div className="widget-loading">
          <div className="mini-spinner"></div>
          <span>Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-widget">
      <div className="widget-header">
        <h3 className="widget-title">
          <BookOpen size={16} />
          Latest Blog Posts
        </h3>
        <div className="widget-badge">
          <TrendingUp size={12} />
          <span>New</span>
        </div>
      </div>

      <div className="widget-content">
        {blogPosts.map((post, index) => (
          <article 
            key={post.id} 
            className="widget-post"
            onClick={() => handleBlogClick(post.slug)}
          >
            <div className="widget-post-image">
              <img 
                src={post.image} 
                alt={post.title}
                loading="lazy"
              />
              <div className="widget-post-category">{post.category}</div>
            </div>
            
            <div className="widget-post-content">
              <h4 className="widget-post-title">{post.title}</h4>
              <p className="widget-post-excerpt">{post.excerpt}</p>
              
              <div className="widget-post-meta">
                <span className="widget-post-date">{formatDate(post.date)}</span>
                {post.readTime && (
                  <span className="widget-post-read-time">
                    <Clock size={12} />
                    {post.readTime}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="widget-footer">
        <button className="widget-view-all" onClick={handleViewAllBlogs}>
          View All Posts
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default BlogWidget;
