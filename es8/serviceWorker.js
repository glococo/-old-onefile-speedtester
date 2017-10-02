oninstall= e=> e.waitUntil( caches.open('SpeedTester').then( c=> c.addAll([ '/' ]).then(n=> self.skipWaiting()) ) )
onactivate= e=> e.waitUntil( self.clients.claim() )
onfetch= e=> e.respondWith( caches.match(e.request).then( r=> { return r || fetch(e.request) }) )


