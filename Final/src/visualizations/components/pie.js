// 课程成绩可视化组件
export function initCharts() {
    if (document.getElementById('pie-chart') && document.getElementById('bar-chart')) {
        // 清理旧的图表内容
        d3.select('#pie-chart').selectAll('*').remove();
        d3.select('#bar-chart').selectAll('*').remove();
        d3.selectAll('.tooltip').remove();

        // 内联数据，避免网络请求问题
        const data = [
          {"课程名称": "C语言", "成绩": 76},
          {"课程名称": "模拟电子技术", "成绩": 90},
          {"课程名称": "数字电子技术", "成绩": 88},
          {"课程名称": "信号与系统", "成绩": 79},
          {"课程名称": "工程电磁场", "成绩": 92},
          {"课程名称": "数字信号处理", "成绩": 86}
        ];
        
        drawPieChart(data);
        drawBarChart(data);
    }
}
//初始化饼图和柱状图
function drawPieChart(data) {
    const width = 600;  // 增加宽度
    const height = 550; // 增加高度
    const radius = Math.min(width, height) / 2.5;
    const labelRadius = radius * 1.2;

    // 计算总分用于计算百分比
    const total = d3.sum(data, d => d["成绩"]);

    d3.select('#pie-chart').html('');
    const svg = d3.select('#pie-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible')
        .style('position', 'relative')
        .style('z-index', '1');

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
    const arcs = pieGroup.selectAll('path')
        .data(pie(data))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data["课程名称"]))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('z-index', '1')
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
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
        .on('mouseout', (event) => {
            d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr('opacity', 1);
            tooltip.transition()
                .duration(200)
                .style('opacity', 0);
        });

    // 百分比文字
    pieGroup.selectAll('text.percentage')
        .data(pie(data))
        .join('text')
        .attr('class', 'percentage')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(d => `${Math.round(d.data["成绩"] / total * 100)}%`);

    // 添加连接线和课程名称标签
    pieGroup.selectAll('polyline')
        .data(pie(data))
        .join('polyline')
        .attr('points', d => {
            const pos = outerArc.centroid(d);
            pos[0] = pos[0] * 1.1;
            return [arc.centroid(d), outerArc.centroid(d), pos];
        })
        .style('fill', 'none')
        .style('stroke', '#00FFFF')
        .style('stroke-width', 1.5);

    pieGroup.selectAll('text.label')
        .data(pie(data))
        .join('text')
        .attr('class', 'label')
        .attr('dy', '.35em')
        .attr('transform', d => {
            const pos = outerArc.centroid(d);
            pos[0] = pos[0] * 1.1;
            return `translate(${pos})`;
        })
        .attr('text-anchor', d => {
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midangle < Math.PI ? 'start' : 'end';
        })
        .attr('fill', 'brown')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(d => d.data["课程名称"]);
}
//绘制饼图及交互效果
function drawBarChart(data) {
    const width = 600;  // 增加宽度
    const height = 550; // 增加高度
    const margin = {top: 20, right: 20, bottom: 100, left: 60};
    const barWidth = width - margin.left - margin.right;
    const barHeight = height - margin.top - margin.bottom;

    d3.select('#bar-chart').html('');
    const svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible')
        .style('position', 'relative')
        .style('z-index', '1');

    const barGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

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
        .join('rect')
        .attr('x', d => x(d["课程名称"]))
        .attr('y', d => y(d["成绩"]))
        .attr('width', x.bandwidth())
        .attr('height', d => barHeight - y(d["成绩"]))
        .attr('fill', '#4fc3f7')
        .attr('rx', 6)
        .style('z-index', '1')
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
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
        .on('mouseout', (event) => {
            d3.select(event.currentTarget)
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
        .attr('fill', 'green')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    barGroup.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', '#00FFFF')
        .style('font-weight', 'bold');

    // 添加成绩标签
    barGroup.selectAll('.score')
        .data(data)
        .join('text')
        .attr('class', 'score')
        .attr('x', d => x(d["课程名称"]) + x.bandwidth()/2)
        .attr('y', d => y(d["成绩"]) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00FFFF')
        .style('font-weight', 'bold')
        .text(d => d["成绩"]);
}
//绘制柱状图及交互效果