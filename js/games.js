// js/games.js
let allGames = [];
let currentStatus = 'all';
let currentGenre = 'all';
let currentSearch = '';
let currentSort = 'default';

async function loadGames() {
    try {
        const response = await fetch('data/games.json');
        if (!response.ok) throw new Error('Не удалось загрузить games.json');
        const rawData = await response.json();
        allGames = rawData.map((game, index) => ({ ...game, id: index }));
        updateStats();
        renderHallOfFame();
        fillGenreTags();
        applyFilters();
    } catch (error) {
        console.error(error);
        document.getElementById('counter').textContent = 'Ошибка загрузки данных';
        document.getElementById('games-grid').innerHTML = '<p class="text-red-400 col-span-full text-center py-10">Не удалось загрузить список игр</p>';
    }
}

function updateStats() {
    const total = allGames.length;
    const completed = allGames.filter(g => g.status === 'Пройдено').length;
    const dropped = allGames.filter(g => g.status === 'Дропнуто').length;
    const review = allGames.filter(g => g.status === 'Обзор').length;
    const totalHours = allGames.reduce((sum, game) => sum + (parseInt(game.hours, 10) || 0), 0);
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-dropped').textContent = dropped;
    document.getElementById('stat-review').textContent = review;
    document.getElementById('stat-hours').textContent = totalHours;
}

function renderHallOfFame() {
    const hallOfFame = allGames.filter(g => String(g.score) === '10');
    if (hallOfFame.length === 0) return;
    document.getElementById('hall-of-fame').classList.remove('hidden');
    const grid = document.getElementById('hall-of-fame-grid');
    grid.innerHTML = hallOfFame.map(game => {
        const displayName = game.name === '[REDACTED]' ? 'Скрытая игра' : game.name;
        return `
            <div class="bg-gray-900 rounded-xl border border-yellow-900/30 p-4 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 transition cursor-pointer group hover:-translate-y-1" onclick="openGame(${game.id})">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-sm group-hover:text-yellow-400 transition line-clamp-2">${displayName}</h4>
                    <span class="text-yellow-400 font-bold text-sm font-mono drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"><svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.65L18.35 12 12 18.35 5.65 12 12 5.65z"/></svg>10</span>
                </div>
                <div class="text-xs text-gray-500">${game.genre || '—'} <span class="font-mono text-gray-400">• ${game.hours || '?'} ч.</span></div>
            </div>
        `;
    }).join('');
}

function fillGenreTags() {
    const genres = new Set();
    allGames.forEach(game => {
        if (game.genre) game.genre.split(',').forEach(g => { if(g.trim()) genres.add(g.trim()); });
    });
    const container = document.getElementById('genre-tags');
    Array.from(genres).sort().forEach(genre => {
        const btn = document.createElement('button');
        btn.dataset.genre = genre;
        btn.className = 'genre-tag bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-full transition';
        btn.textContent = genre;
        container.appendChild(btn);
    });
}

function updateFiltersCount() {
    const countEl = document.getElementById('active-filters-count');
    let count = 0;
    if (currentStatus !== 'all') count++;
    if (currentGenre !== 'all') count++;
    if (currentSort !== 'default') count++;
    if (count > 0) {
        countEl.textContent = count;
        countEl.classList.remove('hidden');
    } else {
        countEl.classList.add('hidden');
    }
}

function applyFilters() {
    let filtered = [...allGames];
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        filtered = filtered.filter(g => {
            const name = (g.name || '').toLowerCase();
            const genre = (g.genre || '').toLowerCase();
            const features = (g.features || '').toLowerCase();
            const setting = (g.setting || '').toLowerCase();
            const genreMatch = genre.split(',').some(gen => gen.trim().includes(s) || s.includes(gen.trim()));
            const featuresMatch = features.split(',').some(feat => feat.trim().includes(s) || s.includes(feat.trim()));
            return name.includes(s) || genreMatch || featuresMatch || setting.includes(s);
        });
    }
    if (currentStatus !== 'all') filtered = filtered.filter(g => g.status === currentStatus);
// Жанр (одиночный выбор)
if (currentGenre !== 'all') {
    filtered = filtered.filter(game => {
        if (!game.genre) return false;
        return game.genre.split(',').map(g => g.trim()).includes(currentGenre);
    });
}
    if (currentSort !== 'default') {
        filtered.sort((a, b) => {
            if (currentSort === 'name-asc') return (a.name||'').localeCompare(b.name||'');
            if (currentSort === 'name-desc') return (b.name||'').localeCompare(a.name||'');
            if (currentSort === 'score-desc') return (parseInt(b.score)||0) - (parseInt(a.score)||0);
            if (currentSort === 'hours-desc') return (parseInt(b.hours)||0) - (parseInt(a.hours)||0);
            if (currentSort === 'date-new') return new Date(b.played_date||'0000-01-01') - new Date(a.played_date||'0000-01-01');
            return 0;
        });
    }
    renderGames(filtered);
    updateFiltersCount();
}

function renderGames(games) {
    const grid = document.getElementById('games-grid');
    document.getElementById('counter').textContent = `Найдено игр: ${games.length}`;
    if (games.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Ничего не найдено</p>';
        return;
    }
    grid.innerHTML = games.map(game => {
        const statusColor = {
            'Пройдено': 'bg-green-900/50 text-green-400 border-green-800',
            'Дропнуто': 'bg-red-900/50 text-red-400 border-red-800',
            'Обзор': 'bg-blue-900/50 text-blue-400 border-blue-800',
            'Жду релиз': 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
            'В процессе': 'bg-purple-900/50 text-purple-400 border-purple-800'
        }[game.status] || 'bg-gray-800 text-gray-400 border-gray-700';
        const displayName = game.name === '[REDACTED]' ? 'Скрытая игра' : (game.name || 'Без названия');
        const topBorderColor = game.status === 'Пройдено' ? 'border-t-green-500' : game.status === 'Дропнуто' ? 'border-t-red-500' : game.status === 'Обзор' ? 'border-t-blue-500' : game.status === 'Жду релиз' ? 'border-t-yellow-500' : 'border-t-purple-500';
        const isMI = game.mi === true || game.MI_Conducted === true;
        const miBadge = isMI ? `<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/50">🏆 МИ</span>` : '';
        const droppedIcon = game.status === 'Дропнуто' ? ' 💀' : '';
        const scoreDisplay = game.score ? (game.score == 10 ? `<span class="text-xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.65L18.35 12 12 18.35 5.65 12 12 5.65z"/></svg>${game.score}</span><span class="text-gray-600 text-sm font-mono">/10</span>` : `<span class="text-xl font-mono font-bold text-purple-400"><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.65L18.35 12 12 18.35 5.65 12 12 5.65z"/></svg>${game.score}</span><span class="text-gray-600 text-sm font-mono">/10</span>`) : '<span class="text-gray-600 text-sm font-mono">—</span>';
        return `
            <div class="game-card bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${topBorderColor} hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative" onclick="openGame(${game.id})">
                <div class="p-5">
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <h3 class="text-lg font-bold group-hover:text-purple-400 transition-colors line-clamp-2">${displayName}${droppedIcon}</h3>
                        ${miBadge}
                    </div>
                    <div class="text-sm text-gray-400 mb-3">${game.genre || '—'} ${game.hours ? '<span class="font-mono text-gray-300">• ' + game.hours + ' ч.</span>' : ''}</div>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${game.features ? game.features.split(',').slice(0, 3).map(f => `<span class="text-[10px] bg-gray-800/80 text-gray-300 px-2 py-1 rounded border border-gray-700/50">${f.trim()}</span>`).join('') : ''}
                    </div>
                    <div class="flex justify-between items-center pt-3 border-t border-gray-800">
                        <div class="flex items-center gap-1">
                            ${scoreDisplay}
                        </div>
                        <span class="text-[10px] px-2.5 py-1 rounded-full border font-medium uppercase tracking-wide ${statusColor}">${game.status || '—'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

function openGame(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;
    const modal = document.getElementById('game-modal');
    const content = document.getElementById('modal-content');
    const displayName = game.name === '[REDACTED]' ? 'Скрытая игра' : (game.name || 'Без название');
    const statusColor = {
        'Пройдено': 'bg-green-900/50 text-green-400 border-green-800',
        'Дропнуто': 'bg-red-900/50 text-red-400 border-red-800',
        'Обзор': 'bg-blue-900/50 text-blue-400 border-blue-800',
        'Жду релиз': 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
        'В процессе': 'bg-purple-900/50 text-purple-400 border-purple-800'
    }[game.status] || 'bg-gray-800 text-gray-400 border-gray-700';
    const isMI = game.mi === true || game.MI_Conducted === true;
    const featuresHtml = game.features ? game.features.split(',').map(f => `<span class="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded border border-purple-500/30">${f.trim()}</span>`).join('') : '';
    const scoreDisplay = game.score ? (game.score == 10 ? `<span class="text-yellow-400 font-bold text-xl flex items-center gap-1 font-mono drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.65L18.35 12 12 18.35 5.65 12 12 5.65z"/></svg>${game.score}</span><span class="text-gray-500 text-sm font-normal">/10</span>` : `<span class="text-purple-400 font-bold text-xl flex items-center gap-1 font-mono"><svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.65L18.35 12 12 18.35 5.65 12 12 5.65z"/></svg>${game.score}</span><span class="text-gray-500 text-sm font-normal">/10</span>`) : '';
    
    content.innerHTML = `
        <!-- 1. ШАПКА -->
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-3">${displayName}</h2>
            <div class="flex flex-wrap items-center gap-3">
                <span class="text-xs px-3 py-1.5 rounded border font-medium uppercase tracking-wide ${statusColor}">${game.status || '—'}</span>
                ${scoreDisplay}
                ${game.progress ? `<span class="text-gray-400 text-sm bg-gray-800 px-2 py-1 rounded font-mono">Прогресс: ${game.progress}%</span>` : ''}
                ${isMI ? '<span class="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold border border-yellow-500/50">🏆 Участник Мастер Игорей</span>' : ''}
            </div>
        </div>
        
        <!-- 2. ТАБЛИЦА ПАРАМЕТРОВ -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-700">
                ${game.genre ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Жанр</div><div class="text-white text-sm">${game.genre}</div></div>` : ''}
                ${game.setting ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Сеттинг</div><div class="text-white text-sm">${game.setting}</div></div>` : ''}
                ${game.difficulty ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Сложность</div><div class="text-white text-sm font-mono">${game.difficulty}/10</div></div>` : ''}
                ${game.hours ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Часы</div><div class="text-white text-sm font-mono">${game.hours} ч.</div></div>` : ''}
                ${game.release_date ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Релиз</div><div class="text-white text-sm">${formatDate(game.release_date)}</div></div>` : ''}
                ${game.played_date ? `<div class="p-3"><div class="text-gray-400 text-xs uppercase font-semibold mb-1">Прохождение</div><div class="text-white text-sm">${formatDate(game.played_date)}</div></div>` : ''}
            </div>
        </div>
        
        <!-- 3. ОСОБЕННОСТИ -->
        ${featuresHtml ? `<div class="mb-6"><div class="text-xs text-gray-400 uppercase font-semibold mb-2">Особенности</div><div class="flex flex-wrap gap-2">${featuresHtml}</div></div>` : ''}
        
        <!-- 4. ЗАМЕТКИ ТИАНА -->
        ${game.notes ? `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-purple-400 mb-3">📝 Заметки Тиана</h3>
                <div class="bg-gray-800/70 rounded-xl border border-purple-500/30 p-6 text-gray-100 text-lg leading-relaxed whitespace-pre-line">${game.notes}</div>
            </div>
        ` : ''}
        
        <!-- 5. КНОПКИ ВНИЗУ -->
        ${(game.youtube || isMI) ? `
            <div class="flex flex-col sm:flex-row gap-3">
                ${game.youtube ? `<a href="${game.youtube}" target="_blank" rel="noopener" class="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-3 rounded-lg transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>▶ Смотреть на YouTube</a>` : ''}
                ${isMI ? `<a href="${game.mi_link || '#'}" target="_blank" rel="noopener" class="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-3 rounded-lg transition">🏆 Выпуск Мастер Игорей</a>` : ''}
            </div>
        ` : ''}
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeGame() {
    const modal = document.getElementById('game-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// === Слушатели ===

document.getElementById('toggle-filters').addEventListener('click', () => {
    document.getElementById('filters-panel').classList.toggle('hidden');
});

document.getElementById('search').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    applyFilters();
});

document.querySelectorAll('.status-tag').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.status-tag').forEach(b => { b.classList.remove('active', 'bg-purple-600', 'text-white'); b.classList.add('bg-gray-800', 'text-gray-300'); });
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('active', 'bg-purple-600', 'text-white');
        currentStatus = btn.dataset.status;
        applyFilters();
    });
});

// Жанры (одиночный выбор)
document.getElementById('genre-tags').addEventListener('click', (e) => {
    const btn = e.target.closest('.genre-tag');
    if (!btn) return;
    // Сбрасываем все
    document.querySelectorAll('.genre-tag').forEach(b => {
        b.classList.remove('active', 'bg-purple-600', 'text-white');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });
    // Активируем выбранный
    btn.classList.remove('bg-gray-800', 'text-gray-300');
    btn.classList.add('active', 'bg-purple-600', 'text-white');
    currentGenre = btn.dataset.genre;
    applyFilters();
});

document.getElementById('sort-filter').addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilters();
});

document.getElementById('game-modal').addEventListener('click', (e) => { if (e.target.id === 'game-modal') closeGame(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGame(); });

// Открытие случайной игры из текущего отфильтрованного списка
document.getElementById('random-game-btn').addEventListener('click', () => {
    let filtered = [...allGames];
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        filtered = filtered.filter(g => {
            const name = (g.name || '').toLowerCase();
            const genre = (g.genre || '').toLowerCase();
            const features = (g.features || '').toLowerCase();
            const setting = (g.setting || '').toLowerCase();
            const genreMatch = genre.split(',').some(gen => gen.trim().includes(s) || s.includes(gen.trim()));
            const featuresMatch = features.split(',').some(feat => feat.trim().includes(s) || s.includes(feat.trim()));
            return name.includes(s) || genreMatch || featuresMatch || setting.includes(s);
        });
    }
    if (currentStatus !== 'all') filtered = filtered.filter(g => g.status === currentStatus);
    if (currentGenre !== 'all') {
        filtered = filtered.filter(g => {
            if (!g.genre) return false;
            return g.genre.split(',').map(x => x.trim()).includes(currentGenre);
        });
    }
    if (filtered.length === 0) {
        alert('По текущим фильтрам игр не найдено!');
        return;
    }
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const randomGame = filtered[randomIndex];
    openGame(randomGame.id);
});

loadGames();