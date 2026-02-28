import React, { useMemo, useState } from 'react';
import { BookOpen, Calendar, User, Clock, Search, Filter, Tag } from 'lucide-react';
import { blogPosts, formatDate, getBlogPostsByCategory } from '../utils/blogData';
import './BlogPage.css';

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  const categories = useMemo(
    () => ['All', ...new Set(blogPosts.map(post => post.category))],
    []
  );

  const tags = useMemo(() => {
    const tagSet = new Set();
    blogPosts.forEach((post) => (post.tags || []).forEach((tag) => tagSet.add(tag)));
    return ['All', ...Array.from(tagSet)];
  }, []);

  const filteredPosts = useMemo(() => {
    let filtered = blogPosts;

    if (selectedCategory !== 'All') {
      filtered = getBlogPostsByCategory(selectedCategory);
    }

    if (selectedTag !== 'All') {
      filtered = filtered.filter((post) => (post.tags || []).includes(selectedTag));
    }

    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(needle) ||
          post.excerpt.toLowerCase().includes(needle) ||
          post.category.toLowerCase().includes(needle) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(needle))
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedTag]);

  const handleBlogClick = (slug) => {
    window.location.href = `/blog/post/${slug}.html`;
  };

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <div className="hero-content">
            <p className="hero-eyebrow">EGreet Journal</p>
            <h1 className="hero-title">Card Ideas for Every Occasion</h1>
            <p className="hero-subtitle">
              Browse all published blog posts, discover message ideas, and pick the perfect style for your next card. EGreet is your go-to <a href="/free-ecard-maker" style={{ color: '#fff', textDecoration: 'underline' }}>free online ecard maker</a> and <a href="/greeting-card-maker" style={{ color: '#fff', textDecoration: 'underline' }}>online greeting card maker</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="blog-filters">
        <div className="container">
          <div className="filters-content">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="category-filters">
              <Filter size={20} className="filter-icon" />
              <div className="category-buttons">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="tag-filters">
              <Tag size={20} className="filter-icon" />
              <div className="tag-buttons">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-posts-section">
        <div className="container">
          <div className="section-header">
            <h2>
              {selectedCategory === 'All' ? 'All Blog Posts' : `${selectedCategory} Posts`}
              {selectedTag !== 'All' && ` tagged #${selectedTag}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </h2>
            <p>{filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found</p>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="no-posts">
              <BookOpen size={48} />
              <h3>No posts found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="blog-grid">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="blog-card"
                  onClick={() => handleBlogClick(post.slug)}
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

                    {!!post.tags?.length && (
                      <div className="blog-card-tags">
                        {post.tags.map((tag) => (
                          <span key={`${post.slug}-${tag}`} className="blog-card-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
