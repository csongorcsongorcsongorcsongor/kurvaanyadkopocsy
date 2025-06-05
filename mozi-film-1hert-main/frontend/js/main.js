// js/main.js
// A searchMoviesByTitleAPI-t kivesszük, vagy kikommentáljuk, ha már nem használjuk
import {
    checkUser,
    createUser,
    getMovies,
    createMovieAPI,
    updateMovieAPI,
    deleteMovieAPI,
    createScreeningAPI,
    getScreenings,
    /*, searchMoviesByTitleAPI */
} from './api.js';

document.addEventListener('DOMContentLoaded', function () {
    const authModal = document.getElementById('authModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const navLoggedOut = document.getElementById('navLoggedOut');
    const navLoggedIn = document.getElementById('navLoggedIn');
    const logoutBtn = document.getElementById('logoutBtn');
    const welcomeUserSpan = document.getElementById('welcomeUser');
    let loginBtnHeader = null;
    let registerBtnHeader = null;

    if (navLoggedOut) {
        loginBtnHeader = navLoggedOut.querySelector('a.login-btn');
        registerBtnHeader = navLoggedOut.querySelector('a.register-btn');
    } else {
        loginBtnHeader = document.querySelector('header nav a.login-btn');
        registerBtnHeader = document.querySelector('header nav a.register-btn');
    }

    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterFormLink = document.getElementById('showRegisterFormLink');
    const showLoginFormLink = document.getElementById('showLoginFormLink');

    const loginFormActual = document.getElementById('loginFormActual');
    const registerFormActual = document.getElementById('registerFormActual');
    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');

    const movieGrid = document.querySelector('.movie-grid');
    const addMovieBtnContainer = document.getElementById('addMovieBtnContainer');
    const addMovieBtn = document.getElementById('addMovieBtn');

    
    const screeningsGrid = document.querySelector('.screenings-grid');
    const screeningsTitle = document.querySelector('.screenings-title');
    const addScreeningBtnContainer = document.getElementById('addScreeningBtnContainer');
    const addScreeningBtn = document.getElementById('addScreeningBtn')

    const movieFormModal = document.getElementById('movieFormModal');
    const movieFormModalCloseBtn = document.getElementById('movieFormModalCloseBtn');
    const movieFormActual = document.getElementById('movieFormActual');
    const movieFormTitle = document.getElementById('movieFormTitle');
    const editMovieIdInput = document.getElementById('editMovieId');
    const movieTitleInput = document.getElementById('movieTitle');
    const movieDescriptionInput = document.getElementById('movieDescription');
    const movieYearInput = document.getElementById('movieYear');
    const movieImgInput = document.getElementById('movieImg');
    const saveMovieBtn = document.getElementById('saveMovieBtn');

    const screeningFormModal = document.getElementById('screeningFormModal');
    const screeningFormModalCloseBtn = document.getElementById('screeningFormModalCloseBtn');
    const screeningFormActual = document.getElementById('screeningFormActual');
    const screeningFormTitle = document.getElementById('screeningFormTitle');
    const editScreeningIdInput = document.getElementById('editScreeningId'); // 
    const screeningRoomInput = document.getElementById('screeningRoom'); // 
    const screeningTimeInput = document.getElementById('screeningTime'); // 
    const saveScreeningBtn = document.getElementById('saveScreeningBtn'); // 

    let currentEditingMovieId = null;
    let currentEditingScreeningId = null;
    let allMoviesCache = []; // Cache a kliensoldali kereséshez

    function getAuthToken() {
        return sessionStorage.getItem('authToken');
    }

    function getUserData() {
        const userDataString = sessionStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    }

    function isAdminUser() {
        const userData = getUserData();
        return userData && userData.isAdmin === true;
    }

    function openModal() {
        if (authModal) authModal.style.display = 'flex';
    }

    function closeModal() {
        if (authModal) {
            authModal.style.display = 'none';
            if (loginFormActual) loginFormActual.reset();
            if (registerFormActual) registerFormActual.reset();
        }
    }

    function showLoginForm() {
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.remove('form-hidden');
            registerFormContainer.classList.add('form-hidden');
        }
    }

    function showRegisterForm() {
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.add('form-hidden');
            registerFormContainer.classList.remove('form-hidden');
        }
    }

    function openMovieFormModal(mode = 'create', movie = null) {
        if (!movieFormModal) return;
        currentEditingMovieId = null;
        movieFormActual.reset();

        if (mode === 'edit' && movie) {
            movieFormTitle.textContent = 'Film szerkesztése';
            editMovieIdInput.value = movie.id;
            movieTitleInput.value = movie.title || '';
            movieDescriptionInput.value = movie.description || ''; // Itt a teljes leírás kellene
            movieYearInput.value = movie.year || '';
            movieImgInput.value = movie.img || '';
            currentEditingMovieId = movie.id;
        } else {
            movieFormTitle.textContent = 'Új film hozzáadása';
            editMovieIdInput.value = '';
        }
        movieFormModal.style.display = 'flex';
    }

    // Screening form megnyitása - JAVÍTVA
    function openScreeningFormModal(mode = 'create', screening = null) {
        if (!screeningFormModal) return;
        currentEditingScreeningId = null;
        screeningFormActual.reset();

        if (mode === 'edit' && screening) {
            screeningFormTitle.textContent = 'Vetítés szerkesztése';

            // ELLENŐRZÉS HOZZÁADVA
            if (editScreeningIdInput) editScreeningIdInput.value = screening.id;
            if (screeningRoomInput) screeningRoomInput.value = screening.room || '';

            // Dátum formázás ISO formátumba
            if (screeningTimeInput && screening.time) {
                const date = new Date(screening.time);
                screeningTimeInput.value = date.toISOString().slice(0, 16);
            }

            currentEditingScreeningId = screening.id;
        } else {
            if (screeningFormTitle) screeningFormTitle.textContent = 'Új vetítés hozzáadása';
            if (editScreeningIdInput) editScreeningIdInput.value = '';
        }
        screeningFormModal.style.display = 'flex';
    }

    function closeMovieFormModal() {
        if (movieFormModal) {
            movieFormModal.style.display = 'none';
            movieFormActual.reset();
            currentEditingMovieId = null;
        }
    }

    function closeScreeningFormModal() {
        if (screeningFormModal) {
            screeningFormModal.style.display = 'none';
            screeningFormActual.reset();
            currentEditingScreeningId = null;
        }
    }

    function updateLoginUI(isLoggedIn, userData = null) {
        if (navLoggedOut && navLoggedIn && welcomeUserSpan) {
            if (isLoggedIn) {
                navLoggedOut.style.display = 'none';
                navLoggedIn.style.display = 'flex';
                if (userData && userData.username) {
                    welcomeUserSpan.textContent = `Üdv, ${userData.username}!`;
                } else if (userData && userData.emailAddress) {
                    welcomeUserSpan.textContent = `Üdv, ${userData.emailAddress.split('@')[0]}!`;
                } else {
                    welcomeUserSpan.textContent = `Üdv!`;
                }
            } else {
                navLoggedOut.style.display = 'flex';
                navLoggedIn.style.display = 'none';
                welcomeUserSpan.textContent = '';
            }
        } else {
            console.warn("A 'navLoggedOut', 'navLoggedIn' vagy 'welcomeUserSpan' elemek hiányoznak a HTML-ből a UI frissítéséhez.");
            if (loginBtnHeader && registerBtnHeader) {
                if (isLoggedIn) {
                    loginBtnHeader.style.display = 'none';
                    registerBtnHeader.style.display = 'none';
                } else {
                    loginBtnHeader.style.display = 'inline-block';
                    registerBtnHeader.style.display = 'inline-block';
                }
            }
        }

        if (addMovieBtnContainer) {
            addMovieBtnContainer.style.display = isAdminUser() ? 'block' : 'none';
        }
        if (addScreeningBtnContainer) {
            addScreeningBtnContainer.style.display = isAdminUser() ? 'block' : 'none';
        }

        if (movieGrid) {
            loadAndDisplayMovies();
        }
    
        if (screeningsGrid) {
            loadAndDisplayScreenings();
        }
    }

    function handleLoginSuccess(loginResponse) {
        sessionStorage.setItem('isLoggedIn', 'true');
        if (loginResponse.user) sessionStorage.setItem('userData', JSON.stringify(loginResponse.user));
        if (loginResponse.token) sessionStorage.setItem('authToken', loginResponse.token);
        updateLoginUI(true, loginResponse.user);
        closeModal();
        startInactivityTimer();
        alert('Sikeres bejelentkezés!');
    }

    function handleLogout(showNotification = true) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        allMoviesCache = []; // Cache törlése kijelentkezéskor
        updateLoginUI(false);
        clearTimeout(inactivityTimer);
        if (showNotification) alert('Sikeresen kijelentkezett.');
        if (window.location.pathname.includes('profil.html')) {
            window.location.href = 'index.html';
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                alert('Az inaktivitás miatt automatikusan kijelentkeztettünk.');
                handleLogout(false);
            }
        }, INACTIVITY_TIMEOUT_MS);
    }

    function startInactivityTimer() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, {
                    passive: true
                });
            });
            resetInactivityTimer();
        }
    }

    function displayMovies(moviesToDisplay) {
        if (!movieGrid) {
            console.error("A 'movie-grid' elem nem található a HTML-ben.");
            return;
        }
        movieGrid.innerHTML = '';

        if (!moviesToDisplay || moviesToDisplay.length === 0) {
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            if (searchTerm !== '') {
                movieGrid.innerHTML = `<p class="info-message">Nincs találat a keresésre: "${searchTerm}"</p>`;
            } else {
                movieGrid.innerHTML = '<p class="info-message">Jelenleg nincsenek elérhető filmek.</p>';
            }
            return;
        }

        const admin = isAdminUser();

        moviesToDisplay.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.dataset.movieId = movie.id;
            // Kliensoldali kereséshez tároljuk a címet a kártyán (nem láthatóan)
            movieCard.dataset.title = movie.title.toLowerCase();


            const img = document.createElement('img');
            img.src = movie.img || 'https://via.placeholder.com/300x450.png?text=Filmplak%C3%A1t';
            img.alt = movie.title || "Filmplakát";

            const movieInfo = document.createElement('div');
            movieInfo.classList.add('movie-info');

            const title = document.createElement('h3');
            title.textContent = movie.title || "Film Címe";

            const yearP = document.createElement('p');
            yearP.classList.add('year');
            yearP.textContent = `Év: ${movie.year || 'Ismeretlen'}`;

            const description = document.createElement('p');
            description.classList.add('description');
            const shortDescription = movie.description ? (movie.description.length > 100 ? movie.description.substring(0, 97) + '...' : movie.description) : "Nincs elérhető leírás.";
            description.textContent = shortDescription;

            const ctaButton = document.createElement('a');
            ctaButton.href = "#";
            ctaButton.classList.add('cta-button');
            ctaButton.textContent = "Részletek és Jegyvásárlás";

            movieInfo.appendChild(title);
            movieInfo.appendChild(yearP);
            movieInfo.appendChild(description);
            movieInfo.appendChild(ctaButton);

            if (admin) {
                const adminActionsDiv = document.createElement('div');
                adminActionsDiv.classList.add('admin-movie-actions');

                const updateBtn = document.createElement('button');
                updateBtn.textContent = 'Szerkesztés';
                updateBtn.classList.add('update-movie-btn', 'admin-action-btn');
                updateBtn.dataset.movieId = movie.id;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Törlés';
                deleteBtn.classList.add('delete-movie-btn', 'admin-action-btn');
                deleteBtn.dataset.movieId = movie.id;

                adminActionsDiv.appendChild(updateBtn);
                adminActionsDiv.appendChild(deleteBtn);
                movieInfo.appendChild(adminActionsDiv);
            }

            movieCard.appendChild(img);
            movieCard.appendChild(movieInfo);
            movieGrid.appendChild(movieCard);
        });
    }
     function displayScreenings(screeningsToDisplay) {
        screeningsGrid.innerHTML = '';

        if (!screeningsToDisplay || screeningsToDisplay.length === 0) {
            screeningsGrid.innerHTML = '<p class="info-message">Jelenleg nincsenek elérhető vetítések.</p>';
            return;
        }

        const admin = isAdminUser();

        screeningsToDisplay.forEach(screening => {
            const screeningCard = document.createElement('div');
            screeningCard.classList.add('screening-card');
            screeningCard.dataset.screeningId = screening.id;

            const room = document.createElement('h3');
            room.textContent = `Szoba: ${screening.room}`;

            const time = document.createElement('p');
            const date = new Date(screening.time);
            time.textContent = `Idő: ${date.toLocaleString()}`;

            const adminName = document.createElement('p');
            adminName.textContent = `Admin: ${screening.adminName}`;

            screeningCard.appendChild(room);
            screeningCard.appendChild(time);
            screeningCard.appendChild(adminName);

            if (admin) {
                const adminActionsDiv = document.createElement('div');
                adminActionsDiv.classList.add('admin-screening-actions');

                const updateBtn = document.createElement('button');
                updateBtn.textContent = 'Szerkesztés';
                updateBtn.classList.add('update-screening-btn', 'admin-action-btn');
                updateBtn.dataset.screeningId = screening.id;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Törlés';
                deleteBtn.classList.add('delete-screening-btn', 'admin-action-btn');
                deleteBtn.dataset.screeningId = screening.id;

                adminActionsDiv.appendChild(updateBtn);
                adminActionsDiv.appendChild(deleteBtn);
                screeningCard.appendChild(adminActionsDiv);
            }

            screeningsGrid.appendChild(screeningCard);
        });
    }

    async function loadAndDisplayMovies(forceReload = false) {
        if (!movieGrid) return;

        // Ha van már cache és nem kényszerítettük az újratöltést, használjuk a cache-t
        // De itt most a logika az, hogy mindig a backendről töltünk, a kliens oldali keresés
        // a már DOM-ban lévő elemeken fog futni, vagy a 'allMoviesCache' alapján.
        // Maradjunk annál, hogy a loadAndDisplayMovies mindig betölti az összeset.
        // A keresés pedig a movieGrid gyerekein vagy az allMoviesCache-en fog operálni.

        movieGrid.innerHTML = '<p class="loading-message">Filmek betöltése...</p>';
        if (searchInput) searchInput.value = '';
        if (clearSearchButton) clearSearchButton.style.display = 'none';

        try {
            const moviesData = await getMovies();
            allMoviesCache = moviesData; // Cache frissítése
            displayMovies(allMoviesCache); // Az összes filmet megjelenítjük
        } catch (error) {
            console.error("Hiba a filmek betöltésekor:", error);
            allMoviesCache = []; // Hiba esetén cache ürítése
            if (movieGrid) {
                movieGrid.innerHTML = `<p class="error-message">Hiba történt a filmek betöltése közben. Kérjük, próbálja később! (${error.message})</p>`;
            }
        }
    }
     // Vetítések megjelenítése
    async function loadAndDisplayScreenings() {
        if (!screeningsGrid) return;
        
        screeningsGrid.innerHTML = '<p class="loading-message">Vetítések betöltése...</p>';
        
        try {
            const screeningsData = await getScreenings();
            displayScreenings(screeningsData);
        } catch (error) {
            console.error("Hiba a vetítések betöltésekor:", error);
            screeningsGrid.innerHTML = `<p class="error-message">Hiba történt a vetítések betöltése közben. Kérjük, próbálja később! (${error.message})</p>`;
        }
    }

    // Kliensoldali keresés
    function handleSearch() {
        if (!searchInput || !movieGrid) return;
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (clearSearchButton) {
            clearSearchButton.style.display = searchTerm ? 'inline-block' : 'none';
        }

        const movieCards = movieGrid.querySelectorAll('.movie-card');
        let foundMovies = 0;

        movieCards.forEach(card => {
            // A címet a korábban eltárolt data-title attribútumból olvassuk ki
            const title = card.dataset.title; // Ez már kisbetűs
            if (title && title.includes(searchTerm)) {
                card.style.display = ''; // Megjelenítés
                foundMovies++;
            } else {
                card.style.display = 'none'; // Elrejtés
            }
        });

        // Üzenet, ha nincs találat
        const noResultsMessage = movieGrid.querySelector('.no-results-message');
        if (noResultsMessage) {
            noResultsMessage.remove(); // Előző üzenet eltávolítása
        }

        if (foundMovies === 0 && searchTerm !== '') {
            const p = document.createElement('p');
            p.classList.add('info-message', 'no-results-message');
            p.textContent = `Nincs találat a keresésre: "${searchInput.value.trim()}"`;
            movieGrid.appendChild(p); // Hozzáadás a grid végéhez, hogy ne írja felül a kártyákat
        }
    }


    // --- Eseménykezelők ---

    if (loginBtnHeader) {
        loginBtnHeader.addEventListener('click', function (event) {
            event.preventDefault();
            showLoginForm();
            openModal();
        });
    }

    if (registerBtnHeader) {
        registerBtnHeader.addEventListener('click', function (event) {
            event.preventDefault();
            showRegisterForm();
            openModal();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (event) {
            event.preventDefault();
            handleLogout();
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (authModal) {
        authModal.addEventListener('click', function (event) {
            if (event.target === authModal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (authModal && authModal.style.display === 'flex') closeModal();
            if (movieFormModal && movieFormModal.style.display === 'flex') closeMovieFormModal();
        }
    });

    if (showRegisterFormLink) {
        showRegisterFormLink.addEventListener('click', function (event) {
            event.preventDefault();
            showRegisterForm();
        });
    }

    if (showLoginFormLink) {
        showLoginFormLink.addEventListener('click', function (event) {
            event.preventDefault();
            showLoginForm();
        });
    }

    if (loginFormActual) {
        loginFormActual.addEventListener('submit', function (event) {
            event.preventDefault();
            const emailAddress = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!emailAddress || !password) {
                alert('Kérjük, adja meg az email címét és a jelszavát!');
                return;
            }

            checkUser(emailAddress, password)
                .then(handleLoginSuccess)
                .catch(error => {
                    console.error('Hiba a bejelentkezés során:', error);
                    alert(`Hiba a bejelentkezés során: ${error.message || 'Kérjük, ellenőrizze az adatait.'}`);
                });
        });
    }

    if (registerFormActual) {
        registerFormActual.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const emailAddress = document.getElementById('registerEmail').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!username || !emailAddress || !password || !confirmPassword) {
                alert('Kérjük, töltse ki az összes mezőt!');
                return;
            }
            if (password !== confirmPassword) {
                alert('A megadott jelszavak nem egyeznek!');
                return;
            }

            createUser(username, password, emailAddress)
                .then(data => {
                    console.log('Regisztráció sikeres:', data);
                    alert('Sikeres regisztráció! Most már bejelentkezhet.');
                    showLoginForm();
                })
                .catch(error => {
                    console.error('Hiba a regisztráció során:', error);
                    alert(`Hiba a regisztráció során: ${error.message || 'Kérjük, ellenőrizze az adatait.'}`);
                });
        });
    }

    if (movieFormModalCloseBtn) {
        movieFormModalCloseBtn.addEventListener('click', closeMovieFormModal);
    }
    if (screeningFormModalCloseBtn) {
        screeningFormModalCloseBtn.addEventListener('click', closeScreeningFormModal);
    }

    if (movieFormModal) {
        movieFormModal.addEventListener('click', function (event) {
            if (event.target === movieFormModal) {
                closeMovieFormModal();
            }
        });
    }
    if (screeningFormModal) {
        screeningFormModal.addEventListener('click', function (event) {
            if (event.target === screeningFormModal) {
                closeScreeningFormModal();
            }
        });
    }

    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', () => {
            openMovieFormModal('create');
        });
    }
    if (addScreeningBtn) {
        addScreeningBtn.addEventListener('click', () => {
            openScreeningFormModal('create');
        });
    }

    if (movieFormActual) {
        movieFormActual.addEventListener('submit', async function (event) {
            event.preventDefault();
            const token = getAuthToken();
            const userData = getUserData();

            if (!token || !userData || !userData.isAdmin) {
                alert('Nincs jogosultsága ehhez a művelethez, vagy nincs bejelentkezve.');
                return;
            }

            const movieData = {
                title: movieTitleInput.value,
                description: movieDescriptionInput.value,
                year: parseInt(movieYearInput.value, 10),
                img: movieImgInput.value
            };

            saveMovieBtn.disabled = true;
            saveMovieBtn.textContent = 'Mentés...';

            try {
                if (currentEditingMovieId) {
                    await updateMovieAPI(currentEditingMovieId, movieData, userData.id, token);
                    alert('Film sikeresen frissítve!');
                } else {
                    await createMovieAPI(movieData, userData.id, token);
                    alert('Film sikeresen létrehozva!');
                }
                closeMovieFormModal();
                await loadAndDisplayMovies(true); // Kényszerített újratöltés a cache frissítéséhez
            } catch (error) {
                console.error('Hiba a film mentése során:', error);
                alert(`Hiba a film mentése során: ${error.message}`);
            } finally {
                saveMovieBtn.disabled = false;
                saveMovieBtn.textContent = 'Mentés';
            }
            //vetites resz
            try {
                if (currentEditingScreeningId) {
                    await updateMovieAPI(currentEditingScreeningId, screeningData, userData.id, token);
                    alert('Vetites sikeresen frissítve!');
                } else {
                    await createMovieAPI(movieData, userData.id, token);
                    alert('Vetites sikeresen létrehozva!');
                }
                closeScreeningFormModal();
                await loadAndDisplayScreening(true); // Kényszerített újratöltés a cache frissítéséhez
            } catch (error) {
                console.error('Hiba a vetites mentése során:', error);
                alert(`Hiba a vetites mentése során: ${error.message}`);
            } finally {
                saveScreeningBtn.disabled = false;
                saveScreeningBtn.textContent = 'Mentés';
            }
        });
    }
    if (screeningFormActual) {
        screeningFormActual.addEventListener('submit', async function(event) {
            event.preventDefault();
            const token = getAuthToken();
            const userData = getUserData();
    
            if (!token || !userData || !userData.isAdmin) {
                alert('Nincs jogosultsága ehhez a művelethez, vagy nincs bejelentkezve.');
                return;
            }
    
            // Ellenőrizzük, hogy van-e érték a mezőben
            if (!screeningTimeInput.value) {
                alert('Kérjük, adja meg az időpontot!');
                return;
            }
    
            const screeningData = {
                room: screeningRoomInput.value,
                time: screeningTimeInput.value // Küldjük el a nyers értéket (YYYY-MM-DDTHH:mm)
            };
    
            saveScreeningBtn.disabled = true;
            saveScreeningBtn.textContent = 'Mentés...';
    
            try {
                if (currentEditingScreeningId) {
                    // TODO: Implementálj updateScreeningAPI-t
                    alert('Vetítés frissítés még nincs implementálva!');
                } else {
                    await createScreeningAPI(screeningData, userData.id, token);
                    alert('Vetítés sikeresen létrehozva!');
                }
                closeScreeningFormModal();
            } catch (error) {
                console.error('Hiba a vetítés mentése során:', error);
                alert(`Hiba a vetítés mentése során: ${error.message}`);
            } finally {
                saveScreeningBtn.disabled = false;
                saveScreeningBtn.textContent = 'Mentés';
            }
        });
    }
    if (movieGrid) {
        movieGrid.addEventListener('click', async function (event) {
            const target = event.target;

            const ctaButton = target.closest('.cta-button');
            if (ctaButton) {
                event.preventDefault();
                const movieCard = ctaButton.closest('.movie-card');
                if (!movieCard) return;
                const movieTitleElement = movieCard.querySelector('.movie-info h3');
                const movieTitle = movieTitleElement ? movieTitleElement.textContent : "Ismeretlen film";

                if (sessionStorage.getItem('isLoggedIn') === 'true') {
                    alert(`"${movieTitle}" - Részletek és jegyvásárlás\n(Ez a funkció még fejlesztés alatt áll.)`);
                } else {
                    alert(`A "${movieTitle}" részleteinek megtekintéséhez és jegyvásárláshoz kérjük, jelentkezzen be.`);
                    showLoginForm();
                    openModal();
                }
                return;
            }

            const updateButton = target.closest('.update-movie-btn');
            if (updateButton) {
                const movieId = updateButton.dataset.movieId;
                if (!movieId || !allMoviesCache) return;

                // Keresd meg a teljes film adatot a cache-ből, hogy a teljes leírást kapjuk
                const movieToEdit = allMoviesCache.find(movie => movie.id.toString() === movieId);

                if (movieToEdit) {
                    openMovieFormModal('edit', movieToEdit);
                } else {
                    // Fallback, ha valamiért nem lenne a cache-ben (nem szabadna előfordulnia)
                    console.warn("A szerkesztendő film nem található a cache-ben. A kártya adatait használom.");
                    const card = updateButton.closest('.movie-card');
                    const fallbackMovieData = {
                        id: movieId,
                        title: card.querySelector('h3').textContent,
                        description: card.querySelector('.description').textContent, // Ez lehet rövidített
                        year: parseInt(card.querySelector('.year').textContent.replace('Év: ', '').trim(), 10),
                        img: card.querySelector('img').src
                    };
                    openMovieFormModal('edit', fallbackMovieData);
                }
                return;
            }

            const deleteButton = target.closest('.delete-movie-btn');
            if (deleteButton) {
                const movieId = deleteButton.dataset.movieId;
                if (!movieId) return;

                const movieTitleElement = deleteButton.closest('.movie-card').querySelector('h3');
                const movieTitle = movieTitleElement ? movieTitleElement.textContent : 'ezt a filmet';

                if (confirm(`Biztosan törölni szeretnéd ${movieTitle}?`)) {
                    const token = getAuthToken();
                    const userData = getUserData();
                    if (!token || !userData || !userData.isAdmin) {
                        alert('Nincs jogosultsága ehhez a művelethez.');
                        return;
                    }
                    try {
                        await deleteMovieAPI(movieId, userData.id, token);
                        alert('Film sikeresen törölve!');
                        await loadAndDisplayMovies(true); // Kényszerített újratöltés
                    } catch (error) {
                        console.error('Hiba a film törlése során:', error);
                        alert(`Hiba a film törlése során: ${error.message}`);
                    }
                }
                return;
            }
        });
    }

    // Keresés gomb és input eseménykezelők
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleSearch);

        // Gépelés közbeni keresés (debounce-olható lenne nagyobb adatmennyiségnél)
        searchInput.addEventListener('input', handleSearch);

        // Enter lenyomására is keressen (bár az 'input' már lefedi)
        // De ha valaki gyorsan beírja és entert nyom, mielőtt az input esemény lefutna.
        searchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Megakadályozza az űrlapküldést, ha lenne
                handleSearch(); // Biztosíték, de az input eseménynek kellene kezelnie
            }
        });
    }

    if (clearSearchButton && searchInput) {
        clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            // A handleSearch() automatikusan visszaállítja az összes filmet, ha a searchTerm üres
            handleSearch();
            // clearSearchButton.style.display = 'none'; // Ezt a handleSearch kezeli
        });
    }

    // --- Oldal betöltődésekor inicializálás ---
    const isLoggedInOnLoad = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedInOnLoad) {
        const storedUserData = getUserData();
        updateLoginUI(true, storedUserData);
        startInactivityTimer();
    } else {
        updateLoginUI(false);
    }
});