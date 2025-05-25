// 添加对AlbumVisualizer的导入
import AlbumVisualizer from './album-visualizer.js';

// 定义全局变量
let currentView = 0;
let visualizer;
let musicInfo = [];
let audioPlayer;
let audioElement;
let currentLyricIndex = -1;
let lastUpdatedSong = ''; // 添加变量跟踪最后更新的歌曲
let animationFrameId; // 用于存储 requestAnimationFrame 的 ID
let albumVisualizer; // 添加专辑封面可视化对象
let lyricClickHandler; // 全局歌词点击处理函数
let isAudioInitialized = false; // 标记音频是否已初始化

// 暴露全局变量，使音乐播放器能够检查
window.currentView = currentView;
window.musicInfo = musicInfo; // 确保音乐信息全局可用

// 视图切换函数
function toggleViewInternal() {
    console.log('toggleViewInternal被调用，当前视图:', currentView);
    
    // 在每次切换时重新获取DOM元素，确保在SPA环境中也有效
    const visualizationContainerCurrent = document.getElementById('visualization-container');
    const albumContainerCurrent = document.getElementById('album-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (!visualizationContainerCurrent || !albumContainerCurrent) {
        console.error('切换视图失败：找不到必要的容器元素');
        return;
    }
    
    if (!prevBtn || !nextBtn) {
        console.error('切换视图失败：找不到导航按钮');
        return;
    }
    
    // 防止重复切换，添加标志位
    if (window.isViewSwitching) {
        console.log('视图切换进行中，忽略当前请求');
        return;
    }
    
    // 设置切换标志位
    window.isViewSwitching = true;
    
    if (currentView === 0) {
        // 切换到专辑歌词视图
        
        // 确保专辑容器已正确定位但初始不可见
        albumContainerCurrent.style.display = 'flex';
        
        // 添加过渡动画类
        visualizationContainerCurrent.classList.add('hiding');
        
        // 延迟一小段时间后开始显示专辑视图
        setTimeout(() => {
            // 显示专辑视图
            albumContainerCurrent.classList.add('showing');
            
            // 直接从音乐播放器获取当前歌曲并强制更新专辑视图
            try {
                updateAlbumViewFromPlayer();
                
                // 初始化专辑封面可视化
                if (!albumVisualizer && audioElement) {
                    albumVisualizer = new AlbumVisualizer('album-viz-canvas', audioElement);
                    albumVisualizer.init().catch(err => console.error('专辑可视化初始化失败:', err));
                }
            } catch (e) {
                console.error('直接获取歌曲信息失败:', e);
            }
            
            // 设置按钮提示
            prevBtn.title = "切换到可视化视图";
            nextBtn.title = "切换到可视化视图";
            
            // 更新状态
            currentView = 1;
            window.currentView = 1; // 同步更新全局变量
            
            // 更新时间戳
            window.lastUpdateTimestamp = new Date().getTime();
            
            // 完全切换后释放标志位
            setTimeout(() => {
                window.isViewSwitching = false;
                // 完全隐藏可视化容器，优化性能
                visualizationContainerCurrent.style.display = 'none';
            }, 500);
            
            // 设置更高频率的轮询，确保专辑视图保持更新
            if (!window.albumUpdateInterval) {
                window.albumUpdateInterval = setInterval(() => {
                    if (currentView === 1) {
                        try {
                            // 获取当前时间戳检查是否需要更新
                            const now = new Date().getTime();
                            if (!window.lastUpdateTimestamp || now - window.lastUpdateTimestamp > 1000) {
                                updateAlbumViewFromPlayer();
                                window.lastUpdateTimestamp = now;
                            }
                        } catch (e) {
                            console.error('专辑视图轮询更新出错:', e);
                        }
                    }
                }, 300);  // 减少轮询间隔，提高响应速度
            }
            
            console.log('已切换到专辑视图');
        }, 50);
        
    } else {
        // 切换到音谱可视化视图
        
        // 确保可视化容器已准备好
        visualizationContainerCurrent.style.display = 'block';
        
        // 开始动画过渡
        albumContainerCurrent.classList.add('hiding');
        albumContainerCurrent.classList.remove('showing');
        
        setTimeout(() => {
            // 显示可视化视图
            visualizationContainerCurrent.classList.remove('hiding');
            visualizationContainerCurrent.classList.add('showing');
            
            // 设置按钮提示
            prevBtn.title = "切换到专辑视图";
            nextBtn.title = "切换到专辑视图";
            
            // 更新状态
            currentView = 0;
            window.currentView = 0; // 同步更新全局变量
            
            // 清除更新定时器
            if (window.albumUpdateInterval) {
                clearInterval(window.albumUpdateInterval);
                window.albumUpdateInterval = null;
            }
            
            // 完全切换后释放标志位
            setTimeout(() => {
                window.isViewSwitching = false;
                // 完全隐藏专辑容器，优化性能
                albumContainerCurrent.style.display = 'none';
            }, 500);
            
            console.log('已切换到可视化视图');
        }, 50);
    }
}

// 直接从播放器获取信息并更新专辑视图
function updateAlbumViewFromPlayer() {
    const audioPlayerCurrent = document.getElementById('global-music-player');
    if (!audioPlayerCurrent || !audioPlayerCurrent.contentWindow || !audioPlayerCurrent.contentWindow.document) {
        console.warn('无法访问播放器iframe内容');
        return;
    }
    
    try {
        // 尝试直接获取当前播放歌曲名称
        let currentSongName;
        
        // 首先尝试使用全局函数
        if (audioPlayerCurrent.contentWindow.getCurrentSongName) {
            currentSongName = audioPlayerCurrent.contentWindow.getCurrentSongName();
        } else {
            // 回退到DOM查询方式
            const currentSongElement = audioPlayerCurrent.contentWindow.document.getElementById('currentSong');
            if (currentSongElement) {
                currentSongName = currentSongElement.textContent;
            }
        }
        
        if (!currentSongName) {
            console.warn('无法获取当前歌曲名称');
            return;
        }
        
        if (currentSongName !== lastUpdatedSong) {
            console.log('检测到歌曲变化:', currentSongName);
            const songInfo = musicInfo.find(song => song.name === currentSongName);
            if (songInfo) {
                // 使用requestAnimationFrame确保DOM更新流畅
                window.requestAnimationFrame(() => {
                    // 更新歌曲信息
                    const titleElement = document.getElementById('song-title');
                    const artistElement = document.getElementById('song-artist');
                    if (titleElement) titleElement.textContent = songInfo.name;
                    if (artistElement) artistElement.textContent = songInfo.artist;
                    
                    // 预加载和更新封面
                    updateAlbumCover(songInfo);
                    
                    // 使用documentFragment更高效地更新歌词
                    updateLyricsEfficiently(songInfo);
                    
                    lastUpdatedSong = currentSongName;
                });
            }
        }
    } catch (error) {
        console.error('更新专辑视图时出错:', error);
    }
}

// 高效更新封面图片
function updateAlbumCover(songInfo) {
    const coverElement = document.getElementById('album-cover');
    if (!coverElement) return;
    
    // 添加加载中类
    coverElement.classList.add('loading');
    
    // 确保发光效果元素存在并可见
    let glowElement = document.querySelector('.album-glow');
    if (!glowElement) {
        const containerElement = document.querySelector('.album-cover-container');
        if (containerElement) {
            glowElement = document.createElement('div');
            glowElement.className = 'album-glow';
            containerElement.appendChild(glowElement);
        }
    }
    
    // 预加载图片
    const img = new Image();
    const timestamp = new Date().getTime();
    img.onload = function() {
        // 使用requestAnimationFrame确保动画流畅
        window.requestAnimationFrame(() => {
            coverElement.src = songInfo.cover + '?t=' + timestamp;
            coverElement.classList.remove('loading');
            
            // 确保发光效果随着专辑封面的显示而可见
            if (glowElement) {
                glowElement.style.opacity = '1';
            }
        });
    };
    img.onerror = function() {
        window.requestAnimationFrame(() => {
            // 使用默认封面
            coverElement.src = '../../image/album/default/default.png';
            coverElement.classList.remove('loading');
            
            // 确保发光效果可见
            if (glowElement) {
                glowElement.style.opacity = '1';
            }
        });
    };
    img.src = songInfo.cover + '?t=' + timestamp;
}

// 使用DocumentFragment高效更新歌词
function updateLyricsEfficiently(songInfo) {
    const lyricsContainer = document.getElementById('lyrics-container');
    if (!lyricsContainer) return;
    
    // 清空并更新歌词容器
    lyricsContainer.innerHTML = '';
    
    if (!songInfo.hasLyrics || !songInfo.lyrics || songInfo.lyrics.length === 0) {
        const noLyricsMsg = document.createElement('div');
        noLyricsMsg.className = 'no-lyrics-message';
        noLyricsMsg.textContent = '纯音乐，无歌词';
        lyricsContainer.appendChild(noLyricsMsg);
        return;
    }
    
    // 创建文档片段以批量更新DOM
    const fragment = document.createDocumentFragment();
    
    // 创建所有歌词元素并添加到片段
    songInfo.lyrics.forEach((lyric, index) => {
        const lyricItem = document.createElement('div');
        lyricItem.className = 'lyrics-item';
        lyricItem.id = `lyric-${index}`;
        
        if (lyric.time !== undefined) {
            lyricItem.dataset.time = lyric.time;
            lyricItem.style.cursor = 'pointer';
            // 不再添加单独的点击事件，依赖事件委托处理
        }
        
        if (lyric.original && lyric.translation) {
            // 创建原文元素
            const originalText = document.createElement('div');
            originalText.className = 'lyrics-original';
            originalText.textContent = lyric.original;
            lyricItem.appendChild(originalText);
            
            // 创建翻译元素
            const translationText = document.createElement('div');
            translationText.className = 'lyrics-translation';
            translationText.textContent = lyric.translation;
            lyricItem.appendChild(translationText);
        } else if (lyric.text) {
            // 普通歌词
            lyricItem.textContent = lyric.text;
        }
        
        fragment.appendChild(lyricItem);
    });
    
    // 一次性添加所有歌词元素
    lyricsContainer.appendChild(fragment);
    
    // 确保歌词点击处理器已设置
    setupLyricClickHandler();
}

// 更新歌词显示
function updateLyrics(songInfo) {
    // 重新获取歌词容器，确保在SPA环境中正常工作
    const lyricsContainerCurrent = document.getElementById('lyrics-container');
    if (!lyricsContainerCurrent) {
        console.error('找不到歌词容器');
        return;
    }
    
    lyricsContainerCurrent.innerHTML = '';
    console.log('更新歌词:', songInfo.name, '是否有歌词:', songInfo.hasLyrics, '歌词数量:', songInfo.lyrics.length);
    
    if (!songInfo.hasLyrics || !songInfo.lyrics || songInfo.lyrics.length === 0) {
        const noLyricsMsg = document.createElement('div');
        noLyricsMsg.className = 'no-lyrics-message';
        noLyricsMsg.textContent = '纯音乐，无歌词';
        lyricsContainerCurrent.appendChild(noLyricsMsg);
        return;
    }
    
    // 创建文档片段
    const fragment = document.createDocumentFragment();
    
    // 创建歌词元素
    songInfo.lyrics.forEach((lyric, index) => {
        const lyricItem = document.createElement('div');
        lyricItem.className = 'lyrics-item';
        lyricItem.id = `lyric-${index}`;
        
        // 设置时间属性用于高亮和点击跳转
        if (lyric.time !== undefined) {
            lyricItem.dataset.time = lyric.time;
            lyricItem.style.cursor = 'pointer';
            // 不再添加单独的点击事件，依赖事件委托处理
        }
        
        // 检查是否为双语歌词
        if (lyric.original && lyric.translation) {
            // 创建原文元素
            const originalText = document.createElement('div');
            originalText.className = 'lyrics-original';
            originalText.textContent = lyric.original;
            lyricItem.appendChild(originalText);
            
            // 创建翻译元素
            const translationText = document.createElement('div');
            translationText.className = 'lyrics-translation';
            translationText.textContent = lyric.translation;
            lyricItem.appendChild(translationText);
        } else if (lyric.text) {
            // 普通歌词
            lyricItem.textContent = lyric.text;
        }
        
        fragment.appendChild(lyricItem);
    });
    
    // 一次性添加所有歌词
    lyricsContainerCurrent.appendChild(fragment);
    
    // 确保歌词点击处理器已设置
    setupLyricClickHandler();
}

// 新增：歌词高亮更新函数
function updateLyricHighlight(newLyricIndex) {
    const lyricsContainer = document.getElementById('lyrics-container');
    if (!lyricsContainer) return;
    
    // 如果索引没变，不需要更新
    if (newLyricIndex === currentLyricIndex) return;
    
    // 移除之前的高亮
    if (currentLyricIndex !== -1) {
        const oldLyric = document.getElementById(`lyric-${currentLyricIndex}`);
        if (oldLyric) {
            oldLyric.classList.remove('active');
        }
    }
    
    // 添加新的高亮
    const newLyric = document.getElementById(`lyric-${newLyricIndex}`);
    if (newLyric) {
        newLyric.classList.add('active');
        
        // 滚动到当前歌词
        lyricsContainer.scrollTop = newLyric.offsetTop - lyricsContainer.offsetHeight/2 + newLyric.offsetHeight/2;
    }
    
    // 更新当前索引
    currentLyricIndex = newLyricIndex;
}

// 新增：设置全局歌词点击处理器（使用事件委托）
function setupLyricClickHandler() {
    if (!audioPlayer) {
        audioPlayer = document.getElementById('global-music-player');
        if (!audioPlayer) return;
    }
    
    // 确保audioElement已初始化
    if (!audioElement && audioPlayer.contentWindow && audioPlayer.contentWindow.document) {
        audioElement = audioPlayer.contentWindow.document.getElementById('bgMusic');
        if (!audioElement) return;
    }
    
    // 移除旧的事件处理器（如果有）
    if (lyricClickHandler) {
        document.removeEventListener('click', lyricClickHandler, true);
    }
    
    // 创建新的事件处理函数 - 直接处理点击事件
    lyricClickHandler = function(event) {
        // 检查点击的是否是歌词元素或其子元素
        let target = event.target;
        
        // 如果点击的是歌词内的子元素(如翻译文本)，向上查找到lyrics-item
        while (target && !target.classList.contains('lyrics-item') && target !== document.body) {
            target = target.parentElement;
        }
        
        // 如果找到了lyrics-item元素且有时间数据
        if (target && target.classList.contains('lyrics-item') && target.dataset.time) {
            const clickTime = parseFloat(target.dataset.time);
            if (!isNaN(clickTime)) {
                // 使用浏览器原生API，更快速设置
                requestAnimationFrame(() => {
                    // 保存当前播放状态
                    const wasPlaying = !audioElement.paused;
                    
                    // 立即跳转到指定时间
                    audioElement.currentTime = clickTime;
                    
                    // 如果之前是播放状态，确保继续播放
                    if (wasPlaying) {
                        const playPromise = audioElement.play();
                        if (playPromise) {
                            playPromise.catch(error => {
                                console.error('歌词点击后播放失败:', error);
                            });
                        }
                    }
                    
                    // 获取被点击歌词的索引并立即高亮
                    const lyricId = target.id;
                    if (lyricId && lyricId.startsWith('lyric-')) {
                        const newIndex = parseInt(lyricId.split('-')[1]);
                        if (!isNaN(newIndex)) {
                            // 立即更新高亮
                            updateLyricHighlight(newIndex);
                        }
                    }
                });
                
                // 阻止事件冒泡和默认行为
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };
    
    // 使用事件捕获阶段，提高响应速度
    document.addEventListener('click', lyricClickHandler, true);
}

// 全局视图切换函数
window.toggleView = function() {
    console.log('全局toggleView被调用');
    // 在SPA环境中重新获取元素，避免引用丢失
    const visualizationContainer = document.getElementById('visualization-container');
    const albumContainer = document.getElementById('album-container');
    if (!visualizationContainer || !albumContainer) {
        console.error('切换视图失败：找不到必要的容器元素');
        return;
    }
    toggleViewInternal();
};

// 加载音乐信息
async function loadMusicInfo() {
    try {
        console.log('开始加载音乐信息...');
        // 尝试多个可能的路径
        const possiblePaths = [
            '/src/data/music-info.json',
            '../../src/data/music-info.json',
            './src/data/music-info.json',
            '../data/music-info.json'
        ];
        
        let loaded = false;
        
        for (const path of possiblePaths) {
            try {
                console.log('尝试从路径加载:', path);
                const response = await fetch(path);
                if (response.ok) {
                    musicInfo = await response.json();
                    console.log('成功加载音乐信息:', path);
                    loaded = true;
                    break;
                }
            } catch (e) {
                console.warn(`路径 ${path} 加载失败:`, e);
            }
        }
        
        if (!loaded) {
            console.error('所有路径都无法加载音乐信息');
            // 硬编码一些基本信息以避免完全失败
            musicInfo = [
                {
                    "name": "不要让梦醒来",
                    "artist": "泰然阿修罗",
                    "cover": "../../image/album/不要让梦醒来.png",
                    "hasLyrics": true,
                    "lyrics": []
                },
                {
                    "name": "Lumina",
                    "artist": "Wisp X/Xomu",
                    "cover": "../../image/album/Lumina.png",
                    "hasLyrics": false,
                    "lyrics": []
                },
                {
                    "name": "胧月夜",
                    "artist": "PIKASONIC",
                    "cover": "../../image/album/胧月夜.png",
                    "hasLyrics": true,
                    "lyrics": []
                },
                {
                    "name": "Dragonflame",
                    "artist": "Kirara Magic",
                    "cover": "../../image/album/Dragonflame.png",
                    "hasLyrics": false,
                    "lyrics": []
                },
                {
                    "name": "Running Up That Hill",
                    "artist": "Kate Bush",
                    "cover": "../../image/album/Running Up That Hill.png",
                    "hasLyrics": true,
                    "lyrics": []
                },
                {
                    "name": "Over the New World",
                    "artist": "WOW sound",
                    "cover": "../../image/album/Over the New World.png",
                    "hasLyrics": false,
                    "lyrics": []
                }
            ];
        }
        
        console.log('最终加载的音乐信息:', musicInfo);
    } catch (error) {
        console.error('加载音乐信息失败:', error);
    }
}

// 暴露给全局
window.updateLyrics = updateLyrics;

// 修改初始化函数，处理音频加载
async function initializeMusicPlayerAndVisualizer() {
    // 获取全局播放器和音频元素
    audioPlayer = document.getElementById('global-music-player');
    if (!audioPlayer) {
        console.error('找不到全局音乐播放器');
        return;
    }
    
    // 等待iframe加载完成
    try {
        await new Promise((resolve, reject) => {
            if (audioPlayer.contentWindow && audioPlayer.contentWindow.document.readyState === 'complete') {
                resolve();
            } else {
                audioPlayer.addEventListener('load', resolve);
                // 添加5秒超时
                setTimeout(() => reject(new Error('加载iframe超时')), 5000);
            }
        });
        
        // 尝试通过window.getAudioElement获取
        if (audioPlayer.contentWindow.getAudioElement) {
            audioElement = audioPlayer.contentWindow.getAudioElement();
        } else {
            // 回退到DOM查询
            audioElement = audioPlayer.contentWindow.document.getElementById('bgMusic');
        }
        
        if (!audioElement) {
            console.error('无法获取音频元素');
            return;
        }
        
        // 等待音频元素就绪
        if (audioElement.readyState < 2) {
            await new Promise(resolve => {
                audioElement.addEventListener('loadeddata', resolve, { once: true });
                // 如果加载时间过长，设置3秒超时
                setTimeout(resolve, 3000);
            });
        }
        
        isAudioInitialized = true;
        
        // 确保音乐信息已加载
        if (musicInfo.length === 0) {
            await loadMusicInfo();
        }
        
        // 创建可视化器
        const container = document.getElementById('visualization-container');
        if (container) {
            visualizer = new AudioVisualizer('visualization-container', false);
            await visualizer.init(audioElement);
            
            // 监听播放状态变化
            audioElement.addEventListener('play', () => {
                if (visualizer) visualizer.resume();
                if (albumVisualizer && currentView === 1) albumVisualizer.resume();
            });
            
            audioElement.addEventListener('pause', () => {
                if (visualizer) visualizer.pause();
                if (albumVisualizer) albumVisualizer.pause();
            });
        }
        
        // 设置歌词点击处理
        setupLyricClickHandler();
        
        // 初始更新专辑视图
        if (currentView === 1) {
            updateAlbumViewFromPlayer();
        }
        
        console.log('音频和可视化初始化完成');
    } catch (error) {
        console.error('初始化音频和可视化时出错:', error);
    }
}

// 清理函数，确保在页面卸载时释放资源
function cleanupResources() {
    console.log('清理资源');
    
    // 清理定时器
    if (window.albumUpdateInterval) {
        clearInterval(window.albumUpdateInterval);
        window.albumUpdateInterval = null;
    }
    
    // 清理专辑可视化效果
    if (albumVisualizer) {
        albumVisualizer.cleanup();
        albumVisualizer = null;
    }
    
    // 清理音谱可视化
    if (visualizer && visualizer.cleanup) {
        visualizer.cleanup();
        visualizer = null;
    }
    
    // 清理动画帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// 监听页面卸载事件
window.addEventListener('beforeunload', cleanupResources);
window.addEventListener('pagehide', cleanupResources);

// 主入口点：在文档加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM加载完成，开始初始化音乐可视化模块');
        
        // 1. 加载音乐信息
        await loadMusicInfo();
        
        // 2. 初始化音乐播放器和可视化器
        await initializeMusicPlayerAndVisualizer();
        
        // 3. 确保切换视图功能可用
        window.toggleView = toggleViewInternal;
        
        // 4. 绑定导航按钮事件
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn && nextBtn) {
            // 移除可能存在的旧事件监听器
            const newPrevBtn = prevBtn.cloneNode(true);
            const newNextBtn = nextBtn.cloneNode(true);
            
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            // 添加新的事件监听器
            newPrevBtn.addEventListener('click', toggleViewInternal);
            newNextBtn.addEventListener('click', toggleViewInternal);
            
            console.log('导航按钮事件绑定完成');
        }
        
        // 5. 设置清理函数
        window.addEventListener('beforeunload', cleanupResources);
        
        console.log('音乐可视化模块初始化完成');
    } catch (error) {
        console.error('初始化音乐可视化模块时出错:', error);
    }
});

// 浏览器后退前进按钮处理
window.addEventListener('popstate', () => {
    if (window.location.hash !== '#music' && currentView === 1) {
        // 如果导航离开音乐页面且当前是专辑视图，清理资源
        cleanupResources();
    }
});

// 添加全局函数，可以从控制台调用
window.switchToAlbumView = function() {
    if (currentView === 0) {
        toggleViewInternal();
    }
};

window.switchToVisualizerView = function() {
    if (currentView === 1) {
        toggleViewInternal();
    }
};

window.refreshAlbumView = function() {
    if (window.forceUpdateAlbumView) {
        window.forceUpdateAlbumView();
    }
}; 