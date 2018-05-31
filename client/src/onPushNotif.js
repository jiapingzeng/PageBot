function showNotification() {
  return new Promise(resolve => {

      self.registration
          .getNotifications()
          .then(() => {
              const icon = `../public/logo.png`;
              return self.registration
                  .showNotification("Page Bot", {body:"A customer wants your help!", image:icon, icon: icon})
          })
          .then(resolve)
  })
}
self.addEventListener('push', (e)=>{
  e.waitUntil(
    showNotification()
  )
})
//self is the same as window[0]
self.addEventListener('notificationclick', (e) => {
    if (e.action !== 'close') 
      clients.openWindow('/');
    e.notification.close();
})