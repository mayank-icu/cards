# Blog Integration Guide

## Overview
The EGreet website now includes a fully integrated blog section that works alongside the React application.

## Structure

### React Integration
- **Route**: `/blog` - Redirects to external blog
- **Component**: `src/pages/Blog.jsx` - Handles redirect
- **Homepage Section**: `src/components/BlogSection.jsx` - Shows latest posts on homepage
- **Navigation**: Added to navbar and footer

### External Blog (Static Files)
- **Location**: `public/blog/`
- **Main Page**: `public/blog/index.html`
- **Posts**: `public/blog/post/[slug].html`
- **Assets**: `public/blog/css/` and `public/blog/js/`

## Features

### Homepage Blog Section
- Shows 3 latest blog posts
- Responsive grid layout
- Click to read full posts
- "View All Blog Posts" button

### Full Blog Site
- Complete SEO optimization
- Responsive design
- Same navbar/footer as main site
- Individual blog post pages
- Newsletter signup

## How It Works

1. **User clicks "Blog" in navbar/footer** → React route `/blog` → Redirects to `/blog/`
2. **External blog loads** → Static HTML/CSS/JS files served from `public/blog/`
3. **Homepage shows preview** → BlogSection component fetches and displays latest posts
4. **Click blog post** → Navigates to external blog post page

## Adding New Blog Posts

1. Create new HTML file in `public/blog/post/[slug].html`
2. Update blog data in `public/blog/js/blog.js`
3. Optionally update BlogSection component data

## Benefits

- **SEO Friendly**: Static HTML files are easily indexed
- **Performance**: Fast loading, no React overhead
- **Maintenance**: Easy to update without React knowledge
- **Integration**: Seamless navigation between React app and blog

## Technical Details

### React Router Integration
```jsx
// main.jsx
<Route path="/blog" element={<Blog />} />

// src/pages/Blog.jsx
useEffect(() => {
  window.location.href = '/blog/';
}, []);
```

### Static File Serving
- Blog files served from `public/blog/`
- Vite automatically serves static files from `public/`
- No additional server configuration needed

### Styling Consistency
- Blog uses same CSS variables as React app
- Matching fonts, colors, and design patterns
- Responsive breakpoints aligned

## Future Enhancements

1. **API Integration**: Replace static data with CMS API
2. **Dynamic Loading**: Fetch posts from backend
3. **Search Functionality**: Add search to blog
4. **Comments**: Add comment system
5. **Categories**: Better categorization and filtering
