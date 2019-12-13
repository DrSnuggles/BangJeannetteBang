var Bang = (function() {
  //
  // Init
  //
  console.info("Jeannette Bang - ©2019 by Gnax");
  var my = {},
  imgs, can, ctx,
  raf,
  frameCnt = 11,
  relMouse = {x:0, y:0},
  lastFrame = -1,
  localBangs = 0;
  totalBangs = 0,
  lastExtreme = 0, // 0 = top, 1 = bottom
  xhr = new XMLHttpRequest(),
  apiUrl = "https://script.google.com/macros/s/AKfycbyEaUuTDSEQFs3DXtgao3pLxItANEFSttbaMxqKu1vjfsz25MA/exec";

  //
  // Global handler
  //
  xhr.onload = function(e) {
    totalBangs = e.target.responseText;
    updateScoreUI();
  };
  setInterval(function(){Bang.updateScore()}, 10000);
  updateScore();

  //
  // Private
  //
  function updateScoreUI() {
    ui_score.innerText = totalBangs*1 + localBangs*1;
  }
  function updateScore() {
    xhr.open("GET", apiUrl, true);
    xhr.send();
  }
  function submitScore() {
    var data = "bangs="+localBangs;
    xhr.open("POST", apiUrl, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
    localBangs = 0;
  }

  function start() {
    //
    // mouse/touch handler
    //
    /*
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      can.addEventListener(ev, doMouseMove, false);
    });
    */
    can.addEventListener("mouseup", doMouseMove, false);
    can.addEventListener("mousedown", doMouseMove, false);
    can.addEventListener("mousemove", doMouseMove, false);
    can.addEventListener("click", doMouseMove, false);
    can.addEventListener("contextmenu", doMouseMove, false);
    can.addEventListener("touchstart", doMouseMove, false);
    can.addEventListener("touchcancel", doMouseMove, false);
    can.addEventListener("touchmove", doMouseMove, false);

    ui_cont.innerHTML = "";
    can.classList.add("udcursor");

    setFrame(0);
    // start audio
    //BangAud.loop = true;
    AudioBang.play();
    AudioBang.addEventListener("ended", doAudioEnded, false);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(doLoop);
  }
  function doMouseMove(e) {
    if (e.layerX) {
      // mouse events
      // firefox !== chrome layerY is relative in chrome and absolute in ff
      if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
        // FF
        relMouse = {
          x: (e.layerX / (e.target.offsetWidth-1)),
          y: ((e.clientY-e.srcElement.offsetTop) / (e.target.offsetHeight-1)),
          dirX: e.movementX,
          dirY: e.movementY,
        }
      } else {
        // Chrome / iOS
        relMouse = {
          x: (e.layerX / (e.target.offsetWidth-1)),
          y: (e.layerY / (e.target.offsetHeight-1)),
          dirX: e.movementX,
          dirY: e.movementY,
        }
      }
    } else {
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
    /*
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      can.removeEventListener(ev, doMouseMove);
    });
    */
    can.removeEventListener("mouseup", doMouseMove);
    can.removeEventListener("mousedown", doMouseMove);
    can.removeEventListener("mousemove", doMouseMove);
    can.removeEventListener("click", doMouseMove);
    can.removeEventListener("contextmenu", doMouseMove);
    can.removeEventListener("touchstart", doMouseMove);
    can.removeEventListener("touchcancel", doMouseMove);
    can.removeEventListener("touchmove", doMouseMove);

    ctx.drawImage(imgs[11], 0, 0, can.width, can.height);
    ctx.drawImage(imgs[12], 0, 0, can.width, can.height);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(wiggle);

    ui_cont.innerHTML = '<button onclick="Bang.restart();">START</button>';
    can.classList.remove("udcursor");

    submitScore();
  }
  function doLoop() {
    raf = requestAnimationFrame(doLoop);
    var nextFrame = getActFrame();
    if (lastFrame !== nextFrame)
      setFrame(nextFrame);
  }
  function getActFrame() {
    return Math.floor(relMouse.y * (frameCnt));
  }
  function setFrame(n) {
    if (n >= frameCnt) n = frameCnt-1;
    if (n < 0) n = 0;
    ctx.drawImage(imgs[n], 0, 0, can.width, can.height);
    // score movement
    if (lastExtreme === 0) {
      // downwards
      if (frameCnt-n <= 1) {
        // ~bottom reached
        lastExtreme = 1;
        localBangs++;
        updateScoreUI();
      }
    } else {
      // upwards
      if (n <= 1) {
        // ~top reached
        lastExtreme = 0;
        localBangs++;
        updateScoreUI();
      }
    }
    lastFrame = n;
  };
  function wiggle(){
    raf = requestAnimationFrame(wiggle);
    ctx.drawImage(imgs[lastFrame], 0, 0, can.width, can.height);
    var d = new Date();
    var n = d.getTime();
    var y1 = Math.sin(n/50.0) * 10;
    var y2 = Math.cos(n/80.0) * 20;
    ctx.drawImage(imgs[11], 0, y1, can.width, can.height);
    ctx.drawImage(imgs[12], 0, y2, can.width, can.height);
  }
  function setFirstFrameAfterLoaded() {
    // check img state
    if (imgs[0].width > 0) {
      setTimeout(function(){setFrame(0);}, 500);
    } else {
      setTimeout(function(){setFirstFrameAfterLoaded()}, 500);
    }
  }

  //
  // Public
  //
  my.init = function(canv) {
    imgs = document.getElementsByClassName("bang-container")[0].getElementsByTagName("img");
    can = canv;
    ctx = can.getContext("2d");
    setFirstFrameAfterLoaded();
  }
  my.restart = function() {
    start();
  }
  my.updateScore = updateScore;

  //
  // Exit
  //
  return my;

})();
