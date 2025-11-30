document.addEventListener('DOMContentLoaded', () => {
    // Конфигурация API
    const API_BASE = 'https://api.themoviedb.org/3';
    const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzZmZjMzEzNGMzNWZjNTJkYTkxNTM4MWU5MWI4YWRiNCIsIm5iZiI6MTcyMzUyODcxMy4zMjMsInN1YiI6IjY2YmFmNjA5ZDY1OTc1Y2Q5YzA2MTllZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.qeFd9FIdP4O3VtdZRc-CdMv8C-NCVyJ5Q73bf3sOjWw';
    const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';
    const IMAGE_PATH_HIGH = 'https://image.tmdb.org/t/p/original';
    const YOUTUBE_API_KEY = 'AIzaSyB7XWg8bWQJN3QZQZQZQZQZQZQZQZQZQZQ';
    const YOUTUBE_SEARCH_API = 'https://www.googleapis.com/youtube/v3/search';

    const headers = {
        Authorization: `Bearer ${API_TOKEN}`
    };

    // Элементы DOM
    const popularContainer = document.getElementById('popularMovies');
    const newMoviesContainer = document.getElementById('newMovies');
    const newSeriesContainer = document.getElementById('newSeries');
    const newCartoonsContainer = document.getElementById('newCartoons');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsContainer = document.getElementById('searchResults');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const closeSearchResults = document.getElementById('closeSearchResults');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const backToTopButton = document.getElementById('backToTop');

    // Кэши
    const trailerCache = {};
    const apiCache = {};
    const searchCache = {};

    // Инициализация частиц
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 3, direction: "none", random: true, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" }
            }
        }
    });

    // Слайдер героя
    let heroSlides = document.querySelectorAll('.hero-slide');
    let currentHeroSlide = 0;
    
    function showHeroSlide(index) {
        heroSlides.forEach(slide => slide.classList.remove('active'));
        heroSlides[index].classList.add('active');
    }
    
    function nextHeroSlide() {
        currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
        showHeroSlide(currentHeroSlide);
    }
    
    setInterval(nextHeroSlide, 5000);
    showHeroSlide(0);

    // Получение трейлера с YouTube
    async function getTrailerUrl(movieTitle) {
        if (trailerCache[movieTitle]) {
            return trailerCache[movieTitle];
        }
        try {
            const response = await fetch(`${YOUTUBE_SEARCH_API}?part=snippet&q=${encodeURIComponent(movieTitle + ' official trailer')}&maxResults=1&type=video&key=${YOUTUBE_API_KEY}`);
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                const trailerUrl = `https://www.youtube.com/watch?v=${videoId}`;
                trailerCache[movieTitle] = trailerUrl;
                return trailerUrl;
            }
        } catch (error) {
            console.error('Ошибка при получении трейлера:', error);
        }
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' official trailer')}`;
    }

    // Кэширование запросов к API
    async function fetchWithCache(url) {
        if (apiCache[url]) {
            return apiCache[url];
        }
        try {
            const response = await fetch(url, { headers });
            const data = await response.json();
            apiCache[url] = data;
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { results: [] };
        }
    }

    // Загрузка фильмов
    async function loadMovies(endpoint, container, isSlider = false, isHighQuality = false) {
        try {
            const data = await fetchWithCache(`${API_BASE}${endpoint}`);
            if (data.results && data.results.length > 0) {
                container.innerHTML = '';
                for (const movie of data.results) {
                    const trailerUrl = await getTrailerUrl(movie.title || movie.name);
                    const element = document.createElement('div');
                    element.className = isSlider ? 'swiper-slide' : 'movie-item transition-all duration-300 ease-in-out transform hover:-translate-y-1';
                    element.innerHTML = createMovieCard(movie, trailerUrl, isHighQuality);
                    container.appendChild(element);
                }
            }
        } catch (error) {
            console.error('Error loading movies:', error);
        }
    }

    // Создание карточки фильма
    function createMovieCard(movie, trailerUrl, isHighQuality = false) {
        const title = movie.title || movie.name;
        const releaseDate = movie.release_date || movie.first_air_date;
        const imagePath = isHighQuality ? IMAGE_PATH_HIGH : IMAGE_PATH;
        
        return `
            <div class="movie-card bg-gray-800 rounded-xl overflow-hidden shadow-md h-full flex flex-col group">
                <div class="relative overflow-hidden h-80">
                    <img src="${movie.poster_path ? imagePath + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Poster'}" 
                         alt="${title}" 
                         class="w-full h-full object-cover transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p class="text-sm text-gray-300 line-clamp-3">${movie.overview || 'Описание отсутствует'}</p>
                    </div>
                    <div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        ${movie.vote_average.toFixed(1)}
                    </div>
                </div>
                <div class="p-4 flex-grow">
                    <h3 class="text-lg font-semibold mb-2 truncate">${title}</h3>
                    <div class="flex justify-between items-center">
                        <p class="text-sm text-gray-400">${releaseDate ? releaseDate.split('-')[0] : 'Дата неизвестна'}</p>
                        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">${movie.media_type === 'tv' ? 'Сериал' : 'Фильм'}</span>
                    </div>
                </div>
                <div class="px-4 pb-4">
                    <a href="${trailerUrl}" target="_blank" 
                       class="block w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white text-center py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-red-500/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Трейлер
                    </a>
                </div>
            </div>
        `;
    }

    // Поиск фильмов
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        searchResultsContainer.innerHTML = '<div class="col-span-full py-12"><div class="loader"></div></div>';
        searchResultsSection.classList.remove('hidden');
        document.body.classList.add('search-active');
        
        try {
            const data = await fetchWithCache(`${API_BASE}/search/multi?query=${encodeURIComponent(query)}&language=ru-RU&include_adult=false`);
            searchResultsContainer.innerHTML = '';
            
            if (data.results.length === 0) {
                searchResultsContainer.innerHTML = `
                    <div class="col-span-full py-12 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="text-xl font-semibold text-gray-400 mb-2">Ничего не найдено</h3>
                        <p class="text-gray-500">Попробуйте изменить запрос</p>
                    </div>
                `;
            } else {
                for (const item of data.results) {
                    if (!item.poster_path) continue;
                    
                    const trailerUrl = await getTrailerUrl(item.title || item.name);
                    const card = document.createElement('div');
                    card.className = 'movie-item transition-all duration-300 ease-in-out transform hover:-translate-y-1';
                    card.innerHTML = createMovieCard(item, trailerUrl);
                    searchResultsContainer.appendChild(card);
                }
            }
            
            window.scrollTo({ top: searchResultsSection.offsetTop - 100, behavior: 'smooth' });
        } catch (error) {
            console.error('Search error:', error);
            searchResultsContainer.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 class="text-xl font-semibold text-red-400 mb-2">Ошибка при поиске</h3>
                    <p class="text-gray-500">Попробуйте позже</p>
                </div>
            `;
        }
    }

    // Подсказки при поиске
    async function showSearchSuggestions(query) {
        if (!query) {
            searchSuggestions.classList.add('hidden');
            return;
        }
        
        if (searchCache[query]) {
            displaySuggestions(searchCache[query]);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/search/multi?query=${encodeURIComponent(query)}&language=ru-RU&page=1&include_adult=false`, { headers });
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                searchCache[query] = data.results.slice(0, 5);
                displaySuggestions(searchCache[query]);
            } else {
                searchSuggestions.classList.add('hidden');
            }
        } catch (error) {
            console.error('Suggestions error:', error);
            searchSuggestions.classList.add('hidden');
        }
    }
    
    function displaySuggestions(suggestions) {
        searchSuggestions.innerHTML = '';
        suggestions.forEach(item => {
            const title = item.title || item.name;
            const type = item.media_type === 'movie' ? 'Фильм' : item.media_type === 'tv' ? 'Сериал' : 'Персона';
            const year = (item.release_date || item.first_air_date) ? (item.release_date || item.first_air_date).split('-')[0] : '';
            
            const suggestion = document.createElement('div');
            suggestion.className = 'p-3 hover:bg-gray-700/50 transition cursor-pointer flex items-center';
            suggestion.innerHTML = `
                <div class="w-10 h-10 bg-gray-700 rounded mr-3 overflow-hidden flex-shrink-0">
                    ${item.poster_path || item.profile_path ? 
                        `<img src="${IMAGE_PATH + (item.poster_path || item.profile_path)}" alt="${title}" class="w-full h-full object-cover">` : 
                        `<div class="w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`}
                </div>
                <div class="flex-grow">
                    <div class="font-medium truncate">${title}</div>
                    <div class="text-xs text-gray-400">${type} ${year ? `· ${year}` : ''}</div>
                </div>
            `;
            
            suggestion.addEventListener('click', () => {
                searchInput.value = title;
                searchSuggestions.classList.add('hidden');
                handleSearch();
            });
            
            searchSuggestions.appendChild(suggestion);
        });
        
        searchSuggestions.classList.remove('hidden');
    }

    // Инициализация слайдеров
    function initSliders() {
        // Слайдер популярных фильмов
        new Swiper('.movie-slider-premium', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: { 
                delay: 6000, 
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            speed: 800,
            effect: 'coverflow',
            coverflowEffect: { 
                rotate: 5, 
                stretch: 0, 
                depth: 100, 
                modifier: 2, 
                slideShadows: false
            },
            pagination: { 
                el: '.swiper-pagination', 
                clickable: true, 
                dynamicBullets: true 
            },
            navigation: { 
                nextEl: '.swiper-button-next', 
                prevEl: '.swiper-button-prev' 
            },
            breakpoints: { 
                480: { slidesPerView: 2 }, 
                768: { slidesPerView: 3 }, 
                1024: { slidesPerView: 4 }, 
                1280: { slidesPerView: 5 } 
            },
            preloadImages: false,
            lazy: true,
            grabCursor: true,
            centeredSlides: true,
            keyboard: true
        });
        
        // Слайдер отзывов
        new Swiper('.testimonials-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 8000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30
                }
            }
        });
    }

    // Управление табами
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Удаляем активный класс у всех кнопок и контента
                tabButtons.forEach(btn => btn.classList.remove('active', 'bg-gradient-to-r', 'from-red-600', 'to-purple-600', 'text-white'));
                tabContents.forEach(content => content.classList.add('hidden'));
                
                // Добавляем активный класс к текущей кнопке
                button.classList.add('active', 'bg-gradient-to-r', 'from-red-600', 'to-purple-600', 'text-white');
                
                // Показываем соответствующий контент
                const tabId = button.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.remove('hidden');
                
                // Загружаем контент при необходимости
                if (tabId === 'series-tab' && newSeriesContainer.children.length === 0) {
                    loadMovies('/tv/popular?language=ru-RU&page=1', newSeriesContainer);
                } else if (tabId === 'cartoons-tab' && newCartoonsContainer.children.length === 0) {
                    loadMovies('/discover/movie?language=ru-RU&with_genres=16&sort_by=popularity.desc', newCartoonsContainer);
                }
            });
        });
    }

    // Кнопка "Наверх"
    function setupBackToTop() {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
                backToTopButton.classList.remove('hide');
            } else {
                backToTopButton.classList.add('hide');
                backToTopButton.classList.remove('show');
            }
        });
        
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Мобильное меню
    function setupMobileMenu() {
        mobileMenuButton.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('animate__fadeInDown');
                mobileMenu.classList.remove('animate__fadeOutUp');
            } else {
                mobileMenu.classList.add('animate__fadeOutUp');
                mobileMenu.classList.remove('animate__fadeInDown');
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }
        });
    }

    // Основная функция инициализации
    async function init() {
        // Загрузка данных
        await Promise.all([
            loadMovies('/movie/popular?language=ru-RU&page=1', popularContainer, true, true),
            loadMovies('/movie/now_playing?language=ru-RU&page=1', newMoviesContainer)
        ]);
        
        // Инициализация компонентов
        initSliders();
        setupTabs();
        setupBackToTop();
        setupMobileMenu();
        
        // Поиск
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
            else showSearchSuggestions(searchInput.value.trim());
        });
        
        // Закрытие подсказок при клике вне
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target)) {
                searchSuggestions.classList.add('hidden');
            }
        });
        
        // Закрытие результатов поиска
        closeSearchResults.addEventListener('click', () => {
            searchResultsSection.classList.add('hidden');
            document.body.classList.remove('search-active');
        });
    }

    init();
});