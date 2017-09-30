const RUNNING_TEST=10
const RUNNING_TEST_CELLULAR=10


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
  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height" />
  <meta name="theme-color" content="#4285f4">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" sizes="192x192" href="ofst_192.png">
  <title>ES8/NodeJs One File Speedtester</title>
  <script src="https://openlayers.org/en/v4.3.1/build/ol.js"></script>
  <script src="https://api.mapbox.com/mapbox.js/plugins/arc.js/v0.1.0/arc.js"></script>
  <link rel="stylesheet" href="https://openlayers.org/en/v4.3.1/css/ol.css" type="text/css">
  <style type="text/css">
    * { padding: 0; margin: 0; }
    html, body, .main { height: 100%; width: 100%; font-family: Ubuntu, sans-serif; text-align:center;}
    a { color: #2b2b61 }
    .map { height:100%; width:100%; opacity:1.0; position: absolute; z-index:1;}
    .code { position:absolute; bottom:0; left:0; width:auto; font-size:2vmin; border-radius: 0 1vw 0 0; box-shadow: 0 0 8px #000; background-color:#FFF; color:#555; opacity:.7; z-index:3; padding:4px 10px 4px 10px }
    .main { opacity:.75; position: absolute; z-index:2; background-color:transparent; overflow: hidden; display: grid; border:0; grid-auto-rows: 10% 5% 55% 10% 15%;}
    div[id^="mt_"]{ vertical-align:middle; grid-column:1; margin: auto; }
    input[type=button] { font-size: 4vmin; padding: .5vw 6vw; text-align:center; box-shadow: .1vw .1vw .5vw RGBA(5,5,5,.5); border:0; border-radius: .25vw; }
    #st-start { background: linear-gradient(#73c3f9, #2980b9, #3498db); color: #FFF }
    #st-start:hover { background-color: #08f; color: #fff; border-color: #08f }
    #st-stop { background: linear-gradient(#ff6767, #bd0b0b, #c72e2e); color: #FFF; display:none}
    #st-stop:hover  { background-color: #C23; color: #FFF; border-color: #C23 }
    #mt_1 { font-size: 8vmin; color:#FFF; text-shadow:1px 1px 4px #000 }
    #mt_2 { font-size: 4vmin; color:#444; text-shadow:0px 0px 4px #FFF }
    #mt_5 { display:inline-grid; grid-template-columns: 25% 25% 25% 25%; width: 100%;}
    #mt_5 div { opacity:0;border-radius:1vw; color:#FFF; padding: .3vw 1vw .3vw 1vw; margin: .3vw auto; font-size: 4vmin; background:linear-gradient(#3cc8f9, #3f7f96); text-shadow:0 0 3px #666; box-shadow:0 0 4px #333 }
    .st-sec { width:40px }
    .progress-bar { display: inline-block; position: relative; width:280px;height:280px; margin:0; padding:0; opacity: 0; transition: opacity 1s ease-in-out}
    .progress-bar canvas { position: absolute; left:0}
    .progress-data{ position:relative; top: 80px; text-align: center; color: #48718c}
    #pdAccMB, #pdSpeMB { font-size: 20px }
    #pdUnit,#pdTest  { font-size: 15px }
    #pdSpeed { font-size: 50px; line-height:100% }
  @media only screen and (orientation: landscape) and (max-height: 500px) {
    .main { grid-auto-columns: 50%; grid-auto-rows: 20% 20% 20% 40%; }
    div[id^="mt_"] { grid-column: 2; margin: auto; width:100% }
    #mt_3 { grid-column:1; grid-row-start: 1; grid-row-end: 5; margin: auto auto auto 1vw; }
    #mt_5 { grid-template-columns: 50% 50%; }
  }
  </style>
</head>

<body>
  <div id="map" class="map"></div>
  <div class="code">Designed by: <a href="https://www.linkedin.com/in/guillermolococo">Guillermo Lo Coco</a>
                <br>Source Code: <a href="https://github.com/glococo/onefile-speedtester">Github</a></div>
  <div class="main">
    <div id="mt_1">ES8/Node Speedtest</div>
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

<script id="webWorker" type="javascript/worker">
var Stream  = null
var rDat    = null
class sharedBuffer {
      constructor (sArray) {
        this.status= new Uint8Array(sArray,0,4),    // Status, Percentage Ping-Download-Upload
        this.floats= new Float32Array(sArray,4,8)   // Floats->Ping,Jitter,Download,DownloadCu,DownloadMB,Upload,UploadCu,UploadMB
      }
}
var settings = {
  cUrl: '',                             // current URL received by call
  count_ping: 20,                       // number of pings to perform in ping test
  urlPing: '?action=ping&rnd=',         // empty file, reply with OK 200.
  urlUpload: '?action=upload&rnd=',
  urlDownload: '?action=download&rnd=',
  tUpDown: 20,                          // Seconds to test Upload/Download Speed
  pCache: 5000,                         // Wait miliseconds for increase TCP/IP:window -> maxSpeed
  compFactor: 1.13                      // Compensation for HTTP+TCP+IP+ETH overhead. 925000 is how much data is actually carried over 1048576 (1mb) bytes downloaded/uploaded. This default value assumes HTTP+TCP+IPv4+ETH with typical MTUs over the Internet. You may want to change this if you're going through your local network with a different MTU or if you're going over IPv6
}

onmessage= e=>{
  settings.cUrl= e.data["currentUrl"]
  settings.tUpDown= e.data["seconds"]
  rDat=new sharedBuffer(e.data["sharedArray"])
  ping()
}

function ping() {
  rDat.status[0]= 4
  rDat.status[1]= 0
  var pingDelay= []
  var fetchJitt= 0
  var count= 0

  function doPing(v) {
    let start= performance.now()
    fetch( settings.cUrl+settings.urlPing+Math.random() )
      .then( r=>{
       if(rDat.status[0] == 2) return
       if(r.ok) {
        rDat.floats[0]= pingDelay[v]= performance.now()-start
        if (v>0) fetchJitt+= Math.abs(pingDelay[v]-pingDelay[v-1])
        if (v>1) rDat.floats[1]= fetchJitt / (v-1)
        rDat.status[1]=(v+1)/settings.count_ping*100
        count++
        count<settings.count_ping?doPing(count):download()
       } else {doPing(count)}
      }).catch(r=>doPing(count))
  }
  doPing(0)
}

function download() {
  rDat.status[0]= 5
  rDat.status[2]= 0
  var startDL = new Date().getTime()
  var bytesReceived = 0
  var bytesDiscarded = 0
  var msDiscarded= 0

  function doDownload() {
    fetch( settings.cUrl+settings.urlDownload+Math.random() ).then( r=> {
      var sstream= r.body.getReader()

      sstream.read().then( function keepDL(data) {
        if( data.done ) { doDownload(); return }
        if( rDat.status[0] == 2 ) { sstream.cancel(); return }

        let elapsed= new Date().getTime() - startDL
        rDat.status[2]= elapsed /10 /settings.tUpDown
        bytesReceived+= data.value.length
        rDat.floats[4]= bytesReceived/1024/1024
        if( elapsed >= settings.pCache ) {
          rDat.floats[2]= ((bytesReceived-bytesDiscarded)/131072) /((elapsed-msDiscarded)/1000)
          rDat.floats[3]= rDat.floats[2]/8
        } else {
          bytesDiscarded= bytesReceived
          msDiscarded= elapsed
        }
        if( elapsed > settings.tUpDown*1000 ) { sstream.cancel(); upload(); return }
        return sstream.read().then(keepDL)
      })
    }).catch( e=>console.log(e) )
  }
  doDownload()
}

function upload() {
  rDat.status[0]= 6
  rDat.status[3]= 0

  var startUL = new Date().getTime()
  var bytesSent = 0
  var bytesCurr = 0
  var msDiscarded = 0
  var bytesDiscarded = 0

  var garbage = new Float64Array(128)
  for (let i=0; i<garbage.length; i++) garbage[i] = Math.random()
  var gArray    = []
  for (let i=0; i<1024; i++) gArray.push(garbage);
  var gBlob = new Blob(gArray)   // 1MB random() garbage

  var controller = new FetchController();
  var signal = controller.signal;

  function doUpload() {
    fetch( settings.cUrl+settings.urlUpload+Math.random(),{method:'POST',headers:{"Content-Type":"multipart/form-data"},body:gBlob, signal, observer(o) {
        o.onrequestprogress=e=> {
          let elapsed= new Date().getTime() - startUL
          bytesCurr= e.total
          rDat.status[5]= elapsed /10 /settings.tUpDown
          rDat.floats[7]= (bytesSent+e.total)/1024/1024
          if( elapsed >= settings.pCache ) {
            rDat.floats[5]= ((bytesSent+e.total-bytesDiscarded)/131072) /((elapsed-msDiscarded)/1000)
            rDat.floats[6]= rDat.floats[5]/8
          } else {
            bytesDiscarded= e.total
            msDiscarded= elapsed
          }
          if( rDat.status[0] == 2 ) controller.abort()
          if( elapsed > settings.tUpDown*1000 ) { controller.abort(); rDat.status[0]=1 }
        }
        o.onstatechange=e=> {
          if( o.state=='complete' ) {
            bytesSent+= bytesCurr
            if( elapsed > settings.tUpDown*1000 ) {
              rDat.status[0]=1
            } else {
              doUpload()
            }
          }
        }
      }
    }).catch( e=>console.log("Error uploading: "+e.err) )
  }
  doUpload()
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
  var sArr = new SharedArrayBuffer(36)
  var sDat = {
          status: new Uint8Array(sArr,0,4),   // Status, Seconds, Percentage Ping-Download-Upload
          floats: new Float32Array(sArr,4,8)  // Floats->Ping,Jitter,Download,DownloadCu,DownloadMB,Upload,UploadCu,UploadMB
  }
  var askInterval= null
  var connection= navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var clientIP='${getIP(reqq)}'
  var clientCC=''
  var wireless=''
  var running_seconds=${RUNNING_TEST}
  var pdAccMB= document.getElementById('pdAccMB')
  var pdSpeed= document.getElementById('pdSpeed')
  var pdSpeMB= document.getElementById('pdSpeMB')
  var pdTest = document.getElementById('pdTest')
  var currentTask= 0
  var pTotal= 0
  try { if (connection.type) wireless=connection.type } catch (e) {}
  if (wireless) { document.getElementById('mt_2').innerHTML='Connected trought '+wireless+' - IP: '+clientIP }
    else { document.getElementById('mt_2').innerHTML='Your IP: '+clientIP }
  if (wireless=="cellular") running_seconds=${RUNNING_TEST_CELLULAR}
  var worker = new Worker( window.URL.createObjectURL( new File([ document.querySelector('#webWorker').textContent ], "webWorker.js") ) )
  navigator.serviceWorker.register("/serviceWorker.js")

  function pollSharedMemory() {
    if (sDat.status[0]==4) {
        if(currentTask!=4) { currentTask=4; pdTest.textContent="Ping + Jitter"; pdUnit.textContent="milliseconds"; pdAccMB.textContent=""; }
        pTotal= sDat.status[1]/5
        drawBlue( sDat.status[1], pTotal )
        pdSpeed.textContent= sDat.floats[0].toFixed(2)
        pdSpeMB.textContent= 'Jitter '+sDat.floats[1].toFixed(2)
    } else if (sDat.status[0]==5) {
        if(currentTask!=5) {
          currentTask=5;
          pdUnit.textContent = "Mbps"
          pdSpeed.textContent= "wait.."
          pdTest.textContent = "Downloading...";
          document.getElementById("rPing").innerHTML="Last Ping<br>"+sDat.floats[0].toFixed(2)+" milliseconds"
          document.getElementById("rPing").style.opacity=1
          document.getElementById("rJitter").innerHTML="Jitter<br>"+sDat.floats[1].toFixed(2)+" milliseconds"
          document.getElementById("rJitter").style.opacity=1
        }
        pTotal=sDat.status[2]/5*2+20
        drawBlue( sDat.status[2], pTotal )
        pdAccMB.textContent = (sDat.floats[4]).toFixed(2) + ' MB'
        pdSpeMB.textContent = sDat.floats[3].toFixed(2) + ' MB/s'
        if( sDat.floats[2]!=0 ) pdSpeed.textContent=sDat.floats[2].toFixed(2)
    } else if (sDat.status[0]==6) {
        if(currentTask!=6) {
          currentTask=6
          pdSpeed.textContent="wait.."
          pdTest.textContent ="Uploading..."
          document.getElementById("rDownload").innerHTML="Download "+sDat.floats[2].toFixed(2)+" Mbps<br>Received: "+sDat.floats[4].toFixed(2)
          document.getElementById("rDownload").style.opacity=1
        }
        pTotal=sDat.status[3]/5*2+60
        drawBlue( sDat.status[3], pTotal )
        pdAccMB.textContent = sDat.floats[7].toFixed(2) + ' MB'
        pdSpeMB.textContent = sDat.floats[6].toFixed(2) + ' MB/s'
        if( sDat.floats[5]!=999 ) pdSpeed.textContent=sDat.floats[5].toFixed(2)
    } else if (sDat.status[0]==1) {
        if(currentTask!=1) {
          currentTask=1;
          document.getElementById("rUpload").innerHTML="Upload "+sDat.floats[5].toFixed(2)+" Mbps<br>Sent: "+sDat.floats[7].toFixed(2)
          document.getElementById("rUpload").style.opacity=1
          pdTest.textContent="¡ Finished !";
        }
        pTotal=sDat.status[3]/5*2+60
        drawBlue( sDat.status[3], pTotal )
        pdAccMB.textContent = sDat.floats[7].toFixed(2) + ' MB'
        pdSpeMB.textContent = sDat.floats[6].toFixed(2) + ' MB/s'
        pdSpeed.textContent = sDat.floats[5].toFixed(2)
    }
    if (sDat.status[0]<3) {
        clearInterval(askInterval)
        document.getElementById('st-start').style.display= "unset"
        document.getElementById('st-stop').style.display= "none"
        console.log("Done, status: "+sDat.status[0])
    }
  }

  function stopTest() { sDat.status[0]=2; }
  function startTest() {
    document.getElementById('progress-bar').style.opacity=1;
    document.getElementById('st-start').style.display= "none"
    document.getElementById('st-stop').style.display= "unset"
    worker.postMessage({ currentUrl:window.location.href, seconds:running_seconds, sharedArray:sArr })
    askInterval = setInterval( pollSharedMemory, 250)
  }

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
map.getInteractions().forEach(i=>{i.setActive(false);console.log()})

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
pServer.setGeometry( new ol.geom.Point( ol.proj.transform([13.4105,52.5244],"EPSG:4326","EPSG:3857") ) )
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
      var garbage_size=128
      var garbage = new Float64Array(garbage_size)     // 1KB Random buffer
      for (let i=0; i<garbage_size; i++) garbage[i]= Math.random()
      var second= new Float64Array(garbage_size*1024)  // 1MB Buffer
      for (let i=0;i<1024;i++ ) second[i*garbage_size]=garbage
      for (let i=0;i<10;i++ ) res.write(new Buffer.from(second.buffer))
      res.end()
      break
    default:
      res.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-cache' })
      res.end(print_main(req))

  }
})

srv.listen( process.env.PORT || 3000, console.log('NodeJs running at port 3000') )
