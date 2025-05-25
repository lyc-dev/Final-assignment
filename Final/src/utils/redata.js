// 处理关系数据为力导向图所需的格式
const relationshipData = [
    {
        "name": "lyc",
        "label": "廖云川",
        "image": "image/lyc.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级电子1班学生"
    },
    {
        "name": "ymk",
        "label": "叶马可",
        "image": "image/ymk.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级电子1班学生",
        "relation": "室友",
        "target": "lyc"
    },
    {
        "name": "ly",
        "label": "刘烨",
        "image": "image/ly.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级电子1班学生",
        "relation": "室友",
        "target": "lyc"
    },
    {
        "name": "xqj",
        "label": "熊秋锦",
        "image": "image/xqj.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级电子1班学生",
        "relation": "室友",
        "target": "lyc"
    },
    {
        "name": "wpr",
        "label": "王培荣",
        "image": "image/wpr.jpg",
        "desc": "重庆理工大学电气与电气工程学院数据可视化教师",
        "relation": "老师",
        "target": "lyc"
    },
    {
        "name": "lr",
        "label": "李瑞",
        "image": "image/lr.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级电子4班学生",
        "relation": "同学",
        "target": "lyc"
    },
    {
        "name": "zcj",
        "label": "邹承江",
        "image": "image/zcj.jpg",
        "desc": "重庆理工大学电气与电气工程学院2023级电子4班学生",
        "relation": "直系学弟",
        "target": "lyc"
    },
    {
        "name": "hxy",
        "label": "胡新宇",
        "image": "image/hxy.jpg",
        "desc": "重庆理工大学电气与电气工程学院党委书记",
        "relation": "班导师",
        "target": "lyc"
    },
    {
        "name": "hb",
        "label": "胡斌",
        "image": "image/hb.jpg",
        "desc": "重庆理工大学电气与电气工程学院2022级通信3班胡斌",
        "relation": "同学",
        "target": "lyc"
    }
];

// 转换数据为力导向图所需的格式
const graphData = {
    nodes: [
        { id: "lyc", name: "廖云川", group: 1, image: "image/lyc.jpg", desc: "重庆理工大学电气与电气工程学院2022级电子1班学生" },
        { id: "ymk", name: "叶马可", group: 2, image: "image/ymk.jpg", desc: "重庆理工大学电气与电气工程学院2022级电子1班学生" },
        { id: "ly", name: "刘烨", group: 2, image: "image/ly.jpg", desc: "重庆理工大学电气与电气工程学院2022级电子1班学生" },
        { id: "xqj", name: "熊秋锦", group: 2, image: "image/xqj.jpg", desc: "重庆理工大学电气与电气工程学院2022级电子1班学生" },
        { id: "wpr", name: "王培荣", group: 3, image: "image/wpr.jpg", desc: "重庆理工大学电气与电气工程学院数据可视化教师" },
        { id: "lr", name: "李瑞", group: 2, image: "image/lr.jpg", desc: "重庆理工大学电气与电气工程学院2022级电子4班学生" },
        { id: "zcj", name: "邹承江", group: 4, image: "image/zcj.jpg", desc: "重庆理工大学电气与电气工程学院2023级电子4班学生" },
        { id: "hxy", name: "胡新宇", group: 5, image: "image/hxy.jpg", desc: "重庆理工大学电气与电气工程学院党委书记" },
        { id: "hb", name: "胡斌", group: 2, image: "image/hb.jpg", desc: "重庆理工大学电气与电气工程学院2022级通信3班胡斌" }
    ],
    links: [
        { source: "ymk", target: "lyc", relation: "室友" },
        { source: "ly", target: "lyc", relation: "室友" },
        { source: "xqj", target: "lyc", relation: "室友" },
        { source: "wpr", target: "lyc", relation: "老师" },
        { source: "lr", target: "lyc", relation: "同学" },
        { source: "zcj", target: "lyc", relation: "直系学弟" },
        { source: "hxy", target: "lyc", relation: "班导师" },
        { source: "hb", target: "lyc", relation: "同学" }
    ]
};