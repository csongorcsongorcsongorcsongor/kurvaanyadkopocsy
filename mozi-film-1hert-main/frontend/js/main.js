// js/main.js

// API funkciók importálása a külső api.js fájlból.
// Ezek a függvények felelnek a szerverrel való kommunikációért.
import {
    checkUser,
    createUser,
    getMovies,
    createMovieAPI,
    updateMovieAPI,
    deleteMovieAPI,
    createScreeningAPI,
    getScreenings,
    getScreeningsByMovieAPI, // ÚJ import a vetítések filmszerinti szűréséhez
    getScreeningsByDateAPI, // ÚJ import a vetítések dátumszerinti szűréséhez
    getScreeningDetailsAPI,

} from './api.js';

// Az eseménykezelő biztosítja, hogy a JavaScript kód csak azután fusson le,
// miután a teljes HTML dokumentum betöltődött és feldolgozásra került.
document.addEventListener('DOMContentLoaded', function () {
    
    // --- DOM Elemek Referenciáinak Gyűjtése ---
    // A gyakran használt HTML elemeket változókba mentjük a gyorsabb elérés és átláthatóság érdekében.

    // Autentikációs (bejelentkezés/regisztráció) modál és annak bezáró gombja.
    const screeningDetailsModal = document.getElementById('screeningDetailsModal');
    const screeningDetailsModalCloseBtn = document.getElementById('screeningDetailsModalCloseBtn');
    const screeningDetailsContent = document.getElementById('screeningDetailsContent');
    const authModal = document.getElementById('authModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const dateFilterInput = document.getElementById('dateFilterInput');
    const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');

    // Navigációs elemek a bejelentkezett és kijelentkezett állapotokhoz.
    const navLoggedOut = document.getElementById('navLoggedOut');
    const navLoggedIn = document.getElementById('navLoggedIn');
    const logoutBtn = document.getElementById('logoutBtn');
    const welcomeUserSpan = document.getElementById('welcomeUser');
    let loginBtnHeader = null;
    let registerBtnHeader = null;

    // A headerben lévő gombok referenciáinak beállítása.
    if (navLoggedOut) {
        loginBtnHeader = navLoggedOut.querySelector('a.login-btn');
        registerBtnHeader = navLoggedOut.querySelector('a.register-btn');
    } else {
        loginBtnHeader = document.querySelector('header nav a.login-btn');
        registerBtnHeader = document.querySelector('header nav a.register-btn');
    }

    // A bejelentkezési és regisztrációs űrlapok konténerei és a közöttük váltó linkek.
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterFormLink = document.getElementById('showRegisterFormLink');
    const showLoginFormLink = document.getElementById('showLoginFormLink');

    // A tényleges <form> elemek.
    const loginFormActual = document.getElementById('loginFormActual');
    const registerFormActual = document.getElementById('registerFormActual');
    
    // Inaktivitás miatti automatikus kijelentkeztetés időzítője.
    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 perc.

    // Keresőmező és a hozzá tartozó gombok.
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');

    // Filmek megjelenítésére szolgáló rács és az adminisztrátori "Új film" gomb.
    const movieGrid = document.querySelector('.movie-grid');
    const addMovieBtnContainer = document.getElementById('addMovieBtnContainer');
    const addMovieBtn = document.getElementById('addMovieBtn');

    // Vetítések megjelenítésére szolgáló rács és a kapcsolódó elemek.
    const screeningsGrid = document.querySelector('.screenings-grid');
    const screeningsTitle = document.querySelector('.screenings-title');
    const addScreeningBtnContainer = document.getElementById('addScreeningBtnContainer');
    const addScreeningBtn = document.getElementById('addScreeningBtn');

    // Film hozzáadása/szerkesztése modál és annak űrlap elemei.
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

    // Vetítés hozzáadása/szerkesztése modál és annak űrlap elemei.
    const screeningFormModal = document.getElementById('screeningFormModal');
    const screeningFormModalCloseBtn = document.getElementById('screeningFormModalCloseBtn');
    const screeningFormActual = document.getElementById('screeningFormActual');
    const screeningFormTitle = document.getElementById('screeningFormTitle');
    const editScreeningIdInput = document.getElementById('editScreeningId'); 
    const screeningRoomInput = document.getElementById('screeningRoom');
    const screeningTimeInput = document.getElementById('screeningTime');
    const saveScreeningBtn = document.getElementById('saveScreeningBtn');
    const movieFilterSelect = document.getElementById('movieFilterSelect'); // Szűrő a vetítések oldalon
    const screeningMovieIdSelect = document.getElementById('screeningMovieIdSelect'); // Legördülő menü a vetítés létrehozó modálban

    // --- Globális Állapot Változók ---
    let currentEditingMovieId = null; // A szerkesztés alatt álló film ID-ját tárolja.
    let currentEditingScreeningId = null; // A szerkesztés alatt álló vetítés ID-ját tárolja.
    let allMoviesCache = []; // Gyorsítótár a betöltött filmeknek a kliensoldali kereséshez és szűréshez.

    // --- Segédfüggvények (Helpers) ---

    // Visszaadja a bejelentkezési tokent a sessionStorage-ből.
    function getAuthToken() {
        return sessionStorage.getItem('authToken');
    }

    // Visszaadja a bejelentkezett felhasználó adatait a sessionStorage-ből.
    function getUserData() {
        const userDataString = sessionStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    }

    // Ellenőrzi, hogy a bejelentkezett felhasználó admin-e.
    function isAdminUser() {
        const userData = getUserData();
        return userData && userData.isAdmin === true;
    }

    // Megnyitja az autentikációs modált.
    function openModal() {
        if (authModal) authModal.style.display = 'flex';
    }

    // Bezárja az autentikációs modált és törli az űrlapok tartalmát.
    function closeModal() {
        if (authModal) {
            authModal.style.display = 'none';
            if (loginFormActual) loginFormActual.reset();
            if (registerFormActual) registerFormActual.reset();
        }
    }

    // Megjeleníti a bejelentkezési űrlapot és elrejti a regisztrációsat.
    function showLoginForm() {
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.remove('form-hidden');
            registerFormContainer.classList.add('form-hidden');
        }
    }

    // Megjeleníti a regisztrációs űrlapot és elrejti a bejelentkezésit.
    function showRegisterForm() {
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.add('form-hidden');
            registerFormContainer.classList.remove('form-hidden');
        }
    }

    // Megnyitja a film hozzáadása/szerkesztése modált.
    // 'mode' ('create' vagy 'edit') alapján beállítja a címet és feltölti az űrlapot adatokkal.
    function openMovieFormModal(mode = 'create', movie = null) {
        if (!movieFormModal) return;
        currentEditingMovieId = null;
        movieFormActual.reset();

        if (mode === 'edit' && movie) {
            movieFormTitle.textContent = 'Film szerkesztése';
            editMovieIdInput.value = movie.id;
            movieTitleInput.value = movie.title || '';
            movieDescriptionInput.value = movie.description || '';
            movieYearInput.value = movie.year || '';
            movieImgInput.value = movie.img || '';
            currentEditingMovieId = movie.id;
        } else {
            movieFormTitle.textContent = 'Új film hozzáadása';
            editMovieIdInput.value = '';
        }
        movieFormModal.style.display = 'flex';
    }

    // Feltölti a filmválasztó legördülő menüket (a vetítés szűrőn és a létrehozó modálban) a filmekkel.
    function populateMovieSelects() {
        if (!movieFilterSelect || !screeningMovieIdSelect || allMoviesCache.length === 0) return;

        // Előző opciók törlése (az alapértelmezett kivételével).
        movieFilterSelect.innerHTML = '<option value="all">Összes film</option>';
        screeningMovieIdSelect.innerHTML = '<option value="" disabled selected>Válassz filmet...</option>';

        // Minden filmhez hozzáad egy opciót a legördülő menükhöz.
        allMoviesCache.forEach(movie => {
            const option = document.createElement('option');
            option.value = movie.id;
            option.textContent = movie.title;

            movieFilterSelect.appendChild(option.cloneNode(true));
            screeningMovieIdSelect.appendChild(option.cloneNode(true));
        });
    }

    // Megnyitja a vetítés hozzáadása/szerkesztése modált.
    function openScreeningFormModal(mode = 'create', screening = null) {
        if (!screeningFormModal) return;
        currentEditingScreeningId = null;
        screeningFormActual.reset();

        // Szerkesztés módban feltölti az űrlapot a meglévő adatokkal.
        if (mode === 'edit' && screening) {
            screeningFormTitle.textContent = 'Vetítés szerkesztése';

            if (editScreeningIdInput) editScreeningIdInput.value = screening.id;
            if (screeningRoomInput) screeningRoomInput.value = screening.room || '';

            // A dátumot a datetime-local inputnak megfelelő ISO formátumra alakítja.
            if (screeningTimeInput && screening.time) {
                const date = new Date(screening.time);
                screeningTimeInput.value = date.toISOString().slice(0, 16);
            }
            
            // TODO: A film kiválasztása a legördülőben (screening.movieId alapján).

            currentEditingScreeningId = screening.id;
        } else {
            if (screeningFormTitle) screeningFormTitle.textContent = 'Új vetítés hozzáadása';
            if (editScreeningIdInput) editScreeningIdInput.value = '';
        }
        screeningFormModal.style.display = 'flex';
    }

    // Bezárja a film modált.
    function closeMovieFormModal() {
        if (movieFormModal) {
            movieFormModal.style.display = 'none';
            movieFormActual.reset();
            currentEditingMovieId = null;
        }
    }

    // Bezárja a vetítés modált.
    function closeScreeningFormModal() {
        if (screeningFormModal) {
            screeningFormModal.style.display = 'none';
            screeningFormActual.reset();
            currentEditingScreeningId = null;
        }
    }

    // Frissíti a felhasználói felületet a bejelentkezési állapot alapján.
    function updateLoginUI(isLoggedIn, userData = null) {
        // Navigációs sáv frissítése.
        if (navLoggedOut && navLoggedIn && welcomeUserSpan) {
            if (isLoggedIn) {
                navLoggedOut.style.display = 'none';
                navLoggedIn.style.display = 'flex';
                welcomeUserSpan.textContent = `Üdv, ${userData?.username || userData?.emailAddress?.split('@')[0] || ''}!`;
            } else {
                navLoggedOut.style.display = 'flex';
                navLoggedIn.style.display = 'none';
                welcomeUserSpan.textContent = '';
            }
        } else {
            // Fallback, ha a komplexebb nav struktúra hiányzik.
            console.warn("A 'navLoggedOut', 'navLoggedIn' vagy 'welcomeUserSpan' elemek hiányoznak a HTML-ből a UI frissítéséhez.");
            if (loginBtnHeader && registerBtnHeader) {
                loginBtnHeader.style.display = isLoggedIn ? 'none' : 'inline-block';
                registerBtnHeader.style.display = isLoggedIn ? 'none' : 'inline-block';
            }
        }

        // Admin gombok megjelenítése/elrejtése.
        if (addMovieBtnContainer) {
            addMovieBtnContainer.style.display = isAdminUser() ? 'block' : 'none';
        }
        if (addScreeningBtnContainer) {
            addScreeningBtnContainer.style.display = isAdminUser() ? 'block' : 'none';
        }

        // Tartalom újratöltése a jogosultságok változása miatt (pl. admin gombok).
        if (movieGrid) {
            loadAndDisplayMovies();
        }
        if (screeningsGrid) {
            loadAndDisplayScreenings();
        }
    }

    // Sikeres bejelentkezés után lefutó folyamatok.
    function handleLoginSuccess(loginResponse) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userData', JSON.stringify(loginResponse.user));
        sessionStorage.setItem('authToken', loginResponse.token);
        updateLoginUI(true, loginResponse.user);
        closeModal();
        startInactivityTimer();
        alert('Sikeres bejelentkezés!');
    }

    // Kijelentkezéskor lefutó folyamatok.
    function handleLogout(showNotification = true) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        allMoviesCache = []; // Cache törlése.
        updateLoginUI(false);
        clearTimeout(inactivityTimer);
        if (showNotification) alert('Sikeresen kijelentkezett.');
        // Ha a profil oldalon van, átirányítjuk a főoldalra.
        if (window.location.pathname.includes('profil.html')) {
            window.location.href = 'index.html';
        }
    }

    // Visszaállítja az inaktivitási időzítőt.
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                alert('Az inaktivitás miatt automatikusan kijelentkeztettünk.');
                handleLogout(false);
            }
        }, INACTIVITY_TIMEOUT_MS);
    }

    // Elindítja az inaktivitás figyelését.
    function startInactivityTimer() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, { passive: true });
            });
            resetInactivityTimer();
        }
    }

    // Megjeleníti a filmeket a 'movieGrid' elemben.
    function displayMovies(moviesToDisplay) {
        if (!movieGrid) return;
        movieGrid.innerHTML = ''; // Rács kiürítése.

        // Üzenet, ha nincsenek filmek.
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

        // Minden filmhez létrehoz egy "kártyát".
        moviesToDisplay.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.dataset.movieId = movie.id;
            // A film címét kisbetűvel eltároljuk a data-title attribútumban a kliensoldali kereséshez.
            movieCard.dataset.title = movie.title.toLowerCase();

            // A kártya elemeinek létrehozása (kép, infók, gombok).
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

            movieInfo.append(title, yearP, description, ctaButton);
            
            // Ha a felhasználó admin, hozzáadjuk a szerkesztő és törlő gombokat.
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

                adminActionsDiv.append(updateBtn, deleteBtn);
                movieInfo.appendChild(adminActionsDiv);
            }

            movieCard.append(img, movieInfo);
            movieGrid.appendChild(movieCard);
        });
    }
    function openScreeningDetailsModal(screeningData) {
        if (!screeningDetailsModal || !screeningDetailsContent) return;

        // Formázott dátum és idő
        const date = new Date(screeningData.time);
        const formattedDate = date.toLocaleDateString('hu-HU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit'
        });

        // Modális ablak tartalmának összeállítása
        screeningDetailsContent.innerHTML = `
            <h2 class="details-title">${screeningData.movie.title}</h2>
            <div class="details-grid">
                <img src="${screeningData.movie.img || 'https://via.placeholder.com/300x450'}" alt="${screeningData.movie.title}" class="details-img">
                <div class="details-info">
                    <p><strong>Vetítés időpontja:</strong> ${formattedDate} - ${formattedTime}</p>
                    <p><strong>Terem:</strong> ${screeningData.room}</p>
                    <p><strong>Film éve:</strong> ${screeningData.movie.year}</p>
                    <p><strong>Leírás:</strong></p>
                    <p class="details-description">${screeningData.movie.description}</p>
                    <p><small>Vetítést rögzítette: ${screeningData.adminName}</small></p>
                    <button class="cta-button">Jegyvásárlás</button>
                </div>
            </div>
        `;

        screeningDetailsModal.style.display = 'flex';
    }

    // Bezárja a vetítés részletei modált
    function closeScreeningDetailsModal() {
        if (screeningDetailsModal) {
            screeningDetailsModal.style.display = 'none';
            // Töröljük a tartalmat, hogy a következő megnyitáskor ne a régi látszódjon
            screeningDetailsContent.innerHTML = '<p class="loading-message">Részletek betöltése...</p>';
        }
    }

    // Megjeleníti a vetítéseket a 'screeningsGrid' elemben.
    function displayScreenings(screeningsToDisplay) {
        if (!screeningsGrid) return;
        screeningsGrid.innerHTML = '';

        if (!screeningsToDisplay || screeningsToDisplay.length === 0) {
            screeningsGrid.innerHTML = '<p class="info-message">Nincsenek a szűrőfeltételnek megfelelő vetítések.</p>';
            return;
        }

        const admin = isAdminUser();

        // Minden vetítéshez létrehoz egy kártyát.
        screeningsToDisplay.forEach(screening => {
            const screeningCard = document.createElement('div');
            screeningCard.classList.add('screening-card');
            screeningCard.dataset.screeningId = screening.id;

            // A film címe is megjelenik a kártyán (az include-nak köszönhetően).
            const movieTitle = document.createElement('p');
            movieTitle.classList.add('movie-title-on-card');
            movieTitle.textContent = screening.movie ? screening.movie.title : 'Ismeretlen film';

            const room = document.createElement('h3');
            room.textContent = `Terem: ${screening.room}`;

            const time = document.createElement('p');
            const date = new Date(screening.time);
            time.textContent = `Idő: ${date.toLocaleString('hu-HU')}`; // Magyar formátum.
            const detailsBtn = document.createElement('button');
            detailsBtn.textContent = 'Részletek';
            detailsBtn.classList.add('screening-details-btn');
            detailsBtn.dataset.screeningId = screening.id;

            screeningCard.append(movieTitle, room, time, detailsBtn); // Hozzáadjuk a gombot

            // Az admin gombokat most a gomb mellé tesszük
            if (admin) {
                const adminActionsDiv = document.createElement('div');
                adminActionsDiv.classList.add('admin-screening-actions');
                // TODO: Szerkesztő és törlő gombok implementálása a vetítésekhez.
                screeningCard.appendChild(adminActionsDiv);
            }

            const adminName = document.createElement('p');
            adminName.textContent = `Létrehozta: ${screening.adminName}`;

            screeningCard.append(movieTitle, room, time, adminName);
            
            // Admin gombok hozzáadása.
            if (admin) {
                const adminActionsDiv = document.createElement('div');
                adminActionsDiv.classList.add('admin-screening-actions');
                // TODO: Szerkesztő és törlő gombok implementálása a vetítésekhez.
                screeningCard.appendChild(adminActionsDiv);
            }

            screeningsGrid.appendChild(screeningCard);
        });
    }

    // Eseménykezelő a vetítések film szerinti szűréséhez.
    if (movieFilterSelect) {
        movieFilterSelect.addEventListener('change', async (event) => {
            const movieId = event.target.value;
            screeningsGrid.innerHTML = '<p class="loading-message">Vetítések frissítése...</p>';
            // Ha a film szűrőt használjuk, töröljük a dátum szűrő értékét.
            if (dateFilterInput) dateFilterInput.value = '';
            if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';

            try {
                if (movieId === 'all') {
                    // Ha az "Összes film" van kiválasztva, betöltjük az összes vetítést.
                    await loadAndDisplayScreenings();
                } else {
                    // Különben hívjuk az API-t a kiválasztott film ID-jával.
                    const filteredScreenings = await getScreeningsByMovieAPI(movieId);
                    displayScreenings(filteredScreenings);
                }
            } catch (error) {
                console.error('Hiba a vetítések szűrésekor:', error);
                screeningsGrid.innerHTML = `<p class="error-message">Hiba történt a vetítések frissítése közben. (${error.message})</p>`;
            }
        });
    }

    // Betölti az összes filmet az API-ról és megjeleníti őket.
    async function loadAndDisplayMovies() {
        if (!movieGrid) return;
        movieGrid.innerHTML = '<p class="loading-message">Filmek betöltése...</p>';
        if (searchInput) searchInput.value = '';
        if (clearSearchButton) clearSearchButton.style.display = 'none';

        try {
            const moviesData = await getMovies();
            allMoviesCache = moviesData; // Adatok mentése a cache-be.
            displayMovies(allMoviesCache);
            populateMovieSelects(); // A legördülők feltöltése a friss film-listával.
        } catch (error) {
            console.error("Hiba a filmek betöltésekor:", error);
            allMoviesCache = [];
            if (movieGrid) {
                movieGrid.innerHTML = `<p class="error-message">Hiba történt a filmek betöltése közben. (${error.message})</p>`;
            }
        }
    }

    // Betölti az összes vetítést az API-ról és megjeleníti őket.
    async function loadAndDisplayScreenings() {
        if (!screeningsGrid) return;
        screeningsGrid.innerHTML = '<p class="loading-message">Vetítések betöltése...</p>';
        
        try {
            const screeningsData = await getScreenings();
            displayScreenings(screeningsData);
        } catch (error) {
            console.error("Hiba a vetítések betöltésekor:", error);
            screeningsGrid.innerHTML = `<p class="error-message">Hiba történt a vetítések betöltése közben. (${error.message})</p>`;
        }
    }
    async function refreshPageData() {
        if (!movieGrid && !screeningsGrid) return; // Ha egyik sincs az oldalon, ne csináljon semmit.

        // Visszajelzés a felhasználónak, amíg töltődnek az adatok
        if (movieGrid) movieGrid.innerHTML = '<p class="loading-message">Filmek frissítése...</p>';
        if (screeningsGrid) screeningsGrid.innerHTML = '<p class="loading-message">Vetítések frissítése...</p>';
        if (searchInput) searchInput.value = '';
        if (clearSearchButton) clearSearchButton.style.display = 'none';

        try {
            // Párhuzamosan kérjük le a filmeket és a vetítéseket a jobb teljesítmény érdekében.
            const [moviesData, screeningsData] = await Promise.all([
                getMovies(),
                getScreenings()
            ]);

            // 1. Filmek feldolgozása (erre épül a vetítések szűrője)
            allMoviesCache = moviesData;
            if (movieGrid) {
                displayMovies(allMoviesCache);
            }
            populateMovieSelects(); // Fontos, hogy a dropdown menük is frissüljenek!

            // 2. Vetítések feldolgozása
            if (screeningsGrid) {
                displayScreenings(screeningsData);
            }

        } catch (error) {
            console.error("Hiba az adatok közös frissítésekor:", error);
            // Hibaüzenetek megjelenítése a UI-on
            if (movieGrid) {
                movieGrid.innerHTML = `<p class="error-message">Hiba történt a filmek betöltése közben. (${error.message})</p>`;
            }
            if (screeningsGrid) {
                screeningsGrid.innerHTML = `<p class="error-message">Hiba történt a vetítések betöltése közben. (${error.message})</p>`;
            }
        }
    }

    // Eseménykezelő a vetítések dátum szerinti szűréséhez
    if (dateFilterInput) {
        dateFilterInput.addEventListener('change', async (event) => {
            const selectedDate = event.target.value;

            // Ha nincs dátum kiválasztva (pl. a felhasználó törölte), ne csináljunk semmit.
            if (!selectedDate) {
                return;
            }

            screeningsGrid.innerHTML = '<p class="loading-message">Vetítések frissítése...</p>';
            
            // Ha a dátum szűrőt használjuk, állítsuk vissza a film szűrőt "Összes film"-re.
            if (movieFilterSelect) movieFilterSelect.value = 'all';
            if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'inline-block';

            try {
                const filteredScreenings = await getScreeningsByDateAPI(selectedDate);
                displayScreenings(filteredScreenings);
            } catch (error) {
                console.error('Hiba a vetítések dátum szerinti szűrésekor:', error);
                screeningsGrid.innerHTML = `<p class="error-message">Hiba történt a vetítések frissítése közben. (${error.message})</p>`;
            }
        });
    }

    // Eseménykezelő a dátumszűrő törlése gombhoz
    if (clearDateFilterBtn) {
        clearDateFilterBtn.addEventListener('click', async () => {
            dateFilterInput.value = ''; // Töröljük a dátumot az inputból
            clearDateFilterBtn.style.display = 'none'; // Elrejtjük a gombot
            await loadAndDisplayScreenings(); // Újratöltjük az összes vetítést
        });
    }

    // Kliensoldali keresést végez a már betöltött filmeken.
    function handleSearch() {
        if (!searchInput || !movieGrid) return;
        const searchTerm = searchInput.value.trim().toLowerCase();

        // A keresés törlése gomb megjelenítése/elrejtése.
        if (clearSearchButton) {
            clearSearchButton.style.display = searchTerm ? 'inline-block' : 'none';
        }

        const movieCards = movieGrid.querySelectorAll('.movie-card');
        let foundMovies = 0;

        // Végigmegy az összes filmkártyán.
        movieCards.forEach(card => {
            const title = card.dataset.title; // A keresés a korábban elmentett data-title alapján történik.
            if (title && title.includes(searchTerm)) {
                card.style.display = ''; // Megjeleníti a kártyát, ha egyezik.
                foundMovies++;
            } else {
                card.style.display = 'none'; // Elrejti, ha nem egyezik.
            }
        });

        // Üzenet megjelenítése, ha nincs találat.
        const noResultsMessage = movieGrid.querySelector('.no-results-message');
        if (noResultsMessage) noResultsMessage.remove();

        if (foundMovies === 0 && searchTerm !== '') {
            const p = document.createElement('p');
            p.classList.add('info-message', 'no-results-message');
            p.textContent = `Nincs találat a keresésre: "${searchInput.value.trim()}"`;
            movieGrid.appendChild(p);
        }
    }


    // --- Eseménykezelők Regisztrálása ---

    // Bejelentkezés gomb a headerben.
    if (loginBtnHeader) {
        loginBtnHeader.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); openModal(); });
    }

    // Regisztráció gomb a headerben.
    if (registerBtnHeader) {
        registerBtnHeader.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); openModal(); });
    }

    // Kijelentkezés gomb.
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    }

    // Modál bezárása a 'x' gombbal.
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    // Modál bezárása a háttérre kattintással.
    if (authModal) {
        authModal.addEventListener('click', (e) => { if (e.target === authModal) closeModal(); });
    }
    if (movieFormModal) {
        movieFormModal.addEventListener('click', (e) => { if (e.target === movieFormModal) closeMovieFormModal(); });
    }
    if (screeningFormModal) {
        screeningFormModal.addEventListener('click', (e) => { if (e.target === screeningFormModal) closeScreeningFormModal(); });
    }
    if (movieFormModalCloseBtn) {
        movieFormModalCloseBtn.addEventListener('click', closeMovieFormModal);
    }
    if (screeningFormModalCloseBtn) {
        screeningFormModalCloseBtn.addEventListener('click', closeScreeningFormModal);
    }

    if (screeningDetailsModal) {
        screeningDetailsModal.addEventListener('click', (e) => { if (e.target === screeningDetailsModal) closeScreeningDetailsModal(); });
    }
    if (screeningDetailsModalCloseBtn) {
        screeningDetailsModalCloseBtn.addEventListener('click', closeScreeningDetailsModal);
    }

    // Modál bezárása az 'Escape' billentyűvel.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (authModal && authModal.style.display === 'flex') closeModal();
            if (movieFormModal && movieFormModal.style.display === 'flex') closeMovieFormModal();
            if (screeningFormModal && screeningFormModal.style.display === 'flex') closeScreeningFormModal();
            if (screeningDetailsModal && screeningDetailsModal.style.display === 'flex') closeScreeningDetailsModal();
        }
    });

    // Váltás a regisztrációs űrlapra.
    if (showRegisterFormLink) {
        showRegisterFormLink.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
    }

    // Váltás a bejelentkezési űrlapra.
    if (showLoginFormLink) {
        showLoginFormLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
    }

    // Bejelentkezési űrlap elküldése.
    if (loginFormActual) {
        loginFormActual.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailAddress = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!emailAddress || !password) return alert('Kérjük, adja meg az email címét és a jelszavát!');

            checkUser(emailAddress, password)
                .then(handleLoginSuccess)
                .catch(error => alert(`Hiba a bejelentkezés során: ${error.message}`));
        });
    }

    // Regisztrációs űrlap elküldése.
    if (registerFormActual) {
        registerFormActual.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const emailAddress = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!username || !emailAddress || !password || !confirmPassword) return alert('Kérjük, töltse ki az összes mezőt!');
            if (password !== confirmPassword) return alert('A megadott jelszavak nem egyeznek!');

            createUser(username, password, emailAddress)
                .then(() => {
                    alert('Sikeres regisztráció! Most már bejelentkezhet.');
                    showLoginForm();
                })
                .catch(error => alert(`Hiba a regisztráció során: ${error.message}`));
        });
    }
    
    // "Új film" gomb eseménykezelője.
    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', () => openMovieFormModal('create'));
    }
    
    // "Új vetítés" gomb eseménykezelője.
    if (addScreeningBtn) {
        addScreeningBtn.addEventListener('click', () => openScreeningFormModal('create'));
    }

    // Film űrlap elküldése (létrehozás vagy frissítés).
    if (movieFormActual) {
        movieFormActual.addEventListener('submit', async function (e) {
            e.preventDefault();
            const token = getAuthToken();
            const userData = getUserData();

            if (!token || !userData?.isAdmin) return alert('Nincs jogosultsága ehhez a művelethez.');

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
                
                await refreshPageData(); // Ez frissíti a filmeket ÉS a vetítéseket is.

            } catch (error) {
                alert(`Hiba a film mentése során: ${error.message}`);
            } finally {
                saveMovieBtn.disabled = false;
                saveMovieBtn.textContent = 'Mentés';
            }
        });
    }

    // Vetítés űrlapjának elküldése.
    if (screeningFormActual) {
        screeningFormActual.addEventListener('submit', async function (e) {
            e.preventDefault();
            const token = getAuthToken();
            const userData = getUserData();

            if (!token || !userData?.isAdmin) return alert('Nincs jogosultsága ehhez a művelethez.');

            const screeningData = {
                movieId: screeningMovieIdSelect.value,
                room: screeningRoomInput.value,
                time: screeningTimeInput.value
            };

            if (!screeningData.movieId) return alert('Kérjük, válasszon filmet!');

            saveScreeningBtn.disabled = true;
            saveScreeningBtn.textContent = 'Mentés...';

            try {
                if (currentEditingScreeningId) {
                    // TODO: A vetítés frissítésének implementálása
                    alert('Vetítés frissítés még nincs implementálva!');
                } else {
                    await createScreeningAPI(screeningData, userData.id, token);
                    alert('Vetítés sikeresen létrehozva!');
                }
                closeScreeningFormModal();
                await loadAndDisplayScreenings(); // Frissíti a vetítések listáját.
            } catch (error) {
                alert(`Hiba a vetítés mentése során: ${error.message}`);
            } finally {
                saveScreeningBtn.disabled = false;
                saveScreeningBtn.textContent = 'Mentés';
            }
        });
    }

     // Eseménykezelés a vetítések rácsán (event delegation)
    if (screeningsGrid) {
        screeningsGrid.addEventListener('click', async (e) => {
            const detailsButton = e.target.closest('.screening-details-btn');
            if (detailsButton) {
                const screeningId = detailsButton.dataset.screeningId;
                try {
                    // Megjelenítjük a modált egy betöltő üzenettel, amíg az adatok jönnek
                    screeningDetailsModal.style.display = 'flex';
                    const screeningDetails = await getScreeningDetailsAPI(screeningId);
                    openScreeningDetailsModal(screeningDetails);
                } catch (error) {
                    alert(`Hiba a részletek betöltésekor: ${error.message}`);
                    closeScreeningDetailsModal();
                }
            }
        });
    }

    // Eseménykezelés a filmek rácsán (event delegation).
    if (movieGrid) {
        movieGrid.addEventListener('click', async function (e) {
            const target = e.target;

            // Részletek / Jegyvásárlás gomb
            if (target.closest('.cta-button')) {
                e.preventDefault();
                const movieTitle = target.closest('.movie-card')?.querySelector('h3')?.textContent || "Ismeretlen film";
                if (isLoggedInOnLoad) {
                    alert(`"${movieTitle}" - Részletek és jegyvásárlás (Ez a funkció még fejlesztés alatt áll.)`);
                } else {
                    alert(`A(z) "${movieTitle}" részleteinek megtekintéséhez kérjük, jelentkezzen be.`);
                    showLoginForm();
                    openModal();
                }
            }

            // Szerkesztés gomb
            else if (target.closest('.update-movie-btn')) {
                const movieId = target.closest('.update-movie-btn').dataset.movieId;
                const movieToEdit = allMoviesCache.find(movie => movie.id.toString() === movieId);
                if (movieToEdit) {
                    openMovieFormModal('edit', movieToEdit);
                }
            }

            // Törlés gomb
            else if (target.closest('.delete-movie-btn')) {
                const movieId = target.closest('.delete-movie-btn').dataset.movieId;
                const movieTitle = target.closest('.movie-card')?.querySelector('h3')?.textContent || 'ezt a filmet';

                if (confirm(`Biztosan törölni szeretnéd a(z) "${movieTitle}" című filmet?`)) {
                    const token = getAuthToken();
                    const userData = getUserData();
                    if (!token || !userData?.isAdmin) return alert('Nincs jogosultsága ehhez a művelethez.');
                    try {
                        await deleteMovieAPI(movieId, userData.id, token);
                        alert('Film sikeresen törölve!');
                        await refreshPageData(); // Ez frissíti a filmeket ÉS a vetítéseket is.
                    } catch (error) {
                        alert(`Hiba a film törlése során: ${error.message}`);
                    }
                }
            }
        });
    }

    // Keresőmező eseménykezelői.
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleSearch);
        // Gépelés közbeni keresés.
        searchInput.addEventListener('input', handleSearch);
        // Enter lenyomására is keressen.
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(); handleSearch(); });
    }

    // Keresés törlése gomb.
    if (clearSearchButton && searchInput) {
        clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch();
        });
    }

    // --- Oldal Betöltődésekor Futtatandó Kód (Inicializálás) ---

    // Ellenőrzi, hogy a felhasználó be van-e jelentkezve a munkamenet alapján.
    const isLoggedInOnLoad = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedInOnLoad) {
        // Ha be van jelentkezve, frissíti a UI-t és elindítja az inaktivitás figyelőt.
        const storedUserData = getUserData();
        updateLoginUI(true, storedUserData);
        startInactivityTimer();
    } else {
        // Ha nincs bejelentkezve, beállítja a kijelentkezett állapotot.
        updateLoginUI(false);
    }
    refreshPageData();
});