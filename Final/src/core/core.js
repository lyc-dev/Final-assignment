// core.js - 核心功能模块
import { initCharts } from '../visualizations/components/pie.js';
import { initMap, DrawMaps, Mask } from '../visualizations/components/map.js';
import { initForceGraph } from '../visualizations/components/force.js';
import AlbumVisualizer from '../utils/album-visualizer.js';

// 全局变量保存专辑可视化对象
let albumVisualizer = null;

// 初始化所有页面功能
export async function initializePageModules(page) {
    console.log('Initializing module:', page);

    if (page === 'music') {
        // 确保在音乐模块初始化时，视图切换状态标志为false
        window.isViewSwitching = false;
    }

    switch (page) {
        case 'music':
            try {
                // 初始化专辑封面可视化
                const initAlbumViz = async () => {
                    console.log('初始化专辑封面可视化效果...');
                    try {
                        // 确保获取到音频元素
                        const audioPlayer = document.getElementById('global-music-player');
                        if (!audioPlayer) {
                            console.error('找不到音频播放器');
                            return;
                        }
                        
                        // 等待iframe加载完成
                        await new Promise(resolve => {
                            if (audioPlayer.contentWindow && audioPlayer.contentWindow.document.readyState === 'complete') {
                                resolve();
                            } else {
                                audioPlayer.addEventListener('load', resolve, { once: true });
                            }
                        });
                        
                        // 从iframe中获取音频元素
                        const audioElement = audioPlayer.contentWindow.document.getElementById('bgMusic');
                        if (!audioElement) {
                            console.error('找不到音频元素');
                            return;
                        }
                        
                        // 清理可能存在的旧实例
                        if (albumVisualizer) {
                            albumVisualizer.cleanup();
                        }
                        
                        // 创建新的专辑可视化实例
                        albumVisualizer = new AlbumVisualizer('album-viz-canvas', audioElement);
                        await albumVisualizer.init();
                        console.log('专辑封面可视化初始化成功');
                    } catch (error) {
                        console.error('初始化专辑封面可视化失败:', error);
                    }
                };
                
                // 先初始化一次
                await initAlbumViz();
                
                // 为音乐可视化页面绑定切换视图按钮事件 (移除setTimeout延迟)
                console.log('Initializing music visualizer buttons immediately after initAlbumViz...');
                const prevBtnOriginal = document.getElementById('prev-btn');
                const nextBtnOriginal = document.getElementById('next-btn');
                
                if (prevBtnOriginal && nextBtnOriginal) {
                    console.log('在SPA环境中重新绑定音乐可视化按钮事件');
                    // 清除可能存在的旧事件处理器
                    const prevBtn = prevBtnOriginal.cloneNode(true);
                    prevBtnOriginal.parentNode.replaceChild(prevBtn, prevBtnOriginal);

                    const nextBtn = nextBtnOriginal.cloneNode(true);
                    nextBtnOriginal.parentNode.replaceChild(nextBtn, nextBtnOriginal);
                    
                    let isAlbumViewActive = false;
                    let lyricsHighlightInterval = null;
                    let handleLyricClickEvent; // 用于存储事件处理函数，方便移除
                    let currentLyricIndex = -1; // 全局变量跟踪当前高亮的歌词索引

                    // 直接在core.js中实现视图切换函数
                    function toggleViewDirectly() {
                        console.log('SPA环境中直接切换视图');
                        
                        if (window.isViewSwitching) {
                            console.log('视图切换进行中，忽略当前请求');
                            return;
                        }
                        window.isViewSwitching = true; // 设置切换标志位
                        
                        // 获取必要的DOM元素
                        const visualizationContainer = document.getElementById('visualization-container');
                        const albumContainer = document.getElementById('album-container');
                        
                        if (!visualizationContainer || !albumContainer) {
                            console.error('切换视图失败：找不到容器元素');
                            window.isViewSwitching = false; // 重置标志位
                            return;
                        }
                        
                        // 判断当前视图状态
                        const isVisualizationVisible = !visualizationContainer.classList.contains('hiding') && 
                                                      visualizationContainer.style.display !== 'none';
                        
                        if (isVisualizationVisible) {
                            // 切换到专辑视图
                            console.log('切换到专辑视图');
                            
                            albumContainer.style.display = 'flex';
                            visualizationContainer.classList.add('hiding');
                            visualizationContainer.classList.remove('showing');
                            
                            setTimeout(() => {
                                albumContainer.classList.add('showing');
                                albumContainer.classList.remove('hiding');
                                prevBtn.title = "切换到可视化视图";
                                nextBtn.title = "切换到可视化视图";
                                
                                if (!albumVisualizer) { // 再次检查，虽然不太可能
                                    initAlbumViz(); // 如果意外丢失，尝试重新初始化
                                }
                                
                                isAlbumViewActive = true;
                                updateAlbumViewDirectly();
                                setupSongChangeListener();
                                setupGlobalLyricClickHandler();
                                
                                setTimeout(() => {
                                    visualizationContainer.style.display = 'none';
                                    window.isViewSwitching = false;
                                    console.log('切换到专辑视图完成');
                                }, 500);
                            }, 50);
                        } else {
                            // 切换到音频可视化视图
                            console.log('切换到可视化视图');
                            
                            visualizationContainer.style.display = 'block';
                            albumContainer.classList.add('hiding');
                            albumContainer.classList.remove('showing');
                            
                            setTimeout(() => {
                                visualizationContainer.classList.remove('hiding');
                                visualizationContainer.classList.add('showing');
                                prevBtn.title = "切换到专辑视图";
                                nextBtn.title = "切换到专辑视图";
                                
                                isAlbumViewActive = false;
                                if (lyricsHighlightInterval) {
                                    clearInterval(lyricsHighlightInterval);
                                    lyricsHighlightInterval = null;
                                }
                                
                                if (handleLyricClickEvent) {
                                    document.removeEventListener('click', handleLyricClickEvent, true);
                                }
                                
                                setTimeout(() => {
                                    albumContainer.style.display = 'none';
                                    window.isViewSwitching = false;
                                    console.log('切换到可视化视图完成');
                                }, 500);
                            }, 50);
                        }
                    }
                    
                    // 新增：设置全局歌词点击处理器（使用事件委托）
                    function setupGlobalLyricClickHandler() {
                        const audioPlayer = document.getElementById('global-music-player');
                        if (!audioPlayer || !audioPlayer.contentWindow) return;
                        const audioElement = audioPlayer.contentWindow.document.getElementById('bgMusic');
                        if (!audioElement) return;
                        
                        if (handleLyricClickEvent) { // 移除旧的，如果存在
                            document.removeEventListener('click', handleLyricClickEvent, true);
                        }
                        
                        handleLyricClickEvent = function(event) {
                            let target = event.target;
                            while (target && !target.classList.contains('lyrics-item') && target !== document.body) {
                                target = target.parentElement;
                            }
                            if (target && target.classList.contains('lyrics-item') && target.dataset.time) {
                                const clickTime = parseFloat(target.dataset.time);
                                if (!isNaN(clickTime)) {
                                    // 保存当前播放状态
                                    const wasPlaying = !audioElement.paused;
                                    
                                    // 先设置时间点
                                    audioElement.currentTime = clickTime;
                                    
                                    // 如果之前是播放状态，确保继续播放
                                    if (wasPlaying) {
                                        // 使用Promise处理播放请求
                                        const playPromise = audioElement.play();
                                        if (playPromise !== undefined) {
                                            playPromise.catch(error => {
                                                console.error('歌词点击后播放失败:', error);
                                            });
                                        }
                                    }
                                    
                                    const lyricId = target.id;
                                    if (lyricId && lyricId.startsWith('lyric-')) {
                                        const newIndex = parseInt(lyricId.split('-')[1]);
                                        if (!isNaN(newIndex)) updateLyricHighlight(newIndex);
                                    }
                                    event.stopPropagation();
                                    event.preventDefault();
                                }
                            }
                        };
                        document.addEventListener('click', handleLyricClickEvent, true);
                    }
                    
                    // 新增：单独的歌词高亮更新函数
                    function updateLyricHighlight(newLyricIndex) {
                        const lyricsContainer = document.getElementById('lyrics-container');
                        if (!lyricsContainer) return;
                        if (newLyricIndex === currentLyricIndex) return;
                        
                        if (currentLyricIndex !== -1) {
                            const oldLyric = document.getElementById(`lyric-${currentLyricIndex}`);
                            if (oldLyric) oldLyric.classList.remove('active');
                        }
                        
                        const newLyric = document.getElementById(`lyric-${newLyricIndex}`);
                        if (newLyric) {
                            newLyric.classList.add('active');
                            lyricsContainer.scrollTop = newLyric.offsetTop - lyricsContainer.offsetHeight/2 + newLyric.offsetHeight/2;
                        }
                        currentLyricIndex = newLyricIndex;
                    }
                    
                    // 监听歌曲变化
                    function setupSongChangeListener() {
                        const audioPlayer = document.getElementById('global-music-player');
                        if (!audioPlayer || !audioPlayer.contentWindow) return;
                        
                        let lastSongName = '';
                        try {
                            const initialPlayerState = audioPlayer.contentWindow.getMusicPlayerState();
                            lastSongName = initialPlayerState.currentSong;
                        } catch (e) { console.error('获取初始歌曲失败:', e); }
                        
                        const checkInterval = setInterval(() => {
                            if (!isAlbumViewActive) {
                                clearInterval(checkInterval);
                                return;
                            }
                            try {
                                const currentPlayerState = audioPlayer.contentWindow.getMusicPlayerState();
                                const currentSongName = currentPlayerState.currentSong;
                                
                                if (currentSongName !== lastSongName) {
                                    console.log('检测到歌曲变化:', currentSongName);
                                    lastSongName = currentSongName;
                                    updateAlbumViewDirectly(currentPlayerState);
                                }
                            } catch (e) { console.error('检查歌曲变化出错:', e); }
                        }, 300);
                    }
                    
                    // 更新专辑视图
                    function updateAlbumViewDirectly(playerStateFromListener) {
                        try {
                            const audioPlayer = document.getElementById('global-music-player');
                            const songTitleEl = document.getElementById('song-title');
                            const songArtistEl = document.getElementById('song-artist');
                            const albumCoverEl = document.getElementById('album-cover');
                            const lyricsContainerEl = document.getElementById('lyrics-container');
                            
                            if (!audioPlayer || !songTitleEl || !songArtistEl || !albumCoverEl || !lyricsContainerEl) {
                                console.error('更新专辑视图失败：找不到必要DOM元素');
                                return;
                            }
                            
                            // 新增：修改歌词容器样式，使其在视觉上不可见，但保留其功能（如滚动）
                            // 这会使得歌词容器的背景变透明，移除边框和内边距，
                            // 从而达到"去掉"容器视觉效果的目的，同时保留其作为滚动区域的功能。
                            lyricsContainerEl.style.backgroundColor = 'transparent';
                            lyricsContainerEl.style.border = 'none';
                            lyricsContainerEl.style.padding = '0';
                            // lyricsContainerEl.style.boxShadow = 'none'; // 如果需要，也可以移除阴影

                            // Use passed state or fetch new if not passed (e.g. initial load of view)
                            const playerState = playerStateFromListener || audioPlayer.contentWindow.getMusicPlayerState();
                            const currentSongNameFromState = playerState.currentSong;

                            // --- Immediate UI Update with Placeholders ---
                            songTitleEl.textContent = currentSongNameFromState; // Use song name from player state for immediate title
                            songArtistEl.textContent = '加载中...'; 
                            albumCoverEl.src = '/image/album/default/default.png'; // Default/placeholder album art
                            lyricsContainerEl.innerHTML = '<div class="lyrics-item" style="text-align:center; margin-top: 20px;">歌词加载中...</div>';

                            currentLyricIndex = -1; // Reset lyric index for the new song

                            // Fetch detailed information from music-info.json
                            fetch('/Final/src/data/music-info.json')
                                .catch(() => fetch('../../src/data/music-info.json')) // Fallback paths
                                .catch(() => fetch('./src/data/music-info.json'))
                                .then(response => {
                                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                                    return response.json();
                                })
                                .then(musicInfo => {
                                    const songInfo = musicInfo.find(song => song.name === currentSongNameFromState);
                                    if (!songInfo) {
                                        console.error('找不到歌曲信息:', currentSongNameFromState);
                                        songArtistEl.textContent = '未知艺术家'; // Update placeholder
                                        albumCoverEl.src = '/image/album/default/default.png'; // Keep default cover
                                        lyricsContainerEl.innerHTML = ''; // Clear "loading"
                                        const noInfoMsg = document.createElement('div');
                                        noInfoMsg.className = 'no-lyrics-message'; // Re-use style
                                        noInfoMsg.textContent = '歌曲信息未找到';
                                        lyricsContainerEl.appendChild(noInfoMsg);
                                        return;
                                    }
                                    
                                    // --- Update with detailed info from JSON ---
                                    songTitleEl.textContent = songInfo.name; // Update with potentially more accurate name
                                    songArtistEl.textContent = songInfo.artist;
                                    
                                    // Album cover loading logic (existing is fine, with timestamp)
                                    const defaultCoverPath = `/Final/image/album/${songInfo.name}.png`;
                                    const fallbackCoverPath = songInfo.cover;
                                    const timestamp = new Date().getTime();
                                    
                                    fetch(defaultCoverPath)
                                        .then(response => {
                                            if (response.ok) albumCoverEl.src = defaultCoverPath + '?t=' + timestamp;
                                            else albumCoverEl.src = fallbackCoverPath + '?t=' + timestamp;
                                        })
                                        .catch(() => {
                                            albumCoverEl.src = fallbackCoverPath + '?t=' + timestamp; // Fallback on fetch error
                                        });
                                    
                                    // Lyrics rendering (existing logic is fine)
                                    lyricsContainerEl.innerHTML = ''; // Clear "loading" or previous lyrics
                                    if (!songInfo.hasLyrics || !songInfo.lyrics || songInfo.lyrics.length === 0) {
                                        const noLyricsMsg = document.createElement('div');
                                        noLyricsMsg.className = 'no-lyrics-message';
                                        noLyricsMsg.textContent = '纯音乐，无歌词';
                                        lyricsContainerEl.appendChild(noLyricsMsg);
                                    } else {
                                        const fragment = document.createDocumentFragment();
                                        songInfo.lyrics.forEach((lyric, index) => {
                                            const lyricItem = document.createElement('div');
                                            lyricItem.className = 'lyrics-item';
                                            lyricItem.id = `lyric-${index}`;
                                            if (lyric.time !== undefined) {
                                                lyricItem.dataset.time = lyric.time;
                                                lyricItem.style.cursor = 'pointer';
                                            }
                                            if (lyric.original && lyric.translation) {
                                                const originalText = document.createElement('div');
                                                originalText.className = 'lyrics-original';
                                                originalText.textContent = lyric.original;
                                                lyricItem.appendChild(originalText);
                                                const translationText = document.createElement('div');
                                                translationText.className = 'lyrics-translation';
                                                translationText.textContent = lyric.translation;
                                                lyricItem.appendChild(translationText);
                                            } else if (lyric.text) {
                                                lyricItem.textContent = lyric.text;
                                            }
                                            fragment.appendChild(lyricItem);
                                        });
                                        lyricsContainerEl.appendChild(fragment);
                                        
                                        if (lyricsHighlightInterval) clearInterval(lyricsHighlightInterval);
                                        lyricsHighlightInterval = setInterval(() => {
                                            if (!isAlbumViewActive) {
                                                clearInterval(lyricsHighlightInterval);
                                                return;
                                            }
                                            try {
                                                // Ensure audioPlayer is still valid and get fresh state
                                                const liveAudioPlayer = document.getElementById('global-music-player');
                                                if(!liveAudioPlayer || !liveAudioPlayer.contentWindow) return;
                                                const currentState = liveAudioPlayer.contentWindow.getMusicPlayerState();
                                                const currentTime = currentState.currentTime;
                                                let newLyricIndex = -1;
                                                for (let i = 0; i < songInfo.lyrics.length; i++) {
                                                    const lyricTime = songInfo.lyrics[i].time;
                                                    if (lyricTime !== undefined && currentTime >= lyricTime) newLyricIndex = i;
                                                    else if (lyricTime !== undefined && currentTime < lyricTime) break;
                                                }
                                                if (newLyricIndex !== -1 && newLyricIndex !== currentLyricIndex) {
                                                    updateLyricHighlight(newLyricIndex);
                                                }
                                            } catch (e) { console.error('更新歌词高亮失败:', e); }
                                        }, 300);
                                    }
                                })
                                .catch(error => {
                                    console.error('加载音乐信息失败:', error);
                                    songArtistEl.textContent = '错误';
                                    albumCoverEl.src = '/image/album/default/default.png'; // Fallback to default image on error
                                    lyricsContainerEl.innerHTML = '<div class="lyrics-item" style="text-align:center; margin-top: 20px;">歌词加载失败</div>';
                                });

                            setupGlobalLyricClickHandler(); // Ensure lyric click handler is active
                        } catch (error) {
                            console.error('更新专辑视图出错:', error);
                            // Attempt to provide some fallback UI on general error
                            const songTitleEl = document.getElementById('song-title');
                            const songArtistEl = document.getElementById('song-artist');
                            if (songTitleEl) songTitleEl.textContent = "播放器错误";
                            if (songArtistEl) songArtistEl.textContent = "请检查控制台";
                        }
                    }

                    // 重新绑定事件到新的按钮实例
                    prevBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('SPA环境中点击了左侧按钮');
                        toggleViewDirectly();
                    });
                    
                    nextBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('SPA环境中点击了右侧按钮');
                        toggleViewDirectly();
                    });
                    
                    console.log('在SPA环境中不再设置全局键盘箭头键事件监听');
                    
                } else {
                    console.error('SPA环境中找不到音乐可视化导航按钮');
                }
            } catch (error) {
                console.error('Failed to initialize music page modules:', error);
            }
            break;
            
        case 'pie':
            try {
                // 延迟一点初始化饼图，确保DOM已经加载完毕
                setTimeout(() => {
                    console.log('Initializing pie charts...');
                    if (document.getElementById('pie-chart') && document.getElementById('bar-chart')) {
                        initCharts();
                    } else {
                        console.error('Pie chart containers not found in DOM');
                    }
                }, 300);
            } catch (error) {
                console.error('Failed to initialize charts:', error);
            }
            break;

        case 'map':
            try {
                setTimeout(function(){
                    DrawMaps();
                    setTimeout(function(){
                        Mask('重庆市');
                    }, 1000);
                }, 500);
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
            break;

        case 'relation':
            try {
                if (window.d3) {
                    d3.selectAll(".graph-tooltip").remove();
                    d3.select("#graph-container svg").remove();
                }
                const container = document.getElementById('graph-container');
                if (container) {
                    container.innerHTML = '';
                }
                window.inSpaContext = true;
                await initForceGraph();
            } catch (error) {
                console.error('Failed to initialize relation graph:', error);
            }
            break;

        default:
            break;
    }
}

// 清理页面功能
export function cleanupPageModules(page) {
    console.log(`Cleaning up module: ${page}`);
    
    // 释放不再需要的资源
    switch (page) {
        case 'pie':
            // 清理饼图资源
            break;
            
        case 'map':
            // 清理地图资源
            break;
            
        case 'relation':
            // 清理关系图资源
            if (window.forceGraphCleanup) {
                window.forceGraphCleanup();
                window.forceGraphCleanup = null;
            }
            break;
            
        case 'music':
            // 清理音乐可视化资源
            if (albumVisualizer) {
                console.log('清理专辑封面可视化资源');
                albumVisualizer.cleanup();
                albumVisualizer = null;
            }
            break;
            
        default:
            break;
    }
}

// 导出辅助函数
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}