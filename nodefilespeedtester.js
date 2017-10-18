const RUNNING_TEST=20
const RUNNING_TEST_CELLULAR=10
const MY_SERVER_POSITION='[13.4105,52.5244]'

function getIP (eq){
  var reg=/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/
  var arr= ['x-client-ip','x-forwarded-for','cf-connecting-ip','true-client-ip','x-real-ip','x-cluster-client-ip','x-forwarded','forwarded-for']
  var head_id=arr.find(e=>(eq.headers[e]!=undefined && eq.headers[e].match(reg)) )
  if (head_id) { return eq.headers[head_id] } else { return '127.0.0.1' }
}

var print_main=(reqq) => `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=devic$
  <meta name="theme-color" content="#4285f4">
  <title>ES6/PHP One File Speedtester</title>
  <link rel="stylesheet" href="https://openlayers.org/en/v4.3.1/css/ol.css" type="text/css">
  <script src="https://openlayers.org/en/v4.3.1/build/ol.js"></script>
  <script src="https://api.mapbox.com/mapbox.js/plugins/arc.js/v0.1.0/arc.js"></script>
  <style type="text/css">
    * { padding: 0; margin: 0 }
    html, body, .main { height: 100%; width: 100%; font-family: Ubuntu, sans-serif; text-align:center; }
    a { color: #2b2b61 }
    .map { height:100%; width:100%; opacity:1.0; position: absolute; z-index:1 }
    .code { position:absolute; bottom:0; left:0; width:auto; font-size:2vmin; border-radius: 0 1vw 0 0; box-shadow: 0 0 8px #000; background-color:#FFF; color:#555; opacity:.7; z-index:3; padding:4px 10px 4px 10px }
    .main { opacity:.75; position: absolute; z-index:2; background-color:transparent; overflow: hidden; display: grid; border:0; grid-template: 2fr 1fr 11fr 2fr 3fr / 100% }
    div[id^="mt_"]{ grid-column:1; margin: auto; }
    input[type=button] { font-size: 2.5vmax; padding: .5vw 6vw; text-align:center; box-shadow: .1vw .1vw .5vw RGBA(5,5,5,.5); border:0; border-radius: .25vw; }
    #st-start { background: linear-gradient(#73c3f9, #2980b9, #3498db); color: #FFF }
    #st-start:hover { background-color: #08f; color: #fff; border-color: #08f }
    #st-stop { background: linear-gradient(#ff6767, #bd0b0b, #c72e2e); color: #FFF; display:none}
    #st-stop:hover  { background-color: #C23; color: #FFF; border-color: #C23 }
    #mt_1 { font-size: 8vmin; color:#FFF; text-shadow:1px 1px 4px #000 }
    #mt_2 { font-size: 4vmin; color:#444; text-shadow:0px 0px 4px #FFF }
    #mt_5 { display:inline-flex; flex-wrap: nowrap; width: 100%;}
    #mt_5 div { opacity:0;border-radius:1vw; color:#FFF; padding: .3vw 1vw .3vw 1vw; margin: .3vw auto; font-size: 2vmax; background:linear-gradient(#3cc8f9, #3f7f96); text-shadow:0 0 3px #666; box-shadow:0 0 4px #333 }
    .st-sec { width:40px }
    .progress-bar { display: inline-block; position: relative; width:280px;height:280px; margin:0; padding:0; opacity: 0; transition: opacity 1s ease-in-out}
    .progress-bar canvas { position: absolute; left:0}
    .progress-data{ position:relative; top: 80px; text-align: center; color: #48718c}
    #pdAccMB, #pdSpeMB { font-size: 20px }
    #pdUnit,#pdTest  { font-size: 15px }
    #pdSpeed { font-size: 50px; line-height:100% }
  @media only screen and (orientation: landscape) and (max-height: 500px) {
    .main { grid-template: 1fr 1fr 1fr 2fr / 1fr 1fr; }
    div[id^="mt_"] { grid-column: 2; margin: auto; width:100% }
    #mt_3 { grid-column:1; grid-row-start: 1; grid-row-end: 5; margin: auto auto auto 1vw; }
    #mt_5 { flex-wrap: wrap; }
  }
  </style>
</head>

<body>
  <div id="map" class="map"></div>
  <div class="code">Designed by: <a href="https://www.linkedin.com/in/guillermolococo">Guillermo Lo Coco</a>
                <br>Source Code: <a href="https://github.com/glococo/onefile-speedtester">Github</a></div>
  <div class="main">
    <div id="mt_1">ES6/NODE 1File Speedtest</div>
    <div id="mt_2"></div>
    <div id="mt_3"><div class="progress-bar" id="progress-bar">
        <canvas id="pBase" height="280px" width="280px"></canvas>
        <canvas id="pBlue" height="280px" width="280px"></canvas>
        <div class="progress-data"> <span id="pdAccMB"></span><br><span id="pdSpeed"></span><br><span id="pdUnit"></span><br><span id="pdSpeMB"></span><br><br><span id="pdTest"></span> </div>
      </div>
    </div>
    <div id="mt_4"><input type="button" id="st-start" onclick="startTest()" value=" S t a r t ">
                   <input type="button" id="st-stop" onclick="stopTest()" value=" S t o p ">
    </div>
    <div id="mt_5"> <div id="rPing"></div><div id="rJitter"></div><div id="rDownload"></div><div id="rUpload"></div> </div>
  </div>
</body>

<script id="workerBlob" type="javascript/worker">
var xhr = null              // array of currently active xhr requests
var interval = null
var wStatus = {
  ip: '',
  ping: '',
  pingp: '',                // Ping percentage
  jitter: '',
  upload: '',               // Upload speed
  uploadp: '',              // Upload percentage
  uploadr: '',              // Upload recent speed (last 2 seconds)
  uploadCu: '',             // Current Speed (last 2 seconds)
  uploadMB: '',             // Uploaded MB
  download: '',             // Download speed
  downloadp: '',            // Download percentage
  downloadr: '',            // Download recent speed (last 2 seconds)
  downloadCu: '',           // Current Speed (last 2seconds)
  downloadMB: '',           // Downloaded MB
  status: 0                 // 0:not started, 1=finished, 2=abort/error, 4:Ping+Jitter, 5:Download, 6:Upload
}
var settings = {
  cUrl: '',                             // current URL received by call
  count_ping: 20,                       // number of pings to perform in ping test
  urlPing: '?action=ping&rnd=',         // empty file, reply with OK 200.
  urlUpload: '?action=upload&rnd=',
  urlDownload: '?action=download&rnd=',
  tUpDown: 20,                          // Seconds to test Upload/Download Speed
  pCache: 5000,                         // Wait miliseconds for increase TCP/IP:window -> maxSpeed
  compFactor: 1048576/925000            // Compensation for HTTP+TCP+IP+ETH overhead. 925000 is how much data is actually carried over 1048576 (1mb) bytes downloaded/uploaded. This default value assumes HTTP+TCP+IPv4+ETH with typical MTUs over the Internet. You may want to change this if you're going through your local network with a different MTU or if you're going over IPv6
}

this.addEventListener('message', (e)=>{
  switch(e.data["action"]) {
    case "status": postMessage(wStatus); break;
    case "start":  settings.cUrl= e.data["currentUrl"]; settings.tUpDown= e.data["seconds"]; ping(); break;
    case "abort":  clearRequests(2)
  }
})

function clearRequests(setStatus) {
  if (xhr) {
    try { xhr.abort() } catch (e) { }
    try { xhr.onprogress= null; xhr.onload= null; xhr.onerror= null } catch (e) { }
  }
  xhr = null
  clearInterval(interval)
  wStatus.status= setStatus
}

function ping() {
  wStatus.status=4
  var xhrPing = []
  var xhrJitt = 0
  var counter = 0
  wStatus.pingp = 0

  xhr = new XMLHttpRequest()
  xhr.open('GET', settings.cUrl+settings.urlPing+Math.random() )
  xhr.onload = ()=>{
    wStatus.ping = xhrPing[counter] = (performance.now() - xhrPing[counter]).toFixed(2)
    if (counter>0) xhrJitt+= Math.abs(xhrPing[counter]-xhrPing[counter-1])
    if (counter>1) wStatus.jitter= (xhrJitt / (counter-1)).toFixed(2)
    if (counter<settings.count_ping ) {
      counter++
      wStatus.pingp=((counter/settings.count_ping)*100).toFixed()
      xhrPing[counter] = performance.now()
      if (xhr) { xhr.open('GET', settings.cUrl+settings.urlPing+Math.random()); xhr.send() }
    } else { wStatus.pingp=100; download() }
  }
  xhr.onerror = ()=>{ wStatus.ping= 'Fail'; wStatus.jitter= 'Fail'; clearRequests(2) }
  xhrPing[counter] = performance.now()
  xhr.send()
}

function download() {
  wStatus.status++
  var startTime = new Date().getTime()
  var loadedTot = 0
  var loadedPre = 0
  var loadedAcu = 0
  var speeeding = 1
  var syncPCache= 0
  var loadedArr = []
  var Url= settings.cUrl+settings.urlDownload+Math.random()
  wStatus.downloadp= 0

  xhr = new XMLHttpRequest()
  xhr.responseType= 'arraybuffer'
  xhr.open('GET', Url )
  xhr.onerror= ()=>{
      try { xhr.abort() } catch (e) { }
      wStatus.download= 'Fail'
      clearRequests(2)
  }
  xhr.onload= (o)=>{ loadedAcu+=o.loaded; loadedTot=0; xhr.open('GET',Url); xhr.send() }
  xhr.onprogress= (o)=>loadedTot=o.loaded
  xhr.send()

  interval= setInterval( ()=>{
    let rNow= new Date().getTime()
    let msElapsed= rNow-startTime
    let loadedMBs= (loadedAcu+loadedTot)/1024/1024
    wStatus.downloadp = ((msElapsed/10)/settings.tUpDown).toFixed()
    wStatus.downloadMB= loadedMBs.toFixed(2) + ' MB'
    if(loadedArr.length>7) wStatus.downloadCu=((loadedMBs-loadedArr[8])/2).toFixed(2) + ' MB/s'
    loadedArr.unshift(loadedMBs);
    if (msElapsed>settings.pCache) {
      if(speeeding) {  // Sync greace time with LoadedBuffer
        speeeding=0; loadedPre=loadedTot; syncPCache=rNow-startTime;
      } else {
        speed= (loadedAcu+loadedTot-loadedPre) *1000 / (msElapsed-syncPCache)
        wStatus.download= ((speed*8*settings.compFactor)/1048576).toFixed(2)
      }
      if( (rNow-startTime)>(settings.tUpDown*1000) ) { clearInterval(interval); xhr.abort(); wStatus.downloadp=100; upload() }
    } else { wStatus.download=999 }
  }, 250 )
}

function upload() {
  wStatus.status++
  var arraySize = 104856
  var startTime = new Date().getTime()
  var loadedAcu = 0
  var loadedTot = 0
  var loadedPre = 0
  var speeeding = 1
  var syncPCache= 0
  var loadedArr = []
  var Url= settings.cUrl+settings.urlUpload+Math.random()
  var garbage = new Float32Array(new ArrayBuffer(arraySize))
  for (let i=0; i<garbage.length; i++) garbage[i] = Math.random()
  var gArray    = []
  for (let i=0; i<100; i++) gArray.push(garbage);
  gArray = new Blob(gArray)
  var fd = new FormData();
  fd.append("gfile", gArray);
  wStatus.uploadp= 0

  xhr = new XMLHttpRequest()
  xhr.upload.onprogress= (o)=>loadedTot=o.loaded
  xhr.upload.onload= (o)=>{ loadedAcu+=o.loaded; loadedTot=0; xhr.open('POST',Url, true); xhr.send(fd) }
  xhr.upload.onerror= ()=>{
    try { xhr.abort() } catch (e) { }
    wStatus.download= 'Fail'
    clearRequests(2)
  }
  xhr.open('POST', Url, true )
  xhr.send(fd)

  interval= setInterval( ()=>{
    let rNow= new Date().getTime()
    let msElapsed= rNow-startTime
    let loadedMBs= (loadedAcu+loadedTot)/1024/1024
    wStatus.uploadp=((msElapsed/10)/settings.tUpDown).toFixed()
    wStatus.uploadMB=loadedMBs.toFixed(2) + ' MB'
    if(loadedArr.length>7) wStatus.uploadCu=((loadedMBs-loadedArr[8])/2).toFixed(2) + ' MB/s'
    loadedArr.unshift(loadedMBs);
    if (msElapsed>settings.pCache) {
      if (speeeding) {
        speeeding=0; loadedPre=loadedTot; syncPCache=rNow-startTime;
      } else {
        let speed= (loadedAcu+loadedTot-loadedPre)*1000 / (msElapsed-syncPCache)
        wStatus.upload= ((speed*8*settings.compFactor)/1048576).toFixed(2)
      }
      if( (rNow-startTime)>(settings.tUpDown*1000) ) { wStatus.uploadp=100; clearRequests(1) }
    } else { wStatus.upload=999 }
  }, 250 )

}

</script>

<script type="text/javascript">
  // Canvas Speedometer
  e=document.getElementById('pBase').getContext('2d')
  e.lineCap= 'butt'
  e.beginPath()
  e.lineWidth= 15
  e.strokeStyle= '#DDD'
  e.arc(140,140,129,0,2*Math.PI)
  e.stroke()
  e.beginPath()
  e.lineWidth= 19
  e.strokeStyle= '#AAA'
  e.arc(140,140,110,0,2*Math.PI)
  e.stroke()
  e.beginPath()
  e.strokeStyle= '#EEE'
  e.arc(140,140,110,.25*Math.PI,.75*Math.PI)
  e.stroke()
  e.beginPath()
  e.lineWidth= 0
  e.fillStyle= '#FFF'
  e.arc(140,140,100,0,2*Math.PI)
  e.fill()

function drawBlue(percent,total){
  percent=percent/100
  total=total/100
  var blue= document.getElementById('pBlue').getContext("2d")
  var pArcEnd= (2*percent*Math.PI*.75 + Math.PI*.75)
  var tArcEnd= (2*total*Math.PI*.75 + Math.PI*.75)
  var arcStart= Math.PI*.75

  blue.clearRect(0, 0, 280, 280);

  blue.lineCap= 'butt'
  blue.beginPath()
  blue.setLineDash([]);
  blue.lineWidth= 19
  blue.strokeStyle= '#0BF'
  blue.arc(140,140,110, arcStart, tArcEnd)
  blue.stroke()

  blue.lineCap= 'butt'
  blue.beginPath()
  blue.setLineDash([20, 5])
  blue.lineWidth= 10
  blue.strokeStyle= '#0BF'
  blue.arc(140,140,90, arcStart, pArcEnd)
  blue.stroke()
}

  var worker = null
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var clientIP='${getIP(reqq)}'
  var clientCC=''
  var wireless=''
  var running_test=${RUNNING_TEST}
  try { if (connection.type) wireless=connection.type } catch (e) {}
  if (wireless) { document.getElementById('mt_2').innerHTML='Connected trought '+wireless+' - IP: '+clientIP }
    else { document.getElementById('mt_2').innerHTML='Your IP: '+clientIP }
  if (wireless=="cellular") running_test=${RUNNING_TEST_CELLULAR}

  function startTest() {
    document.getElementById('progress-bar').style.opacity=1;
    document.getElementById('st-start').style.display= "none"
    document.getElementById('st-stop').style.display= "unset"

    var blob = new Blob([ document.querySelector('#workerBlob').textContent ], { type: "text/javascript" })
    worker = new Worker(window.URL.createObjectURL(blob))
    var askInterval = setInterval( ()=>worker.postMessage({action:"status"}), 100)
    worker.onmessage = (e) => {
      var pdAccMB = document.getElementById('pdAccMB')
      var pdSpeed = document.getElementById('pdSpeed')
      var pdSpeMB = document.getElementById('pdSpeMB')
      var pdTest  = document.getElementById('pdTest')
      var pTotal, currentTask=0;

      if (e.data["status"]==4) {
          if(currentTask!=4) { currentTask=4; pdTest.textContent="Ping + Jitter"; pdUnit.textContent = "milliseconds"; pdAccMB.textContent=""; }
          pTotal= e.data["pingp"]/5
          drawBlue( e.data["pingp"], pTotal )
          pdSpeed.textContent= e.data["ping"]
          pdSpeMB.textContent= 'Jitter '+e.data["jitter"]
      } else if (e.data["status"]==5) {
          if(currentTask!=5) {
            currentTask=5;
            pdTest.textContent="Downloading...";
            document.getElementById("rPing").innerHTML="Last ping<br>"+e.data["ping"]+" milliseconds"
            document.getElementById("rPing").style.opacity=1
            document.getElementById("rJitter").innerHTML="Jitter<br>"+e.data["jitter"]+" milliseconds"
            document.getElementById("rJitter").style.opacity=1
            pdUnit.textContent = "Mbps"
          }
          pTotal=e.data["downloadp"]/5*2+20
          drawBlue( e.data["downloadp"], pTotal )
          pdAccMB.textContent = e.data["downloadMB"]
          pdSpeMB.textContent = e.data["downloadCu"]
          e.data["download"]==999?pdSpeed.textContent="wait..":pdSpeed.textContent=e.data["download"]
      } else if (e.data["status"]==6) {
          if(currentTask!=6) {
            currentTask=6;
            pdTest.textContent="Uploading..."
            document.getElementById("rDownload").innerHTML="Download "+e.data["download"]+" Mbps<br>Received: "+e.data["downloadMB"]
            document.getElementById("rDownload").style.opacity=1
          }
          pTotal=e.data["uploadp"]/5*2+60
          drawBlue( e.data["uploadp"], pTotal )
          pdAccMB.textContent = e.data["uploadMB"]
          pdSpeMB.textContent = e.data["uploadCu"]
          e.data["upload"]==999?pdSpeed.textContent="wait..":pdSpeed.textContent=e.data["upload"]
      } else if (e.data["status"]==1) {
          if(currentTask!=1) {
            currentTask=1;
            document.getElementById("rUpload").innerHTML="Upload "+e.data["upload"]+" Mbps<br>Sent: "+e.data["uploadMB"]
            document.getElementById("rUpload").style.opacity=1
            pdTest.textContent="¡ Finished !";
          }
          pTotal=e.data["uploadp"]/5*2+60
          drawBlue( e.data["uploadp"], pTotal )
          pdAccMB.textContent = e.data["uploadMB"]
          pdSpeMB.textContent = e.data["uploadCu"]
          pdSpeed.textContent = e.data["upload"]
      }
      if (e.data["status"]<3) {
          clearInterval(askInterval)
          document.getElementById('st-start').style.display= "unset"
          document.getElementById('st-stop').style.display= "none"
          worker = null
          console.log("Done, status: "+e.data["status"])
      }
    }
    worker.postMessage({ action:"start", currentUrl:window.location.href, seconds: running_test })
  }

  function stopTest() { if (worker) worker.postMessage({action:"abort"}) }

//  OpenLayer stuff
function Arcc(pointA, pointB) {
  pointA= ol.proj.transform(pointA,"EPSG:3857","EPSG:4326")
  pointB= ol.proj.transform(pointB,"EPSG:3857","EPSG:4326")
  var start = { x: pointA[0], y: pointA[1] }
  var end   = { x: pointB[0], y: pointB[1] }
  var generator = new arc.GreatCircle(start, end, {'name': ''})
  var line = generator.Arc(100,{offset:10})
  var coordinates = line.geometries[0].coords
  coordinates.forEach((e,i,a)=>a[i]=ol.proj.transform(e,"EPSG:4326","EPSG:3857") )
  return new ol.geom.LineString(coordinates)
}

var view = new ol.View({ center: [0, 0], zoom: 4})

var map = new ol.Map({
  layers: [ new ol.layer.Tile({ source: new ol.source.OSM() }) ],
  target: 'map', controls: ol.control.defaults({ attribution: false, zoom: false, rotate: false }),
  view: view
})
map.getInteractions().forEach(i=>i.setActive(false))

var geoLoc = new ol.Geolocation({ projection: view.getProjection() });

var anchor = new ol.style.Style({ image: new ol.style.Circle({ radius: 6, fill: new ol.style.Fill({ color: '#3399CC' }), stroke: new ol.style.Stroke({ color: '#fff', width: 2 }) }) })
var tline  = new ol.style.Style({ stroke: new ol.style.Stroke({color:"#0FF", width:8}) })
var pServer= new ol.Feature()
var pClient= new ol.Feature()
var aClient= new ol.Feature()
var CliServ= new ol.Feature()
pServer.setStyle(anchor)
pClient.setStyle(anchor)
CliServ.setStyle(tline)
pServer.setGeometry( new ol.geom.Point( ol.proj.transform(${MY_SERVER_POSITION},"EPSG:4326","EPSG:3857") ) )
ipSourceVector= new ol.source.Vector({ features: [aClient, pClient, pServer, CliServ] })
new ol.layer.Vector({ map: map, source: ipSourceVector });

geoLoc.on('change:position', ()=>{
  let cc= geoLoc.getPosition()
  if (cc) {
    pClient.setGeometry( new ol.geom.Point(cc) )
    CliServ.setGeometry( Arcc(pServer.getGeometry().getCoordinates(),pClient.getGeometry().getCoordinates() ) )
    view.fit(CliServ.getGeometry(), {padding: [50,50,50,50], duration: 2000});
  }
})
geoLoc.on('change:accuracyGeometry', ()=>{aClient.setGeometry(geoLoc.getAccuracyGeometry()) })
window.onresize=(e)=>{view.fit(CliServ.getGeometry(), {padding: [50,50,50,50], duration: 500}) }

fetch('https://ipinfo.io/json',{mode: 'cors'}).then( r=>r.json() )
  .then( r=> clientCC=r.loc.split(",").reverse() )
  .then( s=> clientCC.forEach((e,i)=>clientCC[i]= +clientCC[i]) )
  .then( r=> setTimeout(()=>geoLoc.setProperties({ accuracy:140, position: ol.proj.transform(clientCC,"EPSG:4326","EPSG:3857") }),500) )
setTimeout(()=>geoLoc.setTracking(1),2000)

</script>
</html>`

const h= require('http')
const f= require('fs')
var srv= h.createServer()

f.appendFileSync('nodefilespeedtester.log', '\nServerStarted at '+new Date().toLocaleString('en-GB')+'\n');

srv.on('request', (req,res)=> {
  var url={}
  req.url.split("?").length<2?url="":req.url.split("?")[1].split("&").forEach(e=> url[e.split("=")[0]]=e.split("=")[1])
  switch(url["action"]) {
    case "upload":
    case "ping":
      res.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-cache' })
      res.end()
      break
    case "download":
      f.appendFileSync('nodefilespeedtester.log', new Date().toLocaleString('en-GB')+' -> '+getIP(req)+'\n');
      res.writeHead(200, {'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename=random.dat','Content-Transfer-Encoding':'binary'})
      var random_size=128
      var garbage = new Float64Array(random_size)     // 1KB Random buffer
      for (let i=0; i<random_size; i++) garbage[i]= Math.random()
      var second= new Float64Array(random_size*1024)  // 1MB Buffer
      for (let i=0;i<1024;i++ ) second[i*random_size]=garbage
      for (let i=0;i<100;i++ ) res.write(new Buffer.from(second.buffer))
      res.end()
      break
    default:
      res.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-cache' })
      res.end(print_main(req))

  }
})

srv.listen( process.env.PORT || 3000, console.log('NodeJs running at port 3000') )
