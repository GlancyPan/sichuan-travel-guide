// 全局变量
let map = null;
let driving = null;

// 地图配置
const mapConfig = {
    center: [102.0652, 30.6571], // 四川中部坐标
    zoom: 8,
    viewMode: '3D',
    pitch: 50
};

// 路线点位
const routePoints = {
    wenzhou: {
        position: [120.699367, 27.994267],
        name: '温州',
        info: '起点：温州龙湾国际机场'
    },
    chengdu: {
        position: [104.0647, 30.5702],
        name: '成都',
        info: '中转站：春熙路商圈'
    },
    kangding: {
        position: [101.9638, 30.0042],
        name: '康定',
        info: '康定情歌城，海拔2560米'
    },
    tagong: {
        position: [101.5359, 31.2831],
        name: '塔公',
        info: '塔公草原，海拔3730米'
    },
    xinduqiao: {
        position: [101.4799, 30.0427],
        name: '新都桥',
        info: '摄影天堂，海拔3300米'
    },
    siguniang: {
        position: [102.8646, 31.4864],
        name: '四姑娘山',
        info: '四姑娘山景区，海拔3200米'
    }
};

// 景点图片数据
const scenicSpotImages = {
    wenzhou: {
        images: ['https://picsum.photos/id/433/800/600'],  // 机场
        description: '温州龙湾国际机场'
    },
    chengdu: {
        images: [
            'https://picsum.photos/id/1042/800/600',  // 城市街道
            'https://picsum.photos/id/225/800/600'    // 寺庙建筑
        ],
        description: '春熙路商圈、武侯祠'
    },
    kangding: {
        images: [
            'https://picsum.photos/id/167/800/600',   // 山城风光
            'https://picsum.photos/id/116/800/600'    // 城市广场
        ],
        description: '康定情歌城、康定广场'
    },
    tagong: {
        images: [
            'https://picsum.photos/id/164/800/600',   // 寺庙
            'https://picsum.photos/id/112/800/600'    // 草原
        ],
        description: '塔公寺、塔公草原'
    },
    xinduqiao: {
        images: [
            'https://picsum.photos/id/131/800/600',   // 日出
            'https://picsum.photos/id/129/800/600'    // 日落
        ],
        description: '新都桥晨雾、日落'
    },
    siguniang: {
        images: [
            'https://picsum.photos/id/156/800/600',   // 雪山
            'https://picsum.photos/id/110/800/600'    // 山谷
        ],
        description: '四姑娘山、长坪沟'
    }
};

// 地图初始化
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    updateAllWeather();
    // 每30分钟更新一次天气
    setInterval(updateAllWeather, 30 * 60 * 1000);
});

function initMap() {
    map = new AMap.Map('map-container', {
        ...mapConfig,
        resizeEnable: true,
        mapStyle: 'amap://styles/normal'
    });

    // 添加控件
    map.addControl(new AMap.Scale());
    map.addControl(new AMap.ToolBar({
        position: 'RB'
    }));

    // 添加标记点和路线
    addMarkers();
    planRoute();

    // 添加地图点击事件
    map.on('click', function(e) {
        // 清除已有信息窗体
        map.clearInfoWindow();
    });
}

// 添加标记点
function addMarkers() {
    for (let key in routePoints) {
        const point = routePoints[key];
        const marker = new AMap.Marker({
            map: map,
            position: point.position,
            title: point.name,
            animation: 'AMAP_ANIMATION_DROP'
        });

        // 创建信息窗体
        const infoWindow = new AMap.InfoWindow({
            content: `<div class="info-window">
                        <h4>${point.name}</h4>
                        <p>${point.info}</p>
                        <div class="image-preview">
                            <img src="${scenicSpotImages[key].images[0]}" alt="${point.name}" 
                                 onclick="showGallery('${key}')" style="cursor: pointer; max-width: 200px;">
                            <p class="image-desc">${scenicSpotImages[key].description}</p>
                        </div>
                        <button onclick="showRouteInfo('${key}')" class="route-info-btn">查看路线信息</button>
                     </div>`,
            offset: new AMap.Pixel(0, -30)
        });

        // 绑定鼠标点击事件
        marker.on('click', () => {
            map.clearInfoWindow();
            infoWindow.open(map, point.position);
        });
    }
}

// 显示图片画廊
function showGallery(locationKey) {
    const images = scenicSpotImages[locationKey].images;
    const description = scenicSpotImages[locationKey].description;
    const point = routePoints[locationKey];
    
    const galleryHTML = `
        <div class="gallery-overlay" onclick="closeGallery()">
            <div class="gallery-content" onclick="event.stopPropagation()">
                <h3>${point.name}景区照片</h3>
                <div class="gallery-images">
                    ${images.map(img => `
                        <div class="gallery-image">
                            <img src="${img}" alt="${point.name}">
                        </div>
                    `).join('')}
                </div>
                <p class="gallery-description">${description}</p>
                <button onclick="closeGallery()" class="gallery-close">关闭</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', galleryHTML);
}

// 关闭图片画廊
function closeGallery() {
    const gallery = document.querySelector('.gallery-overlay');
    if (gallery) {
        gallery.remove();
    }
}

// 显示路线信息
function showRouteInfo(locationKey) {
    // 获取当前位置在行程中的天数
    const dayIndex = getDayIndex(locationKey);
    if (dayIndex === -1) return;

    // 获取路线起终点
    const route = getRouteByDay(dayIndex);
    if (!route) return;

    // 计算路线信息
    driving.search(
        new AMap.LngLat(route[0][0], route[0][1]),
        new AMap.LngLat(route[1][0], route[1][1]),
        {
            showTraffic: true
        },
        function(status, result) {
            if (status === 'complete') {
                const route = result.routes[0];
                const duration = formatDuration(route.time);
                const distance = (route.distance / 1000).toFixed(1);
                
                const infoHTML = `
                    <div class="route-info-overlay" onclick="closeRouteInfo()">
                        <div class="route-info-content" onclick="event.stopPropagation()">
                            <h3>第${dayIndex + 1}天行程信息</h3>
                            <p>起点：${getLocationName(route.start)}</p>
                            <p>终点：${getLocationName(route.end)}</p>
                            <p>行驶距离：${distance}公里</p>
                            <p>预计用时：${duration}</p>
                            <p>途经主要城市：${route.cities.join(' → ')}</p>
                            <button onclick="closeRouteInfo()" class="route-close">关闭</button>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', infoHTML);
            }
        }
    );
}

// 关闭路线信息
function closeRouteInfo() {
    const routeInfo = document.querySelector('.route-info-overlay');
    if (routeInfo) {
        routeInfo.remove();
    }
}

// 获取位置在行程中的天数索引
function getDayIndex(locationKey) {
    const routes = [
        ['wenzhou', 'chengdu'],
        ['chengdu', 'kangding'],
        ['kangding', 'tagong'],
        ['tagong', 'xinduqiao'],
        ['xinduqiao', 'siguniang'],
        ['siguniang', 'chengdu']
    ];
    
    for (let i = 0; i < routes.length; i++) {
        if (routes[i].includes(locationKey)) {
            return i;
        }
    }
    return -1;
}

// 根据天数获取路线起终点坐标
function getRouteByDay(dayIndex) {
    const routes = [
        [routePoints.wenzhou.position, routePoints.chengdu.position],
        [routePoints.chengdu.position, routePoints.kangding.position],
        [routePoints.kangding.position, routePoints.tagong.position],
        [routePoints.tagong.position, routePoints.xinduqiao.position],
        [routePoints.xinduqiao.position, routePoints.siguniang.position],
        [routePoints.siguniang.position, routePoints.chengdu.position]
    ];
    return routes[dayIndex];
}

// 格式化时间
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
}

// 获取位置名称
function getLocationName(lnglat) {
    for (let key in routePoints) {
        const point = routePoints[key];
        if (point.position[0] === lnglat.lng && point.position[1] === lnglat.lat) {
            return point.name;
        }
    }
    return '未知位置';
}

// 规划路线
function planRoute() {
    if (driving) {
        driving.clear();
    }

    driving = new AMap.Driving({
        map: map,
        panel: "panel",
        hideMarkers: true
    });
    
    // 规划六天行程路线
    const routes = [
        [routePoints.wenzhou.position, routePoints.chengdu.position],    // 第一天
        [routePoints.chengdu.position, routePoints.kangding.position],   // 第二天
        [routePoints.kangding.position, routePoints.tagong.position],    // 第三天
        [routePoints.tagong.position, routePoints.xinduqiao.position],   // 第四天
        [routePoints.xinduqiao.position, routePoints.siguniang.position],// 第五天
        [routePoints.siguniang.position, routePoints.chengdu.position]   // 第六天
    ];
    
    routes.forEach((route, index) => {
        const routeStyle = {
            strokeColor: getRouteColor(index),
            strokeWeight: 6,
            strokeOpacity: 0.8
        };

        driving.search(
            new AMap.LngLat(route[0][0], route[0][1]),
            new AMap.LngLat(route[1][0], route[1][1]),
            {
                showTraffic: true,
                styleOptions: routeStyle
            }
        );
    });
}

// 获取路线颜色
function getRouteColor(index) {
    const colors = [
        '#FF4E50', // 红色
        '#FC913A', // 橙色
        '#F9D423', // 黄色
        '#4ecdc4', // 青色
        '#45B7D1', // 蓝色
        '#96CEB4'  // 绿色
    ];
    return colors[index % colors.length];
}

// 天气更新功能
async function updateWeather(city) {
    try {
        const weatherInfo = document.querySelector(`.weather-info[data-city="${city}"]`);
        if (!weatherInfo) return;

        const response = await mcp_amap_amap_sse_maps_weather({ city });
        
        if (response && response.lives && response.lives[0]) {
            const data = response.lives[0];
            weatherInfo.innerHTML = `
                <h4>${city}实时天气</h4>
                <p>温度：${data.temperature}°C</p>
                <p>天气：${data.weather}</p>
                <p>风向：${data.winddirection}</p>
                <p>风力：${data.windpower}</p>
                <p>湿度：${data.humidity}%</p>
                <p class="update-time">更新时间：${data.reporttime}</p>
            `;
        } else {
            throw new Error('无法获取天气数据');
        }
    } catch (error) {
        console.error(`获取${city}天气信息失败:`, error);
        const weatherInfo = document.querySelector(`.weather-info[data-city="${city}"]`);
        if (weatherInfo) {
            weatherInfo.innerHTML = `
                <h4>${city}</h4>
                <p class="error">暂时无法获取天气信息</p>
            `;
        }
    }
}

// 更新所有城市的天气
function updateAllWeather() {
    const cities = ['康定', '新都桥', '四姑娘山'];
    cities.forEach(city => updateWeather(city));
} 