// Blog data
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
        title: "10 Creative Graduation Card Ideas That Honor Academic Achievement",
        excerpt: "Celebrate academic success with inspiring graduation card ideas. From traditional to modern designs, honor the graduate's achievements.",
        category: "graduation",
        author: "EGreet Team",
        date: "2024-02-09",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop&crop=center",
        slug: "creative-graduation-card-ideas"
    },
    {
        id: 8,
        title: "10 Creative New Baby Card Ideas That Welcome New Life",
        excerpt: "Welcome the newest addition with adorable baby card ideas. From cute designs to heartfelt messages, celebrate the joy of new life.",
        category: "new-baby",
        author: "EGreet Team",
        date: "2024-02-13",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop&crop=center",
        slug: "creative-new-baby-card-ideas"
    },
    {
        id: 9,
        title: "10 Creative Congratulations Card Ideas That Celebrate Success",
        excerpt: "Celebrate achievements and milestones with inspiring congratulations card ideas. From career success to personal accomplishments.",
        category: "congratulations",
        author: "EGreet Team",
        date: "2024-02-15",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop&crop=center",
        slug: "creative-congratulations-card-ideas"
    },
    {
        id: 10,
        title: "10 Creative Long Distance Card Ideas That Bridge the Miles",
        excerpt: "Bridge the distance with thoughtful long distance relationship card ideas. From connection cards to思念 designs.",
        category: "long-distance",
        author: "EGreet Team",
        date: "2024-02-07",
        image: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=400&h=200&fit=crop&crop=center",
        slug: "creative-long-distance-card-ideas"
    },
    {
        id: 11,
        title: "10 Creative Formal Invite Card Ideas for Professional Events",
        excerpt: "Create elegant formal invitation cards for professional events. From corporate invitations to business conference designs.",
        category: "formal-invite",
        author: "EGreet Team",
        date: "2024-02-03",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=200&fit=crop&crop=center",
        slug: "creative-formal-invite-card-ideas"
    },
    {
        id: 12,
        title: "10 Creative Time Capsule Card Ideas That Preserve Memories",
        excerpt: "Create meaningful time capsule cards that capture moments and messages for the future. From memory preservation to future message designs.",
        category: "time-capsule",
        author: "EGreet Team",
        date: "2024-02-05",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop&crop=center",
        slug: "creative-time-capsule-card-ideas"
    },
    {
        id: 13,
        title: "10 Creative Wish Jar Card Ideas That Capture Dreams",
        excerpt: "Create magical wish jar cards that collect dreams and aspirations. From dream collection cards to wish sharing designs.",
        category: "wish-jar",
        author: "EGreet Team",
        date: "2024-02-07",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=200&fit=crop&crop=center",
        slug: "creative-wish-jar-card-ideas"
    },
    {
        id: 14,
        title: "10 Creative Crush Ask Out Card Ideas",
        excerpt: "Express your feelings with creative crush ask out card ideas. From romantic to playful, find the perfect way to ask someone out.",
        category: "crush-ask-out",
        author: "EGreet Team",
        date: "2024-02-01",
        image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=200&fit=crop&crop=center",
        slug: "creative-crush-ask-out-card-ideas"
    },
    {
        id: 15,
        title: "10 Creative Apology Card Ideas That Express Sincere Regret",
        excerpt: "Express sincere apologies with thoughtful card ideas. From heartfelt messages to meaningful designs.",
        category: "apology",
        author: "EGreet Team",
        date: "2024-02-03",
        image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&h=200&fit=crop&crop=center",
        slug: "creative-apology-card-ideas"
    },
    {
        id: 16,
        title: "10 Creative Sympathy Card Ideas That Offer Comfort",
        excerpt: "Offer comfort and support during difficult times with thoughtful sympathy card ideas. From condolence cards to comfort support designs.",
        category: "sympathy",
        author: "EGreet Team",
        date: "2024-02-19",
        image: "https://images.unsplash.com/photo-15067858290056-73e3a905e6c1?w=400&h=200&fit=crop&crop=center",
        slug: "creative-sympathy-card-ideas"
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
        'sympathy': 'Sympathy'
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
    window.location.href = `post/${slug}.html`;
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
