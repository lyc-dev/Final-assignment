class AudioController {
  constructor() {
    this.audio = document.getElementById('bgMusic');
    this.isForcePlayInProgress = false;  // 添加标志以防止循环
    this.songs = [
      { path: '../../music/不要让梦醒来.mp3', name: '不要让梦醒来' },
      { path: '../../music/Lumina.mp3', name: 'Lumina' },                    
      { path: '../../music/胧月夜.mp3', name: '胧月夜' },
      { path: '../../music/Dragonflame.mp3', name: 'Dragonflame' },
      { path: '../../music/Running Up That Hill.mp3', name: 'Running Up That Hill' },
      { path: '../../music/Over the New World.mp3', name: 'Over the New World' }
    ];
    this.currentSongIndex = 0;
    
    // 获取UI元素
    this.prevButton = document.getElementById('prevSong');
    this.nextButton = document.getElementById('nextSong');
    this.songNameElement = document.getElementById('currentSong');
    this.playPauseBtn = document.getElementById('play-pause');
    this.volumeBtn = document.getElementById('volume-btn');
    this.progressContainer = document.getElementById('progress-container');
    this.progressBar = document.getElementById('progress-bar');
    this.timeDisplay = document.getElementById('time');
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumePercentage = document.getElementById('volume-percentage');
    
    this.isPlaying = false;
    this.isMuted = false;
    this.userInteracted = false;
    
    this.initializeAudio();
    this.setupBuffering();
    this.setupEventListeners();
    this.setupSongControls();
    this.setupCustomPlayerControls();
    
    // 将当前歌曲名称添加到全局变量，确保父窗口能够访问
    window.currentPlayingSong = this.songs[this.currentSongIndex].name;
    
    // 监听用户交互
    this.setupUserInteractionListeners();
    
    // 延迟执行第一次播放，避免与事件监听冲突
    setTimeout(() => {
      // 检查浏览器是否支持AudioContext
      const audioContext = window.AudioContext || window.webkitAudioContext;
      if (audioContext) {
        // 创建全局音频上下文
        if (!window.globalAudioContext) {
          window.globalAudioContext = new audioContext();
        }
        
        // 尝试自动播放
        this.forcePlay();
      }
    }, 300);
  }
  
  // 添加用户交互监听
  setupUserInteractionListeners() {
    const markUserInteracted = () => {
      this.userInteracted = true;
      
      // 尝试播放音频
      if (this.audio.paused) {
        this.forcePlay();
      }
      
      // 在本地存储中记录用户已交互状态，这样页面刷新后也能保持
      try {
        localStorage.setItem('userHasInteracted', 'true');
      } catch (e) {
        console.warn('无法设置localStorage:', e);
      }
    };
    
    // 检查是否已经有过交互
    try {
      if (localStorage.getItem('userHasInteracted') === 'true') {
        this.userInteracted = true;
        console.log('从localStorage恢复用户交互状态');
      }
    } catch (e) {
      console.warn('无法读取localStorage:', e);
    }
    
    // 所有可能的用户交互事件
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'];
    
    // 监听所有交互事件
    interactionEvents.forEach(event => {
      document.addEventListener(event, markUserInteracted, { once: true });
      
      // 尝试添加到父页面
      try {
        window.parent.document.addEventListener(event, markUserInteracted, { once: true });
      } catch (e) {
        // 忽略父窗口访问错误
      }
    });
    
    // 按钮点击也要标记为交互
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.userInteracted = true;
      });
    }
    
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => {
        this.userInteracted = true;
      });
    }
    
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => {
        this.userInteracted = true;
      });
    }
  }
  
  setupCustomPlayerControls() {
    // 播放/暂停按钮事件
    this.playPauseBtn.addEventListener('click', () => {
      // 记录点击播放按钮为用户交互
      this.userInteracted = true;
      
      if (this.isPlaying) {
        this.audio.pause();
        this.playPauseBtn.textContent = '▶';
      } else {
        // 尝试播放
        const playPromise = this.audio.play();
        
        // 处理播放Promise
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // 播放成功
            this.playPauseBtn.textContent = '⏸';
            console.log('通过按钮成功播放音频');
          }).catch(error => {
            // 播放失败，回退到原状态
            this.playPauseBtn.textContent = '▶';
            console.error('通过按钮播放失败:', error);
            
            // 可以尝试使用forcePlay
            setTimeout(() => this.forcePlay(), 100);
          });
        }
      }
      this.isPlaying = !this.isPlaying;
    });
    
    // 音量按钮事件
    this.volumeBtn.addEventListener('click', () => {
      if (this.isMuted) {
        this.audio.volume = 0.5;
        this.volumeBtn.textContent = '🔊';
        this.volumePercentage.style.width = '100%';
      } else {
        this.audio.volume = 0;
        this.volumeBtn.textContent = '🔇';
        this.volumePercentage.style.width = '0%';
      }
      this.isMuted = !this.isMuted;
    });
    
    // 进度条事件
    this.progressContainer.addEventListener('click', (e) => {
      // 记录当前播放状态
      const wasPlaying = !this.audio.paused;
      
      const progressWidth = this.progressContainer.clientWidth;
      const clickPosition = e.offsetX;
      const clickPercentage = (clickPosition / progressWidth);
      this.audio.currentTime = clickPercentage * this.audio.duration;
      
      // 如果之前是播放状态，确保继续播放
      if (wasPlaying) {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('进度条点击后播放失败:', error);
          });
        }
      }
    });
    
    // 音量滑块事件
    this.volumeSlider.addEventListener('click', (e) => {
      const sliderWidth = this.volumeSlider.clientWidth;
      const clickPosition = e.offsetX;
      const volume = clickPosition / sliderWidth;
      this.audio.volume = volume;
      this.volumePercentage.style.width = `${volume * 100}%`;
      if (volume === 0) {
        this.volumeBtn.textContent = '🔇';
        this.isMuted = true;
      } else {
        this.volumeBtn.textContent = '🔊';
        this.isMuted = false;
      }
    });
    
    // 更新进度条和时间显示
    this.audio.addEventListener('timeupdate', () => {
      const currentTime = this.audio.currentTime;
      const duration = this.audio.duration || 0;
      const progressPercent = (currentTime / duration) * 100;
      this.progressBar.style.width = `${progressPercent}%`;
      
      // 格式化时间显示
      const currentMinutes = Math.floor(currentTime / 60);
      const currentSeconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
      const durationMinutes = Math.floor(duration / 60);
      const durationSeconds = Math.floor(duration % 60).toString().padStart(2, '0');
      
      this.timeDisplay.textContent = `${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`;
    });
    
    // 播放状态变化
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playPauseBtn.textContent = '⏸';
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.playPauseBtn.textContent = '▶';
    });
  }

  setupSongControls() {
    this.prevButton.addEventListener('click', () => {
      this.changeSong(-1);
    });
    
    this.nextButton.addEventListener('click', () => {
      this.changeSong(1);
    });
  }
  
  changeSong(direction) {
    // 记录当前歌曲索引，以便知道切换到哪首歌
    const previousIndex = this.currentSongIndex;
    this.currentSongIndex = (this.currentSongIndex + direction + this.songs.length) % this.songs.length;
    const song = this.songs[this.currentSongIndex];
    console.log('切换歌曲:', song.name);
    
    // 记录切换前的播放状态
    const wasPlaying = !this.audio.paused;
    
    // 尝试在播放前预加载下一首歌的封面 - 优化点1：预加载资源
    const nextSong = this.songs[(this.currentSongIndex + 1) % this.songs.length];
    this.preloadNextSongCover(nextSong.name);
    
    // 更新歌曲源和UI
    this.audio.src = song.path;
    this.songNameElement.textContent = song.name;
    
    // 更新全局变量
    window.currentPlayingSong = song.name;
    
    // 立即触发父窗口专辑视图更新 - 优化点2：最高优先级立即更新
    this.updateParentAlbumViewImmediately(song.name);
    
    // 记录切换歌曲的动作为用户交互，确保后续可以自动播放
    this.userInteracted = true;
    
    // 强制实现切换后自动播放
    const playNewSong = () => {
      // 确保音频已经加载到可以播放的状态
      if (this.audio.readyState >= 2) {
        console.log('歌曲已加载，尝试播放');
        
        // 使用直接播放方式，避免Promise带来的复杂性
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.playPauseBtn.textContent = '⏸';
          console.log('成功播放新歌曲');
        }).catch(error => {
          console.error('播放失败，尝试应用兼容模式:', error);
          
          // 特殊情况处理：在某些浏览器环境下可能需要用户再次交互
          // 在UI上显示提示或自动触发播放按钮点击
          setTimeout(() => {
            if (this.audio.paused && wasPlaying) {
              console.log('模拟播放按钮点击');
              this.playPauseBtn.click();
            }
          }, 100);
        });
      } else {
        console.log('歌曲未完全加载，等待加载');
      }
    };
    
    // 处理音频加载和播放逻辑
    if (this.audio.readyState >= 2) {
      // 已加载完成，直接播放
      if (wasPlaying || this.userInteracted) {
        playNewSong();
      }
    } else {
      // 等待加载完成后播放
      const loadHandler = () => {
        this.audio.removeEventListener('loadeddata', loadHandler);
        if (wasPlaying || this.userInteracted) {
          playNewSong();
        }
      };
      
      this.audio.addEventListener('loadeddata', loadHandler, { once: true });
      
      // 添加超时处理，防止加载过久
      setTimeout(() => {
        if (this.audio.paused && (wasPlaying || this.userInteracted)) {
          console.log('加载超时，尝试强制播放');
          this.forcePlay();
        }
      }, 2000);
    }
  }

  // 新增方法：预加载下一首歌封面图片
  preloadNextSongCover(songName) {
    try {
      if (window.parent && window.parent.musicInfo) {
        const nextSongInfo = window.parent.musicInfo.find(s => s.name === songName);
        if (nextSongInfo && nextSongInfo.cover) {
          const img = new Image();
          img.src = nextSongInfo.cover + '?t=' + new Date().getTime();
          console.log('预加载下一首歌曲封面:', songName);
        }
      }
    } catch (e) {
      console.error('预加载封面失败:', e);
    }
  }

  // 优化方法：立即更新父窗口专辑视图，不依赖轮询或消息传递
  updateParentAlbumViewImmediately(songName) {
    try {
      // 1. 直接检查父窗口是否在专辑视图模式
      if (window.parent && window.parent.currentView === 1) {
        console.log('父窗口处于专辑视图，立即更新UI');
        
        // 2. 提前获取父窗口中的专辑信息
        const musicInfo = window.parent.musicInfo;
        if (!musicInfo) return;
        
        const songInfo = musicInfo.find(s => s.name === songName);
        if (!songInfo) return;
        
        // 3. 直接获取DOM元素
        const titleElement = window.parent.document.getElementById('song-title');
        const artistElement = window.parent.document.getElementById('song-artist');
        const coverElement = window.parent.document.getElementById('album-cover');
        const lyricsContainer = window.parent.document.getElementById('lyrics-container');
        
        // 4. 阻止父窗口的轮询更新，避免重复操作
        if (window.parent.lastUpdateTimestamp) {
          window.parent.lastUpdateTimestamp = new Date().getTime();
        }
        
        // 5. 立即更新DOM元素，无需等待
        if (titleElement) {
          titleElement.textContent = songInfo.name;
        }
        
        if (artistElement) {
          artistElement.textContent = songInfo.artist;
        }
        
        // 6. 预先准备歌词内容，避免后续处理延迟
        let lyricsHTML = '';
        if (lyricsContainer) {
          // 先清空现有歌词
          lyricsContainer.innerHTML = '';
          
          if (!songInfo.hasLyrics || !songInfo.lyrics || songInfo.lyrics.length === 0) {
            // 纯音乐，无歌词
            const noLyricsMsg = document.createElement('div');
            noLyricsMsg.className = 'no-lyrics-message';
            noLyricsMsg.textContent = '纯音乐，无歌词';
            lyricsContainer.innerHTML = ''; // 确保容器是空的
            lyricsContainer.appendChild(noLyricsMsg);
          } else {
            // 一次性创建所有歌词元素
            const fragment = document.createDocumentFragment();
            songInfo.lyrics.forEach((lyric, index) => {
              const lyricItem = document.createElement('div');
              lyricItem.className = 'lyrics-item';
              lyricItem.id = `lyric-${index}`;
              
              // 设置时间属性用于高亮
              if (lyric.time !== undefined) {
                lyricItem.dataset.time = lyric.time;
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
            
            // 一次性添加所有歌词元素
            lyricsContainer.appendChild(fragment);
          }
        }
        
        // 7. 在更新图片之前已经完成其他UI更新，优化用户体验
        if (coverElement) {
          // 添加时间戳避免缓存，并使用更高优先级进行加载
          const timestamp = new Date().getTime();
          const coverPath = songInfo.cover + '?t=' + timestamp;
          
          // 检查缓存状态确定是否需要淡入动画效果
          const img = new Image();
          img.onload = function() {
            // 图片加载完成后更新，配合CSS实现淡入效果
            coverElement.src = coverPath;
            coverElement.style.opacity = '1';
            console.log('封面图片加载完成:', coverPath);
          };
          img.onerror = function() {
            // 图片加载失败时使用默认封面
            coverElement.src = '/Final/image/album/default/default.png';
            coverElement.style.opacity = '1';
            console.log('封面图片加载失败，使用默认封面');
          };
          
          // 在加载期间降低透明度实现淡入效果
          coverElement.style.opacity = '0.6';
          img.src = coverPath;
        }
        
        // 8. 更新最后处理的歌曲名
        window.parent.lastUpdatedSong = songName;
        
        // 9. 发送更新完成消息通知父窗口
        window.parent.postMessage({ 
          type: 'ALBUM_UPDATE_COMPLETE', 
          song: songName,
          timestamp: new Date().getTime()
        }, '*');
        
        console.log('专辑视图立即更新完成');
      }
    } catch (e) {
      console.error('立即更新专辑视图失败:', e);
    }
  }

  async forcePlay() {
    if (this.isForcePlayInProgress) return;  // 如果正在执行则直接返回
    this.isForcePlayInProgress = true;  // 设置标志

    try {
      // 创建音频上下文
      if (!window.globalAudioContext) {
        window.globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // 确保音频上下文处于运行状态
      if (window.globalAudioContext.state !== 'running') {
        await window.globalAudioContext.resume();
      }
      
      // 确保音频已加载
      if (this.audio.readyState < 2) {
        await new Promise((resolve, reject) => {
          const loadHandler = () => {
            this.audio.removeEventListener('loadeddata', loadHandler);
            resolve();
          };
          this.audio.addEventListener('loadeddata', loadHandler);
          
          // 设置超时
          setTimeout(() => {
            this.audio.removeEventListener('loadeddata', loadHandler);
            resolve(); // 即使超时也继续尝试播放
          }, 3000);
        });
      }
      
      // 检查是否已经有用户交互
      const hasInteracted = this.userInteracted || 
                          localStorage.getItem('userHasInteracted') === 'true';
      
      if (hasInteracted) {
        console.log('用户已交互，尝试更强制的播放方式');
        // 用户已交互，可以尝试更直接的播放方式
        
        // 尝试直接播放
        const playResult = await this.audio.play()
          .catch(async error => {
            console.log('直接播放失败，尝试备用策略:', error);
            
            // 备用策略1：先暂停再播放
            this.audio.pause();
            await new Promise(resolve => setTimeout(resolve, 10));
            return this.audio.play().catch(e => {
              console.log('备用策略1失败:', e);
              
              // 备用策略2：模拟用户点击
              setTimeout(() => {
                if (this.audio.paused) {
                  this.playPauseBtn.click();
                }
              }, 100);
              
              return Promise.reject(e);
            });
          });
        
        if (playResult !== undefined) {
          // 播放成功
          this.isPlaying = true;
          this.playPauseBtn.textContent = '⏸';
          this.audio.volume = 0.5;
          this.volumePercentage.style.width = '100%';
          console.log('强制播放成功');
        }
      } else {
        // 用户尚未交互，使用原始策略
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // 播放成功
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸';
            
            // 设置音量
            this.audio.volume = 0.5;
            this.volumePercentage.style.width = '100%';
            
            // 不启用循环播放，改为歌曲播放完切换到下一首
            this.audio.loop = false;
            
            console.log('音频播放成功');
          }).catch(error => {
            console.log('自动播放被阻止:', error);
            
            if (!this.userInteracted) {
              // 如果用户尚未交互，等待用户交互
              console.log('等待用户交互后再次尝试播放');
              this.setupDelayedPlayback();
            }
          });
        }
      }
    } catch (error) {
      console.error('播放失败:', error);
      this.setupDelayedPlayback();
    } finally {
      this.isForcePlayInProgress = false;  // 重置标志
    }
  }
  
  setupDelayedPlayback() {
    // 确保只添加一次事件监听
    const playbackAttempt = async () => {
      try {
        if (this.audio.paused) {
          await this.audio.play();
          this.isPlaying = true;
          this.playPauseBtn.textContent = '⏸';
        }
        
        // 移除所有事件监听器
        document.removeEventListener('click', playbackAttempt);
        document.removeEventListener('touchstart', playbackAttempt);
        document.removeEventListener('keydown', playbackAttempt);
        
        try {
          window.parent.document.removeEventListener('click', playbackAttempt);
          window.parent.document.removeEventListener('touchstart', playbackAttempt);
          window.parent.document.removeEventListener('keydown', playbackAttempt);
        } catch (e) {
          // 忽略父窗口访问错误
        }
      } catch (e) {
        console.error('延迟播放尝试失败:', e);
      }
    };
    
    // 添加多个事件监听以提高自动播放成功率
    document.addEventListener('click', playbackAttempt);
    document.addEventListener('touchstart', playbackAttempt);
    document.addEventListener('keydown', playbackAttempt);
    
    try {
      window.parent.document.addEventListener('click', playbackAttempt);
      window.parent.document.addEventListener('touchstart', playbackAttempt);
      window.parent.document.addEventListener('keydown', playbackAttempt);
    } catch (e) {
      // 忽略父窗口访问错误
    }
  }

  initializeAudio() {
    this.audio.volume = 0.5;
    this.audio.currentTime = 0;
  }

  setupBuffering() {
    this.audio.preload = "auto";
    this.audio.addEventListener('waiting', () => {
      console.log('Buffering...');
    });

    // 修改 canplay 事件处理
    let canPlayTimeout;
    this.audio.addEventListener('canplay', () => {
      console.log('Can play...');
      // 清除之前的定时器
      clearTimeout(canPlayTimeout);
      // 添加新的定时器，避免频繁触发
      canPlayTimeout = setTimeout(() => {
        if (!this.audio.paused) return; // 如果已经在播放则不需要重新开始
        this.forcePlay();
      }, 200);
    });
  }

  setupEventListeners() {
    let visibilityTimeout;
    // 页面可见性变化时的处理
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 清除之前的定时器
        clearTimeout(visibilityTimeout);
        // 添加新的定时器，避免频繁触发
        visibilityTimeout = setTimeout(() => {
          if (!this.audio.paused) return; // 如果已经在播放则不需要重新开始
          this.forcePlay();
        }, 200);
      }
    });

    // 音频结束时自动播放下一首
    this.audio.addEventListener('ended', () => {
      // 不循环单曲，改为播放下一首
      this.audio.loop = false;
      this.changeSong(1);
    });

    // 添加歌曲加载完成时的处理，确保封面和歌词已更新
    this.audio.addEventListener('loadeddata', () => {
      const song = this.songs[this.currentSongIndex];
      console.log('歌曲加载完成:', song.name);
      this.notifyParentSongChanged(song);
    });
    
    // 添加播放状态变化监听，确保状态同步
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playPauseBtn.textContent = '⏸';
      const song = this.songs[this.currentSongIndex];
      this.notifyParentSongChanged(song);
      console.log('音频开始播放');
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.playPauseBtn.textContent = '▶';
      console.log('音频暂停');
    });
    
    // 处理播放错误
    this.audio.addEventListener('error', (e) => {
      console.error('音频播放错误:', e);
      this.isPlaying = false;
      this.playPauseBtn.textContent = '▶';
      
      // 尝试重新加载
      setTimeout(() => {
        this.audio.load();
      }, 1000);
    });
    
    // 添加定时器定期同步歌曲信息（每3秒）
    setInterval(() => {
      if (this.isPlaying) {
        const song = this.songs[this.currentSongIndex];
        this.notifyParentSongChanged(song);
      }
    }, 3000);
  }

  getAudioElement() {
    return this.audio;
  }

  getMusicPlayerState() {
    return {
      currentTime: this.audio.currentTime,
      volume: this.audio.volume,
      isPlaying: !this.audio.paused,
      currentSong: this.songs[this.currentSongIndex].name
    };
  }

  // 添加缺失的notifyParentSongChanged方法
  notifyParentSongChanged(song) {
    try {
      // 检查父窗口是否在专辑视图模式
      if (window.parent && window.parent.currentView === 1) {
        // 使用新的立即更新方法，确保更新及时
        this.updateParentAlbumViewImmediately(song.name);
      }
    } catch (e) {
      console.error('通知父窗口歌曲变化失败:', e);
    }
  }
}

// 确保只创建一个控制器实例
window.audioController = window.audioController || new AudioController();

// 提供给父窗口的方法
window.getMusicPlayerState = function() {
  return window.audioController.getMusicPlayerState();
};

window.getAudioElement = function() {
  return window.audioController.getAudioElement();
};

// 添加一个直接获取当前歌曲名称的方法
window.getCurrentSongName = function() {
  return window.currentPlayingSong || window.audioController.songs[window.audioController.currentSongIndex].name;
};

// 确保contentDocument可以被父窗口访问
document.domain = document.domain; 