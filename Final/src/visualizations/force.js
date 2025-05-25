// 初始化函数，确保在DOM加载完成后再创建力导向图
function initForceGraph() {
    // 获取容器尺寸
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 清理可能存在的旧SVG
    d3.select("#graph-container svg").remove();

    // 创建SVG容器
    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // 创建力导向图模拟
    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(300))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(50));

    // 创建tooltip
    d3.selectAll(".graph-tooltip").remove();
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip graph-tooltip")
        .style("opacity", 0);

    // 绘制连接线
    const link = svg.append("g")
        .selectAll("line")
        .data(graphData.links)
        .join("line")
        .attr("class", "link");

    // 创建节点组
    const node = svg.append("g")
        .selectAll(".node")
        .data(graphData.nodes)
        .join("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // 添加高亮圆环（仅主人公）
    node.filter(d => d.id === "lyc")
        .append("circle")
        .attr("r", 24)
        .attr("fill", "none")
        .attr("stroke", "#00cfff")
        .attr("stroke-width", 4);

    // 添加节点头像图片
    node.append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", 40)
        .attr("height", 40)
        .attr("x", -20)
        .attr("y", -20)
        .attr("clip-path", "circle(20px at 20px 20px)");

    // 添加节点文本
    node.append("text")
        .text(d => d.name)
        .attr("dy", "3.5em")
        .attr("text-anchor", "middle");

    // 绘制关系文字
    const linkText = svg.append("g")
        .selectAll("text")
        .data(graphData.links)
        .join("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .text(d => d.relation);

    // 添加鼠标交互事件
    node.on("mouseover", function(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .95);
        tooltip.html(`
            <div style='padding:4px 8px;'>
                <div><b>${d.name}</b></div>
                <div style='font-size:13px;color:#fff;'>${d.desc || ''}</div>
            </div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");

        // 添加高亮金色圆圈
        d3.select(this)
            .append("circle")
            .attr("class", "highlight-circle")
            .attr("r", 28)
            .attr("fill", "none")
            .attr("stroke", "gold")
            .attr("stroke-width", 3);
    })
    .on("mouseout", function() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        // 移除高亮金色圆圈
        d3.select(this).select(".highlight-circle").remove();
    });

    // 更新力导向图
    simulation.on("tick", () => {
        // 限制节点在视图范围内
        node.attr("transform", d => {
            d.x = Math.max(40, Math.min(width - 40, d.x));
            d.y = Math.max(40, Math.min(height - 40, d.y));
            return `translate(${d.x},${d.y})`;
        });

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkText
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);
    });

    // 拖拽功能实现
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // 处理窗口大小变化
    function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        svg.attr("width", newWidth)
           .attr("height", newHeight);
        
        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
                  .alpha(0.3)
                  .restart();
    }

    window.addEventListener('resize', handleResize);

    // 返回清理函数
    return () => {
        window.removeEventListener('resize', handleResize);
        simulation.stop();
    };
}

// 如果不在SPA环境中，直接初始化
if (!window.inSpaContext) {
    document.addEventListener('DOMContentLoaded', initForceGraph);
}