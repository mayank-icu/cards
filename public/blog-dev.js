// Blog data for development
const blogPosts = [
    {
        id: 1,
        title: "10 Creative Valentine Card Ideas That Express Love",
        excerpt: "Discover romantic and heartfelt Valentine card ideas that will make your loved one feel special. From classic designs to modern expressions of love.",
        category: "valentine",
        author: "EGreet Team",
        date: "2024-02-01",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&crop=center",
        slug: "creative-valentine-card-ideas"
    },
    {
        id: 2,
        title: "10 Creative Anniversary Card Ideas That Celebrate Love",
        excerpt: "Celebrate your special day with unique anniversary card ideas. From romantic to playful, find the perfect way to honor your relationship.",
        category: "anniversary",
        author: "EGreet Team",
        date: "2024-02-03",
        image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=200&fit=crop&crop=center",
        slug: "creative-anniversary-card-ideas"
    },
    {
        id: 3,
        title: "10 Creative Thank You Card Ideas That Show Gratitude",
        excerpt: "Express your appreciation with thoughtful thank you card designs. From simple elegance to creative expressions of gratitude.",
        category: "thank-you",
        author: "EGreet Team",
        date: "2024-02-05",
        image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&h=200&fit=crop&crop=center",
        slug: "creative-thank-you-card-ideas"
    },
    {
        id: 4,
        title: "10 Creative Birthday Card Ideas That Will Make Their Day Special",
        excerpt: "Discover unique and heartfelt birthday card designs that go beyond the ordinary. From pop-up cards to personalized messages, learn how to create birthday cards that truly celebrate your loved ones.",
        category: "birthday",
        author: "EGreet Team",
        date: "2024-01-15",
        image: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=400&h=200&fit=crop&crop=center",
        slug: "creative-birthday-card-ideas"
    },
    {
        id: 5,
        title: "10 Creative Wedding Card Ideas That Celebrate Love & Union",
        excerpt: "Create beautiful wedding cards that honor the special day. From elegant invitations to heartfelt congratulations, find the perfect design.",
        category: "wedding",
        author: "EGreet Team",
        date: "2024-02-11",
        image: "https://images.unsplash.com/photo-1519227381189-be72d36d8aab?w=400&h=200&fit=crop&crop=center",
        slug: "creative-wedding-card-ideas"
    },
    {
        id: 6,
        title: "10 Creative Get Well Soon Card Ideas That Send Healing Wishes",
        excerpt: "Send comfort and healing wishes with thoughtful get well soon card ideas. From gentle designs to uplifting messages.",
        category: "get-well",
        author: "EGreet Team",
        date: "2024-02-17",
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop&crop=center",
        slug: "creative-get-well-soon-card-ideas"
    },
    {
        id: 7,
        title: "10 Festive Christmas Card Ideas to Spread Holiday Cheer",
        excerpt: "Spread the joy of the season with these creative and festive Christmas card ideas. From traditional to modern, find the perfect design for everyone on your list.",
        category: "christmas",
        author: "EGreet Team",
        date: "2024-12-15",
        image: "https://images.unsplash.com/photo-1576267423445-807c697530f2?w=400&h=200&fit=crop&crop=center",
        slug: "christmas-card-ideas"
    },
    {
        id: 8,
        title: "Missing You Card Ideas: Heartfelt Ways to Bridge the Distance",
        excerpt: "When you can't be there in person, a thoughtful card is the next best thing. Explore touching ideas for 'Missing You' cards that show you care.",
        category: "missing-you",
        author: "EGreet Team",
        date: "2024-02-10",
        image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=200&fit=crop&crop=center",
        slug: "missing-you-card-ideas"
    },
    {
        id: 9,
        title: "10 Inspiring New Year Card Ideas to Welcome 2025",
        excerpt: "Ring in the new year with unique New Year card ideas. Create personalized wishes for friends and family with EGreet's creative designs.",
        category: "new-year",
        author: "EGreet Team",
        date: "2024-12-28",
        image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=200&fit=crop&crop=center",
        slug: "new-year-card-ideas"
    },
    {
        id: 10,
        title: "10 Joyful Easter Card Ideas to Celebrate Renewal",
        excerpt: "Celebrate Easter with creative card ideas. From bunny-themed crafts to elegant floral designs, share the joy of spring with EGreet.",
        category: "easter",
        author: "EGreet Team",
        date: "2024-03-15",
        image: "https://images.unsplash.com/photo-1521685968273-047f1530d990?w=400&h=200&fit=crop&crop=center",
        slug: "easter-card-ideas"
    },
    {
        id: 11,
        title: "10 Spooky and Fun Halloween Card Ideas",
        excerpt: "Get ready for a spooktacular Halloween with creative card ideas. From cute ghosts to eerie designs, send shivers of delight with EGreet.",
        category: "halloween",
        author: "EGreet Team",
        date: "2024-10-10",
        image: "https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?w=400&h=200&fit=crop&crop=center",
        slug: "halloween-card-ideas"
    },
    {
        id: 12,
        title: "10 Encouraging Good Luck Card Ideas for Success",
        excerpt: "Wish them the best with inspiring Good Luck card ideas. Perfect for exams, new jobs, or big adventures. Create yours with EGreet.",
        category: "good-luck",
        author: "EGreet Team",
        date: "2024-05-20",
        image: "https://images.unsplash.com/photo-1555601568-c9e6130f0633?w=400&h=200&fit=crop&crop=center",
        slug: "good-luck-card-ideas"
    },
    {
        id: 13,
        title: "10 Memorable Retirement Card Ideas to Celebrate a New Chapter",
        excerpt: "Celebrate years of hard work with creative retirement card ideas. From funny to heartfelt, find the perfect way to say 'Happy Retirement'.",
        category: "retirement",
        author: "EGreet Team",
        date: "2024-06-30",
        image: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&h=200&fit=crop&crop=center",
        slug: "retirement-card-ideas"
    },
    {
        id: 14,
        title: "10 Heartwarming Thinking of You Card Ideas",
        excerpt: "Let someone know they are in your thoughts with sweet Thinking of You card ideas. Simple gestures that mean the world.",
        category: "thinking-of-you",
        author: "EGreet Team",
        date: "2024-07-15",
        image: "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=400&h=200&fit=crop&crop=center",
        slug: "thinking-of-you-card-ideas"
    },
    {
        id: 15,
        title: "10 Purr-fect Card Ideas for Cat Lovers",
        excerpt: "Delight the feline enthusiast in your life with creative cat-themed card ideas. From cute kittens to funny cat puns, find the perfect design.",
        category: "cat-lovers",
        author: "EGreet Team",
        date: "2024-08-08",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop&crop=center",
        slug: "cat-lovers-card-ideas"
    },
    {
        id: 16,
        title: "10 Uplifting Balloon Celebration Card Ideas",
        excerpt: "Celebrate any joyful moment with colorful balloon-themed card ideas. Perfect for birthdays, graduations, and more.",
        category: "balloon-celebration",
        author: "EGreet Team",
        date: "2024-09-12",
        image: "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?w=400&h=200&fit=crop&crop=center",
        slug: "balloon-celebration-card-ideas"
    }
];

// Initialize blog page
document.addEventListener('DOMContentLoaded', function () {
    renderBlogPosts();
    initializeNavbar();
    initializeNewsletter();
    initializeSearchAndFilter();
});

// Initialize search and filter functionality
function initializeSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (!searchInput || filterButtons.length === 0) return;
    
    let currentCategory = 'all';
    let currentSearchTerm = '';
    
    // Handle search input
    searchInput.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.toLowerCase();
        filterAndRenderPosts();
    });
    
    // Handle filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentCategory = this.dataset.category;
            filterAndRenderPosts();
        });
    });
    
    // Filter and render posts
    function filterAndRenderPosts() {
        const blogGrid = document.getElementById('blogGrid');
        if (!blogGrid) return;
        
        // Clear current posts
        blogGrid.innerHTML = '';
        
        // Filter posts
        const filteredPosts = blogPosts.filter(post => {
            const matchesCategory = currentCategory === 'all' || post.category === currentCategory;
            const matchesSearch = currentSearchTerm === '' || 
                post.title.toLowerCase().includes(currentSearchTerm) ||
                post.excerpt.toLowerCase().includes(currentSearchTerm) ||
                post.category.toLowerCase().includes(currentSearchTerm);
            
            return matchesCategory && matchesSearch;
        });
        
        // Render filtered posts
        filteredPosts.forEach(post => {
            const blogCard = createBlogCard(post);
            blogGrid.appendChild(blogCard);
        });
        
        // Show no results message if needed
        if (filteredPosts.length === 0) {
            blogGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No blog posts found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
        }
    }
}

// Render blog posts
function renderBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return;

    blogPosts.forEach(post => {
        const blogCard = createBlogCard(post);
        blogGrid.appendChild(blogCard);
    });
}

// Create blog card element
function createBlogCard(post) {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.onclick = () => navigateToBlogPost(post.slug);

    card.innerHTML = `
        <img src="${post.image}" alt="${post.title}" class="blog-card-image" loading="lazy">
        <div class="blog-card-content">
            <span class="blog-card-category">${formatCategory(post.category)}</span>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <div class="blog-card-meta">
                <div class="blog-card-author">
                    <i class="fas fa-user"></i>
                    <span>${post.author}</span>
                </div>
                <div class="blog-card-date">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(post.date)}</span>
                </div>
            </div>
            <div class="blog-card-read-more">
                <button class="read-more-btn" onclick="event.stopPropagation(); navigateToBlogPost('${post.slug}')">
                    Read More <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

// Format category name
function formatCategory(category) {
    const categoryMap = {
        'valentine': 'Valentine',
        'anniversary': 'Anniversary',
        'thank-you': 'Thank You',
        'birthday': 'Birthday',
        'wedding': 'Wedding',
        'get-well': 'Get Well',
        'graduation': 'Graduation',
        'new-baby': 'New Baby',
        'congratulations': 'Congratulations',
        'long-distance': 'Long Distance',
        'formal-invite': 'Formal Invite',
        'time-capsule': 'Time Capsule',
        'wish-jar': 'Wish Jar',
        'crush-ask-out': 'Crush Ask Out',
        'apology': 'Apology',
        'sympathy': 'Sympathy',
        'christmas': 'Christmas',
        'missing-you': 'Missing You',
        'new-year': 'New Year',
        'easter': 'Easter',
        'halloween': 'Halloween',
        'good-luck': 'Good Luck',
        'retirement': 'Retirement',
        'thinking-of-you': 'Thinking of You',
        'cat-lovers': 'Cat Lovers',
        'balloon-celebration': 'Balloon Celebration'
    };
    return categoryMap[category] || category;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Navigate to blog post
function navigateToBlogPost(slug) {
    // In development, open the blog post file
    window.open(`/blog/post/${slug}.html`, '_blank');
}

// Initialize navbar
function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    // Handle scroll effect
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Handle mobile menu toggle
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', function () {
            navbarMenu.classList.toggle('open');
            mobileMenuToggle.classList.toggle('open');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (event) {
            if (!navbar.contains(event.target)) {
                navbarMenu.classList.remove('open');
                mobileMenuToggle.classList.remove('open');
            }
        });
    }
}

// Initialize newsletter
function initializeNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;

        // Show success message
        showNotification('Thank you for subscribing! Check your email for confirmation.');

        // Reset form
        this.reset();
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-gradient);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
