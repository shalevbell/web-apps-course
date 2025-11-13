/**
 * Content Details Page JavaScript
 * Handles loading content information, viewing history, likes, and similar content
 */

// Global variables
let currentContent = null;
let currentProfile = null;
let viewingHistory = null;
let isLiked = false;

// Sample cast data (in a real app, this would come from a database)
const CAST_DATA = {
    1: [ // Stranger Things
        { name: "Millie Bobby Brown", character: "Eleven", wikipedia: "https://en.wikipedia.org/wiki/Millie_Bobby_Brown" },
        { name: "Finn Wolfhard", character: "Mike Wheeler", wikipedia: "https://en.wikipedia.org/wiki/Finn_Wolfhard" },
        { name: "Gaten Matarazzo", character: "Dustin Henderson", wikipedia: "https://en.wikipedia.org/wiki/Gaten_Matarazzo" },
        { name: "Caleb McLaughlin", character: "Lucas Sinclair", wikipedia: "https://en.wikipedia.org/wiki/Caleb_McLaughlin" },
        { name: "Noah Schnapp", character: "Will Byers", wikipedia: "https://en.wikipedia.org/wiki/Noah_Schnapp" }
    ],
    2: [ // Breaking Bad
        { name: "Bryan Cranston", character: "Walter White", wikipedia: "https://en.wikipedia.org/wiki/Bryan_Cranston" },
        { name: "Aaron Paul", character: "Jesse Pinkman", wikipedia: "https://en.wikipedia.org/wiki/Aaron_Paul" },
        { name: "Anna Gunn", character: "Skyler White", wikipedia: "https://en.wikipedia.org/wiki/Anna_Gunn" },
        { name: "Dean Norris", character: "Hank Schrader", wikipedia: "https://en.wikipedia.org/wiki/Dean_Norris" }
    ],
    3: [ // The Witcher
        { name: "Henry Cavill", character: "Geralt of Rivia", wikipedia: "https://en.wikipedia.org/wiki/Henry_Cavill" },
        { name: "Anya Chalotra", character: "Yennefer of Vengerberg", wikipedia: "https://en.wikipedia.org/wiki/Anya_Chalotra" },
        { name: "Freya Allan", character: "Ciri", wikipedia: "https://en.wikipedia.org/wiki/Freya_Allan" }
    ],
    4: [ // Inception
        { name: "Leonardo DiCaprio", character: "Dom Cobb", wikipedia: "https://en.wikipedia.org/wiki/Leonardo_DiCaprio" },
        { name: "Marion Cotillard", character: "Mal Cobb", wikipedia: "https://en.wikipedia.org/wiki/Marion_Cotillard" },
        { name: "Tom Hardy", character: "Eames", wikipedia: "https://en.wikipedia.org/wiki/Tom_Hardy" },
        { name: "Ellen Page", character: "Ariadne", wikipedia: "https://en.wikipedia.org/wiki/Elliot_Page" }
    ]
};

// Generate sample episodes for series
function generateEpisodes(totalEpisodes, seasons) {
    const episodes = [];
    const episodesPerSeason = Math.ceil(totalEpisodes / seasons);

    for (let season = 1; season <= seasons; season++) {
        const seasonEpisodes = season === seasons ?
            totalEpisodes - (episodesPerSeason * (seasons - 1)) :
            episodesPerSeason;

        for (let ep = 1; ep <= seasonEpisodes; ep++) {
            const episodeNumber = ((season - 1) * episodesPerSeason) + ep;
            episodes.push({
                season: season,
                episode: ep,
                title: `Episode ${ep}`,
                description: `Episode ${ep} of Season ${season}`,
                duration: Math.floor(Math.random() * 20) + 40 + " min",
                thumbnail: currentContent?.image || './_images/posters/default.jpg'
            });
        }
    }
    return episodes;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Content details page loaded');

    try {
        // Get content ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const contentId = urlParams.get('id');

        if (!contentId) {
            throw new Error('No content ID provided');
        }

        // Load user session and profile
        await loadUserSession();

        // Load content details
        await loadContentDetails(contentId);

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing page:', error);
        showError(error.message);
    }
});

// Load user session and current profile
async function loadUserSession() {
    try {
        // Get current user
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
            window.location.href = '/login.html';
            return;
        }

        const userData = await userResponse.json();

        // Get current profile from localStorage
        const profileId = localStorage.getItem('selectedProfileId') || localStorage.getItem('activeProfileId');
        const profileName = localStorage.getItem('selectedProfileName');
        const profileAvatar = localStorage.getItem('selectedProfileAvatar');

        if (!profileId) {
            window.location.href = '/profiles.html';
            return;
        }

        // Construct currentProfile object from localStorage items
        currentProfile = {
            id: profileId,
            name: profileName,
            avatar: profileAvatar
        };

        // Update navigation
        document.getElementById('navProfileName').textContent = currentProfile.name;
        document.getElementById('navProfileAvatar').src = `./_images/profile/${currentProfile.avatar}`;

    } catch (error) {
        console.error('Error loading user session:', error);
        window.location.href = '/login.html';
    }
}

// Load content details
async function loadContentDetails(contentId) {
    try {
        showLoading(true);

        // Fetch content data
        const contentResponse = await fetch('/api/content');
        if (!contentResponse.ok) {
            throw new Error('Failed to load content data');
        }

        const contentData = await contentResponse.json();
        currentContent = contentData.find(item => item.id == contentId);

        if (!currentContent) {
            throw new Error('Content not found');
        }

        // Load viewing history for this content
        await loadViewingHistory(contentId);

        // Load like status
        await loadLikeStatus(contentId);

        // Display content information
        displayContentInfo();

        // Load episodes if it's a series
        if (currentContent.type === 'series') {
            displayEpisodes();
        }

        // Load cast information
        displayCast();

        // Load similar content
        await loadSimilarContent();

    } catch (error) {
        console.error('Error loading content details:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Load viewing history for this content
async function loadViewingHistory(contentId) {
    try {
        const response = await fetch(`/api/profiles/${currentProfile.id}/viewing-history/${contentId}`);
        if (response.ok) {
            const data = await response.json();
            viewingHistory = data.data;
        } else {
            viewingHistory = null;
        }
    } catch (error) {
        console.error('Error loading viewing history:', error);
        viewingHistory = null;
    }
}

// Load like status
async function loadLikeStatus(contentId) {
    try {
        const response = await fetch(`/api/profiles/${currentProfile.id}/likes`);
        if (response.ok) {
            const data = await response.json();
            isLiked = data.data.includes(parseInt(contentId));
        } else {
            isLiked = false;
        }
    } catch (error) {
        console.error('Error loading like status:', error);
        isLiked = false;
    }
}

// Display content information
function displayContentInfo() {
    document.getElementById('contentTitle').textContent = currentContent.name;
    document.getElementById('contentYear').textContent = currentContent.year;
    document.getElementById('contentRating').textContent = currentContent.rating;
    document.getElementById('contentGenre').textContent = currentContent.genre;
    document.getElementById('contentDescription').textContent = currentContent.description;

    // Set duration/episodes info
    if (currentContent.type === 'movie') {
        document.getElementById('contentDuration').textContent = currentContent.duration;
    } else {
        document.getElementById('contentDuration').textContent =
            `${currentContent.seasons} Season${currentContent.seasons > 1 ? 's' : ''} • ${currentContent.episodes} Episodes`;
    }

    // Set hero background
    const heroBackground = document.getElementById('heroBackground');
    heroBackground.style.backgroundImage = `url('${currentContent.image}')`;

    // Update page title
    document.title = `Netflix - ${currentContent.name}`;

    // Configure action buttons based on viewing history
    configureActionButtons();

    // Configure like button
    configureLikeButton();
}

// Configure action buttons based on viewing status
function configureActionButtons() {
    const playButton = document.getElementById('playButton');
    const resumeButton = document.getElementById('resumeButton');
    const restartButton = document.getElementById('restartButton');
    const watchAgainButton = document.getElementById('watchAgainButton');

    // Hide all buttons first
    [playButton, resumeButton, restartButton, watchAgainButton].forEach(btn => {
        btn.style.display = 'none';
    });

    if (!viewingHistory) {
        // Never watched - show Play button
        playButton.style.display = 'inline-block';
    } else if (viewingHistory.completed) {
        // Completed - show Watch Again button
        watchAgainButton.style.display = 'inline-block';
    } else if (viewingHistory.currentTime > 0) {
        // Partially watched - show Resume and Restart buttons
        resumeButton.style.display = 'inline-block';
        restartButton.style.display = 'inline-block';
    } else {
        // No progress - show Play button
        playButton.style.display = 'inline-block';
    }
}

// Configure like button
function configureLikeButton() {
    const likeButton = document.getElementById('likeButton');
    const unlikeButton = document.getElementById('unlikeButton');

    if (isLiked) {
        likeButton.style.display = 'none';
        unlikeButton.style.display = 'inline-block';
    } else {
        likeButton.style.display = 'inline-block';
        unlikeButton.style.display = 'none';
    }
}

// Display episodes for series
function displayEpisodes() {
    const episodesSection = document.getElementById('episodesSection');
    const seasonSelect = document.getElementById('seasonSelect');
    const episodesList = document.getElementById('episodesList');

    if (currentContent.type !== 'series') {
        episodesSection.style.display = 'none';
        return;
    }

    episodesSection.style.display = 'block';

    // Populate season selector
    seasonSelect.innerHTML = '';
    for (let i = 1; i <= currentContent.seasons; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        seasonSelect.appendChild(option);
    }

    // Generate episodes
    const episodes = generateEpisodes(currentContent.episodes, currentContent.seasons);

    // Display episodes for season 1 initially
    displayEpisodesForSeason(episodes, 1);

    // Season selector change handler
    seasonSelect.addEventListener('change', (e) => {
        displayEpisodesForSeason(episodes, parseInt(e.target.value));
    });
}

// Display episodes for specific season
function displayEpisodesForSeason(allEpisodes, season) {
    const episodesList = document.getElementById('episodesList');
    const seasonEpisodes = allEpisodes.filter(ep => ep.season === season);

    episodesList.innerHTML = '';

    seasonEpisodes.forEach((episode, index) => {
        const episodeElement = document.createElement('div');
        episodeElement.className = 'episode-item';

        // Check if this episode has viewing progress
        const episodeProgress = Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0;

        episodeElement.innerHTML = `
            <div class="episode-thumbnail">
                <img src="${episode.thumbnail}" alt="${episode.title}">
                <div class="episode-number">${episode.episode}</div>
                ${episodeProgress > 0 ? `<div class="episode-progress"><div class="progress-bar" style="width: ${episodeProgress}%"></div></div>` : ''}
            </div>
            <div class="episode-info">
                <h5 class="episode-title">${episode.title}</h5>
                <p class="episode-description">${episode.description}</p>
                <span class="episode-duration">${episode.duration}</span>
            </div>
            <div class="episode-actions">
                <button class="btn btn-sm btn-outline-light play-episode-btn" data-episode="${episode.episode}" data-season="${episode.season}">
                    <i class="bi bi-play-fill"></i>
                </button>
            </div>
        `;

        episodesList.appendChild(episodeElement);
    });

    // Add event listeners for episode play buttons
    episodesList.querySelectorAll('.play-episode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const season = e.target.closest('[data-season]').dataset.season;
            const episode = e.target.closest('[data-episode]').dataset.episode;
            playEpisode(season, episode);
        });
    });
}

// Display cast information
function displayCast() {
    const castList = document.getElementById('castList');
    const cast = CAST_DATA[currentContent.id] || [];

    if (cast.length === 0) {
        castList.innerHTML = '<p class="text-muted">Cast information not available.</p>';
        return;
    }

    castList.innerHTML = '';

    cast.forEach(actor => {
        const castElement = document.createElement('div');
        castElement.className = 'cast-member';

        castElement.innerHTML = `
            <div class="cast-info">
                <h6 class="actor-name">
                    <a href="${actor.wikipedia}" target="_blank" rel="noopener noreferrer">
                        ${actor.name} <i class="bi bi-box-arrow-up-right"></i>
                    </a>
                </h6>
                <p class="character-name">${actor.character}</p>
            </div>
        `;

        castList.appendChild(castElement);
    });
}

// Load similar content
async function loadSimilarContent() {
    try {
        const response = await fetch('/api/content/similar/' + currentContent.id);
        let similarContent = [];

        if (response.ok) {
            const data = await response.json();
            similarContent = data.data || [];
        } else {
            // Fallback: get content from same genre
            const contentResponse = await fetch('/api/content');
            if (contentResponse.ok) {
                const allContent = await contentResponse.json();
                similarContent = allContent
                    .filter(item =>
                        item.id !== currentContent.id &&
                        item.genre.toLowerCase().includes(currentContent.genre.split(',')[0].toLowerCase().trim())
                    )
                    .slice(0, 4);
            }
        }

        displaySimilarContent(similarContent);

    } catch (error) {
        console.error('Error loading similar content:', error);
        displaySimilarContent([]);
    }
}

// Display similar content
function displaySimilarContent(similarContent) {
    const similarContentContainer = document.getElementById('similarContent');

    if (similarContent.length === 0) {
        similarContentContainer.innerHTML = '<p class="text-muted">No similar content found.</p>';
        return;
    }

    similarContentContainer.innerHTML = '';

    similarContent.forEach(content => {
        const contentElement = document.createElement('div');
        contentElement.className = 'similar-content-item';

        contentElement.innerHTML = `
            <div class="similar-content-thumbnail">
                <img src="${content.image}" alt="${content.name}">
                <div class="similar-content-overlay">
                    <button class="btn btn-sm btn-light play-similar-btn" data-content-id="${content.id}">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </div>
            </div>
            <div class="similar-content-info">
                <h6 class="similar-content-title">${content.name}</h6>
                <p class="similar-content-meta">${content.year} • ${content.rating}</p>
                <p class="similar-content-description">${content.description.substring(0, 100)}...</p>
            </div>
        `;

        // Add click handler to navigate to similar content
        contentElement.addEventListener('click', () => {
            window.location.href = `content-details.html?id=${content.id}`;
        });

        similarContentContainer.appendChild(contentElement);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Play button
    document.getElementById('playButton').addEventListener('click', () => {
        playContent(false);
    });

    // Resume button
    document.getElementById('resumeButton').addEventListener('click', () => {
        playContent(true);
    });

    // Restart button
    document.getElementById('restartButton').addEventListener('click', () => {
        playContent(false);
    });

    // Watch Again button
    document.getElementById('watchAgainButton').addEventListener('click', () => {
        playContent(false);
    });

    // Like button
    document.getElementById('likeButton').addEventListener('click', async () => {
        await toggleLike(true);
    });

    // Unlike button
    document.getElementById('unlikeButton').addEventListener('click', async () => {
        await toggleLike(false);
    });

    // Logout button
    document.getElementById('logoutButton').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('currentProfile');
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Play content
function playContent(resume = false) {
    const startTime = (resume && viewingHistory) ? viewingHistory.currentTime : 0;
    const playerUrl = `player.html?contentId=${currentContent.id}&startTime=${startTime}`;
    window.location.href = playerUrl;
}

// Play specific episode
function playEpisode(season, episode) {
    const playerUrl = `player.html?contentId=${currentContent.id}&season=${season}&episode=${episode}`;
    window.location.href = playerUrl;
}

// Toggle like status
async function toggleLike(like) {
    try {
        const endpoint = like ? 'like' : 'unlike';
        const response = await fetch(`/api/profiles/${currentProfile.id}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contentId: currentContent.id
            })
        });

        if (response.ok) {
            isLiked = like;
            configureLikeButton();
        } else {
            const error = await response.json();
            console.error('Error toggling like:', error);
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorElement.style.display = 'block';

    // Hide loading spinner
    showLoading(false);

    // Hide main content
    document.querySelector('.content-details-main').style.display = 'none';
}