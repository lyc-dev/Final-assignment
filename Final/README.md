# 个人简历与音乐可视化项目

这是一个集合了个人简历和多种数据可视化功能的项目，包括音乐可视化、地图可视化、关系图和饼图等功能。

## 项目结构

- `index.html`: 主页面，包含个人简历信息和可视化模块入口
- `src/`: 源代码目录
  - `audio/`: 音频处理相关代码
    - `music-viz.js`: 音频可视化核心类，实现了音频分析和频谱动画
    - `music-player-controller.js`: 音乐播放器控制逻辑，处理播放、暂停等功能
    - `music-visualizer.js`: 音频可视化器配置和初始化
  - `core/`: 核心功能代码
    - `spa.js`: 单页应用架构核心，实现页面路由和转场动画
    - `core.js`: 核心功能集合，提供各模块初始化和清理功能
    - `main.js`: 应用主要入口，负责初始化各个组件
  - `data/`: 数据文件
    - `music-info.json`: 音乐信息数据，包含歌曲名、艺术家、封面等
    - `Major_courses.json`: 专业课程数据，用于成绩可视化
    - `relationship.json`: 人物关系数据，用于关系图可视化
    - `CQdata.json`: 重庆地区数据，用于地图可视化
  - `html/`: HTML页面
    - `music.html`: 音乐可视化页面
    - `music_player.html`: 音乐播放器iframe页面
    - `map.html`: 地图可视化页面
    - `relation.html`: 关系图可视化页面
    - `pie.html`: 饼图可视化页面
  - `styles/`: 样式文件
  - `utils/`: 工具函数
    - `album-visualizer.js`: 专辑封面音频可视化效果实现
    - `music-view-controller.js`: 音乐视图控制器，管理视图切换
  - `visualizations/`: 可视化组件
    - `components/`: 可视化组件集合
      - `map.js`: 地图可视化组件，使用百度地图API展示重庆地区信息
      - `pie.js`: 饼图和柱状图组件，使用D3.js展示课程成绩数据
      - `force.js`: 力导向图组件，展示人物关系网络
    - `force.js`: 力导向关系图实现
- `D3/`: D3.js库文件
- `image/`: 图像资源
  - `album/`: 音乐专辑封面
    - `default/`: 默认封面图片
- `music/`: 音乐文件
- `music_lyrics/`: 歌词文件
- `rule/`: 规则和依赖库文件，包含jQuery、ECharts等

## 主要模块功能介绍

### 1. SPA核心模块 (src/core/spa.js)

单页应用架构的核心实现，负责：

- 页面路由管理：监听URL哈希变化，加载相应页面内容
- 内容缓存：缓存已加载页面内容，提高切换效率
- 平滑转场动画：实现页面间的无缝过渡效果
- 状态管理：保存和恢复各页面状态（如音乐播放状态）
- 页面初始化：为新加载的页面初始化相应的模块
- 页面样式控制：根据当前页面动态调整全局样式

```javascript
const routes = {
    home: 'home',
    pie: 'src/html/pie.html',
    map: 'src/html/map.html',
    relation: 'src/html/relation.html',
    music: 'src/html/music.html'
};
```

### 2. 音频可视化模块 (src/audio/music-viz.js)

音频可视化核心类，实现了：

- Web Audio API集成：创建音频上下文和分析器
- 实时频谱分析：分析音频频率数据
- 自适应画布渲染：根据容器大小调整可视化效果
- 平滑过渡动画：使用插值算法实现波形平滑动画
- 迷你模式和全屏模式：支持不同尺寸和样式的可视化效果
- 动态渐变色彩：为频谱波形添加动态渐变色彩
- 资源管理：自动清理和释放音频和画布资源

```javascript
class AudioVisualizer {
    constructor(containerId, isMini = false) {
        // 初始化属性
    }
  
    async init(audioElement) {
        // 初始化音频分析器和画布
    }
  
    draw() {
        // 绘制音频频谱波形
    }
}
```

### 3. 专辑封面音频可视化模块 (src/utils/album-visualizer.js)

基于Web Audio API和Canvas的专辑封面动态可视化：

- 频谱线效果：将音频频率数据转化为专辑封面周围的动态光线
- 脉冲波纹系统：根据音乐节奏产生向外扩散的波纹
- 分频分析：分别处理低、中、高频段，以不同方式影响视觉效果
- 动态颜色变化：根据音乐强度和频率特性调整视觉效果的色彩
- 光环效果：为专辑封面添加随音乐强度变化的发光效果
- 资源管理：优化渲染性能并确保资源正确释放

```javascript
class AlbumVisualizer {
    constructor(canvasId, audioElement) {
        // 初始化属性
    }
  
    async init() {
        // 初始化音频分析器和Canvas
    }
  
    drawSpectralRings(amplitude, bassAmplitude, midAmplitude, trebleAmplitude) {
        // 绘制频谱线效果
    }
  
    drawPulseWaves(amplitude, bassAmplitude) {
        // 绘制脉冲波纹效果
    }
}
```

### 4. 地图可视化模块 (src/visualizations/components/map.js)

基于百度地图API和ECharts实现的地图可视化：

- 地理位置标记：显示重庆理工大学主要建筑位置
- 路线连接：连接主要地点形成路线图
- 区域边界：绘制重庆市行政区域边界
- 动态效果：添加点位波纹动画效果
- 背景小地图：为教育经历部分提供地理位置背景

```javascript
export function initMap() {
    // 初始化地图并添加标记点和边界
}

export function renderEduMapBgFixed() {
    // 渲染背景小地图
}
```

### 5. 饼图和柱状图模块 (src/visualizations/components/pie.js)

使用D3.js实现的成绩数据可视化：

- 交互式饼图：展示各课程成绩占比
- 动态柱状图：直观展示各科成绩高低
- 交互提示：鼠标悬停显示详细信息
- 动画效果：添加过渡动画提升用户体验
- 自适应设计：适应不同屏幕尺寸
- 标签优化：优化标签位置避免重叠

```javascript
export function initCharts() {
    // 初始化饼图和柱状图
}

function drawPieChart(data) {
    // 绘制饼图及交互效果
}

function drawBarChart(data) {
    // 绘制柱状图及交互效果
}
```

### 6. 关系图模块 (src/visualizations/components/force.js & src/visualizations/force.js)

基于D3.js力导向算法的关系网络图：

- 动态力导向布局：自动调整节点位置
- 交互式节点：支持拖拽、点击和悬停交互
- 关系线条：显示不同实体之间的关系
- 节点分类：使用不同颜色和大小区分节点类型
- 缩放和平移：支持图表的缩放和平移操作
- 碰撞检测：防止节点重叠提高可读性

### 7. 音乐播放器模块 (src/audio/music-player-controller.js)

嵌入式音乐播放器实现：

- 播放控制：播放、暂停、上一曲、下一曲功能
- 进度条控制：支持进度拖拽和点击定位
- 音量控制：提供音量调节功能
- 播放模式：循环、随机等多种播放模式
- 专辑展示：显示当前播放歌曲的专辑封面
- 歌词同步：支持LRC格式歌词同步滚动
- 全局控制：作为iframe嵌入在所有页面底部

## 使用的技术

- HTML5/CSS3/JavaScript ES6
- Web Audio API：音频处理与分析
- Canvas API：动态绘制音频可视化效果
- D3.js：数据可视化库，用于关系图、饼图等
- ECharts：用于地图可视化
- 百度地图API：地理位置可视化
- SPA (单页应用) 架构：无刷新页面切换

## 最近更新

### 添加专辑封面音频可视化效果

- 为专辑封面添加了基于Canvas的音频可视化效果
- 实现了专辑封面周围的频谱线效果，直观显示音频频率分布
- 添加了从专辑封面向外扩散的波纹脉冲效果，随音乐节奏扩散
- 实现了低音、中音、高音频段的分离处理，不同频段以不同视觉效果呈现
- 优化了SPA架构下的音频上下文管理，解决了资源释放问题
- 简化了用户交互，移除多余的键盘控制，保留按钮切换功能

### 修复音乐可视化模块的专辑页面切换问题

- 修复了页面切换按钮事件监听可能重复绑定的问题
- 优化了专辑封面图片加载逻辑，添加默认封面支持
- 改进了歌词显示和滚动功能
- 增强了事件处理的稳定性，解决了音频状态变化监听问题
- 添加了更详细的调试信息以便于故障排除

## 开发者指南

### 添加新的音乐

1. 将音乐文件放入 `music/` 目录
2. 将专辑封面图片放入 `image/album/` 目录
3. 在 `src/data/music-info.json` 中添加新歌曲信息，包括：
   - 歌曲名称
   - 作者
   - 封面图片路径
   - 是否有歌词
   - 歌词内容（如果有，包含时间和文本）

### 添加新的可视化组件

1. 在 `src/visualizations/components/` 目录创建新的组件文件
2. 在 `src/html/` 目录创建相应的HTML页面
3. 在 `src/core/spa.js` 中添加新的路由
4. 在首页的模块入口卡片区添加新模块的入口

## 许可证

此项目仅供个人使用和学习目的。音乐和图像资源的版权归原作者所有。
