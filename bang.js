var Bang = (function() {
  //
  // Init
  //
  console.info("Jeannette Bang - ©2019 by Gnax");
  var my = {
    score: 0,
  },
  debug = false,
  BangVid = document.createElement("video"),
  BangAud = document.createElement("audio"),
  frames = [],
  lastPos, lastHash,
  bufCan, bufCtx,
  BangCan,
  CanvasCtx,
  AudioCtx,
  relMouse = {x:0, y:0},
  lastFrame = -1;

  //
  // Private
  //
  function log(out) {
    if (debug) console.log(out);
    logMem();
  };
  function logMem() {
    if (debug) console.log("Mem: "+ formatBytes(performance.memory.totalJSHeapSize));
  }
  function formatBytes(bytes) {
    // b, kB, MB, GB
    var kilobytes = bytes/1024;
    var megabytes = kilobytes/1024;
    var gigabytes = megabytes/1024;
    if (gigabytes>1) return gigabytes.toFixed(2) +' GB';
    if (megabytes>1) return megabytes.toFixed(2) +' MB';
    if (kilobytes>1) return kilobytes.toFixed(2) +' kB';
    return bytes +' b';
  }
  function copyAllFrames() {
    console.time("copyFrames");
    lastPos = -1;
    lastHash = -1;

    bufCan = document.createElement("canvas");
    bufCtx = bufCan.getContext("2d");
    bufCan.width = BangCan.width = BangVid.videoWidth;
    bufCan.height = BangCan.height = BangVid.videoHeight;

    BangVid.currentTime = 0;
    BangVid.playbackRate = 0.1; // very slow to catch'n'hash em all
    BangVid.play();

    BangCan.classList.add("udcursor");

    requestAnimationFrame(copyFrame);
  }
  function copyFrame() {
    //log("copyFrame");
    if (lastPos !== BangVid.currentTime) {
      // new timecode
      bufCtx.drawImage(BangVid, 0, 0, BangCan.width, BangCan.height);
      var data = bufCan.toDataURL();

      var newHash = CRC32( data );
      if (newHash !== lastHash) {
        var img = new Image();
        img.src = data;
        frames.push( img );
        lastHash = newHash;
        //log("found frame "+ frames.length +" with hash: "+ newHash);
        ui_cont.innerHTML = "LADE BILD: "+ frames.length;
      } else {
        //log("identical images via hash");
      }
      lastPos = BangVid.currentTime;
    } else {
      //log("identical images via currentTime");
    }

    // detect end
    if (BangVid.ended === true) {
      frames.shift(); // dismiss first img = black/blank
      console.timeEnd("copyFrames");
      log("video ended after "+ frames.length +" frames");
      start();
    } else {
      requestAnimationFrame(copyFrame);
    }
  }
  function start() {
    //
    // mouse/touch handler
    //
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      BangCan.addEventListener(ev, doMouseMove, false);
    });

    ui_cont.innerHTML = "";

    // start audio
    //BangAud.loop = true;
    BangAud.play();
    BangAud.addEventListener("ended", doAudioEnded, false);

    requestAnimationFrame(doLoop);
  }
  function doMouseMove(e) {
    if (e.layerX) {
      // mouse events
      relMouse = {
        x: (e.layerX / (e.target.offsetWidth-1)),
        y: (e.layerY / (e.target.offsetHeight-1)),
        dirX: e.movementX,
        dirY: e.movementY,
      }
    } else{
      // touch events
      relMouse = {
        x: ((e.targetTouches[0].pageX-e.target.offsetLeft) / (e.target.offsetWidth-1)),
        y: ((e.targetTouches[0].pageY-e.target.offsetTop) / (e.target.offsetHeight-1)),
        pageY: e.targetTouches[0].pageY,
        offset: e.target.offsetTop,
      }
    }
    e.preventDefault();
  }
  function doAudioEnded() {
    log("doAudioEnded");
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      BangCan.removeEventListener(ev, doMouseMove);
    });


    //setFrame(0);
    ui_cont.innerHTML = '<button onclick="Bang.restart();">Start</button>';
    BangCan.classList.remove("udcursor");
  }
  function doLoop() {
    requestAnimationFrame(doLoop);
    var nextFrame = getActFrame();
    if (lastFrame !== nextFrame)
      setFrame(nextFrame);
  }
  function getActFrame() {
    return Math.floor(relMouse.y * (frames.length-1));
  }
  function setFrame(n) {
    if (n>-1 && n<frames.length) {
      CanvasCtx.drawImage(frames[n], 0, 0, BangCan.width, BangCan.height);
      lastFrame = n;
    }
  };
  function analyzeAudio() {
    log("analyzeAudio");

    // source
    var BangAudSrc = AudioCtx.createMediaElementSource(BangAud); // creates source from audio tag with at least 2channels
    BangAudSrc.connect(AudioCtx.destination); // route source to destination
  };
  function CRC32(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};

  //
  // Public
  //
  my.init = function(canv) {
    log("init");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    AudioCtx = new AudioContext();
    BangCan = canv;
    CanvasCtx = BangCan.getContext("2d");

    BangVid.addEventListener("loadedmetadata", copyAllFrames, false);
    BangVid.src = canv.getAttribute("video");

    BangAud.addEventListener("loadedmetadata", analyzeAudio, false);
    BangAud.src = canv.getAttribute("audio");

  }
  my.restart = function() {
    start();
  }

  //
  // Exit
  //
  return my;

})();
