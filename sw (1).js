var CACHE_VERSION = 'v3';
var CACHE_NAME = 'homework-' + CACHE_VERSION;

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function() {
      return clients.claim();
    })
  );
});

// Always fetch from network, don't cache
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    schedulePendingNotifications(e.data.tasks || []);
  }
});

var SUBJECT_NAMES = {
  math:'คณิตศาสตร์', sci:'วิทยาศาสตร์', eng:'อังกฤษ',
  thai:'ภาษาไทย', soc:'สังคม', art:'ศิลปะ', other:'อื่นๆ'
};

function schedulePendingNotifications(tasks) {
  tasks.forEach(function(t) {
    if (t.done || !t.due || t.notified) return;
    var diff = new Date(t.due).getTime() - Date.now();
    if (diff > 0 && diff < 60*60*1000) {
      self.registration.showNotification('ใกล้ถึงกำหนดส่ง', {
        body: t.title + ' — ' + (SUBJECT_NAMES[t.subject] || t.subject),
        tag: 'hw-' + t.id,
        requireInteraction: true
      });
    }
  });
}

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(list) {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
