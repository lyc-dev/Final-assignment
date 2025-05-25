class MusicVisualizer {
    constructor(containerId, audioElement) {
        this.container = document.getElementById(containerId);
        this.audio = audioElement;
        this.svg = null;
        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        this.bars = [];
        this.isInitialized = false;
        this.animationFrame = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // 创建音频上下文
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.source = this.audioCtx.createMediaElementSource(this.audio);
            
            // 连接节点
            this.source.connect(this.analyser);
            this.source.connect(this.audioCtx.destination);
            
            // 配置分析器
            this.analyser.fftSize = 256; // 增加FFT大小以获得更多频率数据
            
            // 初始化SVG
            this.initializeSVG();
            
            // 标记为已初始化
            this.isInitialized = true;
            
            // 开始动画
            this.startVisualization();
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
        }
    }

    initializeSVG() {
        // 清除现有的SVG
        if (this.svg) {
            this.svg.remove();
        }
        
        // 创建新的SVG
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.container.appendChild(this.svg);
        
        // 创建频谱条
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // 增加条形数量，铺满页面
        const BAR_COUNT = Math.floor(width / 15); // 动态计算条形数量以充满宽度
        const barWidth = width / BAR_COUNT * 0.85;
        const barGap = width / BAR_COUNT * 0.15;
        
        this.bars = [];
        for (let i = 0; i < BAR_COUNT; i++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", i * (barWidth + barGap));
            rect.setAttribute("y", height);
            rect.setAttribute("width", barWidth);
            rect.setAttribute("height", 0);
            
            // 创建彩色渐变
            const hue = (i / BAR_COUNT) * 360;
            rect.setAttribute("fill", `hsl(${hue}, 80%, 60%)`);
            
            // 添加圆角效果
            rect.setAttribute("rx", "2");
            rect.setAttribute("ry", "2");
            
            this.svg.appendChild(rect);
            this.bars.push(rect);
        }
    }

    startVisualization() {
        if (!this.isInitialized) return;

        // 添加平滑过渡
        const smoothingFactor = 0.3;
        const prevHeights = new Array(this.bars.length).fill(0);

        const updateVisualization = () => {
            const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(frequencyData);
            
            const height = this.container.clientHeight;
            this.bars.forEach((bar, index) => {
                if (index < this.bars.length) {
                    // 使用不同的频率范围增强视觉效果
                    const dataIndex = Math.floor(index * (frequencyData.length * 0.75) / this.bars.length);
                    
                    // 应用放大系数使低频更明显
                    let value = frequencyData[dataIndex];
                    if (dataIndex < frequencyData.length * 0.2) {
                        value *= 1.2; // 放大低频
                    }
                    
                    // 应用平滑过渡
                    let barHeight = (value / 255) * height * 0.9; // 使用90%的高度，留出空间
                    barHeight = prevHeights[index] * smoothingFactor + barHeight * (1 - smoothingFactor);
                    prevHeights[index] = barHeight;
                    
                    bar.setAttribute("height", barHeight);
                    bar.setAttribute("y", height - barHeight);
                    
                    // 动态更新颜色，使其随音频强度变化
                    const intensity = Math.min(100, 40 + (value / 255) * 60);
                    const hue = (index / this.bars.length) * 360;
                    bar.setAttribute("fill", `hsl(${hue}, 80%, ${intensity}%)`);
                }
            });
            
            this.animationFrame = requestAnimationFrame(updateVisualization);
        };
        
        updateVisualization();
    }

    handleResize() {
        if (!this.isInitialized) return;
        this.initializeSVG();
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.audioCtx) {
            this.audioCtx.close();
        }
        this.isInitialized = false;
    }
}

// 导出类
window.MusicVisualizer = MusicVisualizer;

// 添加初始化全屏可视化的函数
export async function initFullScreenVisualizer(audioElement) {
    try {
        const visualizer = new MusicVisualizer('visualization-container', audioElement);
        await visualizer.initialize();
        
        // 添加窗口大小变化监听器
        window.addEventListener('resize', () => visualizer.handleResize());
        
        return visualizer;
    } catch (error) {
        console.error('Failed to initialize full screen visualizer:', error);
        throw error;
    }
}