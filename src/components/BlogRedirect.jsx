import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BlogRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    // Get the full path and redirect to the static blog site
    const currentPath = location.pathname;
    const search = location.search;
    const hash = location.hash;
    
    // Redirect to the static blog site without showing the redirect message
    window.location.replace(`https://egreet.in/blog${currentPath.replace('/blog', '')}${search}${hash}`);
  }, [location]);

  // Return empty fragment - no visible content
  return null;
};

export default BlogRedirect;
