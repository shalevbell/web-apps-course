// Video Player with Viewing Progress Tracking

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const contentId = urlParams.get('contentId');
const startTime = urlParams.get('startTime');
const currentSeason = urlParams.get('season') || 1;
const currentEpisode = urlParams.get('episode') || 1;
// Try both possible localStorage keys for profile ID
const profileId = localStorage.getItem('activeProfileId') || localStorage.getItem('selectedProfileId');

// DOM Elements
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const playPauseBtn = document.getElementById('playPauseBtn');
const centerPlayBtn = document.getElementById('centerPlayBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const progressFilled = document.getElementById('progressFilled');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const controlsOverlay = document.getElementById('controlsOverlay');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const backBtn = document.getElementById('backBtn');
const errorBackBtn = document.getElementById('errorBackBtn');
const contentTitle = document.getElementById('contentTitle');
const contentDescription = document.getElementById('contentDescription');

// State
let content = null;
let lastSavedTime = 0;
let controlsTimeout = null;
let isMouseMoving = false;
let resumeTime = 0; // Store the time to resume from
let episodes = []; // Store episodes for series
let episodeViewingHistory = {}; // Store viewing history for episodes

// Initialize player
async function initializePlayer() {
    console.log('=== Video Player Initialization ===');
    console.log('Content ID from URL:', contentId);
    console.log('Profile ID from localStorage:', profileId);
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('All localStorage:', { ...localStorage });

    if (!contentId || !profileId) {
        console.error('Missing required data:', { contentId, profileId });
        showError('Invalid content or profile. Please try again.');
        return;
    }

    try {
        console.log('Fetching content from API...');
        // Fetch content details
        const contentResponse = await fetch('/api/content');
        if (!contentResponse.ok) {
            throw new Error(`Failed to fetch content: ${contentResponse.status}`);
        }
        const allContent = await contentResponse.json();
        console.log(`Fetched ${allContent.length} content items`);

        content = allContent.find(c => c.id === parseInt(contentId));
        console.log('Found content:', content ? content.name : 'NOT FOUND');

        if (!content) {
            console.error('Content not found for ID:', contentId);
            showError('Content not found.');
            return;
        }

        // Update content info
        contentTitle.textContent = content.name;
        contentDescription.textContent = content.description;

        // Setup episodes for series
        if (content.type === 'series') {
            await setupEpisodes();
            const episodesBtn = document.getElementById('episodesBtn');
            if (episodesBtn) {
                episodesBtn.style.display = 'inline-flex';
            }
        }

        // Check if video URL exists
        console.log('Video URL:', content.videoUrl);
        if (!content.videoUrl) {
            console.warn('No video URL for content:', content.name);
            showError('This content does not have a video available yet. Demo video URLs can be added by an admin.');
            return;
        }

        // Determine if videoUrl is a full URL or a local path
        let videoSrc;
        if (content.videoUrl.startsWith('http://') || content.videoUrl.startsWith('https://')) {
            // It's a full URL, use as-is
            videoSrc = content.videoUrl;
            console.log('Using external URL:', videoSrc);
        } else {
            // It's a local path relative to public directory
            // Ensure path starts with ./ for consistency with other assets
            if (!content.videoUrl.startsWith('./') && !content.videoUrl.startsWith('/')) {
                videoSrc = `./_videos/${content.videoUrl}`;
            } else {
                videoSrc = content.videoUrl;
            }
            console.log('Using local path:', videoSrc);
        }

        // Load viewing progress BEFORE loading video
        console.log('Loading viewing progress...');
        await loadViewingProgress();

        // If startTime is provided in URL, use it (for continue watching)
        if (startTime) {
            resumeTime = parseInt(startTime);
            lastSavedTime = resumeTime;
        }

        // Setup event listeners BEFORE loading video
        console.log('Setting up event listeners...');
        setupEventListeners();

        // Set video source and load (this will trigger loadedmetadata event)
        console.log('Setting video source to:', videoSrc);
        videoSource.src = videoSrc;
        videoPlayer.load();

        console.log('=== Player initialized successfully ===');
        console.log(`Now playing: ${content.name} (ID: ${content.id})`);

    } catch (error) {
        console.error('Error initializing player:', error);
        console.error('Error stack:', error.stack);
        showError('Failed to load video. Please try again.');
    }
}

// Load viewing progress from server
async function loadViewingProgress() {
    try {
        console.log(`Fetching viewing progress for profile ${profileId}, content ${contentId}`);
        const response = await fetch(`/api/profiles/${profileId}/viewing-history/${contentId}`);
        const result = await response.json();
        console.log('Viewing progress response:', result);

        if (result.success && result.data && result.data.currentTime > 0) {
            resumeTime = result.data.currentTime;
            lastSavedTime = resumeTime;
            console.log(`✓ Will resume from ${formatTime(resumeTime)} once metadata is loaded`);
        } else {
            console.log('No saved progress found, starting from beginning');
        }
    } catch (error) {
        console.error('Error loading viewing progress:', error);
        console.log('Continuing without saved progress...');
        // Continue without saved progress
    }
}

// Save viewing progress to server
async function saveViewingProgress() {
    if (!profileId || !contentId) {
        console.warn('Cannot save progress: missing profileId or contentId');
        return;
    }

    const currentTime = Math.floor(videoPlayer.currentTime);
    const duration = Math.floor(videoPlayer.duration);

    // Only save if time has changed significantly (more than 5 seconds)
    if (Math.abs(currentTime - lastSavedTime) < 5) {
        return;
    }

    const completed = (duration - currentTime) < 30; // Mark as completed if within 30 seconds of end

    try {
        const response = await fetch(`/api/profiles/${profileId}/viewing-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contentId: parseInt(contentId),
                currentTime: currentTime,
                duration: duration,
                completed: completed
            })
        });

        if (response.ok) {
            lastSavedTime = currentTime;
            console.log(`✓ Progress saved: ${formatTime(currentTime)} / ${formatTime(duration)}${completed ? ' [COMPLETED]' : ''}`);
        } else {
            console.error('Failed to save progress:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error saving viewing progress:', error);
    }
}

// Save viewing progress synchronously (for page unload/navigation)
// Uses sendBeacon to ensure data is sent even as page closes
function saveViewingProgressSync() {
    if (!profileId || !contentId) {
        return;
    }

    const currentTime = Math.floor(videoPlayer.currentTime);
    const duration = Math.floor(videoPlayer.duration);

    // Don't save if no meaningful progress
    if (currentTime < 1 || isNaN(duration)) {
        return;
    }

    const completed = (duration - currentTime) < 30;

    const data = JSON.stringify({
        contentId: parseInt(contentId),
        currentTime: currentTime,
        duration: duration,
        completed: completed
    });

    // Use sendBeacon for reliable sending during page unload
    const blob = new Blob([data], { type: 'application/json' });
    const sent = navigator.sendBeacon(`/api/profiles/${profileId}/viewing-history`, blob);

    if (sent) {
        lastSavedTime = currentTime;
        console.log(`✓ Progress saved (beacon): ${formatTime(currentTime)} / ${formatTime(duration)}${completed ? ' [COMPLETED]' : ''}`);
    } else {
        console.warn('Failed to send progress beacon');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Video events
    videoPlayer.addEventListener('loadedmetadata', onLoadedMetadata);
    videoPlayer.addEventListener('timeupdate', onTimeUpdate);
    videoPlayer.addEventListener('play', onPlay);
    videoPlayer.addEventListener('pause', onPause);
    videoPlayer.addEventListener('ended', onEnded);
    videoPlayer.addEventListener('waiting', () => loadingSpinner.style.display = 'flex');
    videoPlayer.addEventListener('playing', () => loadingSpinner.style.display = 'none');

    // Control buttons
    playPauseBtn.addEventListener('click', togglePlayPause);
    centerPlayBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', () => skip(-10));
    forwardBtn.addEventListener('click', () => skip(10));
    progressBar.addEventListener('input', onProgressBarChange);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', onVolumeChange);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    backBtn.addEventListener('click', goBack);
    errorBackBtn.addEventListener('click', goBack);

    // Mouse movement for controls visibility
    document.addEventListener('mousemove', showControls);
    videoPlayer.addEventListener('click', togglePlayPause);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Save progress periodically
    setInterval(saveViewingProgress, 10000); // Save every 10 seconds

    // Save progress when page becomes hidden (user navigates away)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Page hidden - saving progress...');
            saveViewingProgressSync(); // Use synchronous save when navigating away
        }
    });

    // Save progress when leaving page
    window.addEventListener('beforeunload', () => {
        saveViewingProgressSync(); // Use synchronous save when leaving
    });

    // Episodes button (only for series)
    const episodesBtn = document.getElementById('episodesBtn');
    if (episodesBtn && content && content.type === 'series') {
        episodesBtn.addEventListener('click', () => {
            const drawer = new bootstrap.Offcanvas(document.getElementById('episodesDrawer'));
            drawer.show();
        });
    }
}

// Video event handlers
function onLoadedMetadata() {
    durationDisplay.textContent = formatTime(videoPlayer.duration);
    progressBar.max = videoPlayer.duration;
    loadingSpinner.style.display = 'none';

    // Resume from saved position if available
    if (resumeTime > 0) {
        videoPlayer.currentTime = resumeTime;
        console.log(`✓ Resumed playback from ${formatTime(resumeTime)}`);
    }
    
    // Setup next episode button for series
    if (content && content.type === 'series') {
        checkAndShowNextEpisodeButton();
    }
}

function onTimeUpdate() {
    if (!isNaN(videoPlayer.duration)) {
        // Update progress bar
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressBar.value = videoPlayer.currentTime;
        progressFilled.style.width = percentage + '%';

        // Update time display
        currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
        
        // Check if we should show next episode button (for series, when >80% complete)
        if (content && content.type === 'series') {
            checkAndShowNextEpisodeButton();
        }
    }
}

function onPlay() {
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    centerPlayBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    centerPlayBtn.style.display = 'none';
}

function onPause() {
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    centerPlayBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    centerPlayBtn.style.display = 'flex';
    saveViewingProgress(); // Save when paused
}

function onEnded() {
    centerPlayBtn.style.display = 'flex';
    centerPlayBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
    saveViewingProgress(); // Save final progress
    
    // Auto-advance to next episode for series
    if (content && content.type === 'series') {
        const nextEpisode = getNextEpisode();
        if (nextEpisode) {
            // Show a prompt or auto-advance after a delay
            setTimeout(() => {
                if (confirm('Continue to next episode?')) {
                    switchToEpisode(nextEpisode.season, nextEpisode.episode);
                }
            }, 2000);
        }
    }
}

// Control functions
function togglePlayPause() {
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

function skip(seconds) {
    videoPlayer.currentTime += seconds;
    saveViewingProgress();
}

function onProgressBarChange(e) {
    videoPlayer.currentTime = e.target.value;
}

function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeIcon();
}

function onVolumeChange(e) {
    videoPlayer.volume = e.target.value / 100;
    videoPlayer.muted = false;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const icon = volumeBtn.querySelector('i');
    if (videoPlayer.muted || videoPlayer.volume === 0) {
        icon.className = 'bi bi-volume-mute-fill';
    } else if (videoPlayer.volume < 0.5) {
        icon.className = 'bi bi-volume-down-fill';
    } else {
        icon.className = 'bi bi-volume-up-fill';
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.querySelector('.player-container').requestFullscreen();
        fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
    }
}

function goBack() {
    saveViewingProgress(); // Save before leaving
    // Check if there's history to go back to, otherwise redirect to feed
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/feed.html';
    }
}

// Controls visibility
function showControls() {
    isMouseMoving = true;
    controlsOverlay.classList.add('visible');
    document.querySelector('.player-container').style.cursor = 'default';

    clearTimeout(controlsTimeout);

    if (!videoPlayer.paused) {
        controlsTimeout = setTimeout(() => {
            controlsOverlay.classList.remove('visible');
            document.querySelector('.player-container').style.cursor = 'none';
            isMouseMoving = false;
        }, 3000);
    }
}

// Keyboard shortcuts
function handleKeyboard(e) {
    switch(e.key) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            skip(-10);
            break;
        case 'ArrowRight':
            e.preventDefault();
            skip(10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            updateVolumeIcon();
            break;
        case 'ArrowDown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            updateVolumeIcon();
            break;
        case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            break;
    }
}

// Utility functions
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    document.querySelector('.video-wrapper').style.display = 'none';
}

// Setup episodes for series
async function setupEpisodes() {
    if (!content || content.type !== 'series') {
        return;
    }

    // Generate episodes
    const totalEpisodes = content.episodes;
    const totalSeasons = content.seasons;
    const episodesPerSeason = Math.ceil(totalEpisodes / totalSeasons);

    episodes = [];
    for (let season = 1; season <= totalSeasons; season++) {
        const seasonEpisodes = season === totalSeasons ?
            totalEpisodes - (episodesPerSeason * (totalSeasons - 1)) :
            episodesPerSeason;

        for (let ep = 1; ep <= seasonEpisodes; ep++) {
            const episodeNumber = ((season - 1) * episodesPerSeason) + ep;
            episodes.push({
                season: season,
                episode: ep,
                episodeNumber: episodeNumber,
                title: `Episode ${ep}`,
                description: `Episode ${ep} of Season ${season}`,
                duration: Math.floor(Math.random() * 20) + 40 + " min",
                thumbnail: content.image || './_images/posters/default.jpg'
            });
        }
    }

    // Load viewing history for episodes
    await loadEpisodeViewingHistory();

    // Render episodes in drawer
    renderEpisodesDrawer();
}

// Load viewing history for episodes
async function loadEpisodeViewingHistory() {
    if (!profileId || !contentId) return;

    try {
        // For now, we'll use the same contentId for all episodes
        // In a real system, you'd have separate contentIds for each episode
        const response = await fetch(`/api/profiles/${profileId}/viewing-history/${contentId}`);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                // Store viewing history (in a real system, you'd have per-episode history)
                episodeViewingHistory[`${currentSeason}-${currentEpisode}`] = result.data;
            }
        }
    } catch (error) {
        console.error('Error loading episode viewing history:', error);
    }
}

// Render episodes in drawer
function renderEpisodesDrawer() {
    const drawerContent = document.getElementById('episodesDrawerContent');
    if (!drawerContent) return;

    // Group episodes by season
    const episodesBySeason = {};
    episodes.forEach(ep => {
        if (!episodesBySeason[ep.season]) {
            episodesBySeason[ep.season] = [];
        }
        episodesBySeason[ep.season].push(ep);
    });

    let html = '';
    Object.keys(episodesBySeason).sort((a, b) => a - b).forEach(season => {
        html += `<div class="mb-4">
            <h6 class="text-white mb-3">Season ${season}</h6>`;

        episodesBySeason[season].forEach(ep => {
            const historyKey = `${ep.season}-${ep.episode}`;
            const history = episodeViewingHistory[historyKey];
            const isCurrentEpisode = parseInt(currentSeason) === ep.season && parseInt(currentEpisode) === ep.episode;
            const progressPercent = history && history.duration > 0 
                ? Math.round((history.currentTime / history.duration) * 100)
                : 0;

            html += `
                <div class="episode-item-drawer mb-3 p-3 ${isCurrentEpisode ? 'bg-dark border border-danger' : 'bg-secondary bg-opacity-25'} rounded" 
                     style="cursor: pointer; transition: all 0.2s;">
                    <div class="d-flex align-items-start">
                        <div class="episode-thumbnail-drawer me-3" style="min-width: 120px; position: relative;">
                            <img src="${ep.thumbnail}" alt="${ep.title}" 
                                 class="w-100 rounded" style="height: 70px; object-fit: cover;">
                            ${progressPercent > 0 ? `
                                <div class="progress" style="height: 3px; position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.3);">
                                    <div class="progress-bar bg-danger" style="width: ${progressPercent}%"></div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <div>
                                    <h6 class="text-white mb-0">${ep.episode}. ${ep.title}</h6>
                                    <small class="text-muted">${ep.duration}</small>
                                </div>
                                ${isCurrentEpisode ? '<span class="badge bg-danger">Playing</span>' : ''}
                            </div>
                            <p class="text-muted small mb-2">${ep.description}</p>
                            ${progressPercent > 0 ? `<small class="text-muted">${progressPercent}% watched</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-light ms-2 play-episode-btn-drawer" 
                                data-season="${ep.season}" 
                                data-episode="${ep.episode}">
                            <i class="bi bi-play-fill"></i>
                        </button>
                    </div>
                </div>`;
        });

        html += `</div>`;
    });

    drawerContent.innerHTML = html;

    // Add click handlers for episode items and play buttons
    drawerContent.querySelectorAll('.episode-item-drawer').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.play-episode-btn-drawer')) return;
            const playBtn = item.querySelector('.play-episode-btn-drawer');
            if (playBtn) {
                playBtn.click();
            }
        });
    });

    drawerContent.querySelectorAll('.play-episode-btn-drawer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const season = btn.getAttribute('data-season');
            const episode = btn.getAttribute('data-episode');
            switchToEpisode(season, episode);
        });
    });
}

// Switch to a different episode
function switchToEpisode(season, episode) {
    // Close drawer
    const drawerElement = document.getElementById('episodesDrawer');
    const drawer = bootstrap.Offcanvas.getInstance(drawerElement);
    if (drawer) {
        drawer.hide();
    }

    // Navigate to the episode
    const newUrl = `player.html?contentId=${contentId}&season=${season}&episode=${episode}`;
    window.location.href = newUrl;
}

// Check and show next episode button
function checkAndShowNextEpisodeButton() {
    if (!content || content.type !== 'series' || !videoPlayer.duration) {
        return;
    }

    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    const nextEpisode = getNextEpisode();
    
    // Show button if >80% complete and next episode exists
    if (progress > 80 && nextEpisode) {
        showNextEpisodeButton(nextEpisode);
    } else {
        hideNextEpisodeButton();
    }
}

// Get next episode
function getNextEpisode() {
    if (!episodes || episodes.length === 0) return null;
    
    const currentEp = episodes.find(ep => 
        ep.season === parseInt(currentSeason) && ep.episode === parseInt(currentEpisode)
    );
    
    if (!currentEp) return null;
    
    // Find next episode in sequence
    const currentIndex = episodes.findIndex(ep => 
        ep.season === currentEp.season && ep.episode === currentEp.episode
    );
    
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
        return episodes[currentIndex + 1];
    }
    
    return null;
}

// Show next episode button
function showNextEpisodeButton(nextEpisode) {
    let nextBtn = document.getElementById('nextEpisodeBtn');
    
    if (!nextBtn) {
        // Create button if it doesn't exist
        nextBtn = document.createElement('button');
        nextBtn.id = 'nextEpisodeBtn';
        nextBtn.className = 'control-btn next-episode-btn';
        nextBtn.title = 'Next Episode';
        nextBtn.innerHTML = '<i class="bi bi-skip-forward-fill"></i><span class="skip-label">Next</span>';
        
        // Insert before fullscreen button
        const controlsRight = document.querySelector('.controls-right');
        if (controlsRight) {
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                controlsRight.insertBefore(nextBtn, fullscreenBtn);
            } else {
                controlsRight.appendChild(nextBtn);
            }
        }
        
        // Add click handler
        nextBtn.addEventListener('click', () => {
            if (nextEpisode) {
                switchToEpisode(nextEpisode.season, nextEpisode.episode);
            }
        });
    }
    
    nextBtn.style.display = 'inline-flex';
}

// Hide next episode button
function hideNextEpisodeButton() {
    const nextBtn = document.getElementById('nextEpisodeBtn');
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializePlayer);
