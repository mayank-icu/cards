import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { getLatestBlogPosts, formatDate } from '../utils/blogData';
import './BlogSection.css';

const BlogSection = ({ limit = 3, showHeader = true, showViewAll = true }) => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest blog posts from unified data source
    const fetchBlogPosts = async () => {
      try {
        // Simulate API loading for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const posts = getLatestBlogPosts(limit);
        setBlogPosts(posts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [limit]);

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
      <section className="blog-section">
        <div className="container">
          <div className="blog-loading">
            <div className="loading-spinner"></div>
            <p>Loading latest blog posts...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="blog-section">
      <div className="container">
        {showHeader && (
          <div className="blog-header">
            <h2 className="blog-title" style={{ 
              fontFamily: "'Playfair Display', serif",
              fontWeight: '300',
              fontSize: '2.5rem',
              lineHeight: '1.2'
            }}>
              Latest <span className="gradient-text">Card Making Tips</span>
            </h2>
            <p className="blog-subtitle">
              Get inspired with creative ideas, design tips, and tutorials for making beautiful greeting cards.
            </p>
          </div>
        )}

        <div className="blog-grid">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className="blog-card"
              onClick={() => handleBlogClick(post.slug)}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="blog-card-image-wrapper">
                <img
                  src={post.image}
                  alt={post.title}
                  className="blog-card-image"
                  loading="lazy"
                />
                <div className="blog-card-overlay">
                  <div className="blog-card-category">{post.category}</div>
                </div>
              </div>
              
              <div className="blog-card-content">
                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                
                <div className="blog-card-meta">
                  <div className="blog-card-author">
                    <User size={14} />
                    <span>{post.author}</span>
                  </div>
                  <div className="blog-card-date">
                    <Calendar size={14} />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  {post.readTime && (
                    <div className="blog-card-read-time">
                      <Clock size={14} />
                      <span>{post.readTime}</span>
                    </div>
                  )}
                </div>
                
                <div className="blog-card-read-more">
                  <span>Read More</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {showViewAll && (
          <div className="blog-cta">
            <div className="cta-content">
              <h3 className="cta-title">Want more card making inspiration?</h3>
              <p className="cta-subtitle">
                Explore our full blog with 50+ articles covering every occasion and technique
              </p>
              <button className="cta-button" onClick={handleViewAllBlogs}>
                View All Blog Posts
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
