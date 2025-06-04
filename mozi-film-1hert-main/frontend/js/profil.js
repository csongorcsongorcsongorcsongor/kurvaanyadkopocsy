

document.addEventListener('DOMContentLoaded', function() {
    const navLoggedOut = document.getElementById('navLoggedOut');
    const navLoggedIn = document.getElementById('navLoggedIn');
    const logoutBtnProfile = document.getElementById('logoutBtnProfile'); 
    const welcomeUserSpan = document.getElementById('welcomeUser');

    const profileUsernameSpan = document.getElementById('profileUsername');
    const profileEmailSpan = document.getElementById('profileEmail');

    function updateProfilePageUI(isLoggedIn, userData = null) {
        if (navLoggedOut && navLoggedIn) {
            if (isLoggedIn) {
                navLoggedOut.style.display = 'none';
                navLoggedIn.style.display = 'flex'; 

                if (welcomeUserSpan && userData) {
                    if (userData.username) {
                        welcomeUserSpan.textContent = `Üdv, ${userData.username}!`;
                    } else if (userData.emailAddress) {
                        welcomeUserSpan.textContent = `Üdv, ${userData.emailAddress.split('@')[0]}!`;
                    } else {
                        welcomeUserSpan.textContent = `Üdv!`;
                    }
                }

                if (profileUsernameSpan && userData && userData.username) {
                    profileUsernameSpan.textContent = userData.username;
                } else if (profileUsernameSpan) {
                    profileUsernameSpan.textContent = "Nincs megadva";
                }

                if (profileEmailSpan && userData && userData.emailAddress) {
                    profileEmailSpan.textContent = userData.emailAddress;
                } else if (profileEmailSpan) {
                    profileEmailSpan.textContent = "Nincs megadva";
                }

            } else {
                alert('A profil megtekintéséhez be kell jelentkeznie.');
                window.location.href = 'index.html'; 
            }
        } else {
            console.warn("A 'navLoggedOut' vagy 'navLoggedIn' elemek hiányoznak a HTML-ből a UI frissítéséhez a profil oldalon.");
            if (!isLoggedIn) {
                alert('A profil megtekintéséhez be kell jelentkeznie.');
                window.location.href = 'index.html';
            }
        }
    }

    function handleLogoutFromProfile() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userData');
        alert('Sikeresen kijelentkezett.');
        window.location.href = 'index.html'; 
    }

    if (logoutBtnProfile) {
        logoutBtnProfile.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogoutFromProfile();
        });
    }


    const isLoggedInOnLoad = sessionStorage.getItem('isLoggedIn') === 'true';
    let storedUserData = null;
    if (isLoggedInOnLoad) {
        try {
            storedUserData = JSON.parse(sessionStorage.getItem('userData'));
        } catch (e) {
            console.error("Hiba a felhasználói adatok sessionStorage-ből való olvasásakor:", e);

            handleLogoutFromProfile();
            return; 
        }
    }
    
    updateProfilePageUI(isLoggedInOnLoad, storedUserData);

    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 perc

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                alert('Az inaktivitás miatt automatikusan kijelentkeztettünk.');
                handleLogoutFromProfile(); 
            }
        }, INACTIVITY_TIMEOUT_MS);
    }

    function startInactivityTimer() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, { passive: true });
            });
            resetInactivityTimer();
        }
    }

    if (isLoggedInOnLoad) {
        startInactivityTimer(); 
    }
});