// spotifyConfig.js

export const spotifyConfig = {
    clientId: 'c3c6f141c28441f9bdd0988863be0d92',
    redirectUri: 'https://itzsudipta.github.io/GrooveGraph/callback.html', // Correct redirect URI
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    apiEndpoint: 'https://api.spotify.com/v1',
    scopes: [
        'user-top-read',
        'user-read-private',
        'user-read-email',
        'playlist-read-private'
    ].join(' '), // Join the array of scopes into a single space-separated string
};
