let currentPage = 1; // Variable para almacenar la página actual en la paginación.
let totalPages = 0; // Variable para almacenar el total de páginas en la paginación.
let currentFilterUrl = ''; // Variable para almacenar la URL de filtro actual.
const itemsPerPage = 20; // Número de elementos por página.

// Añade eventos a los botones de búsqueda y filtros.
document.getElementById('search-button').addEventListener('click', () => {
    const search = document.getElementById('search').value.toLowerCase();
    buscarPokemon(`https://pokeapi.co/api/v2/pokemon/${search}`);
});

document.getElementById('buscarPorId').addEventListener('click', () => {
    const id = document.getElementById('pokemonId').value;
    buscarPokemon(`https://pokeapi.co/api/v2/pokemon/${id}`);
});

document.getElementById('buscarAleatorio').addEventListener('click', () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    buscarPokemon(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
});

document.getElementById('buscarPorTipo').addEventListener('click', () => {
    const type = document.getElementById('pokemonType').value.toLowerCase();
    currentFilterUrl = `https://pokeapi.co/api/v2/type/${type}`;
    currentPage = 1;
    buscarPorTipoHabilidad(currentFilterUrl);
});

document.getElementById('buscarPorHabilidad').addEventListener('click', () => {
    const ability = document.getElementById('pokemonAbility').value.toLowerCase();
    currentFilterUrl = `https://pokeapi.co/api/v2/ability/${ability}`;
    currentPage = 1;
    buscarPorTipoHabilidad(currentFilterUrl);
});

document.getElementById('applyFilter').addEventListener('click', () => {
    const minStat = parseInt(document.getElementById('minStat').value) || 0;
    const maxStat = parseInt(document.getElementById('maxStat').value) || 255;
    const statType = document.getElementById('statType').value;
    aplicarFiltroEstadisticas(statType, minStat, maxStat);
});

document.getElementById('limpiar').addEventListener('click', () => {
    document.getElementById('pokemon').innerHTML = ''; // Limpiar resultados de Pokémon.
    document.getElementById('error').innerHTML = ''; // Limpiar mensajes de error.

    // Restablecer valores de las cajas de texto y selecciones.
    document.getElementById('search').value = '';
    document.getElementById('pokemonId').value = '';
    document.getElementById('minStat').value = '';
    document.getElementById('maxStat').value = '';
    document.getElementById('statType').selectedIndex = 0;
    document.getElementById('pokemonType').selectedIndex = 0;
    document.getElementById('pokemonAbility').selectedIndex = 0;

    currentPage = 1; // Restablecer la página actual en la paginación.
    currentFilterUrl = ''; // Restablecer la URL de filtro actual.
});

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        if (currentFilterUrl) {
            buscarPorTipoHabilidad(currentFilterUrl);
        } else {
            buscarPokemon('');
        }
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        if (currentFilterUrl) {
            buscarPorTipoHabilidad(currentFilterUrl);
        } else {
            buscarPokemon('');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Cargar tipos y habilidades al cargar la página.
    cargarTipos();
    cargarHabilidades();
});

function cargarTipos() {
    fetch('https://pokeapi.co/api/v2/type')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('pokemonType');
            data.results.forEach(type => {
                const option = document.createElement('option');
                option.value = type.name;
                option.text = type.name;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar los tipos:', error));
}

function cargarHabilidades() {
    fetch('https://pokeapi.co/api/v2/ability?limit=1000') // Hay muchas habilidades, así que aumentamos el límite.
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('pokemonAbility');
            data.results.forEach(ability => {
                const option = document.createElement('option');
                option.value = ability.name;
                option.text = ability.name;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar las habilidades:', error));
}

function buscarPokemon(url) {
    const spinner = document.getElementById('spinner');
    const errorDiv = document.getElementById('error');
    const pokemonDiv = document.getElementById('pokemon');

    spinner.style.display = 'block'; // Muestra el spinner de carga.
    errorDiv.innerHTML = ''; // Limpia mensajes de error anteriores.
    pokemonDiv.innerHTML = ''; // Limpia resultados anteriores.

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function() {
        spinner.style.display = 'none'; // Oculta el spinner de carga.
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            mostrarPokemon(data);
        } else {
            errorDiv.innerHTML = 'No se pudo encontrar el Pokémon';
        }
    };

    xhr.onerror = function() {
        spinner.style.display = 'none'; // Oculta el spinner de carga.
        errorDiv.innerHTML = 'Error en la solicitud';
    };

    xhr.send();
}

function buscarPorTipoHabilidad(url) {
    const spinner = document.getElementById('spinner');
    const errorDiv = document.getElementById('error');
    const pokemonDiv = document.getElementById('pokemon');

    spinner.style.display = 'block'; // Muestra el spinner de carga.
    errorDiv.innerHTML = ''; // Limpia mensajes de error anteriores.
    pokemonDiv.innerHTML = ''; // Limpia resultados anteriores.

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function() {
        spinner.style.display = 'none'; // Oculta el spinner de carga.
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            // Calcular la paginación.
            const paginatedData = paginateData(data.pokemon, currentPage, itemsPerPage);
            totalPages = paginatedData.totalPages;

            // Obtener los Pokémon de la página actual.
            const promises = paginatedData.data.map(poke => {
                return new Promise((resolve, reject) => {
                    const pokeXhr = new XMLHttpRequest();
                    pokeXhr.open('GET', poke.pokemon.url, true);

                    pokeXhr.onload = function() {
                        if (pokeXhr.status === 200) {
                            resolve(JSON.parse(pokeXhr.responseText));
                        } else {
                            reject('No se pudo obtener la información del Pokémon');
                        }
                    };

                    pokeXhr.onerror = function() {
                        reject('Error en la solicitud');
                    };

                    pokeXhr.send();
                });
            });

            Promise.all(promises).then(pokemons => {
                pokemonDiv.innerHTML = ''; // Limpiar contenido anterior.
                pokemons.forEach(pokemon => mostrarPokemon(pokemon));

                // Habilitar/Deshabilitar botones de paginación.
                document.getElementById('prevPage').disabled = currentPage === 1;
                document.getElementById('nextPage').disabled = currentPage === totalPages;
            }).catch(error => {
                errorDiv.innerHTML = `Error: ${error}`;
            });

        } else {
            errorDiv.innerHTML = 'No se pudo encontrar la información del Pokémon';
        }
    };

    xhr.onerror = function() {
        spinner.style.display = 'none'; // Oculta el spinner de carga.
        errorDiv.innerHTML = 'Error en la solicitud';
    };

    xhr.send();
}

function aplicarFiltroEstadisticas(statType, minStat, maxStat) {
    const spinner = document.getElementById('spinner');
    const errorDiv = document.getElementById('error');
    const pokemonDiv = document.getElementById('pokemon');

    spinner.style.display = 'block'; // Muestra el spinner de carga.
    errorDiv.innerHTML = ''; // Limpia mensajes de error anteriores.
    pokemonDiv.innerHTML = ''; // Limpia resultados anteriores.

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://pokeapi.co/api/v2/pokemon?limit=898', true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            const allPokemonData = JSON.parse(xhr.responseText);
            const allPokemonUrls = allPokemonData.results.map(poke => poke.url);

            const promises = allPokemonUrls.map(url => {
                return new Promise((resolve, reject) => {
                    const pokeXhr = new XMLHttpRequest();
                    pokeXhr.open('GET', url, true);

                    pokeXhr.onload = function() {
                        if (pokeXhr.status === 200) {
                            resolve(JSON.parse(pokeXhr.responseText));
                        } else {
                            reject('No se pudo obtener la información del Pokémon');
                        }
                    };

                    pokeXhr.onerror = function() {
                        reject('Error en la solicitud');
                    };

                    pokeXhr.send();
                });
            });

            Promise.all(promises).then(allPokemons => {
                // Filtrar Pokémon por estadística
                const filteredPokemons = allPokemons.filter(pokemon => {
                    const stat = pokemon.stats.find(stat => stat.stat.name === statType);
                    return stat && stat.base_stat >= minStat && stat.base_stat <= maxStat;
                });

                // Paginar los resultados filtrados
                const paginatedData = paginateData(filteredPokemons, currentPage, itemsPerPage);
                totalPages = paginatedData.totalPages;
                const pokemonsToShow = paginatedData.data;

                pokemonDiv.innerHTML = ''; // Limpiar contenido anterior.
                pokemonsToShow.forEach(pokemon => mostrarPokemon(pokemon));

                // Habilitar/Deshabilitar botones de paginación.
                document.getElementById('prevPage').disabled = currentPage === 1;
                document.getElementById('nextPage').disabled = currentPage === totalPages;

                spinner.style.display = 'none'; // Oculta el spinner de carga.
            }).catch(error => {
                errorDiv.innerHTML = `Error: ${error}`;
                spinner.style.display = 'none'; // Oculta el spinner de carga.
            });

        } else {
            errorDiv.innerHTML = 'No se pudo obtener la lista de Pokémon';
            spinner.style.display = 'none'; // Oculta el spinner de carga.
        }
    };

    xhr.onerror = function() {
        errorDiv.innerHTML = 'Error en la solicitud';
        spinner.style.display = 'none'; // Oculta el spinner de carga.
    };

    xhr.send();
}

// Función para paginar los datos.
function paginateData(data, currentPage, itemsPerPage) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = {
        data: data.slice(startIndex, endIndex),
        totalPages: Math.ceil(data.length / itemsPerPage)
    };
    return paginatedData;
}

// Función para mostrar la información del Pokémon en el DOM.
function mostrarPokemon(pokemon) {
    const pokemonDiv = document.getElementById('pokemon');
    const pokemonInfo = document.createElement('div');
    pokemonInfo.classList.add('pokemon-info');
    pokemonInfo.innerHTML = `
        <h2>${pokemon.name}</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <p>Altura: ${pokemon.height}</p>
        <p>Peso: ${pokemon.weight}</p>
        <p>Tipo: ${pokemon.types.map(type => type.type.name).join(', ')}</p>
        <p>Habilidades: ${pokemon.abilities.map(ability => ability.ability.name).join(', ')}</p>
        <p>Estadísticas:</p>
        <ul>
            ${pokemon.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>
    `;
    pokemonDiv.appendChild(pokemonInfo);
}
