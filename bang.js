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
  lastFrame = -1;

  //
  // Private
  //
  function start() {
    //
    // mouse/touch handler
    //
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      can.addEventListener(ev, doMouseMove, false);
    });

    ui_cont.innerHTML = "";
    can.classList.add("udcursor");

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
    ["mouseup","mousedown","mousemove","click","contextmenu","touchstart","touchcancel","touchmove"].forEach(ev => {
      can.removeEventListener(ev, doMouseMove);
    });

    ctx.drawImage(imgs[11], 0, 0, can.width, can.height);
    ctx.drawImage(imgs[12], 0, 0, can.width, can.height);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(wiggle);

    ui_cont.innerHTML = '<button onclick="Bang.restart();">START</button>';
    can.classList.remove("udcursor");
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

  //
  // Public
  //
  my.init = function(canv) {
    imgs = document.getElementsByClassName("bang-container")[0].getElementsByTagName("img");
    can = canv;
    ctx = can.getContext("2d");
    start();
  }
  my.restart = function() {
    start();
  }

  //
  // Exit
  //
  return my;

})();
