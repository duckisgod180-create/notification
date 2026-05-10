// Service Worker for สมุดจดการบ้าน
var CACHE_NAME = 'homework-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// Listen for messages from the main page
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    var tasks = e.data.tasks || [];
    schedulePendingNotifications(tasks);
  }
  if (e.data && e.data.type === 'SCHEDULE_CLASS') {
    var schedule = e.data.schedule || [];
    scheduleClassNotifications(schedule);
  }
});

function schedulePendingNotifications(tasks) {
  // Clear existing alarms and re-check
  tasks.forEach(function(t) {
    if (t.done || !t.due || t.notified) return;
    var dueMs = new Date(t.due).getTime();
    var now = Date.now();
    var diff = dueMs - now;
    // Notify if within 1 hour
    if (diff > 0 && diff < 60 * 60 * 1000) {
      self.registration.showNotification('ใกล้ถึงกำหนดส่ง', {
        body: t.title + ' — ' + subjectName(t.subject),
        icon: '/newhomework/icon.png',
        tag: 'hw-' + t.id,
        requireInteraction: true
      });
    }
  });
}

var SUBJECT_NAMES = {
  math: 'คณิตศาสตร์', sci: 'วิทยาศาสตร์', eng: 'อังกฤษ',
  thai: 'ภาษาไทย', soc: 'สังคม', art: 'ศิลปะ', other: 'อื่นๆ'
};
function subjectName(s) { return SUBJECT_NAMES[s] || s; }

// Class schedule notifications
var classTimers = [];
function scheduleClassNotifications(schedule) {
  // schedule = [{day, period, start, subject}]
  // Called every time page loads; SW keeps running
  schedule.forEach(function(item) {
    var ms = msUntilTime(item.day, item.startHour, item.startMin);
    if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
      setTimeout(function() {
        self.registration.showNotification('เริ่มคาบ ' + item.period, {
          body: item.subject + ' — ' + item.time,
          icon: '/newhomework/icon.png',
          tag: 'class-' + item.day + '-' + item.period,
          silent: false
        });
      }, ms);
    }
  });
}

function msUntilTime(targetDay, hour, min) {
  var now = new Date();
  var target = new Date();
  target.setHours(hour, min, 0, 0);
  var dayDiff = targetDay - now.getDay();
  if (dayDiff < 0) dayDiff += 7;
  if (dayDiff === 0 && target <= now) dayDiff = 7;
  target.setDate(target.getDate() + dayDiff);
  return target.getTime() - now.getTime();
}

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/newhomework/');
    })
  );
});
