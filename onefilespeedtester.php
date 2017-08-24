<?php
switch( $_GET["action"] ) {
  case "getIp":
    echo $_SERVER['REMOTE_ADDR'];
    break;
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
        .st-btn { margin-top: -0.5rem; margin-left: 1.5rem; }
        .st-value>span:empty::before { content: "0.00"; color: #636c72; }
        #st-ip:empty::before { content: "___.___.___.___"; color: #636c72; }
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
                    Your IP: <span id="st-ip"></span>
                </p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Download</h3>
                <p class="display-4 st-value"><span id="st-download"></span></p>
                <p class="lead">Mbit/s</p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Upload</h3>
                <p class="display-4 st-value"><span id="st-upload"></span></p>
                <p class="lead">Mbit/s</p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Ping</h3>
                <p class="display-4 st-value"><span id="st-ping"></span></p>
                <p class="lead">ms</p>
            </div>
            <div class="col-lg-3 col-md-6 mb-3 st-block">
                <h3>Jitter</h3>
                <p class="display-4 st-value"><span id="st-jitter"></span></p>
                <p class="lead">ms</p>
            </div>
        </div>
    </div>

<script id="workerBlob" type="javascript/worker">
var xhr = null                          // array of currently active xhr requests
var interval = null
var wStatus = {
  ip: '',
  ping: '',
  jitter: '',
  upload: '',
  download: '',
  status: 0                             // 0:not started, 1=finished, 2=abort/error, 3:IP, 4:Ping+Jitter, 5:Download, 6:Upload
}
var settings = {
  cUrl: '',                             // current URL received by call
  count_ping: 20,                       // number of pings to perform in ping test
  urlPing: '?action=ping&rnd=',         // path to an empty file, used for ping test. must be relative to this js file
  urlGetIp: '?action=getIp&rnd=',       // path to getIP.php relative to this js file, or a similar thing that outputs the client's ip
  urlUpload: '?action=upload&rnd=',
  urlDownload: '?action=download&rnd=',
  tUpload: 20,                          // Seconds to test Upload Speed
  tDownload: 20,                        // Seconds to test Download Speed
  pCache: 3000,                         // Wait for increase TCP/IP:window -> maxSpeed
  compFactor: 1048576/925000            // Compensation for HTTP+TCP+IP+ETH overhead. 925000 is how much data is actually carried over 1048576 (1mb) bytes downloaded/uploaded. This default value assumes HTTP+TCP+IPv4+ETH with typical MTUs over the Internet. You may want to change this if you're going through your local network with a different MTU or if you're going over IPv6
}

this.addEventListener('message', (e)=>{
  switch(e.data["action"]) {
    case "status": postMessage(wStatus); break;
    case "start":  settings.cUrl= e.data["currentUrl"]; getIp(); break;
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

function getIp() {
  wStatus.status= 3
  xhr = new XMLHttpRequest()
  xhr.onload=f=>{ wStatus.ip=xhr.responseText; ping(); }
  xhr.open('GET', settings.cUrl+settings.urlGetIp+Math.random() )
  xhr.send()
}

function ping() {
  wStatus.status++
  var xhrPing = []
  var xhrJitt = 0;
  var counter = 0;

  xhr = new XMLHttpRequest()
  xhr.open('GET', settings.cUrl+settings.urlPing+Math.random() )
  xhr.onload = ()=>{
    wStatus.ping = xhrPing[counter] = (performance.now() - xhrPing[counter]).toFixed(2)
    if (counter>0) xhrJitt+= Math.abs(xhrPing[counter]-xhrPing[counter-1])
    if (counter>1) wStatus.jitter= (xhrJitt / (counter-1)).toFixed(2)
    if (counter<settings.count_ping ) {
      counter++
      xhrPing[counter] = performance.now()
      if (xhr) { xhr.open('GET', settings.cUrl+settings.urlPing+Math.random()); xhr.send() }
    } else { download() }
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
  var Url= settings.cUrl+settings.urlDownload+Math.random()

  xhr = new XMLHttpRequest()
  xhr.responseType= 'arraybuffer'
  xhr.open('GET', Url )
  xhr.onerror= ()=>{
      try { xhr.abort() } catch (e) { }
      wStatus.download= 'Fail'
      clearRequests(2)
  }
  xhr.onload= ()=>{ xhr.open('GET',Url); xhr.send() }
  xhr.onprogress= (o)=>{ (new Date().getTime()-startTime)>settings.pCache ? loadedTot=o.loaded : loadedPre=o.loaded }
  xhr.send()

  interval= setInterval( ()=>{
    let msElapsed= new Date().getTime()-startTime
    if (msElapsed>settings.pCache && loadedTot>0) {
      let speed= (loadedTot-loadedPre) / ((msElapsed-settings.pCache) / 1000.0)
      wStatus.download= ((speed*8*settings.compFactor)/1048576).toFixed(2)
      if( (new Date().getTime()-startTime)>(settings.tDownload*1000) ) { clearInterval(interval); xhr.abort(); upload() }
    } else { wStatus.download= 'wait' }
  }, 200 )
}

function upload() {
  wStatus.status++
  var arraySize = 104856
  var startTime = new Date().getTime()
  var uploaded  = 0
  var loadedTot = 0
  var loadedPre = 0
  var Url= settings.cUrl+settings.urlUpload+Math.random()
  var garbage = new Float32Array(new ArrayBuffer(arraySize))
  for (let i=0; i<garbage.length; i++) garbage[i] = Math.random()
  var gArray    = []
  for (let i=0; i<100; i++) gArray.push(garbage);
  gArray = new Blob(gArray)
  var fd = new FormData();
  fd.append("gfile", gArray);

  xhr = new XMLHttpRequest()
  xhr.upload.onprogress= (o)=>{ (new Date().getTime()-startTime)>settings.pCache ? loadedTot=o.loaded : loadedPre=o.loaded }
  xhr.upload.onload= (o)=>{ uploaded+=o.loaded; console.log("ooo: "+o.loaded); loadedTot=0; xhr.open('POST',Url, true); xhr.send(fd) }
  xhr.upload.onerror= ()=>{
    try { xhr.abort() } catch (e) { }
    wStatus.download= 'Fail'
    clearRequests(2)
  }
  xhr.open('POST', Url, true )
  xhr.send(fd)

  interval= setInterval( ()=>{
    let msElapsed= new Date().getTime()-startTime
    if (msElapsed>settings.pCache && (loadedTot>0||uploaded>0) ) {
      let speed= (uploaded+loadedTot-loadedPre) / ((msElapsed-settings.pCache) / 1000.0)
      wStatus.upload= ((speed*8*settings.compFactor)/1048576).toFixed(2)
      if( (new Date().getTime()-startTime)>(settings.tUpload*1000) ) clearRequests(1)
    } else { wStatus.upload= 'wait' }
  }, 200 )

}

</script>

<script type="text/javascript">

  var worker = null

  function startTest() {
    document.getElementById('st-start').hidden = true
    document.getElementById('st-stop').hidden = false

    var blob = new Blob([ document.querySelector('#workerBlob').textContent ], { type: "text/javascript" });
    worker = new Worker(window.URL.createObjectURL(blob));
    var askInterval = setInterval( ()=>worker.postMessage({action:"status"}), 100)
    worker.onmessage = (e) => {
      var ip = document.getElementById('st-ip')
      var ping = document.getElementById('st-ping')
      var jitter = document.getElementById('st-jitter')
      var upload = document.getElementById('st-upload')
      var download = document.getElementById('st-download')

      if (e.data["status"] < 3) {
        clearInterval(askInterval)
        document.getElementById('st-start').hidden = false
        document.getElementById('st-stop').hidden = true
        worker = null
        console.log("Done, status: "+e.data["status"])
      }
      ip.textContent = e.data["ip"]
      ping.textContent = e.data["ping"]
      jitter.textContent = e.data["jitter"]
      upload.textContent = e.data["upload"]
      download.textContent = e.data["download"]
    }
    worker.postMessage({ action:"start", currentUrl:window.location.href })
  }

  function stopTest() { if (worker) worker.postMessage({action:"abort"}) }

</script>

</body>
</html>


<?php
}
?>
