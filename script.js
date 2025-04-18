import { spotifyConfig } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) {
        console.error('Login button not found!');
        return;
    }

    // Get other UI elements
    const userProfile = document.getElementById('user-profile');
    const profileName = document.getElementById('profile-name');
    const profileImage = document.getElementById('profile-image');
    const errorMessage = document.getElementById('error-message');
    const loadingMessage = document.getElementById('loading');
    const dataContainer = document.getElementById('data-container');

    // Step 1: Handle login button click
    loginButton.addEventListener('click', async () => {
        try {
            console.log('Login button clicked'); // Debug log
            showLoading();

            // Generate PKCE values
            const state = generateRandomString(16);
            const codeVerifier = generateRandomString(64);
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Store PKCE values in session storage
            sessionStorage.setItem('code_verifier', codeVerifier);
            sessionStorage.setItem('spotify_auth_state', state);

            // Construct authorization URL
            const params = new URLSearchParams({
                client_id: spotifyConfig.clientId,
                response_type: 'code',
                redirect_uri: spotifyConfig.redirectUri,
                state: state,
                scope: spotifyConfig.scopes,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge,
                show_dialog: true
            });

            // Redirect to Spotify authorization page
            const authUrl = `${spotifyConfig.authEndpoint}?${params.toString()}`;
            console.log('Redirecting to:', authUrl); // Debug log
            window.location.href = authUrl;
        } catch (error) {
            console.error('Login failed:', error);
            handleError('Failed to initialize login');
            hideLoading();
        }
    });

    // Check if we're returning from auth flow
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('spotify_auth_state');

    if (code) {
        // Verify state to prevent CSRF attacks
        if (state !== storedState) {
            handleError('State mismatch. Please try again.');
            return;
        }

        // Exchange code for token
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
            handleError('Code verifier not found. Please try again.');
            return;
        }

        exchangeCodeForToken(code, codeVerifier);
    } else {
        // Check if we have an existing token
        const accessToken = sessionStorage.getItem('spotify_access_token');
        if (accessToken) {
            showLoading();
            initializeUserData(accessToken);
        }
    }

    // Helper functions
    async function exchangeCodeForToken(code, codeVerifier) {
        try {
            showLoading();
            const response = await fetch(spotifyConfig.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: spotifyConfig.clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: spotifyConfig.redirectUri,
                    code_verifier: codeVerifier
                })
            });

            if (!response.ok) {
                throw new Error('Token exchange failed');
            }

            const data = await response.json();
            sessionStorage.setItem('spotify_access_token', data.access_token);
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('spotify_auth_state');

            // Redirect to clean URL
            window.location.href = window.location.origin + window.location.pathname;
        } catch (error) {
            console.error('Token exchange failed:', error);
            handleError('Authentication failed. Please try again.');
            hideLoading();
        }
    }

    function initializeUserData(accessToken) {
        loginButton.style.display = 'none'; // Hide login button after successful login
        userProfile.classList.remove('hidden'); // Show user profile section
        fetchUserData(accessToken);
    }

    function fetchUserData(accessToken) {
        if (!accessToken) {
            handleError('No access token found');
            return;
        }

        showLoading();

        fetch(`${spotifyConfig.apiEndpoint}/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                profileName.textContent = data.display_name;
                profileImage.src = data.images[0]?.url || 'https://via.placeholder.com/150';
                fetchTopTracks('short_term', accessToken);
            })
            .catch(error => handleError('Error fetching user data: ' + error));
    }

    function fetchTopTracks(timeRange, accessToken) {
        if (!accessToken) {
            handleError('No access token found');
            return;
        }

        showLoading();

        fetch(`${spotifyConfig.apiEndpoint}/me/top/tracks?time_range=${timeRange}&limit=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                displayTopTracks(data.items);
                fetchTopArtists(accessToken);
            })
            .catch(error => handleError('Error fetching top tracks: ' + error));
    }

    function fetchTopArtists(accessToken) {
        if (!accessToken) {
            handleError('No access token found');
            return;
        }

        fetch(`${spotifyConfig.apiEndpoint}/me/top/artists?limit=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                displayTopArtists(data.items);
                fetchTopGenres();
            })
            .catch(error => handleError('Error fetching top artists: ' + error));
    }

    function displayTopTracks(tracks) {
        const tracksChart = document.getElementById('tracks-chart');
        tracksChart.innerHTML = '';
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.innerHTML = `
                <img src="${track.album.images[0].url}" alt="${track.name}" class="track-image">
                <div class="track-info">
                    <h4>${track.name}</h4>
                    <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                    <a href="${track.external_urls.spotify}" target="_blank" class="track-link">Listen on Spotify</a>
                </div>
            `;
            tracksChart.appendChild(trackElement);
        });
    }

    function displayTopArtists(artists) {
        const artistsChart = document.getElementById('artists-chart');
        artistsChart.innerHTML = '';
        artists.forEach(artist => {
            const artistElement = document.createElement('div');
            artistElement.classList.add('artist');
            artistElement.innerHTML = `
                <img src="${artist.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${artist.name}" class="artist-image">
                <div class="artist-info">
                    <h4>${artist.name}</h4>
                    <a href="${artist.external_urls.spotify}" target="_blank" class="artist-link">Visit on Spotify</a>
                </div>
            `;
            artistsChart.appendChild(artistElement);
        });
    }

    function fetchTopGenres() {
        const genres = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical'];
        displayTopGenres(genres);
    }

    function displayTopGenres(genres) {
        const genresChart = document.getElementById('genres-chart');
        genresChart.innerHTML = '';
        genres.forEach(genre => {
            const genreElement = document.createElement('div');
            genreElement.classList.add('genre');
            genreElement.textContent = genre;
            genresChart.appendChild(genreElement);
        });
        hideLoading();
    }

    function showLoading() {
        loadingMessage.classList.remove('hidden');
        dataContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingMessage.classList.add('hidden');
        dataContainer.classList.remove('hidden');
    }

    function handleError(message) {
        errorMessage.textContent = `⚠️ ${message}`;
        errorMessage.classList.remove('hidden');
        hideLoading();
        setTimeout(() => errorMessage.classList.add('hidden'), 5000);
    }

    timeRangeSelect.addEventListener('change', (event) => {
        fetchTopTracks(event.target.value, sessionStorage.getItem('spotify_access_token'));
    });

    function generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async function generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
});
