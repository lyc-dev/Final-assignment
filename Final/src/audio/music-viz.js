class AudioVisualizer {
    constructor(containerId, isMini = false) {
        this.containerId = containerId;
        this.isMini = isMini;
        this.isInitialized = false;
        this.audioContext = null;
        this.analyser = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.dataArray = null;
        this.animationId = null;
        this.source = null;
        this.lastDrawTime = 0;
        this.smoothingFactor = 0.3;
        this.previousBarHeights = [];
        this.isPaused = false;
    }

    async init(audioElement) {
        if (this.isInitialized) {
            this.cleanup();
        }

        try {
            // 尝试获取或创建全局音频上下文
            if (!window.globalAudioContext) {
                window.globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // 确保音频上下文处于运行状态
            if (window.globalAudioContext.state !== 'running') {
                await window.globalAudioContext.resume();
            }
            
            this.audioContext = window.globalAudioContext;

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isMini ? 64 : 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // 处理音频源连接
            if (!audioElement.audioSource) {
                audioElement.audioSource = this.audioContext.createMediaElementSource(audioElement);
            }
            this.source = audioElement.audioSource;

            // 连接节点
            this.source.connect(this.analyser);
            if (!audioElement.isConnectedToDestination) {
                this.source.connect(this.audioContext.destination);
                audioElement.isConnectedToDestination = true;
            }

            // 创建和设置画布
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`Container ${this.containerId} not found`);
                return;
            }

            this.canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(this.canvas);
            this.canvasCtx = this.canvas.getContext('2d');

            // 设置画布大小
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            this.isInitialized = true;
            this.draw();

            // 设置自动更新
            if (!this.isMini) {
                this.startAutoUpdate();
            }
        } catch (error) {
            console.error('Failed to initialize audio visualizer:', error);
            throw error;
        }
    }

    startAutoUpdate() {
        const update = () => {
            if (this.isInitialized) {
                this.resizeCanvas();
            }
        };
        setInterval(update, 1000); // 每秒更新一次
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = this.isMini ? 50 : rect.height;
    }

    draw() {
        if (!this.isInitialized || this.isPaused) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = this.isMini ? 3 : 4;  // 增加柱状宽度
        const gap = this.isMini ? 1 : 2;
        const barCount = Math.floor(width / (barWidth + gap));

        this.analyser.getByteFrequencyData(this.dataArray);
        this.canvasCtx.clearRect(0, 0, width, height);

        // 创建动态渐变色
        let gradient;
        if (this.isMini) {
            gradient = this.canvasCtx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgba(41, 98, 255, 0.7)');
            gradient.addColorStop(0.5, 'rgba(41, 198, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(41, 98, 255, 0.7)');
        } else {
            gradient = this.canvasCtx.createLinearGradient(0, height, width, 0);
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.33, '#00ffff');
            gradient.addColorStop(0.66, '#ffff00');
            gradient.addColorStop(1, '#00ff99');
        }

        this.canvasCtx.fillStyle = gradient;

        // 初始化previousBarHeights数组
        if (!this.previousBarHeights.length) {
            this.previousBarHeights = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * this.dataArray.length / barCount);
            const value = this.dataArray[dataIndex];
            
            // 应用平滑过渡
            let barHeight = (value / 255.0) * height;
            barHeight = this.previousBarHeights[i] * this.smoothingFactor + 
                       barHeight * (1 - this.smoothingFactor);
            this.previousBarHeights[i] = barHeight;

            if (this.isMini) {
                // 迷你模式：从中间向两边对称，更平滑的曲线
                const x = width / 2 + (i * (barWidth + gap));
                const mirrorX = width / 2 - ((i + 1) * (barWidth + gap));
                
                // 添加圆角效果
                this.canvasCtx.beginPath();
                this.roundedRect(x, height/2 - barHeight/2, barWidth, barHeight, barWidth/2);
                this.canvasCtx.fill();
                
                if (i > 0) {
                    this.canvasCtx.beginPath();
                    this.roundedRect(mirrorX, height/2 - barHeight/2, barWidth, barHeight, barWidth/2);
                    this.canvasCtx.fill();
                }
            } else {
                // 全屏模式：从底部向上，均匀分布
                const x = (i * (width / barCount));
                const w = Math.max(width / barCount - gap, 1);
                this.canvasCtx.fillRect(x, height - barHeight, w, barHeight);
            }
        }
    }

    // 添加圆角矩形绘制方法
    roundedRect(x, y, width, height, radius) {
        this.canvasCtx.moveTo(x + radius, y);
        this.canvasCtx.lineTo(x + width - radius, y);
        this.canvasCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.canvasCtx.lineTo(x + width, y + height - radius);
        this.canvasCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.canvasCtx.lineTo(x + radius, y + height);
        this.canvasCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.canvasCtx.lineTo(x, y + radius);
        this.canvasCtx.quadraticCurveTo(x, y, x + radius, y);
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.source && this.analyser) {
            try {
                this.source.disconnect(this.analyser);
            } catch (e) {
                console.warn('Error disconnecting source:', e);
            }
        }

        if (this.analyser) {
            try {
                this.analyser.disconnect();
            } catch (e) {
                console.warn('Error disconnecting analyser:', e);
            }
        }

        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }

        this.isInitialized = false;
    }
    
    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resume() {
        if (this.isInitialized && this.isPaused) {
            this.isPaused = false;
            this.draw();
        }
    }
}