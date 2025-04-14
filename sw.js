const CACHE_NAME = 'sichuan-travel-guide-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/styles.css'
];

// 安装Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 处理fetch请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
    );
});

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'syncData') {
        event.waitUntil(
            // 执行数据同步
            syncData()
        );
    }
});

// 推送通知
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/images/icon-180x180.png',
        badge: '/images/favicon-32x32.png'
    };

    event.waitUntil(
        self.registration.showNotification('川西小环线攻略更新', options)
    );
}); 