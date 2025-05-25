// 专辑封面音频可视化效果类
class AlbumVisualizer {
  constructor(canvasId, audioElement) {
    this.canvasId = canvasId;
    this.audioElement = audioElement;
    this.canvas = null;
    this.ctx = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
    this.isInitialized = false;
    
    // 改为脉冲波纹系统
    this.pulseWaves = [];
    this.waveCount = 20; // 波纹数量
    
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 130; // 专辑封面半径
    this.maxRadius = 200; // 最大波纹半径
    
    this.hue = 0; // 用于光环颜色变化
    this.pulsePhase = 0; // 用于控制脉冲效果
    this.previousAmplitude = 0; // 用于平滑振幅变化
    
    // 新增频谱线相关属性
    this.spectralLines = 120; // 频谱线数量
    this.spectralData = []; // 存储频谱数据
    this.previousSpectralData = []; // 上一帧频谱数据，用于平滑过渡
  }

  async init() {
    if (this.isInitialized) {
      this.cleanup();
    }

    try {
      this.canvas = document.getElementById(this.canvasId);
      if (!this.canvas) {
        console.error(`Canvas with ID ${this.canvasId} not found`);
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      
      // 设置画布尺寸
      this.canvas.width = 360;
      this.canvas.height = 360;
      
      // 计算中心点
      this.centerX = this.canvas.width / 2;
      this.centerY = this.canvas.height / 2;

      // 设置音频分析器
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
      this.analyser.fftSize = 1024; // 增大FFT大小以获得更精细的频谱数据
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // 处理音频源连接
      if (!this.audioElement.audioSource) {
        this.audioElement.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
      }
      const source = this.audioElement.audioSource;

      // 连接节点
      source.connect(this.analyser);
      if (!this.audioElement.isConnectedToDestination) {
        source.connect(this.audioContext.destination);
        this.audioElement.isConnectedToDestination = true;
      }

      // 初始化脉冲波纹
      this.initWaves();
      
      // 初始化频谱数据
      this.spectralData = new Array(this.spectralLines).fill(0);
      this.previousSpectralData = [...this.spectralData];

      this.isInitialized = true;
      this.draw();
    } catch (error) {
      console.error('Failed to initialize album visualizer:', error);
    }
  }

  initWaves() {
    this.pulseWaves = [];
    for (let i = 0; i < this.waveCount; i++) {
      this.pulseWaves.push({
        radius: this.radius + Math.random() * 10, // 初始半径略大于专辑封面
        maxRadius: this.radius + 20 + Math.random() * 60, // 最大半径随机
        growth: 0.2 + Math.random() * 0.6, // 增长速度
        alpha: 0.1 + Math.random() * 0.3, // 初始透明度
        lineWidth: 1 + Math.random() * 2, // 线宽
        hueOffset: Math.random() * 60, // 色相偏移
        isActive: Math.random() > 0.5, // 初始是否激活
        frequency: Math.floor(Math.random() * this.analyser.frequencyBinCount), // 关联的频率
        pulseScale: Math.random() * 0.8 + 0.2 // 脉冲强度随机系数
      });
    }
  }

  draw() {
    if (!this.isInitialized) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 获取音频数据
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // 计算平均振幅
    let sum = 0;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    
    // 分频段计算平均值，用于不同效果
    const bassRange = Math.floor(this.dataArray.length * 0.2); // 低音区20%
    const midRange = Math.floor(this.dataArray.length * 0.5);  // 中音区50%
    
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
      if (i < bassRange) {
        bassSum += this.dataArray[i];
      } else if (i < bassRange + midRange) {
        midSum += this.dataArray[i];
      } else {
        trebleSum += this.dataArray[i];
      }
    }
    
    const average = sum / this.dataArray.length;
    const bassAvg = bassSum / bassRange;
    const midAvg = midSum / midRange;
    const trebleAvg = trebleSum / (this.dataArray.length - bassRange - midRange);
    
    // 平滑振幅变化
    const smoothingFactor = 0.15;
    const amplitude = this.previousAmplitude * (1 - smoothingFactor) + (average / 256) * smoothingFactor;
    this.previousAmplitude = amplitude;
    
    // 更新相位用于脉冲效果
    this.pulsePhase += 0.05;
    
    // 更新色调用于光环颜色变化
    this.hue = (this.hue + 0.5) % 360;
    
    // 1. 绘制专辑周围的频谱线
    this.drawSpectralRings(amplitude, bassAvg/256, midAvg/256, trebleAvg/256);
    
    // 2. 绘制脉冲波纹
    this.drawPulseWaves(amplitude, bassAvg/256);
    
    // 3. 绘制外围光环
    this.drawOuterGlow(amplitude, bassAvg/256);
    
    // 4. 绘制内部光晕
    this.drawInnerGlow(amplitude);
  }
  
  drawSpectralRings(amplitude, bassAmplitude, midAmplitude, trebleAmplitude) {
    // 更新频谱数据
    for (let i = 0; i < this.spectralLines; i++) {
      // 获取对应频率索引
      const freqIndex = Math.floor(i / this.spectralLines * (this.dataArray.length * 0.8));
      
      // 获取并标准化频率值
      const value = this.dataArray[freqIndex] / 256.0;
      
      // 平滑处理
      this.spectralData[i] = this.previousSpectralData[i] * 0.7 + value * 0.3;
    }
    
    // 保存当前频谱数据以便下一帧使用
    this.previousSpectralData = [...this.spectralData];
    
    // 绘制频谱环
    const angleStep = (Math.PI * 2) / this.spectralLines;
    
    for (let i = 0; i < this.spectralLines; i++) {
      // 计算振幅缩放因子
      const value = this.spectralData[i] * (0.5 + amplitude * 1.5);
      
      // 计算线条开始和结束的角度
      const angle = i * angleStep;
      
      // 计算线条起点和终点
      const innerRadius = this.radius;
      const outerRadius = innerRadius + value * 40;
      
      // 计算线条坐标
      const innerX = this.centerX + Math.cos(angle) * innerRadius;
      const innerY = this.centerY + Math.sin(angle) * innerRadius;
      const outerX = this.centerX + Math.cos(angle) * outerRadius;
      const outerY = this.centerY + Math.sin(angle) * outerRadius;
      
      // 根据频率区间设置颜色
      let hue;
      if (i < this.spectralLines * 0.33) {
        // 低频 - 红色/橙色
        hue = (this.hue + 0) % 360;
      } else if (i < this.spectralLines * 0.66) {
        // 中频 - 绿色/青色
        hue = (this.hue + 120) % 360;
      } else {
        // 高频 - 蓝色/紫色
        hue = (this.hue + 240) % 360;
      }
      
      // 设置线条样式
      this.ctx.beginPath();
      this.ctx.moveTo(innerX, innerY);
      this.ctx.lineTo(outerX, outerY);
      
      // 可以添加渐变效果使线条看起来更有深度
      const gradient = this.ctx.createLinearGradient(innerX, innerY, outerX, outerY);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 90%, 0.3)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, ${Math.min(0.8, value * 1.5)})`);
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
  }
  
  drawPulseWaves(amplitude, bassAmplitude) {
    // 获取随机频率值以决定是否添加新波纹
    const triggerFreq = Math.floor(Math.random() * (this.dataArray.length * 0.7));
    const freq = this.dataArray[triggerFreq] / 256;
    
    // 根据音量大小决定添加新波纹的概率
    if (Math.random() < amplitude * 0.3 || Math.random() < bassAmplitude * 0.4) {
      // 找到一个未激活的波纹并激活它
      for (let i = 0; i < this.pulseWaves.length; i++) {
        if (!this.pulseWaves[i].isActive) {
          this.pulseWaves[i].radius = this.radius + Math.random() * 5;
          this.pulseWaves[i].alpha = 0.3 + Math.random() * 0.4;
          this.pulseWaves[i].isActive = true;
          this.pulseWaves[i].frequency = Math.floor(Math.random() * this.dataArray.length * 0.8);
          break;
        }
      }
    }
    
    // 更新和绘制每个波纹
    for (let i = 0; i < this.pulseWaves.length; i++) {
      const wave = this.pulseWaves[i];
      
      if (wave.isActive) {
        // 获取关联频率的值，用于调整波纹扩散速度
        const freqValue = this.dataArray[wave.frequency] / 256;
        
        // 波纹扩散速度根据音频振幅调整
        const growthRate = wave.growth * (0.5 + freqValue * 2 * wave.pulseScale);
        
        // 更新波纹半径
        wave.radius += growthRate;
        
        // 更新不透明度
        wave.alpha *= 0.97;
        
        // 当波纹扩散到最大半径或不透明度过低时重置
        if (wave.radius > wave.maxRadius || wave.alpha < 0.02) {
          wave.isActive = false;
        }
        
        // 绘制波纹
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, wave.radius, 0, Math.PI * 2);
        
        // 波纹颜色
        const waveHue = (this.hue + wave.hueOffset) % 360;
        this.ctx.strokeStyle = `hsla(${waveHue}, 100%, 75%, ${wave.alpha})`;
        this.ctx.lineWidth = wave.lineWidth;
        this.ctx.stroke();
      }
    }
  }
  
  drawOuterGlow(amplitude, bassAmplitude) {
    // 外围光环效果
    const glowSize = 10 + Math.sin(this.pulsePhase) * 5 + amplitude * 25;
    const bassEffect = 15 + bassAmplitude * 30;
    
    // 创建径向渐变
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, this.radius - 5,
      this.centerX, this.centerY, this.radius + bassEffect
    );
    
    // 设置光环颜色
    const primaryColor = `rgba(255, 255, 255, ${0.4 + amplitude * 0.4})`;
    const secondaryColor = `hsla(${this.hue}, 100%, 70%, ${0.2 + amplitude * 0.3})`;
    
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.6, secondaryColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // 绘制外部光环
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius + glowSize, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
  
  drawInnerGlow(amplitude) {
    // 内部光晕效果 - 专辑边缘内部的发光效果
    const innerGlow = this.ctx.createRadialGradient(
      this.centerX, this.centerY, this.radius * 0.8,
      this.centerX, this.centerY, this.radius
    );
    
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    innerGlow.addColorStop(1, `rgba(255, 255, 255, ${0.2 + amplitude * 0.3})`);
    
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = innerGlow;
    this.ctx.fill();
  }

  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.isInitialized = false;
  }
}

export default AlbumVisualizer; 