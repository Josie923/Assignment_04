mapboxgl.accessToken = 'pk.eyJ1Ijoiam9zaWUwOTIzMTAiLCJhIjoiY20xNDBuejgzMWo1bzJpcTJ1YjBjbXpncCJ9.0iHQV9BxlqBxfklfiR_lKQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/josie092310/cm6jjlk9q00bq01qqfgy82xr5',
    center: [-98.5795, 39.8283], // 美国的中心点（大致位于堪萨斯州）
    zoom: 3.5  // 适合全美视角
});


map.on('load', function () {

    // 添加新的数据源
    map.addSource('states', {
        'type': 'geojson',
        'data': 'data/census_states_updated.geojson'
    });
    
    fetch('data/census_counties_updated.geojson.gz')  // 读取 .gz 文件
    .then(response => response.arrayBuffer())      // 获取二进制数据
    .then(buffer => {
        let decompressed = pako.inflate(buffer, { to: 'string' });  // 解压 gzip
        let geojson = JSON.parse(decompressed);  // 解析 JSON
        map.addSource('counties', {
            'type': 'geojson',
            'data': geojson  // 直接传递 JSON 数据
        });

        // ✅ 重新添加县级图层（确保解压后再添加）
        map.addLayer({
            'id': 'county_layer',
            'type': 'fill',
            'source': 'counties',
            'paint': {
                'fill-color': [
                    'interpolate', ['linear'], ['get', 'B02015_002E'],
                    0, 'rgb(201, 219, 236)',      // 0 - 1K
                    1000, 'rgba(158, 202, 225, 1)',   // 1K - 3K
                    3000, 'rgba(107, 174, 214, 1)',  // 3K - 10K
                    10000, 'rgba(49, 130, 189, 1)',   // 10K - 30K
                    30000, 'rgba(8, 81, 156, 1)'     // 30K+
                ],
                'fill-outline-color': 'rgba(0, 65, 131, 0.4)'
            },
            'minzoom': 5
        }, 'water');
    })
    .catch(error => console.error('Error loading GZipped GeoJSON:', error));



    

    // This is the function that finds the first symbol layer
let layers = map.getStyle().layers;
let firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    console.log(layers[i].id); // This is the line of code that we are adding
    if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
    }
}
 
    
    
    
    
    map.addLayer({
        'id': 'state_layer',
        'type': 'fill',
        'source': 'states',
        'paint': {
            'fill-color': [
                'interpolate', ['linear'], ['get', 'B02015_002E'],
                0, 'rgb(201, 219, 236)',     // 0 - 50K
                50000, 'rgba(158, 202, 225, 1)',  // 50K - 200K
                200000, 'rgba(107, 174, 214, 1)', // 200K - 500K
                500000, 'rgba(49, 130, 189, 1)',  // 500K - 1M
                1000000, 'rgba(8, 81, 156, 1)'  // 1M+
            ],
            'fill-outline-color': 'rgba(0, 65, 131, 0.4)'  // 给州添加黑色边界

        },
        'minzoom': 0,  // 全国级显示
        'maxzoom': 5   // 放大到 5 级时隐藏
    }, 'water');
    
        
 
    


});



// Create the popup for all layers
function createPopup(layerId, title, properties, e) {
    let name = e.features[0].properties.NAME || "Unknown";
    let chinesePop = e.features[0].properties.B02015_002E || 0;
    let totalPop = e.features[0].properties.B01003_001E || 1;
    

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<b>${title}:</b> ${name} <br>
                  <b>Chinese Population:</b> ${chinesePop} <br>
                  `)
        .addTo(map);
}

// Apply to state layer
map.on('click', 'state_layer', function (e) {
    createPopup('state_layer', 'State', e.features[0].properties, e);
});

// Apply to county layer
map.on('click', 'county_layer', function (e) {
    createPopup('county_layer', 'County', e.features[0].properties, e);
});




// 地图加载完成后执行
map.on('load', function () {
    console.log("Map has loaded");

    // 这里是你的 map.addSource(), map.addLayer() 等代码...

});

// ✅ 在这里添加监听 zoom 事件的代码
map.on('zoom', function () {
    let zoomLevel = map.getZoom();

    const legendTitle = document.getElementById("legend-title");
    const legendContent = document.getElementById("legend-content");

    if (zoomLevel < 5) {
        // 显示州级图例
        legendTitle.innerHTML = "Chinese Population by State";
        legendContent.innerHTML = `
            <div><span style="background-color: rgb(224, 234, 243)"></span>0 - 50K</div>
            <div><span style="background-color: rgb(185, 219, 236)"></span>50K - 200K</div>
            <div><span style="background-color: rgba(107, 174, 214, 1)"></span>200K - 500K</div>
            <div><span style="background-color: rgba(49, 130, 189, 1)"></span>500K - 1M</div>
            <div><span style="background-color: rgba(8, 81, 156, 1)"></span>1M+</div>
        `;
    } else if (zoomLevel >= 5 && zoomLevel < 9) {
        // 显示县级图例
        legendTitle.innerHTML = "Chinese Population by County";
        legendContent.innerHTML = `
            <div><span style="background-color: rgb(224, 234, 243)"></span>0 - 1K</div>
            <div><span style="background-color: rgb(185, 219, 236)"></span>1K - 3K</div>
            <div><span style="background-color: rgba(107, 174, 214, 1)"></span>3K - 10K</div>
            <div><span style="background-color: rgba(49, 130, 189, 1)"></span>10K - 30K</div>
            <div><span style="background-color: rgba(8, 81, 156, 1)"></span>30K+</div>
        `;
        
    
    }
});



// Change the cursor to a pointer when the mouse is over the turnstileData layer.
map.on('mouseenter', 'RestaurantData', function () {
    map.getCanvas().style.cursor = 'pointer';
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'RestaurantData', function () {
    map.getCanvas().style.cursor = '';
});