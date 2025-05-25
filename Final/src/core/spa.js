// spa.js
import { initializePageModules, cleanupPageModules } from './core.js';

const routes = {
    home: 'home',
    pie: '/Final/src/html/pie.html',
    map: '/Final/src/html/map.html',
    relation: '/Final/src/html/relation.html',
    music: '/Final/src/html/music.html'
};

let currentHash = '';
let contentCache = {};
let isTransitioning = false;

// 导出 SPA 核心功能
export async function initSPA() {
    // 包装初始内容
    const spaContent = document.getElementById('spa-content');
    const initialContent = spaContent.innerHTML;
    
    // 保存初始内容到缓存中用于返回首页
    contentCache.home = initialContent;
    
    // 包装初始内容到页面容器中
    spaContent.innerHTML = wrapContent(initialContent, 'page-initial');
    
    // 设置初始页面的body类
    document.body.classList.add('page-home');
    
    // 立即初始化音频上下文
    if (!window.globalAudioContext) {
        window.globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
       
    bindLinks();
    if (location.hash && location.hash !== '#home') {
        loadPage(location.hash, 'next');
    }
    
    // 标记SPA已初始化完成
    window.spaInitialized = true;
    
    // 触发自定义事件通知其他模块
    window.dispatchEvent(new CustomEvent('spaInitialized'));
}

function wrapContent(content, id) {
    return `<div class="page-container" id="${id}">${content}</div>`;
}

async function initMiniVisualizer() {
    try {
        const audioPlayer = document.getElementById('global-music-player');
        if (!audioPlayer) return;

        // 等待 iframe 加载完成
        await new Promise(resolve => {
            if (audioPlayer.contentWindow.document.readyState === 'complete') {
                resolve();
            } else {
                audioPlayer.addEventListener('load', resolve);
            }
        });

        const audioElement = audioPlayer.contentWindow.document.querySelector('audio');
        if (!audioElement) {
            console.error('Audio element not found in iframe');
            return;
        }

        // 确保 mini-visualizer 容器存在
        let container = document.getElementById('mini-visualizer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mini-visualizer';
            container.className = 'mini-visualizer';
            document.body.insertBefore(container, document.body.firstChild);
        }

        if (!window.miniVisualizer) {
            window.miniVisualizer = new AudioVisualizer('mini-visualizer', true);
            try {
                await window.miniVisualizer.init(audioElement);
            } catch (error) {
                console.error('Failed to initialize mini visualizer:', error);
            }
        }
    } catch (error) {
        console.error('Error in initMiniVisualizer:', error);
    }
}

async function loadPage(hash, direction = 'next') {
    if (isTransitioning) return;
    isTransitioning = true;
    
    let page = (hash || location.hash || '#home').replace('#', '');
    if (!routes[page]) page = 'home';

    // 更新body类，用于控制不同页面的样式
    document.body.className = ''; // 清除所有类
    document.body.classList.add(`page-${page}`); // 添加页面特定类
    document.body.classList.toggle('music-page', page === 'music');
    
    // 控制背景地图的显示和隐藏
    const eduMapBg = document.getElementById('edu-map-bg-fixed');
    if (eduMapBg) {
        // 仅在首页显示背景小地图，其他页面隐藏
        if (page === 'home') {
            eduMapBg.style.display = 'block';
        } else {
            eduMapBg.style.display = 'none';
        }
    }
    
    // 为音乐页面添加特殊处理
    if (page === 'music') {
        // 确保添加正确的类名便于键盘事件检测
        document.body.classList.add('page-music');
    }
    
    // 避免重复加载同一页面
    if (currentHash === hash) {
        isTransitioning = false;
        return;
    }

    // 创建过渡遮罩
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    document.body.appendChild(transition);
    
    // 保存音频状态
    const audioPlayer = document.getElementById('global-music-player');
    let musicState = null;
    try {
        if (audioPlayer?.contentWindow?.getMusicPlayerState) {
            musicState = audioPlayer.contentWindow.getMusicPlayerState();
        }
    } catch (e) {
        console.warn('获取音频状态失败:', e);
    }

    // 获取当前页面容器
    const spaContent = document.getElementById('spa-content');
    const currentPage = spaContent.querySelector('.page-container');
    if (currentPage) {
        currentPage.className = 'page-container current';
    }

    // 准备新页面内容
    let content;
    const newPageId = `page-${Math.random().toString(36).substr(2, 9)}`;

    if (page === 'home') {
        if (contentCache.home) {
            content = contentCache.home;
        } else {
            // 不再从index.html加载内容，而是使用初始化时保存的内容
            const initialContainer = document.getElementById('page-initial');
            if (initialContainer) {
                // 确保提取内容时不包含多余的container元素
                const container = initialContainer.querySelector('.container');
                if (container) {
                    content = container.outerHTML;
                } else {
                    content = initialContainer.innerHTML;
                }
            } else {
                // 备用方案：从页面中获取初始内容
                const container = document.querySelector('.container');
                content = container ? container.outerHTML : '';
            }
            contentCache.home = content;
        }
    } else {
        if (contentCache[page]) {
            content = contentCache[page];
        } else {
            const response = await fetch(routes[page]);
            content = await response.text();
            contentCache[page] = content;
        }
    }

    // 创建新页面容器
    const newPage = document.createElement('div');
    newPage.className = `page-container ${direction}`;
    newPage.id = newPageId;
    newPage.innerHTML = content;
    
    // 添加新页面到DOM
    spaContent.appendChild(newPage);
    
    // 触发reflow以确保过渡效果生效
    newPage.offsetHeight;
    transition.classList.add('active');

    // 执行过渡动画
    requestAnimationFrame(() => {
        if (currentPage) {
            currentPage.className = `page-container ${direction === 'next' ? 'prev' : 'next'}`;
        }
        newPage.className = 'page-container current';
    });

    // 过渡结束后清理和初始化
    setTimeout(async () => {
        if (currentPage) {
            currentPage.remove();
        }
        transition.remove();
        currentHash = hash;
        isTransitioning = false;

        // 恢复音频状态
        if (musicState) {
            try {
                if (audioPlayer?.contentWindow?.setMusicPlayerState) {
                    audioPlayer.contentWindow.setMusicPlayerState(musicState);
                }
            } catch (e) {
                console.warn('恢复音频状态失败:', e);
            }
        }

        // 初始化新页面模块
        await initializePageModules(page);
        
        // 在音乐页面中初始化全屏可视化
        if (page === 'music') {
            try {
                const audioPlayer = document.getElementById('global-music-player');
                if (audioPlayer?.contentWindow) {
                    // 等待 iframe 加载完成
                    await new Promise(resolve => {
                        if (audioPlayer.contentWindow.document.readyState === 'complete') {
                            resolve();
                        } else {
                            audioPlayer.addEventListener('load', resolve);
                        }
                    });

                    const audioElement = audioPlayer.contentWindow.document.querySelector('audio');
                    if (audioElement && !window.fullVisualizer) {
                        // 确保可视化容器存在
                        let container = document.getElementById('visualization-container');
                        if (!container) {
                            container = document.createElement('div');
                            container.id = 'visualization-container';
                            document.querySelector('.page-container.current').appendChild(container);
                        }

                        window.fullVisualizer = new AudioVisualizer('visualization-container', false);
                        try {
                            await window.fullVisualizer.init(audioElement);
                        } catch (error) {
                            console.error('Failed to initialize full visualizer:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize full visualizer:', error);
            }
        } else {
            // 离开音乐页面时清理全屏可视化
            if (window.fullVisualizer) {
                window.fullVisualizer.cleanup();
                window.fullVisualizer = null;
            }
            // 清理其他页面模块
            cleanupPageModules(page);
        }
        
        bindLinks();
    }, 600);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function bindLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.onclick = function(e) {
            e.preventDefault();
            const hash = this.getAttribute('href');
            if (location.hash !== hash) {
                const direction = hash === '#home' ? 'prev' : 'next';
                history.pushState(null, '', hash);
                loadPage(hash, direction);
            }
        };
    });
}

// 监听浏览器前进后退
window.addEventListener('popstate', (e) => {
    const direction = e.state?.direction || 
        (currentHash === '#home' || !currentHash ? 'next' : 'prev');
    loadPage(location.hash, direction);
});

// 绑定Backspace键返回首页
window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        // 防止在输入框内触发
        e.preventDefault();
        if (location.hash !== '#home') {
            history.pushState(null, '', '#home');
            loadPage('#home', 'prev');
            // 自动滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// 初始化调用
window.addEventListener('DOMContentLoaded', initSPA);

