let contentData = [];
let currentView = 'categorized'; // categorized/alphabetical
let profileLikes = []; // User's liked content IDs
let globalLikeCounts = {}; // Global like counts for all content

function getProfileId() {
    return localStorage.getItem('selectedProfileId');
}

function getProfileName() {
    return localStorage.getItem('selectedProfileName') || 'User';
}

function getProfileAvatar() {
    return localStorage.getItem('selectedProfileAvatar') || 'profile_pic_1.png';
}

// Function to render greeting section
function renderGreetingSection() {
    const profileName = getProfileName();
    const greetingSection = document.createElement('div');
    greetingSection.className = 'greeting-section';
    greetingSection.innerHTML = `
        <div class="container-fluid">
            <h2 class="greeting">Hello, ${profileName}</h2>
            <p class="greeting-subtitle">What do you want to watch today?</p>
        </div>
    `;

    // Insert after header and before hero section
    const header = document.querySelector('.header');
    const heroSection = document.getElementById('heroSection');
    header.parentNode.insertBefore(greetingSection, heroSection);
}

// On DOM init will render
document.addEventListener('DOMContentLoaded', async function() {
    // Check if profile is selected
    const profileId = getProfileId();
    if (!profileId) {
        console.error('No profile selected');
        window.location.href = 'profiles.html';
        return;
    }

    // Set profile image in header based on the selected profile's avatar
    const profileAvatar = getProfileAvatar();
    const profileImage = document.getElementById('profileImage');
    profileImage.src = `./_images/profile/${profileAvatar}`;

    // Set up logout functionality
    const logoutButton = document.getElementById('logoutBtn');
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Render the greeting section
    renderGreetingSection();

    // Load content data first
    await loadContentData();

    // Load likes data before rendering content
    await loadLikesData();

    // Re-render content sections with likes data
    renderContentSections();

    // Set up search functionality
    setupSearch();

    // Set up sort button
    setupSortButton();
});

// Function to load content from API
async function loadContentData() {
    try {
        const response = await fetch('/api/content');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        contentData = await response.json();
        renderHeroSection();
        // Don't render content sections yet - wait for likes data to load first
    } catch (error) {
        console.error('Error loading content data:', error);
    }
}

// Function to load likes data from server
async function loadLikesData() {
    const profileId = getProfileId();
    
    try {
        // Load profile's likes
        const profileResponse = await fetch(`/api/profiles/${profileId}/likes`);
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            profileLikes = profileData.data.likes || [];
        }
        
        // Load global like counts
        const globalResponse = await fetch('/api/content/likes');
        if (globalResponse.ok) {
            const globalData = await globalResponse.json();
            globalLikeCounts = globalData.data || {};
        }
    } catch (error) {
        console.error('Error loading likes data:', error);
    }
}

// Function to render hero section with a random content item
function renderHeroSection() {
    if (contentData.length === 0) return;

    // Select a random content item for the hero
    const randomIndex = Math.floor(Math.random() * contentData.length);
    const heroContent = contentData[randomIndex];

    // Set the hero section
    const heroSection = document.getElementById('heroSection');

    // Set background image using inline style
    heroSection.style.backgroundImage = `url(${heroContent.image})`;

    // Generate hero content HTML
    const heroHTML = `
        <div class="hero-content">
            <h1 class="hero-title">${heroContent.name}</h1>
            <p class="hero-description">${heroContent.description}</p>
            <div class="hero-buttons">
                <button class="btn-play">
                    <i class="bi bi-play-fill me-1"></i>Play
                </button>
                <button class="btn-info">
                    <i class="bi bi-info-circle me-1"></i>Info
                </button>
            </div>
        </div>
    `;

    heroSection.innerHTML = heroHTML;
}

// Function to render content sections
function renderContentSections() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';

    if (currentView === 'alphabetical') {
        // Sort content alphabetically
        const sortedContent = [...contentData].sort((a, b) => a.name.localeCompare(b.name));

        // Create a single section with all content
        mainContent.innerHTML = `
            <h2 class="section-title">All Titles (A-Z)</h2>
            <div class="content-row">
                ${sortedContent.map(item => createContentItemHTML(item)).join('')}
            </div>
        `;
    } else {
        // Group content by type and other categories
        const series = contentData.filter(item => item.type === 'series');
        const movies = contentData.filter(item => item.type === 'movie');
        const trending = contentData.filter(item => item.year >= 2020);

        // Create sections
        if (trending.length > 0) {
            mainContent.innerHTML += `
                <h2 class="section-title">Trending Now</h2>
                <div class="content-row">
                    ${trending.map(item => createContentItemHTML(item)).join('')}
                </div>
            `;
        }

        if (series.length > 0) {
            mainContent.innerHTML += `
                <h2 class="section-title">TV Shows</h2>
                <div class="content-row">
                    ${series.map(item => createContentItemHTML(item)).join('')}
                </div>
            `;
        }

        if (movies.length > 0) {
            mainContent.innerHTML += `
                <h2 class="section-title">Movies</h2>
                <div class="content-row">
                    ${movies.map(item => createContentItemHTML(item)).join('')}
                </div>
            `;
        }
    }

    // Add click events for like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLikeClick);
    });

    // Add click events for content items
    document.querySelectorAll('.content-item').forEach(item => {
        item.addEventListener('click', handleContentClick);
    });
}

// Function to create HTML for a content item
function createContentItemHTML(item) {
    // Get like count and liked status
    const likeCount = getLikeCount(item.id);
    const isLiked = isContentLiked(item.id);

    // Create meta info based on content type
    const metaInfo = item.type === 'series'
        ? `${item.seasons} Season${item.seasons > 1 ? 's' : ''} • ${item.episodes} Episodes`
        : item.duration;

    return `
        <div class="content-item" data-id="${item.id}" data-title="${item.name}" data-type="${item.type}">
            <div class="like-container">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${item.id}">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                </button>
                <div class="like-count">${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</div>
            </div>
            <img src="${item.image}" alt="${item.name}" class="content-image">
            <div class="content-title">${item.name}</div>
            <div class="content-details">
                <div><span class="content-year">${item.year}</span> • ${item.type}</div>
                <div>${metaInfo}</div>
                <div class="content-genre">${item.genre}</div>
            </div>
        </div>
    `;
}

// Function to handle like button clicks
async function handleLikeClick(event) {
    event.stopPropagation();

    const button = event.currentTarget;
    const contentId = parseInt(button.getAttribute('data-id'));
    const isLiked = isContentLiked(contentId);
    const profileId = getProfileId();

    // Disable button during API call
    button.disabled = true;

    try {
        if (isLiked) {
            // Unlike
            await unlikeContent(contentId, profileId);
            button.classList.remove('liked');
            button.innerHTML = '<i class="bi bi-heart"></i>';
        } else {
            // Like
            await likeContent(contentId, profileId);
            button.classList.add('liked');
            button.innerHTML = '<i class="bi bi-heart-fill"></i>';
            createHeartAnimation(button);
        }

        // Update like count display
        const likeCount = getLikeCount(contentId);
        const likeCountEl = button.nextElementSibling;
        likeCountEl.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
    } catch (error) {
        console.error('Error toggling like:', error);
        // Revert UI changes on error
        if (isLiked) {
            button.classList.add('liked');
            button.innerHTML = '<i class="bi bi-heart-fill"></i>';
        } else {
            button.classList.remove('liked');
            button.innerHTML = '<i class="bi bi-heart"></i>';
        }
    } finally {
        button.disabled = false;
    }
}

// Function to create heart animation
function createHeartAnimation(button) {
    const heart = document.createElement('i');
    heart.className = 'bi bi-heart-fill heart-animation';
    heart.style.left = '50%';
    heart.style.top = '50%';
    heart.style.transform = 'translate(-50%, -50%)';

    button.style.position = 'relative';
    button.appendChild(heart);

    // Remove the animation element after it completes
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// Functions for managing likes with server API
function getLikeCount(contentId) {
    return globalLikeCounts[contentId] || 0;
}

function isContentLiked(contentId) {
    return profileLikes.includes(contentId);
}

async function likeContent(contentId, profileId) {
    try {
        const response = await fetch(`/api/profiles/${profileId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contentId })
        });

        if (!response.ok) {
            throw new Error('Failed to like content');
        }

        // Update local state
        if (!profileLikes.includes(contentId)) {
            profileLikes.push(contentId);
        }
        globalLikeCounts[contentId] = (globalLikeCounts[contentId] || 0) + 1;
    } catch (error) {
        console.error('Error liking content:', error);
        throw error;
    }
}

async function unlikeContent(contentId, profileId) {
    try {
        const response = await fetch(`/api/profiles/${profileId}/unlike`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contentId })
        });

        if (!response.ok) {
            throw new Error('Failed to unlike content');
        }

        // Update local state
        profileLikes = profileLikes.filter(id => id !== contentId);
        globalLikeCounts[contentId] = Math.max(0, (globalLikeCounts[contentId] || 1) - 1);
    } catch (error) {
        console.error('Error unliking content:', error);
        throw error;
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const searchResults = document.getElementById('searchResults');
    const mainContent = document.getElementById('mainContent');
    const heroSection = document.getElementById('heroSection');

    // Function to clear search and show regular content
    function clearSearch() {
        searchInput.value = '';
        searchResultsContainer.style.display = 'none';
        mainContent.style.display = 'block';
        heroSection.style.display = 'flex';
    }

    // Function to perform search
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
            // Show regular content when search is cleared
            clearSearch();
            return;
        }

        // Filter content data
        const results = contentData.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.genre.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );

        // Hide regular content and show search results
        mainContent.style.display = 'none';
        heroSection.style.display = 'none';
        searchResultsContainer.style.display = 'block';

        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found</p>';
        } else {
            searchResults.innerHTML = results.map(item => createContentItemHTML(item)).join('');

            // Add click events for like buttons and content items
            searchResults.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', handleLikeClick);
            });

            searchResults.querySelectorAll('.content-item').forEach(item => {
                item.addEventListener('click', handleContentClick);
            });
        }
    }

    // Dynamic search as you type
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300); // 300ms delay to prevent excessive calls
    });

    // Setup clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
}

// Setup sort button functionality
function setupSortButton() {
    const sortBtn = document.getElementById('sortBtn');

    sortBtn.addEventListener('click', function() {
        // Toggle view state
        currentView = currentView === 'categorized' ? 'alphabetical' : 'categorized';

        // Toggle button appearance
        if (currentView === 'alphabetical') {
            sortBtn.innerHTML = '<i class="bi bi-sort-alpha-down-alt"></i>';
            sortBtn.classList.add('active');
        } else {
            sortBtn.innerHTML = '<i class="bi bi-sort-alpha-down"></i>';
            sortBtn.classList.remove('active');
        }

        // Re-render content
        renderContentSections();
    });
}

// Function to handle content item clicks
function handleContentClick(event) {
    // Ignore clicks on like buttons
    if (event.target.closest('.like-btn')) return;

    const contentItem = event.currentTarget;
    const contentTitle = contentItem.getAttribute('data-title');
    const contentType = contentItem.getAttribute('data-type');

    console.log(`Playing: ${contentTitle} (${contentType})`);
    alert(`Playing: ${contentTitle} (${contentType})`);
}