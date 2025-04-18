document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const userProfile = document.getElementById('user-profile');
    const profileName = document.getElementById('profile-name');
    const profileImage = document.getElementById('profile-image');
    const timeRangeSelect = document.getElementById('time-range-select');
    const topTracksSection = document.getElementById('top-tracks');
    const topArtistsSection = document.getElementById('top-artists');
    const topGenresSection = document.getElementById('top-genres');
    const errorMessage = document.getElementById('error-message');
    const loadingMessage = document.getElementById('loading');
    const dataContainer = document.getElementById('data-container');

    let accessToken = null;

    // Step 1: Handle login
    loginButton.addEventListener('click', () => {
        const state = generateRandomString(16);
        const codeVerifier = generateRandomString(64);
        generateCodeChallenge(codeVerifier).then(codeChallenge => {
            sessionStorage.setItem('code_verifier', codeVerifier);
            sessionStorage.setItem('spotify_auth_state', state);

            const authUrl = `${spotifyConfig.authEndpoint}?` + new URLSearchParams({
                response_type: 'code',
                client_id: spotifyConfig.clientId,
                scope: spotifyConfig.scopes,
                redirect_uri: spotifyConfig.redirectUri,
                state: state,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge
            });

            window.location.href = authUrl;
        });
    });

    // Step 2: Get the access token from session after redirect
    accessToken = sessionStorage.getItem('spotify_access_token');
    if (accessToken) {
        loginButton.style.display = 'none'; // Hide login button after successful login
        userProfile.classList.remove('hidden'); // Show user profile section
        fetchUserData();
    }

    // Step 3: Fetch user data from Spotify API
    function fetchUserData() {
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
                fetchTopTracks('short_term');
            })
            .catch(error => handleError('Error fetching user data: ' + error));
    }

    // Step 4: Fetch top tracks based on selected time range
    function fetchTopTracks(timeRange) {
        if (!accessToken) {
            handleError('No access token found');
            return;
        }

        fetch(`${spotifyConfig.apiEndpoint}/me/top/tracks?time_range=${timeRange}&limit=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                displayTopTracks(data.items);
                fetchTopGenres(); // optional mock
            })
            .catch(error => handleError('Error fetching top tracks: ' + error));
    }

    // Step 5: Fetch top artists
    function fetchTopArtists() {
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
                const artistsChart = document.getElementById('artists-chart');
                artistsChart.innerHTML = '';
                data.items.forEach(artist => {
                    const artistElement = document.createElement('div');
                    artistElement.classList.add('artist');
                    artistElement.textContent = artist.name;
                    artistsChart.appendChild(artistElement);
                });
                fetchTopGenres();
            })
            .catch(error => handleError('Error fetching top artists: ' + error));
    }

    // Step 6: Display top tracks
    function displayTopTracks(tracks) {
        const tracksChart = document.getElementById('tracks-chart');
        tracksChart.innerHTML = '';
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.textContent = track.name;
            tracksChart.appendChild(trackElement);
        });
        fetchTopArtists();
    }

    // Step 7: Display top genres (mocked)
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

    // Helpers
    function showLoading() {
        loadingMessage.classList.remove('hidden');
        dataContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingMessage.classList.add('hidden');
        dataContainer.classList.remove('hidden');
    }

    function handleError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        hideLoading();
    }

    timeRangeSelect.addEventListener('change', (event) => {
        fetchTopTracks(event.target.value);
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
