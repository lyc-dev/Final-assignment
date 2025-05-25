// main.js
// console.log('简历主页已加载，等待数据可视化模块接入...');

function initializeCharts() {
  if (document.getElementById('pie-chart') && document.getElementById('bar-chart')) {
    // 清理旧的图表内容
    d3.select('#pie-chart').selectAll('*').remove();
    d3.select('#bar-chart').selectAll('*').remove();
    d3.selectAll('.tooltip').remove();

    fetch('Major_courses.json')
      .then(res => res.json())
      .then(data => {
        drawPieChart(data);
        drawBarChart(data);
      })
      .catch(error => {
        console.error('加载数据失败:', error);
      });
  }
}

function drawPieChart(data) {
  const width = 500;
  const height = 400;
  const radius = Math.min(width, height) / 3;
  const labelRadius = radius * 1.2;

  // 计算总分用于计算百分比
  const total = d3.sum(data, d => d["成绩"]);

  d3.select('#pie-chart').html('');
  const svg = d3.select('#pie-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('overflow', 'visible') // 允许内容超出SVG边界
    .style('position', 'relative') // 设置相对定位
    .style('z-index', '1'); // 设置基础层级

  const pieGroup = svg.append('g')
    .attr('transform', `translate(${width/2},${height/2})`);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d["课程名称"]))
    .range(['#4fc3f7', '#0288d1', '#81d4fa', '#1565c0', '#29b6f6', '#90caf9']);

  const pie = d3.pie()
    .value(d => d["成绩"]);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const outerArc = d3.arc()
    .innerRadius(labelRadius)
    .outerRadius(labelRadius);

  // 创建提示框
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // 修改扇形添加鼠标交互
  const arcs = pieGroup.selectAll('arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data["课程名称"]))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('z-index', '1') // 设置扇形的层级
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8);
      tooltip.transition()
        .duration(200)
        .style('opacity', 1);
      tooltip.html(`课程：${d.data["课程名称"]}<br/>成绩：${d.data["成绩"]}<br/>占比：${Math.round(d.data["成绩"] / total * 100)}%`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1);
      tooltip.transition()
        .duration(200)
        .style('opacity', 0);
    });

  // 修改文字样式
  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')  // 百分比字体颜色
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')  // 加粗
    .text(d => `${Math.round(d.data["成绩"] / total * 100)}%`);

  // 添加连接线和课程名称标签
  arcs.append('polyline')
    .attr('points', function(d) {
      const pos = outerArc.centroid(d);
      pos[0] = pos[0] * 1.1;
      return [arc.centroid(d), outerArc.centroid(d), pos];
    })
    .style('fill', 'none')
    .style('stroke', '#00FFFF')  // 连接线颜色
    .style('stroke-width', 1.5);

  arcs.append('text')
    .attr('dy', '.35em')
    .attr('transform', function(d) {
      const pos = outerArc.centroid(d);
      pos[0] = pos[0] * 1.1;
      return `translate(${pos})`;
    })
    .attr('text-anchor', d => {
      const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
      return midangle < Math.PI ? 'start' : 'end';
    })
    .attr('fill', 'brown')  // 课程名称颜色
    .style('font-size', '20px')
    .style('font-weight', 'bold')  // 加粗
    .text(d => d.data["课程名称"]);
}

function drawBarChart(data) {
  const width = 500;
  const height = 400;
  const margin = {top: 20, right: 20, bottom: 100, left: 60};
  const barWidth = width - margin.left - margin.right;
  const barHeight = height - margin.top - margin.bottom;

  d3.select('#bar-chart').html('');
  const svg = d3.select('#bar-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('overflow', 'visible') // 允许内容超出SVG边界
    .style('position', 'relative') // 设置相对定位
    .style('z-index', '1'); // 设置基础层级

  const barGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // 创建比例尺
  const x = d3.scaleBand()
    .domain(data.map(d => d["课程名称"]))
    .range([0, barWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([barHeight, 0]);

  // 创建提示框
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // 绘制柱状图
  barGroup.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => x(d["课程名称"]))
    .attr('y', d => y(d["成绩"]))
    .attr('width', x.bandwidth())
    .attr('height', d => barHeight - y(d["成绩"]))
    .attr('fill', '#4fc3f7')
    .attr('rx', 6)
    .style('z-index', '1') // 设置柱子的层级
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', '#81d4fa');
      tooltip.transition()
        .duration(200)
        .style('opacity', 1);
      tooltip.html(`课程：${d["课程名称"]}<br/>成绩：${d["成绩"]}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', '#4fc3f7');
      tooltip.transition()
        .duration(200)
        .style('opacity', 0);
    });

  // 修改坐标轴文字样式
  barGroup.append('g')
    .attr('transform', `translate(0,${barHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('fill', 'green')  // 直方图坐标轴文字颜色
    .style('font-size', '20px')
    .style('font-weight', 'bold')  // 加粗
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  barGroup.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', '#00FFFF')  // 改为亮蓝色
    .style('font-weight', 'bold');  // 加粗

  // 添加柱状图
  barGroup.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => x(d["课程名称"]))
    .attr('y', d => y(d["成绩"]))
    .attr('width', x.bandwidth())
    .attr('height', d => barHeight - y(d["成绩"]))
    .attr('fill', '#4fc3f7')
    .attr('rx', 6);

  // 修改成绩标签样式
  barGroup.selectAll('.score')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'score')
    .attr('x', d => x(d["课程名称"]) + x.bandwidth()/2)
    .attr('y', d => y(d["成绩"]) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#00FFFF')  // 改为亮蓝色
    .style('font-weight', 'bold')  // 加粗
    .text(d => d["成绩"]);
}

// 导出初始化函数供 spa.js 使用
window.initializeCharts = initializeCharts;