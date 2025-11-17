// ============================================
// DREAMFM - MAIN APP LOGIC
// ============================================

console.log("🚀 DreamFM App Starting...");

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded");
    setupEventListeners();
    loadHomePage();
});

// Setup Event Listeners
function setupEventListeners() {
    // Bottom Navigation
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Navigate to page
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    console.log("✅ Event listeners setup complete");
}

// Navigation System
function navigateTo(page) {
    console.log("📍 Navigating to:", page);
    
    // Load page content
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'library':
            loadLibraryPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
        default:
            loadHomePage();
    }
}

// ============================================
// HOME PAGE (MOBILE-FIRST DESIGN)
// ============================================

function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error("❌ mainContent element not found!");
        return;
    }
    
    console.log("📄 Loading Home Page...");
    
    mainContent.innerHTML = `
        <div class="home-page">
            <!-- Section 1: Featured Audiobooks -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>🔥 Top Picks for You</h2>
                    <div class="nav-arrows">
                        <button class="arrow prev-arrow" data-section="featured">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button class="arrow next-arrow" data-section="featured">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="carousel" id="featuredCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 2: Recently Added -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>📚 Recently Added</h2>
                    <div class="nav-arrows">
                        <button class="arrow prev-arrow" data-section="recent">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button class="arrow next-arrow" data-section="recent">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="carousel" id="recentCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 3: Popular -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>⭐ Most Popular</h2>
                    <div class="nav-arrows">
                        <button class="arrow prev-arrow" data-section="popular">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button class="arrow next-arrow" data-section="popular">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="carousel" id="popularCarousel">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </section>
            
            <!-- Section 4: Browse by Category -->
            <section class="audio-section">
                <div class="section-header">
                    <h2>📂 Browse Categories</h2>
                </div>
                <div class="categories-grid">
                    <div class="category-card" onclick="filterByCategory('Fiction')">
                        <i class="fa-solid fa-book"></i>
                        <span>Fiction</span>
                    </div>
                    <div class="category-card" onclick="filterByCategory('Romance')">
                        <i class="fa-solid fa-heart"></i>
                        <span>Romance</span>
                    </div>
                    <div class="category-card" onclick="filterByCategory('Thriller')">
                        <i class="fa-solid fa-mask"></i>
                        <span>Thriller</span>
                    </div>
                    <div class="category-card" onclick="filterByCategory('Business')">
                        <i class="fa-solid fa-briefcase"></i>
                        <span>Business</span>
                    </div>
                    <div class="category-card" onclick="filterByCategory('Self-Help')">
                        <i class="fa-solid fa-brain"></i>
                        <span>Self-Help</span>
                    </div>
                    <div class="category-card" onclick="filterByCategory('Horror')">
                        <i class="fa-solid fa-ghost"></i>
                        <span>Horror</span>
                    </div>
                </div>
            </section>
        </div>
    `;
    
    // Load audiobooks
    loadAudiobooks();
    
    // Setup carousel navigation
    setupCarouselNavigation();
}

// Load Audiobooks from Firestore
async function loadAudiobooks() {
    try {
        console.log("📡 Fetching audiobooks from Firestore...");
        
        const snapshot = await db.collection('audiobooks')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            console.warn("⚠️ No audiobooks found");
            document.getElementById('featuredCarousel').innerHTML = `
                <div class="no-books">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                    <h3>No audiobooks yet</h3>
                    <p>Add some books to get started!</p>
                </div>
            `;
            return;
        }
        
        console.log(`✅ Loaded ${snapshot.size} audiobooks`);
        
        // Store all books
        window.allAudiobooks = [];
        snapshot.forEach(doc => {
            window.allAudiobooks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Display in different sections
        displayFeaturedBooks(window.allAudiobooks.slice(0, 10));
        displayRecentBooks(window.allAudiobooks.slice(0, 10));
        displayPopularBooks(window.allAudiobooks.slice(0, 10));
        
    } catch (error) {
        console.error("❌ Error loading audiobooks:", error);
        document.getElementById('featuredCarousel').innerHTML = `
            <div class="no-books">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <h3>Error Loading Audiobooks</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Display Featured Books
function displayFeaturedBooks(books) {
    const container = document.getElementById('featuredCarousel');
    if (!container) return;
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Display Recent Books
function displayRecentBooks(books) {
    const container = document.getElementById('recentCarousel');
    if (!container) return;
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Display Popular Books
function displayPopularBooks(books) {
    const container = document.getElementById('popularCarousel');
    if (!container) return;
    
    // Sort by plays (if available)
    const sorted = [...books].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    
    container.innerHTML = '';
    sorted.forEach(book => {
        container.innerHTML += createMobileBookCard(book);
    });
}

// Create Mobile-Optimized Book Card
function createMobileBookCard(book) {
    const rating = book.rating || 4.5;
    const plays = book.plays || Math.floor(Math.random() * 10000000);
    const playsFormatted = formatPlays(plays);
    
    return `
        <div class="audio-card" onclick="openBook('${book.id}')">
            <div class="card-image">
                <img src="${book.coverUrl || 'https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'">
                <span class="plays-badge">${playsFormatted}+</span>
            </div>
            <div class="card-info">
                <div class="stats">
                    <span>${playsFormatted} PLAYS</span>
                    <span><i class="fa-solid fa-star"></i> ${rating.toFixed(1)}</span>
                </div>
                <p class="title">${book.title}</p>
            </div>
        </div>
    `;
}

// Format Plays Number
function formatPlays(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

// Setup Carousel Navigation (Arrow buttons)
function setupCarouselNavigation() {
    document.querySelectorAll('.nav-arrows .arrow').forEach(arrow => {
        arrow.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            const carousel = document.getElementById(section + 'Carousel');
            
            if (!carousel) return;
            
            const scrollAmount = 300;
            
            if (this.classList.contains('next-arrow')) {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        });
    });
}

// Open Book (Play Audiobook)
function openBook(bookId) {
    console.log("📖 Opening book:", bookId);
    
    // Find book in window.allAudiobooks
    const book = window.allAudiobooks.find(b => b.id === bookId);
    
    if (book) {
        playAudiobook(bookId, book);
    } else {
        console.error("❌ Book not found:", bookId);
        showToast("❌ Book not found!");
    }
}

// Filter by Category
function filterByCategory(category) {
    console.log("🔍 Filtering by category:", category);
    navigateTo('library');
    
    // Wait for library to load, then filter
    setTimeout(() => {
        if (window.filterLibrary) {
            window.filterLibrary(category);
        }
    }, 100);
}

// ============================================
// LIBRARY PAGE
// ============================================

function loadLibraryPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="library-page">
            <div class="library-header">
                <h1>📚 Audiobook Library</h1>
                <div class="library-controls">
                    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search books...">
                    <select id="sortSelect" class="sort-select">
                        <option value="recent">Recent</option>
                        <option value="popular">Popular</option>
                        <option value="rating">Highest Rated</option>
                        <option value="title">Title A-Z</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-chips">
                <button class="filter-chip active" onclick="filterLibrary('all')">All</button>
                <button class="filter-chip" onclick="filterLibrary('Fiction')">Fiction</button>
                <button class="filter-chip" onclick="filterLibrary('Romance')">Romance</button>
                <button class="filter-chip" onclick="filterLibrary('Thriller')">Thriller</button>
                <button class="filter-chip" onclick="filterLibrary('Business')">Business</button>
                <button class="filter-chip" onclick="filterLibrary('Self-Help')">Self-Help</button>
                <button class="filter-chip" onclick="filterLibrary('Horror')">Horror</button>
            </div>
            
            <div id="libraryBooks" class="library-grid">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading library...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load all books
    loadLibraryBooks();
    
    // Setup search and sort
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchBooks(e.target.value);
            });
        }
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortBooks(e.target.value);
            });
        }
    }, 100);
}

async function loadLibraryBooks() {
    try {
        if (!window.allAudiobooks) {
            const snapshot = await db.collection('audiobooks').get();
            
            window.allAudiobooks = [];
            snapshot.forEach(doc => {
                window.allAudiobooks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        displayLibraryBooks(window.allAudiobooks);
        
    } catch (error) {
        console.error("Error loading library:", error);
    }
}

function displayLibraryBooks(books) {
    const container = document.getElementById('libraryBooks');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="no-books">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h3>No books found</h3>
                <p>Try a different filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    books.forEach(book => {
        container.innerHTML += createLibraryBookCard(book);
    });
}

function createLibraryBookCard(book) {
    const rating = book.rating || 4.5;
    const plays = book.plays || Math.floor(Math.random() * 10000000);
    
    return `
        <div class="library-book-card" onclick="openBook('${book.id}')">
            <div class="library-book-cover">
                <img src="${book.coverUrl || 'https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/200x300/ab47bc/FFFFFF?text=DreamFM'">
                ${book.language ? `<div class="book-badge">${book.language}</div>` : ''}
            </div>
            <div class="library-book-info">
                <h3 class="library-book-title">${book.title}</h3>
                <p class="library-book-author">${book.author || 'Unknown Author'}</p>
                <div class="library-book-meta">
                    <span class="library-book-duration">🕐 ${book.duration || 'N/A'}</span>
                    <span class="library-book-chapters">📑 ${book.totalChapters || 0} Ch</span>
                </div>
                <div class="library-book-rating">
                    <span style="color: #ffd700;">⭐</span>
                    <span>${rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
}

window.filterLibrary = function(category) {
    // Update active chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.textContent === category || (category === 'all' && chip.textContent === 'All')) {
            chip.classList.add('active');
        }
    });
    
    if (category === 'all') {
        displayLibraryBooks(window.allAudiobooks);
    } else {
        const filtered = window.allAudiobooks.filter(book => book.category === category);
        displayLibraryBooks(filtered);
    }
}

function searchBooks(query) {
    if (!query) {
        displayLibraryBooks(window.allAudiobooks);
        return;
    }
    
    const filtered = window.allAudiobooks.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(query.toLowerCase()))
    );
    
    displayLibraryBooks(filtered);
}

function sortBooks(sortBy) {
    let sorted = [...window.allAudiobooks];
    
    switch(sortBy) {
        case 'popular':
            sorted.sort((a, b) => (b.plays || 0) - (a.plays || 0));
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'recent':
        default:
            // Already sorted by createdAt
            break;
    }
    
    displayLibraryBooks(sorted);
}

// ============================================
// PROFILE PAGE
// ============================================

function loadProfilePage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!window.currentUser) {
        mainContent.innerHTML = `
            <div class="profile-page">
                <div class="auth-container">
                    <div style="font-size: 5rem; margin-bottom: 20px;">🔒</div>
                    <h1>Login Required</h1>
                    <p>Please login to access your profile</p>
                </div>
            </div>
        `;
        return;
    }
    
    const user = window.currentUser;
    
    mainContent.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email}" 
                     class="profile-avatar-large">
                <h1>${user.displayName || 'User'}</h1>
                <p>${user.email}</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <h3>0</h3>
                    <p>Books Played</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏰</div>
                    <h3>0h</h3>
                    <p>Hours Listened</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <h3>0</h3>
                    <p>Favorites</p>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="profile-btn" onclick="window.logout()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                </button>
                <button class="profile-btn" onclick="clearAudioCache()">
                    <i class="fa-solid fa-trash"></i>
                    Clear Cache
                </button>
            </div>
            
            <div class="profile-sections">
                <div class="section">
                    <h2>Continue Listening</h2>
                    <p style="color: #808080;">No recent books</p>
                </div>
                
                <div class="section">
                    <h2>Favorites</h2>
                    <p style="color: #808080;">No favorites yet</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show Toast Notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add sample audiobook (for testing)
async function addSampleAudiobook() {
    try {
        await db.collection('audiobooks').add({
            title: "Sample Audiobook " + Date.now(),
            author: "Test Author",
            narrator: "AI Voice",
            coverUrl: "https://picsum.photos/400/600?random=" + Date.now(),
            description: "This is a test audiobook",
            category: "Fiction",
            language: "English",
            duration: "2h 30m",
            totalChapters: 10,
            rating: 4.5,
            plays: Math.floor(Math.random() * 10000000),
            audioSlug: "sample-" + Date.now(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Sample audiobook added!");
        loadAudiobooks();
    } catch (error) {
        console.error("❌ Error adding sample:", error);
    }
}

// Console helper
console.log(`
%c🎧 DreamFM Console Commands 🎧

%caddSampleAudiobook() %c- Add a test book
%cloadAudiobooks() %c- Reload books
%cnavigateTo('home') %c- Go to home
%cnavigateTo('library') %c- Go to library
%cnavigateTo('profile') %c- Go to profile
%cclearAudioCache() %c- Clear audio cache

`, 
'font-size: 16px; font-weight: bold; color: #ab47bc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;',
'color: #ab47bc; font-weight: bold;', 'color: #ccc;'
);
