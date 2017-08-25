<?php
switch( $_GET["action"] ) {
  case "upload":
  case "ping":
    header("HTTP/1.1 200 OK");
    break;
  case "download":
    header("X-Accel-Buffering: no"); // disable ngnix webServer buffering
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=random.dat');
    header('Content-Transfer-Encoding: binary');
    ob_end_flush();  // close PHP output buffering
    $data=openssl_random_pseudo_bytes(1048576);
    for( $i=0; $i<100000; $i++ ) {
      echo $data;
      flush();
    }
    break;
  default:
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>ES6/PHP One File Speedtester</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">

  <style type="text/css">
        .st-block { text-align: center; }
        .st-sec { width:40px; }
  </style>
</head>

<body class="my-4">

    <div class="container">
        <div class="row">

            <div class="col-sm-12 mb-3">
                <p class="h1">
                    ES6/PHP One File Speedtest
                    <button id="st-start" class="btn btn-outline-primary st-btn" onclick="startTest()">Start</button>
                    <button id="st-stop" class="btn btn-danger st-btn" onclick="stopTest()" hidden="true">Stop</button>
                </p>
                <p class="lead">
                    Your IP: <span id="st-ip"></span> - Your connection is <span id="st-co"></span> - Default Up/Down seconds <input class="st-sec" id="st-sec" type="text" value="20">
                </p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Ping</h3>
                <p id="st-pingp"></p>
                <span class="display-4" id="st-ping">0.00</span>
                <span class="lead">ms</span>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Jitter</h3>
                <p id="st-jitterp"></p>
                <span class="display-4" id="st-jitter">0.00</span>
                <span class="lead">ms</span>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Download</h3>
                <p id="st-downloadp"></p>
                <span class="display-4" id="st-download">0.00</span>
                <span class="lead">Mbit/s</span><br><span id="cu-download"></span></p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Upload</h3>
                <p id="st-uploadp"></p>
                <p><span class="display-4" id="st-upload">0.00</span>
                <span class="lead">Mbit/s</span><br><span id="cu-upload"></span></p>
            </div>
        </div>
    </div>

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
  wStatus.pingp = '0 %'

  xhr = new XMLHttpRequest()
  xhr.open('GET', settings.cUrl+settings.urlPing+Math.random() )
  xhr.onload = ()=>{
    wStatus.ping = xhrPing[counter] = (performance.now() - xhrPing[counter]).toFixed(2)
    if (counter>0) xhrJitt+= Math.abs(xhrPing[counter]-xhrPing[counter-1])
    if (counter>1) wStatus.jitter= (xhrJitt / (counter-1)).toFixed(2)
    if (counter<settings.count_ping ) {
      counter++
      wStatus.pingp=((counter/settings.count_ping)*100).toFixed() + ' %'
      xhrPing[counter] = performance.now()
      if (xhr) { xhr.open('GET', settings.cUrl+settings.urlPing+Math.random()); xhr.send() }
    } else { wStatus.pingp='100 %'; download() }
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
  wStatus.downloadp= '0 %'

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
    wStatus.downloadp = ((msElapsed/10)/settings.tUpDown).toFixed() + ' %'
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
      if( (rNow-startTime)>(settings.tUpDown*1000) ) { clearInterval(interval); xhr.abort(); wStatus.downloadp= '100 %'; upload() }
    } else { wStatus.download='wait' }
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
  wStatus.uploadp= '0 %'

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
    wStatus.uploadp=((msElapsed/10)/settings.tUpDown).toFixed() + ' %'
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
      if( (rNow-startTime)>(settings.tUpDown*1000) ) { wStatus.uploadp= '100 %'; clearRequests(1) }
    } else { wStatus.upload= 'wait' }
  }, 250 )

}

</script>

<script type="text/javascript">

  var worker = null
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  document.getElementById('st-ip').textContent='<?php echo $_SERVER['REMOTE_ADDR']?>'
  document.getElementById('st-co').textContent=connection.type
  if( connection.type=='cellular' ) document.getElementById('st-sec').value=10

  function startTest() {
    if( document.getElementById('st-sec').value<5 ) document.getElementById('st-sec').value=5

    document.getElementById('st-start').hidden = true
    document.getElementById('st-stop').hidden = false

    var blob = new Blob([ document.querySelector('#workerBlob').textContent ], { type: "text/javascript" });
    worker = new Worker(window.URL.createObjectURL(blob));
    var askInterval = setInterval( ()=>worker.postMessage({action:"status"}), 100)
    worker.onmessage = (e) => {
      var ping = document.getElementById('st-ping')
      var pingp = document.getElementById('st-pingp')
      var jitter = document.getElementById('st-jitter')
      var jitterp = document.getElementById('st-jitterp')
      var upload = document.getElementById('st-upload')
      var uploadp = document.getElementById('st-uploadp')
      var uploadCu = document.getElementById('cu-upload')
      var download = document.getElementById('st-download')
      var downloadp = document.getElementById('st-downloadp')
      var downloadCu = document.getElementById('cu-download')

      if (e.data["status"] < 3) {
        clearInterval(askInterval)
        document.getElementById('st-start').hidden = false
        document.getElementById('st-stop').hidden = true
        worker = null
        console.log("Done, status: "+e.data["status"])
      }
      ping.textContent = e.data["ping"]
      pingp.textContent = e.data["pingp"]
      jitter.textContent = e.data["jitter"]
      jitterp.textContent = e.data["pingp"]
      download.textContent = e.data["download"]
      downloadCu.textContent = e.data["downloadCu"]
      downloadp.textContent = e.data["downloadp"]+' - '+e.data["downloadMB"]
      upload.textContent = e.data["upload"]
      uploadCu.textContent = e.data["uploadCu"]
      uploadp.textContent = e.data["uploadp"]+' - '+e.data["uploadMB"]
    }
    worker.postMessage({ action:"start", currentUrl:window.location.href, seconds:document.getElementById('st-sec').value })
  }

  function stopTest() { if (worker) worker.postMessage({action:"abort"}) }

</script>

</body>
</html>


<?php
}
?>
