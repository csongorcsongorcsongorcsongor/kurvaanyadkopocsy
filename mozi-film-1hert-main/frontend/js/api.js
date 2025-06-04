// api.js

export const createUser = async(username, password, emailAddress) =>{
    try{
        const res = await fetch('/api/users/register/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password, emailAddress})
        })
        if(!res.ok){
            const errorData = await res.json()
            throw new Error(errorData.message || 'Hiba történt a kérelem során')
        }
        const data = await res.json()
        return data
    }catch(error){
        console.error('Hiba történt a létrehozás során: ', error)
        throw error;
    }
}

export const checkUser = async(emailAddress, password) => {
    try{
        const res = await fetch('/api/users/loginCheck/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "emailAddress": emailAddress, "password": password })
        })
        if(!res.ok){
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba történt a kérelem során')
        }
        const data = await res.json()
        return data
    }catch(error){
        console.error('Hiba történt: ', error)
        throw error;
    }
}

export const getMovies = async () => {
    try {
        const res = await fetch('/api/movies/movies');
        if (!res.ok) {
            let errorMessage = 'Filmek betöltése sikertelen.';
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
        console.error('Hiba a filmek lekérése során:', error);
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


export const createMovieAPI = async (movieData, accountId, token) => {
    try {
        const res = await fetch('/api/movies/movies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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

export const createScreeningAPI = async (screeningData, accountId, token) => {
    try {
        const res = await fetch('/api/screenings/screenings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                ...screeningData, 
                accountId 
            })
        });
        
        if (!res.ok) {
            let errorMessage = 'Hiba a vetítés létrehozása során';
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

export const updateMovieAPI = async (movieId, movieData, accountId, token) => {
    try {
        const res = await fetch(`/api/movies/movies/${movieId}`, {
            method: 'PUT',
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

export const deleteMovieAPI = async (movieId, accountId, token) => {
    try {
        const res = await fetch(`/api/movies/movies/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ accountId }) // Backendnek szüksége lehet az accountId-ra az authorizációhoz
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Hiba a film törlése során');
        }
        // A DELETE kérések gyakran 204 No Content státusszal térnek vissza, vagy egy üzenettel.
        // Ha van JSON válasz, akkor parse-oljuk, egyébként egy sikert jelző objektumot adunk vissza.
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        } else {
            return { success: true, message: "Film sikeresen törölve." };
        }
    } catch (error) {
        console.error('Hiba a film törlése API hívás közben:', error);
        throw error;
    }
};

export const searchMoviesByTitleAPI = async (title) => {
    try {
        const encodedTitle = encodeURIComponent(title);
        const res = await fetch(`/api/movies/title/${encodedTitle}`);

        if (!res.ok) {
            let errorMessage = `Filmek keresése sikertelen a következő címmel: "${title}".`;
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