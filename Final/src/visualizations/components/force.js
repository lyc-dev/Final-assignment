// 关系图可视化组件
async function loadRelationshipData(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch('/Final/src/data/relationship.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed to load relationship data:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

export async function initForceGraph() {
    try {
        // 获取容器尺寸
        const container = document.getElementById('graph-container');
        if (!container) throw new Error('Graph container not found');
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 清理可能存在的旧SVG
        d3.selectAll("#graph-container svg").remove();
        d3.selectAll(".graph-tooltip").remove();

        // 创建SVG容器
        const svg = d3.select("#graph-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // 加载关系数据
        const relationshipData = await loadRelationshipData();

        // 转换数据为力导向图所需的格式
        const graphData = {
            nodes: relationshipData.map(d => ({
                id: d.name,
                name: d.label,
                image: d.image,
                desc: d.desc
            })),
            links: relationshipData.filter(d => d.target).map(d => ({
                source: d.name,
                target: d.target,
                relation: d.relation
            }))
        };

        // 创建力导向图模拟
        const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(300))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50));

        // 创建tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip graph-tooltip')
            .style('opacity', 0);

        // 绘制连接线
        const link = svg.append("g")
            .selectAll("line")
            .data(graphData.links)
            .join("line")
            .attr("class", "link");

        // 创建节点组
        const node = svg.append("g")
            .selectAll("g")
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
            .attr("xlink:href", d => `/Final/image/${d.image}`)
            .attr("width", 40)
            .attr("height", 40)
            .attr("x", -20)
            .attr("y", -20)
            .attr("clip-path", "circle(20px at 20px 20px)")
            .on("error", function() {
                // 如果图片加载失败，使用一个默认的圆形
                const parent = d3.select(this.parentNode);
                this.remove();
                parent.append("circle")
                    .attr("r", 20)
                    .attr("fill", "#4fc3f7");
            });

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
        node.on("mouseover", (event, d) => {
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
            d3.select(event.currentTarget)
                .append("circle")
                .attr("class", "highlight-circle")
                .attr("r", 28)
                .attr("fill", "none")
                .attr("stroke", "gold")
                .attr("stroke-width", 3);
        })
        .on("mouseout", (event) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            // 移除高亮金色圆圈
            d3.select(event.currentTarget).select(".highlight-circle").remove();
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
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
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
            tooltip.remove();
        };
    } catch (error) {
        console.error('Failed to initialize force graph:', error);
        // 在错误情况下显示错误信息给用户
        const container = document.getElementById('graph-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                    <h3>加载关系图失败</h3>
                    <p>请刷新页面重试</p>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
        }
    }
}