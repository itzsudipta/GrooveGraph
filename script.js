console.log("Script loaded");

import { loadEnvVariables } from './config.js';

const SPOTIFY_CONFIG = {
    ...loadEnvVariables(),
    scopes: [
        'user-top-read',
        'user-read-private',
        'user-read-email',
        'user-read-recently-played',
        'playlist-read-private',
        'user-library-read'
    ].join(' ')
};

class SpotifyAuth {
    constructor(config) {
        this.config = config;
    }

    initializeLoginButton() {
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => this.initiateLogin());
        } else {
            console.warn("Login button with ID 'loginButton' not found.");
        }
    }

    async initiateLogin() {
        try {
            const state = this.generateState();
            sessionStorage.setItem('spotify_auth_state', state);

            const params = new URLSearchParams({
                client_id: this.config.clientId,
                response_type: 'code', // Changed to authorization code flow
                redirect_uri: this.config.redirectUri,
                scope: this.config.scopes,
                state: state,
                show_dialog: true
            });

            const authUrl = `${this.config.authEndpoint}?${params.toString()}`;
            window.location.href = authUrl;
        } catch (error) {
            this.handleError('Failed to initialize login');
        }
    }

    generateState() {
        return crypto.randomUUID();
    }

    checkAuthenticationOnLoad() {
        const hash = window.location.hash.substring(1); // Get the hash part of the URL
        const params = new URLSearchParams(hash); // Extract the parameters
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('spotify_auth_state');

        // Check if access_token and state are present and match
        if (accessToken && state === storedState) {
            this.saveTokenData(accessToken); // Save the access token
            window.location.href = this.config.redirectUri; // Redirect back to the redirectUri
        } else {
            console.error('Authentication failed or state mismatch');
        }
    }

    async exchangeCodeForToken(code) {
        try {
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${this.config.clientId}:${this.config.clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.config.redirectUri
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token exchange failed: ${errorData.error}`);
            }

            const data = await response.json();
            this.saveTokenData(data);
            window.location.href = this.config.homePageUrl;
        } catch (error) {
            console.error('Token exchange error:', error);
            this.handleError('Authentication failed');
        }
    }

    saveTokenData(data) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
    }

    handleError(message) {
        console.error(message);
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
}

class DataVisualizer {
    constructor() {
        this.trackElement = document.getElementById('tracks-chart');
        this.artistElement = document.getElementById('artists-chart');
        this.genreElement = document.getElementById('genres-chart');
    }

    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.classList.remove('hidden');
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.classList.add('hidden');
    }

    displayError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    displayTopTracks(tracks) {
        if (!this.trackElement || !tracks.length) {
            this.displayError('No tracks available');
            return;
        }

        this.trackElement.innerHTML = `
            <div class="tracks-container">
                <div class="tracks-list">
                    ${tracks.map(track => `
                        <div class="track-item">
                            <img src="${track.album.images[2].url}" alt="${track.name}" />
                            <div class="track-info">
                                <span class="track-name">${track.name}</span>
                                <span class="artist-name">${track.artists[0].name}</span>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    displayTopArtists(artists) {
        if (!this.artistElement || !artists.length) {
            this.displayError('No artists available');
            return;
        }

        this.artistElement.innerHTML = `
            <div class="artists-container">
                <div class="artists-list">
                    ${artists.map(artist => `
                        <div class="artist-item">
                            <img src="${artist.images[2]?.url || ''}" alt="${artist.name}" />
                            <span class="artist-name">${artist.name}</span>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    displayTopGenres(genres) {
        if (!this.genreElement || !genres.length) {
            this.displayError('No genre data found');
            return;
        }

        this.genreElement.innerHTML = `
            <div class="genres-container">
                <ul class="genre-list">
                    ${genres.map(([genre, count]) => `
                        <li><strong>${genre}</strong> (${count})</li>
                    `).join('')}
                </ul>
            </div>`;
    }
}

async function fetchTopTracks() {
    const accessToken = sessionStorage.getItem('spotify_access_token');
    if (!accessToken) throw new Error('No access token available');

    const response = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}/me/top/tracks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch top tracks');

    const data = await response.json();
    return data.items;
}

async function fetchTopArtists() {
    const accessToken = sessionStorage.getItem('spotify_access_token');
    if (!accessToken) throw new Error('No access token available');

    const response = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}/me/top/artists`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch top artists');

    const data = await response.json();
    return data.items;
}

function extractTopGenres(artists) {
    const genreMap = {};
    artists.forEach(artist => {
        artist.genres.forEach(genre => {
            genreMap[genre] = (genreMap[genre] || 0) + 1;
        });
    });

    return Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 genres
}

document.addEventListener('DOMContentLoaded', async () => {
    const spotifyAuth = new SpotifyAuth(SPOTIFY_CONFIG);
    const dataVisualizer = new DataVisualizer();

    spotifyAuth.initializeLoginButton();
    spotifyAuth.checkAuthenticationOnLoad();

    if (sessionStorage.getItem('spotify_access_token')) {
        try {
            dataVisualizer.showLoading();
            const [tracks, artists] = await Promise.all([
                fetchTopTracks(),
                fetchTopArtists()
            ]);

            const topGenres = extractTopGenres(artists);

            dataVisualizer.hideLoading();
            document.getElementById('data-container').classList.remove('hidden');
            dataVisualizer.displayTopTracks(tracks);
            dataVisualizer.displayTopArtists(artists);
            dataVisualizer.displayTopGenres(topGenres);
        } catch (error) {
            console.error('Dashboard error:', error);
            dataVisualizer.displayError('Failed to load your music data');
        }
    }
});
