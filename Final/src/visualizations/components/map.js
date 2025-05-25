// 地图可视化组件
var MaskMainCity = '重庆市';
var MapObject;
var bmap;

export function initMap() {
    setTimeout(function(){ 
        DrawMaps(); 
        setTimeout(function(){ 
            Mask(MaskMainCity); 
        }, 1000); 
    }, 500);
}

// 导出这两个函数供 SPA 使用
export function DrawMaps() {
    var dom = document.getElementById("Map");
    if (MapObject == null) {
        MapObject = echarts.init(dom);
    }
    var option = null;
    var Location_1 = ["重庆理工大学(中山图书馆)", [106.537114, 29.459216]];
    var Location_2 = ["重庆理工大学(第一实验楼)", [106.534906, 29.460919]];
    var Location_3 = ["重庆理工大学(教务处)", [106.536397, 29.464051]];
    var MainPoint = [
        { name: Location_1[0], value: Location_1[1] },
        { name: Location_2[0], value: Location_2[1] },
        { name: Location_3[0], value: Location_3[1] }
    ];
    var LineData = [{ coords: [ Location_1[1], Location_2[1], Location_3[1], Location_1[1] ] }];
    
    option = {
        title: { show: false },
        animation: true,
        bmap: {
            center: [106.534906, 29.460919],
            zoom: 13,
            roam: true,
        },
        series: [
            {
                type: 'lines',
                name: 'MainPoint',
                coordinateSystem: 'bmap',
                polyline: true,
                data: LineData,
                lineStyle: { normal: { width: 4, color: '#9400D3' } }
            },
            {
                type: 'effectScatter',
                name: 'MainPoint',
                coordinateSystem: 'bmap',
                data: MainPoint,
                symbolSize: 20,
                showEffectOn: 'render',
                rippleEffect: { brushType: 'stroke', scale: 6 },
                hoverAnimation: true,
                symbolSize: 15,
                label: { normal: { show: false, formatter: '{b}', position: 'right', textStyle: { color: '#800000', fontSize: 20 } } },
                itemStyle: { normal: { borderWidth: 1, color: '#9400D3', shadowBlur: 25, shadowColor: '#9400D3' } }
            },
        ]
    }
    MapObject.setOption(option);
    bmap = MapObject.getModel().getComponent('bmap').getBMap();
    bmap.addControl(new BMap.MapTypeControl());
}

export function Mask(cityName){
    let bdary = new BMap.Boundary();
    bdary.get(cityName, rs => {
        let EN_JW = "180, 90;";
        let NW_JW = "-180, 90;";
        let WS_JW = "-180, -90;";
        let SE_JW = "180, -90;";
        let maxIndex = -1, maxLength = 0;
        for (let i = 0; i < rs.boundaries.length; i++) {
            if (rs.boundaries[i].length > maxLength) {
                maxLength = rs.boundaries[i].length;
                maxIndex = i;
            }
        }
        let ply1 = new BMap.Polygon(rs.boundaries[maxIndex] + ';' + rs.boundaries[maxIndex].split(";")[0] + ';' + SE_JW + WS_JW + NW_JW + EN_JW + SE_JW, {
            strokeColor: "none",
            fillColor: "#ffffff",
            fillOpacity: 1,
            strokeOpacity: 0.5
        });
        bmap.addOverlay(ply1);
        var pointArray = [];
        for (var i = 0; i < rs.boundaries.length; i++) {
            var ply = new BMap.Polygon(rs.boundaries[i], {
                strokeWeight: 4,
                strokeColor: "#D3835D",
                fillColor: ""
            });
            bmap.addOverlay(ply);
            pointArray = pointArray.concat(ply.getPath());
        }
        bmap.setViewport(pointArray);
    });
}

// 教育经历页面背景地图
export function renderEduMapBgFixed() {
    var dom = document.getElementById('edu-map-bg-fixed');
    if (!dom) return;
    var myMap = echarts.init(dom);
    var option = {
        bmap: {
            center: [106.534906, 29.460919],
            zoom: 9,
            roam: false,
            mapStyle: {
                styleJson: [
                    { featureType: 'all', elementType: 'all', stylers: { visibility: 'off' } },
                    { featureType: 'road', elementType: 'geometry', stylers: { visibility: 'on', color: '#e0e0e0' } },
                    { featureType: 'water', elementType: 'geometry', stylers: { visibility: 'on', color: '#f5faff' } }
                ]
            }
        },
        series: [
            {
                type: 'effectScatter',
                coordinateSystem: 'bmap',
                data: [
                    { name: '重庆', value: [106.534906, 29.460919] }
                ],
                symbolSize: 30,
                showEffectOn: 'render',
                rippleEffect: { brushType: 'stroke', scale: 8 },
                itemStyle: { color: '#9400D3', shadowBlur: 20, shadowColor: '#9400D3' }
            }
        ]
    };
    myMap.setOption(option);
    var bmap = myMap.getModel().getComponent('bmap').getBMap();
    // 获取重庆市边界并绘制
    var bdary = new BMap.Boundary();
    bdary.get('重庆市', function(rs) {
        var boundaries = rs.boundaries;
        var allPoints = [];
        for (var i = 0; i < boundaries.length; i++) {
            var ply = new BMap.Polygon(boundaries[i], {
                strokeWeight: 4,
                strokeColor: "#b97b56",
                fillColor: "#fff",
                fillOpacity: 0.0
            });
            bmap.addOverlay(ply);
            allPoints = allPoints.concat(ply.getPath());
        }
        // 视野自适应，合并所有点
        if (allPoints.length > 0) {
            bmap.setViewport(allPoints);
        }
    });
}