// State management
let currentGenre = '';
let currentType = '';
let currentSort = 'name-asc';
let currentWatchedFilter = 'all';
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let profileLikes = [];
let viewingHistory = [];

// Get profile information from localStorage
function getProfileId() {
    return localStorage.getItem('selectedProfileId');
}

function getProfileName() {
    return localStorage.getItem('selectedProfileName') || 'User';
}

function getProfileAvatar() {
    return localStorage.getItem('selectedProfileAvatar') || 'profile_pic_1.png';
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Check if profile is selected
    const profileId = getProfileId();
    if (!profileId) {
        console.error('No profile selected');
        window.location.href = 'profiles.html';
        return;
    }

    // Set profile image in header
    const profileAvatar = getProfileAvatar();
    const profileImage = document.getElementById('profileImage');
    profileImage.src = `./_images/profile/${profileAvatar}`;

    // Set up logout functionality
    const logoutButton = document.getElementById('logoutBtn');
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Load genres into dropdown
    await loadGenres();

    // Read URL parameters and set initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'series' || typeParam === 'movie') {
        currentType = typeParam;
        const typeSelect = document.getElementById('typeSelect');
        if (typeSelect) {
            typeSelect.value = typeParam;
        }
    }

    // Load profile likes
    await loadProfileLikes();

    // Load viewing history
    await loadViewingHistory();

    // Set up event listeners
    setupEventListeners();

    // Set up infinite scroll
    setupInfiniteScroll();

    // Initial load
    await loadContent();
});

// Load all genres
async function loadGenres() {
    try {
        const response = await fetch('/api/genres', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to load genres');
        }
        const data = await response.json();
        const genres = data.data || data;

        const genreSelect = document.getElementById('genreSelect');
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

// Load profile likes
async function loadProfileLikes() {
    const profileId = getProfileId();
    try {
        const response = await fetch(`/api/profiles/${profileId}/likes`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            profileLikes = data.data?.likes || [];
        }
    } catch (error) {
        console.error('Error loading likes:', error);
    }
}

// Load viewing history
async function loadViewingHistory() {
    const profileId = getProfileId();
    try {
        const response = await fetch(`/api/profiles/${profileId}/viewing-history`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            // API returns { data: [...] }
            viewingHistory = data.data || data.history || [];
        }
    } catch (error) {
        console.error('Error loading viewing history:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Genre filter
    document.getElementById('genreSelect').addEventListener('change', (e) => {
        currentGenre = e.target.value;
        resetAndLoad();
    });

    // Type filter
    document.getElementById('typeSelect').addEventListener('change', (e) => {
        currentType = e.target.value;
        resetAndLoad();
    });

    // Sort filter
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        resetAndLoad();
    });

    // Watched filter
    document.getElementById('watchedFilter').addEventListener('change', (e) => {
        currentWatchedFilter = e.target.value;
        resetAndLoad();
    });

    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('genreSelect').value = '';
        document.getElementById('typeSelect').value = '';
        document.getElementById('sortSelect').value = 'name-asc';
        document.getElementById('watchedFilter').value = 'all';

        currentGenre = '';
        currentType = '';
        currentSort = 'name-asc';
        currentWatchedFilter = 'all';

        resetAndLoad();
    });
}

// Reset pagination and reload content
function resetAndLoad() {
    currentPage = 1;
    hasMore = true;
    document.getElementById('contentGrid').innerHTML = '';
    loadContent();
}

// Set up infinite scroll
function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadMoreContent();
        }
    }, {
        threshold: 0.1
    });

    const loadingIndicator = document.getElementById('loadingIndicator');
    observer.observe(loadingIndicator);
}

// Load content from API with filters
async function loadContent() {
    if (isLoading) return;

    isLoading = true;
    const contentGrid = document.getElementById('contentGrid');
    const noResults = document.getElementById('noResults');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const endMessage = document.getElementById('endMessage');
    const resultsCount = document.getElementById('resultsCount');
    const profileId = getProfileId();

    // Show loading indicator
    loadingIndicator.classList.add('visible');
    noResults.classList.remove('visible');
    endMessage.classList.remove('visible');

    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: process.env.ITEMS_PER_PAGE || 12,
            sort: currentSort,
            watched: currentWatchedFilter,
            profileId: profileId
        });

        if (currentGenre) {
            params.append('genre', currentGenre);
        }
        if (currentType) {
            params.append('type', currentType);
        }

        const response = await fetch(`/api/content/filter?${params}`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || data.message || 'Failed to fetch content';
            throw new Error(errorMessage);
        }

        const responseData = data.data || data;
        const content = responseData.content || [];
        const pagination = responseData.pagination || { hasMore: false, totalCount: 0 };


        // Update state
        hasMore = pagination.hasMore;

        // Hide loading indicator
        loadingIndicator.classList.remove('visible');

        // Update results count
        if (currentPage === 1) {
            resultsCount.textContent = `Showing ${pagination.totalCount} result${pagination.totalCount !== 1 ? 's' : ''}`;
        }

        // Check if there are results
        if (content.length === 0 && currentPage === 1) {
            noResults.classList.add('visible');
            return;
        }

        // Render content cards
        content.forEach(item => {
            const card = createContentCard(item);
            contentGrid.appendChild(card);
        });

        // Show end message if no more content
        if (!hasMore && currentPage >= 1) {
            endMessage.classList.add('visible');
        }

    } catch (error) {
        console.error('Error loading content:', error);
        loadingIndicator.classList.remove('visible');
        showError('Failed to load content. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Load more content (infinite scroll)
function loadMoreContent() {
    if (isLoading || !hasMore) return;
    currentPage++;
    loadContent();
}

// Create content card element
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.setAttribute('data-content-id', item.id);

    const isLiked = profileLikes.includes(item.id);

    // Format additional info based on type
    let additionalInfo = '';
    if (item.type === 'series') {
        additionalInfo = `${item.seasons} Season${item.seasons > 1 ? 's' : ''}, ${item.episodes} Episodes`;
    } else if (item.type === 'movie') {
        additionalInfo = item.duration;
    }

    card.innerHTML = `
        <div class="content-image-container">
            <img src="${item.image}" alt="${item.name}" class="content-image">
            <div class="play-overlay">
                <i class="bi bi-play-circle-fill"></i>
            </div>
            <div class="like-container">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-content-id="${item.id}">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                </button>
            </div>
        </div>
        <div class="content-info">
            <h3 class="content-title">${item.name}</h3>
            <div class="content-details">
                <span class="content-year">${item.year}</span>
                <span>•</span>
                <span class="content-rating">⭐ ${item.rating}</span>
                <span>•</span>
                <span class="content-type">${item.type}</span>
            </div>
            <div class="content-details">
                <span class="content-genre">${item.genre}</span>
                ${additionalInfo ? `<span>•</span><span>${additionalInfo}</span>` : ''}
            </div>
            <p class="content-description">${item.description}</p>
        </div>
    `;

    // Add click handler to play content
    card.addEventListener('click', (e) => {
        // Don't navigate if clicking the like button
        if (e.target.closest('.like-btn')) {
            return;
        }
        window.location.href = `player.html?contentId=${item.id}`;
    });

    // Add like button handler
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleLike(item.id, likeBtn);
    });

    return card;
}

// Toggle like/unlike
async function toggleLike(contentId, button) {
    const profileId = getProfileId();
    const isLiked = profileLikes.includes(contentId);

    try {
        const endpoint = isLiked ? 'unlike' : 'like';
        const response = await fetch(`/api/profiles/${profileId}/${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contentId })
        });

        if (!response.ok) {
            throw new Error(`Failed to ${endpoint} content`);
        }

        // Update local state
        if (isLiked) {
            profileLikes = profileLikes.filter(id => id !== contentId);
            button.classList.remove('liked');
            button.querySelector('i').className = 'bi bi-heart';
        } else {
            profileLikes.push(contentId);
            button.classList.add('liked');
            button.querySelector('i').className = 'bi bi-heart-fill';
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showError('Failed to update like status');
    }
}

// Show error message
function showError(message) {
    // You can implement a toast notification or alert here
    alert(message);
}
