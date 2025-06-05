// api.js

// Új felhasználó létrehozására szolgáló API hívás
export const createUser = async(username, password, emailAddress) =>{
    // A try...catch blokk a hibakezelésért felelős.
    try{
        // A fetch függvénnyel küldünk egy kérést a szervernek.
        const res = await fetch('/api/users/register/', {
            method: 'POST', // Meghatározzuk a kérés típusát (POST, mert adatot hozunk létre).
            headers:{
                // A headerben megadjuk, hogy a kérés törzse JSON formátumú.
                'Content-Type': 'application/json',
            },
            // A body-ban küldjük el a regisztrációs adatokat JSON stringgé alakítva.
            body: JSON.stringify({username, password, emailAddress})
        })
        // Ellenőrizzük, hogy a szerver válasza sikeres volt-e (pl. 200-as státuszkód).
        if(!res.ok){
            // Ha a válasz nem sikeres, megpróbáljuk kiolvasni a hibaüzenetet a válaszból.
            const errorData = await res.json()
            // Dobunk egy új hibát a szerver által küldött üzenettel.
            throw new Error(errorData.message || 'Hiba történt a kérelem során')
        }
        // Ha a válasz sikeres, kiolvassuk a JSON adatot a válaszból.
        const data = await res.json()
        // Visszaadjuk a kapott adatokat.
        return data
    }catch(error){
        // Ha a try blokkban bármilyen hiba történik (pl. hálózati hiba, vagy a dobott Error), itt elkapjuk.
        console.error('Hiba történt a létrehozás során: ', error)
        // A hibát továbbdobjuk, hogy a hívó fél is kezelhesse.
        throw error;
    }
}

// Felhasználó bejelentkeztetésének ellenőrzésére szolgáló API hívás
export const checkUser = async(emailAddress, password) => {
    // Hibakezelő blokk.
    try{
        // POST kérést küldünk a bejelentkezési végpontra.
        const res = await fetch('/api/users/loginCheck/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            // A kérés törzsében küldjük az e-mail címet és a jelszót.
            body: JSON.stringify({ "emailAddress": emailAddress, "password": password })
        })
        // Ha a bejelentkezés nem sikeres (pl. rossz jelszó), hibát dobunk.
        if(!res.ok){
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba történt a kérelem során')
        }
        // Sikeres bejelentkezés esetén visszaadjuk a felhasználói adatokat és a tokent.
        const data = await res.json()
        return data
    }catch(error){
        // Hiba naplózása és továbbadása.
        console.error('Hiba történt: ', error)
        throw error;
    }
}

// Az összes film lekérdezésére szolgáló API hívás
export const getMovies = async () => {
    // Hibakezelő blokk.
    try {
        // GET kérést küldünk a filmek végpontjára.
        const res = await fetch('/api/movies/movies');
        // Ha a szerver nem sikeres válasszal tér vissza.
        if (!res.ok) {
            let errorMessage = 'Filmek betöltése sikertelen.';
            // Megpróbáljuk kiolvasni a JSON formátumú hibaüzenetet.
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
                // Ha a hibaüzenet nem JSON, a státusz szövegét használjuk.
                errorMessage = res.statusText || errorMessage;
            }
            // Dobunk egy hibát a részletes hibaüzenettel.
            throw new Error(errorMessage);
        }
        // Visszaadjuk a filmek listáját JSON formátumban.
        const data = await res.json();
        return data;
    } catch (error) {
        // Hiba naplózása és továbbadása.
        console.error('Hiba a filmek lekérése során:', error);
        throw error;
    }
};

// Az összes vetítés lekérdezésére szolgáló API hívás
export const getScreenings = async () => {
    try {
        // GET kérés a vetítések végpontjára.
        const res = await fetch('/api/screenings/screenings');
        if (!res.ok) {
            let errorMessage = 'Vetítések betöltése sikertelen.';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
                errorMessage = res.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Hiba a vetítések lekérése során:', error);
        throw error;
    }
};

// export const getOneMovieAPI = async (movieId) => {
// try {
// const res = await fetch(`/api/movies/movies/${movieId}`);
// if (!res.ok) {
// let errorMessage = 'Film betöltése sikertelen.';
//             if (res.status === 404) {
//                 errorMessage = 'A film nem található.';
//             } else {
//                 try {
//                     const errorData = await res.json();
//                     errorMessage = errorData.message || errorMessage;
//                 } catch (jsonError) {
//                     errorMessage = res.statusText || errorMessage;
//                 }
//             }
// throw new Error(errorMessage);
//         }
// return await res.json();
//     } catch (error) {
// console.error(`Hiba a(z) ${movieId} ID-jű film lekérése során:`, error);
// throw error;
//     }
// };

// Új film létrehozására szolgáló API hívás (admin funkció)
export const createMovieAPI = async (movieData, accountId, token) => {
    try {
        const res = await fetch('/api/movies/movies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Az 'Authorization' headerben küldjük a JWT tokent a hitelesítéshez.
                'Authorization': `Bearer ${token}`
            },
            // A kérés törzsében küldjük az új film adatait és a létrehozó admin ID-ját.
            body: JSON.stringify({ ...movieData, accountId })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba a film létrehozása során');
        }
        return await res.json();
    } catch (error) {
        console.error('Hiba a film létrehozása API hívás közben:', error);
        throw error;
    }
};

// Új vetítés létrehozására szolgáló API hívás (admin funkció)
export const createScreeningAPI = async (screeningData, accountId, token) => {
    try {
        const res = await fetch('/api/screenings/screenings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Hitelesítés token-nel.
            },
            body: JSON.stringify({ 
                ...screeningData, 
                accountId 
            })
        });
        
        if (!res.ok) {
            let errorMessage = 'Hiba a vetítés létrehozása során';
            // Megpróbáljuk kiolvasni a hibaüzenetet, ami lehet JSON vagy sima szöveg.
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                errorMessage = await res.text();
            }
            throw new Error(errorMessage);
        }
        return await res.json();
    } catch (error) {
        console.error('Hiba a vetítés létrehozása API hívás közben:', error);
        throw error;
    }
};

// Film adatainak frissítésére szolgáló API hívás (admin funkció)
export const updateMovieAPI = async (movieId, movieData, accountId, token) => {
    try {
        // PUT kérést küldünk a specifikus film végpontjára.
        const res = await fetch(`/api/movies/movies/${movieId}`, {
            method: 'PUT', // PUT metódus a frissítéshez.
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...movieData, accountId })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba a film frissítése során');
        }
        return await res.json();
    } catch (error) {
        console.error('Hiba a film frissítése API hívás közben:', error);
        throw error;
    }
};

// Film törlésére szolgáló API hívás (admin funkció)
export const deleteMovieAPI = async (movieId, accountId, token) => {
    try {
        // DELETE kérést küldünk a film végpontjára.
        const res = await fetch(`/api/movies/movies/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // A backendnek szüksége lehet az accountId-ra az authorizációhoz.
            body: JSON.stringify({ accountId }) 
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba a film törlése során');
        }
        // A DELETE kérések gyakran 204 No Content státusszal térnek vissza, vagy egy üzenettel.
        // Ellenőrizzük, hogy a válasz JSON-e.
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            // Ha igen, parse-oljuk.
            return await res.json();
        } else {
            // Ha nem, egy általános sikert jelző objektumot adunk vissza.
            return { success: true, message: "Film sikeresen törölve." };
        }
    } catch (error) {
        console.error('Hiba a film törlése API hívás közben:', error);
        throw error;
    }
};

// Filmek keresése cím alapján
export const searchMoviesByTitleAPI = async (title) => {
    try {
        // A címet kódoljuk, hogy biztonságosan beilleszthető legyen az URL-be.
        const encodedTitle = encodeURIComponent(title);
        const res = await fetch(`/api/movies/title/${encodedTitle}`);

        if (!res.ok) {
            let errorMessage = `Filmek keresése sikertelen a következő címmel: "${title}".`;
            // Speciális hibaüzenet, ha a film nem található (404-es hiba).
            if (res.status === 404) {
                errorMessage = `Nem található film "${title}" címmel.`;
            } else {
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    errorMessage = res.statusText || errorMessage;
                }
            }
            throw new Error(errorMessage);
        }
        const data = await res.json();
        return data; 
    } catch (error) {
        console.error(`Hiba a filmek keresése során ("${title}" cím alapján):`, error);
        throw error;
    }
};

// Vetítések lekérése egy adott film ID alapján
export const getScreeningsByMovieAPI = async (movieId) => {
    try {
        // GET kérés a filmhez tartozó vetítések végpontjára.
        const res = await fetch(`/api/screenings/movie/${movieId}`);
        if (!res.ok) {
            let errorMessage = 'Szűrt vetítések betöltése sikertelen.';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
                // Hiba esetén a válasz nem biztos, hogy JSON formátumú.
            }
            throw new Error(errorMessage);
        }
        return await res.json();
    } catch (error) {
        console.error(`Hiba a(z) ${movieId} ID-jű filmhez tartozó vetítések lekérése során:`, error);
        throw error;
    }
};