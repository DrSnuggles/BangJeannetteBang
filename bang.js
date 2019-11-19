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
  CanvasCtx,
  BangCan,
  BangAnal,
  AudioCtx,
  filter,
  relMouse = {x:0, y:0},
  lastFrame = -1,
  totalBangs = 0,
  bangDir,
  BeatIndicator,
  DomScore;

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
    log("copyAllFrames");
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

    requestAnimationFrame(copyFrame);
  }
  function copyFrame() {
    //log("copyFrame");
    if (lastPos !== BangVid.currentTime) {
      // new timecode
      bufCtx.drawImage(BangVid, 0, 0, BangCan.width, BangCan.height);
      var data = bufCan.toDataURL();

      //console.time("hash");
      //var newHash = MD5( data );
      var newHash = CRC32( data );
      //var newHash = fletcher16( data );
      //console.timeEnd("hash");

      if (newHash !== lastHash) {
        var img = new Image();
        img.src = data;
        frames.push( img );
        lastHash = newHash;
        //log("found frame "+ frames.length +" with hash: "+ newHash);
        ui_cont.innerHTML = "Lade Frame: "+ frames.length;
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

      //
      // clear mem
      //
      /*
      BangVid = undefined;
      bufCtx = undefined;
      bufCan = undefined;
      log("after clean");
      */

      start();

    } else {
      requestAnimationFrame(copyFrame);
    }
  }
  function start() {
    //
    // mouse handler
    //
    BangCan.addEventListener("mousemove", doMouseMove, false);

    ui_cont.innerHTML = "";

    // start audio
    //BangAud.loop = true;
    BangAud.play();
    BangAud.addEventListener("ended", doAudioEnded, false);

    requestAnimationFrame(doLoop);
  }
  function doMouseMove(e) {
    //log("doMouseMove");
    //log(e);
    //var y = e.layerY;
    //var perc = y / (e.target.offsetHeight-1);
    relMouse = {
      x: (e.layerX / (e.target.offsetWidth-1)),
      y: (e.layerY / (e.target.offsetHeight-1)),
      dirX: e.movementX,
      dirY: e.movementY,
    }
    //BangVid.currentTime = perc * BangVid.duration;
  }
  function doAudioEnded() {
    log("doAudioEnded");
    BangCan.removeEventListener("mousemove", doMouseMove);
    //setFrame(0);
    ui_cont.innerHTML = '<button onclick="Bang.restart();">Start</button>';
  }
  function doLoop() {
    requestAnimationFrame(doLoop);
    var nextFrame = getActFrame();
    if (lastFrame !== nextFrame)
      setFrame(nextFrame);

    var data = new Uint8Array(BangAnal.frequencyBinCount);
    //var data = new Float32Array(BangAnal.frequencyBinCount);
    //BangAnal.getFloatTimeDomainData(data);
    //BangAnal.getFloatFrequencyData(data);
    //BangAnal.getByteFrequencyData(data);
    BangAnal.getByteTimeDomainData(data);
    //log(data);
    /*
    filter.type = dbg_type.value;
    filter.frequency.value = dbg_freq.value;
    filter.Q.value = dbg_Q.value;
    filter.gain.value = dbg_gain.value;
    //log(filter);
    */

    /*
    var tres = dbgrng.value;
    //tres = 200;
    var dbg = debugTbl.getElementsByTagName("td");
    for (var i=0; i < data.length;i++) {
      if (data[i] > tres) {
        dbg[i].innerText = "X";
        if (i === 6)BeatIndicator.classList.add("beatOn");
      } else {
        dbg[i].innerText = "";
        if (i === 6)BeatIndicator.classList.remove("beatOn");
      }

    }

    // beat indicator
    //BeatIndicator.classList.add("beatOn");

    // score
    DomScore.innerText = my.score;
    */
  }
  function getActFrame() {
    return Math.floor(relMouse.y * (frames.length-1));
  }
  function setFrame(n) {
    //log("setFrame", n);
    CanvasCtx.drawImage(frames[n], 0, 0, BangCan.width, BangCan.height);
    lastFrame = n;
  };
  function analyzeAudio() {
    log("analyzeAudio");

    // source
    var BangAudSrc = AudioCtx.createMediaElementSource(BangAud); // creates source from audio tag with at least 2channels
    //BangAudSrc.connect(AudioCtx.destination); // route source to destination

    // filter
    //filter = AudioCtx.createBiquadFilter();
    //filter.type = "bandpass";
    //filter.frequency.value = 0;
    //filter.Q.value = 0;
    //BangAudSrc.connect(filter);
    BangAudSrc.connect(AudioCtx.destination);

    // analyzer
    BangAnal = AudioCtx.createAnalyser();
    BangAnal.fftSize = 64;
    BangAudSrc.connect(BangAnal);

  };
  function MD5(e) { // https://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript
    function h(a, b) {
        var c, d, e, f, g;
        e = a & 2147483648;
        f = b & 2147483648;
        c = a & 1073741824;
        d = b & 1073741824;
        g = (a & 1073741823) + (b & 1073741823);
        return c & d ? g ^ 2147483648 ^ e ^ f : c | d ? g & 1073741824 ? g ^ 3221225472 ^ e ^ f : g ^ 1073741824 ^ e ^ f : g ^ e ^ f
    }

    function k(a, b, c, d, e, f, g) {
        a = h(a, h(h(b & c | ~b & d, e), g));
        return h(a << f | a >>> 32 - f, b)
    }

    function l(a, b, c, d, e, f, g) {
        a = h(a, h(h(b & d | c & ~d, e), g));
        return h(a << f | a >>> 32 - f, b)
    }

    function m(a, b, d, c, e, f, g) {
        a = h(a, h(h(b ^ d ^ c, e), g));
        return h(a << f | a >>> 32 - f, b)
    }

    function n(a, b, d, c, e, f, g) {
        a = h(a, h(h(d ^ (b | ~c), e), g));
        return h(a << f | a >>> 32 - f, b)
    }

    function p(a) {
        var b = "",
            d = "",
            c;
        for (c = 0; 3 >= c; c++) d = a >>> 8 * c & 255, d = "0" + d.toString(16), b += d.substr(d.length - 2, 2);
        return b
    }
    var f = [],
        q, r, s, t, a, b, c, d;
    e = function(a) {
        a = a.replace(/\r\n/g, "\n");
        for (var b = "", d = 0; d < a.length; d++) {
            var c = a.charCodeAt(d);
            128 > c ? b += String.fromCharCode(c) : (127 < c && 2048 > c ? b += String.fromCharCode(c >> 6 | 192) : (b += String.fromCharCode(c >> 12 | 224), b += String.fromCharCode(c >> 6 & 63 | 128)), b += String.fromCharCode(c & 63 | 128))
        }
        return b
    }(e);
    f = function(b) {
        var a, c = b.length;
        a = c + 8;
        for (var d = 16 * ((a - a % 64) / 64 + 1), e = Array(d - 1), f = 0, g = 0; g < c;) a = (g - g % 4) / 4, f = g % 4 * 8, e[a] |= b.charCodeAt(g) << f, g++;
        a = (g - g % 4) / 4;
        e[a] |= 128 << g % 4 * 8;
        e[d - 2] = c << 3;
        e[d - 1] = c >>> 29;
        return e
    }(e);
    a = 1732584193;
    b = 4023233417;
    c = 2562383102;
    d = 271733878;
    for (e = 0; e < f.length; e += 16) q = a, r = b, s = c, t = d, a = k(a, b, c, d, f[e + 0], 7, 3614090360), d = k(d, a, b, c, f[e + 1], 12, 3905402710), c = k(c, d, a, b, f[e + 2], 17, 606105819), b = k(b, c, d, a, f[e + 3], 22, 3250441966), a = k(a, b, c, d, f[e + 4], 7, 4118548399), d = k(d, a, b, c, f[e + 5], 12, 1200080426), c = k(c, d, a, b, f[e + 6], 17, 2821735955), b = k(b, c, d, a, f[e + 7], 22, 4249261313), a = k(a, b, c, d, f[e + 8], 7, 1770035416), d = k(d, a, b, c, f[e + 9], 12, 2336552879), c = k(c, d, a, b, f[e + 10], 17, 4294925233), b = k(b, c, d, a, f[e + 11], 22, 2304563134), a = k(a, b, c, d, f[e + 12], 7, 1804603682), d = k(d, a, b, c, f[e + 13], 12, 4254626195), c = k(c, d, a, b, f[e + 14], 17, 2792965006), b = k(b, c, d, a, f[e + 15], 22, 1236535329), a = l(a, b, c, d, f[e + 1], 5, 4129170786), d = l(d, a, b, c, f[e + 6], 9, 3225465664), c = l(c, d, a, b, f[e + 11], 14, 643717713), b = l(b, c, d, a, f[e + 0], 20, 3921069994), a = l(a, b, c, d, f[e + 5], 5, 3593408605), d = l(d, a, b, c, f[e + 10], 9, 38016083), c = l(c, d, a, b, f[e + 15], 14, 3634488961), b = l(b, c, d, a, f[e + 4], 20, 3889429448), a = l(a, b, c, d, f[e + 9], 5, 568446438), d = l(d, a, b, c, f[e + 14], 9, 3275163606), c = l(c, d, a, b, f[e + 3], 14, 4107603335), b = l(b, c, d, a, f[e + 8], 20, 1163531501), a = l(a, b, c, d, f[e + 13], 5, 2850285829), d = l(d, a, b, c, f[e + 2], 9, 4243563512), c = l(c, d, a, b, f[e + 7], 14, 1735328473), b = l(b, c, d, a, f[e + 12], 20, 2368359562), a = m(a, b, c, d, f[e + 5], 4, 4294588738), d = m(d, a, b, c, f[e + 8], 11, 2272392833), c = m(c, d, a, b, f[e + 11], 16, 1839030562), b = m(b, c, d, a, f[e + 14], 23, 4259657740), a = m(a, b, c, d, f[e + 1], 4, 2763975236), d = m(d, a, b, c, f[e + 4], 11, 1272893353), c = m(c, d, a, b, f[e + 7], 16, 4139469664), b = m(b, c, d, a, f[e + 10], 23, 3200236656), a = m(a, b, c, d, f[e + 13], 4, 681279174), d = m(d, a, b, c, f[e + 0], 11, 3936430074), c = m(c, d, a, b, f[e + 3], 16, 3572445317), b = m(b, c, d, a, f[e + 6], 23, 76029189), a = m(a, b, c, d, f[e + 9], 4, 3654602809), d = m(d, a, b, c, f[e + 12], 11, 3873151461), c = m(c, d, a, b, f[e + 15], 16, 530742520), b = m(b, c, d, a, f[e + 2], 23, 3299628645), a = n(a, b, c, d, f[e + 0], 6, 4096336452), d = n(d, a, b, c, f[e + 7], 10, 1126891415), c = n(c, d, a, b, f[e + 14], 15, 2878612391), b = n(b, c, d, a, f[e + 5], 21, 4237533241), a = n(a, b, c, d, f[e + 12], 6, 1700485571), d = n(d, a, b, c, f[e + 3], 10, 2399980690), c = n(c, d, a, b, f[e + 10], 15, 4293915773), b = n(b, c, d, a, f[e + 1], 21, 2240044497), a = n(a, b, c, d, f[e + 8], 6, 1873313359), d = n(d, a, b, c, f[e + 15], 10, 4264355552), c = n(c, d, a, b, f[e + 6], 15, 2734768916), b = n(b, c, d, a, f[e + 13], 21, 1309151649), a = n(a, b, c, d, f[e + 4], 6, 4149444226), d = n(d, a, b, c, f[e + 11], 10, 3174756917), c = n(c, d, a, b, f[e + 2], 15, 718787259), b = n(b, c, d, a, f[e + 9], 21, 3951481745), a = h(a, q), b = h(b, r), c = h(c, s), d = h(d, t);
    return (p(a) + p(b) + p(c) + p(d)).toLowerCase()
  };
  function CRC32(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};
  function fletcher16(buf) { // https://softwareengineering.stackexchange.com/questions/96211/what-is-a-faster-alternative-to-a-crc/184668#184668
    var sum1 = 0xff, sum2 = 0xff;
    var i = 0;
    var len = buf.length;

    while (len) {
      var tlen = len > 20 ? 20 : len;
      len -= tlen;
      do {
        sum2 += sum1 += buf[i++];
      } while (--tlen);
      sum1 = (sum1 & 0xff) + (sum1 >> 8);
      sum2 = (sum2 & 0xff) + (sum2 >> 8);
    }
    /* Second reduction step to reduce sums to 8 bits */
    sum1 = (sum1 & 0xff) + (sum1 >> 8);
    sum2 = (sum2 & 0xff) + (sum2 >> 8);
    return sum2 << 8 | sum1;
  }
  //
  // Public
  //
  my.init = function(canv, scorediv, beatdiv) {
    log("init");
    AudioCtx = new AudioContext();
    BangCan = canv;
    CanvasCtx = BangCan.getContext("2d");

    BangVid.addEventListener("loadedmetadata", copyAllFrames, false);
    BangVid.src = canv.getAttribute("video");

    BangAud.addEventListener("loadedmetadata", analyzeAudio, false);
    BangAud.src = canv.getAttribute("audio");

    //BeatIndicator = beatdiv;
    //DomScore = scorediv;
  }
  my.restart = function() {
    start();
  }

  //
  // Exit
  //
  return my;

})();
