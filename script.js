// JavaScript for Login Button and Fetching Data from Spotify

document.getElementById("loginButton").addEventListener("click", function () {
    const client_id = "YOUR_SPOTIFY_CLIENT_ID"; // Your Spotify Client ID
    const redirect_uri = "http://localhost:5500/callback"; // Redirect URI
    const scope = "user-top-read";
    const response_type = "code";
    const state = Math.random().toString(36).substring(7); // Random state for security

    // Redirect to Spotify for authentication
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
});

// Example function to simulate fetching data
function fetchTopTracks() {
    const tracksChart = document.getElementById("tracks-chart");
    tracksChart.innerHTML = "Fetching your top tracks..."; // Placeholder

    // Simulate fetching data
    setTimeout(() => {
        tracksChart.innerHTML = "Top tracks data will be displayed here.";
    }, 2000);
}

fetchTopTracks(); // Call this to simulate the data fetch
