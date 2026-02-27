import React from 'react';
import BlogPage from '../components/BlogPage';
import SimpleSEO from '../components/SimpleSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Blog = () => {
  // SEO configuration for blog page
  const blogSEO = {
    title: 'EGreet Blog - Greeting Card Ideas & Inspiration | Card Making Tips',
    description: 'Discover creative greeting card ideas, design tips, and inspiration for every occasion. Learn how to make personalized cards that touch hearts. Free card making guides and tutorials.',
    keywords: 'greeting card blog, card making ideas, birthday card tips, valentine card inspiration, card design tutorials, personalized cards, creative card ideas, card making guide',
    canonical: 'https://egreet.in/blog/'
  };

  return (
    <div className="blog-page">
      <SimpleSEO {...blogSEO} />
      <Navbar />
      <BlogPage />
      <Footer />
    </div>
  );
};

export default Blog;
