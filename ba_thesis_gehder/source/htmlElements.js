var canvas = document.createElement('canvas');
var initPosX, initPosY;
var canvasRight = true;
var canvasFullExtended = false;
var degrees = 0;
var canvasRotated = false;
var sectionCount;
var localNav, rootNav;
var canvasLinks;
var navHistory = [];
var lastLinks = [];
var smoothOutInterval;

/**
 * @type {Touch}
 */
var canvasLastTouch;



module.exports = {
    getCanvas: getCanvas,
    createCanvas: createCanvas,
    flyCanvasIn: flyCanvasIn,
    dismissCanvas: dismissCanvas,
    removeCanvas: removeCanvas
}

function createCanvas(links, right) {
    rootNav = links;
    if(localNav) canvasLinks = localNav;
    else canvasLinks = rootNav;
    initPosX = undefined;
    initPosY = undefined;
    canvasFullExtended = false;
    removeCanvas();
    canvasRight = right;
    if (canvasRight != false) canvasRight = true;
    var posLeft = '100% - 100px';
    if (canvasRight == false) posLeft = '0% - 200px'
    
    $(canvas)
    .attr('width', '300px')
    .attr('height', '300px')
    .css({
        position: 'fixed',
        top: 'calc(100% - 100px)',
        left: 'calc(' + posLeft + ')',
        opacity: '0.1',
        '-webkit-transition': 'all 0.3s cubic-bezier(0.02, 0.97, 0.57, 0.6)',
        '-moz-transition': 'all 0.3s cubic-bezier(0.02, 0.97, 0.57, 0.6)',
        '-o-transition': 'all 0.3s cubic-bezier(0.02, 0.97, 0.57, 0.6)',
        '-ms-transition': 'all 0.3s cubic-bezier(0.02, 0.97, 0.57, 0.6)',
        'transition': 'all 0.3s cubic-bezier(0.02, 0.97, 0.57, 0.6)'
    });
    
    var ctx = canvas.getContext('2d')
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 145, 0, 2 * Math.PI);
    var rad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.width / 2, canvas.width / 2);
    rad.addColorStop(1, '#E20074');
    rad.addColorStop(0.1, 'white');
    ctx.fillStyle = rad;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = '3';
    ctx.stroke();
    ctx.restore();

    getNavSections(ctx, canvasLinks);
    $('#help').css({display:'none'});
    document.body.appendChild(canvas);
}

function getCanvas() {
    return canvas;
}

function removeCanvas() {
    if (!canvasFullExtended) {
        $(canvas).remove();
        initPosX = undefined;
        initPosY = undefined;
        $('#help').css({display:'block'});        
    } else {
        console.log("add touch listener for convas");
        initCanvasTouchEvents()
    }
}

function dismissCanvas() {
    $(canvas).remove();
    initPosX = undefined;
    initPosY = undefined;
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} angle Winkel wo der Strich gezeichnet werden soll
 * @param {string} title
 */
function lineInCircle(ctx, angle) {
    var halfWidth = ctx.canvas.width / 2;
    var halfHeight = ctx.canvas.height / 2;
    var x = Math.cos(angle);
    var y = Math.sin(angle);
    x = (x * (halfWidth - 10)) + halfWidth;
    y = (y * (halfHeight - 10)) + halfHeight;
    ctx.beginPath();
    ctx.lineWidth = '1';
    ctx.strokeStyle = '#FFF';
    ctx.moveTo(halfWidth, halfHeight);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
}
/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} angle 
 * @param {string} title Ausrichtung des Canvas
 */
function textInSection(ctx, angle, title) {
    var halfWidth = ctx.canvas.width / 2;
    var halfHeight = ctx.canvas.height / 2;

    //focus on center
    ctx.translate(halfWidth, halfHeight);
    //rotieren um x grad
    ctx.rotate(angle);
    //move to point where text will be place
    ctx.translate(100, 0);
    //rotate 180°
    if (canvasRight) ctx.rotate(Math.PI);
    //Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "16px Courier New";
    ctx.fillText(title, 0, 0, 85);
    //rotate 180°
    if (canvasRight) ctx.rotate(-Math.PI);
    //move to point where text will be place
    ctx.translate(-100, 0);
    //zurückrotieren um x grad
    ctx.rotate(-angle);
    //focus to top left corner
    ctx.translate(-halfWidth, -halfHeight);
}
/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object[]} links 
 */
function getNavSections(ctx, links) {
    sectionCount = links.length;
    var angle = 2 * Math.PI / sectionCount;
    links.forEach(function (val, i) {

        var _tmpA = angle * (i + 1);
        var _tmpATxt = _tmpA - angle / 2;

        lineInCircle(ctx, _tmpA);
        textInSection(ctx, _tmpATxt, val.title);
        
    });
    getBackButton(ctx, links);
}
/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object[]} links 
 */
function getBackButton() {
    if(showBackButton())return;
    //fokus auf zentrum
    var ctx = canvas.getContext('2d')
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.arc(0,0,40,0, 2*Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.fillStyle ="#FFF";
    var _tmpAngle = degrees / (180/ Math.PI);
    ctx.rotate(-(_tmpAngle));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "16px Courier New";
    ctx.fillText('->', 0, 0, 80);
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.restore();
}
/**
 * 
 * @param {Touch} initTouch 
 * @param {TouchEvent} touchEvent 
 */
function flyCanvasIn(initTouch, touchEvent) {
    if (!initPosX) initPosX = parseInt($(canvas).css('left'));
    if (!initPosY) initPosY = parseInt($(canvas).css('top'));

    var deltaX = initTouch.clientX - touchEvent.targetTouches[0].clientX;
    var deltaY = initTouch.clientY - touchEvent.targetTouches[0].clientY

    // in px
    var maxExpandX = 75
    var maxExpandY = 75

    //########### New Pos X #############
    if (!(maxExpandX < Math.abs(deltaX))) {
        console.log("Pos Left:", parseInt($(canvas).css('left')));
        $(canvas)
            .css({ left: initPosX - deltaX })
    }

    //########### New Pos Y ##############
    if (!(maxExpandY < deltaY)) {
        console.log("Pos top:", parseInt($(canvas).css('top')));
        $(canvas)
            .css({ top: initPosY - deltaY })
    }
    // change Opacity depending on expanding stat
    var _tmpOpacity = (Math.abs(deltaX) / maxExpandX) * 0.5 + (Math.abs(deltaY) / maxExpandY) * 0.5;
    if (_tmpOpacity < 0.1) _tmpOpacity = 0.1;
    $(canvas).css({
        opacity: _tmpOpacity
    })

    //full extended?
    canvasFullExtended = maxExpandY < deltaY && maxExpandX < Math.abs(deltaX);
}
function initCanvasTouchEvents() {
    if (!canvas) return;
    canvas.addEventListener('touchstart', touchStartCanvas);
    canvas.addEventListener('touchmove', touchCanvas);
    canvas.addEventListener('touchend', touchEndCanvas);
}
/**
 * 
 * @param {TouchEvent} e 
 */
function touchStartCanvas(e){
    canvasRotated = false;
}
/**
 * 
 * @param {TouchEvent} e 
 */
function touchCanvas(e) {
    if (canvasLastTouch) {
        canvasRotated = true;
        var deltaX = e.touches[0].clientX - canvasLastTouch.clientX;
        var deltaY = e.touches[0].clientY - canvasLastTouch.clientY;
        if (canvasRight) deltaY = -deltaY;
        degrees += (deltaX * 0.5 + deltaY * 0.5) * 2;
        console.log(degrees);
        getBackButton();
        $(canvas).css(
            {
                '-webkit-transform': 'rotate(' + degrees + 'deg)',
                '-moz-transform': 'rotate(' + degrees + 'deg)',
                '-ms-transform': 'rotate(' + degrees + 'deg)',
                'transform': 'rotate(' + degrees + 'deg)'
            }
        )
        //smooth out here
    }
    canvasLastTouch = e.touches[0];
}
/**
 * 
 * @param {TouchEvent} e 
 */
function touchEndCanvas(e) {
    canvasLastTouch = undefined;
    if (!canvasRotated) clickLink(e);
    else console.log("*****");
    console.log("end");
}
/**
 * 
 * @param {TouchEvent} e 
 */
function clickLink(e) {
    //changedTouches bc of end Event
    console.log(e.changedTouches[0]);
    var _tmpTouch = e.changedTouches[0];
    //Shift coordinates into center of canvas for calculation
    var canvasCoordinateX = (_tmpTouch.clientX - _tmpTouch.target.offsetLeft) - _tmpTouch.target.clientWidth / 2;
    var canvasCoordinateY = (_tmpTouch.clientY - _tmpTouch.target.offsetTop) - _tmpTouch.target.clientHeight / 2;
    if(Math.sqrt(canvasCoordinateX * canvasCoordinateX + canvasCoordinateY * canvasCoordinateY)< 50 ) return goBack();
    //Get degrees from coordinates
    var clickedDegree = Math.atan2(canvasCoordinateY, canvasCoordinateX) * (180/ Math.PI);
    //Fix for negative degrees
    if(clickedDegree < 0)clickedDegree = clickedDegree + 360;
    //Fix clicked degree from canvas rotation;
    var finalClickedDegrees = (clickedDegree - (degrees % 360))% 360;
    //Fix for degrees bigger then clicked degreeg
    if(finalClickedDegrees < 0)finalClickedDegrees = finalClickedDegrees + 360;
    console.log("Clicked Link: " + finalClickedDegrees);
    getClickedLink(finalClickedDegrees);
}
/**
 * 
 * @param {number} degree 
 */
function getClickedLink(degree){
    if(!sectionCount)return;
    var _tmpSectionDegree = 360 / sectionCount;
    var _tmpSectionCounter = 0;
    do{
        if(degree <= _tmpSectionDegree * (_tmpSectionCounter + 1)){
            if(canvasLinks[_tmpSectionCounter].path){
                if(canvasLinks[_tmpSectionCounter].nav){
                    lastLinks.push(document.getElementById('content').src);
                    localNav = canvasLinks[_tmpSectionCounter].nav;
                    navHistory.push(canvasLinks);
                }
                document.getElementById('content').src = canvasLinks[_tmpSectionCounter].path;
                dismissCanvas();
            }
        }
        _tmpSectionCounter++;
    }while(degree > _tmpSectionDegree * (_tmpSectionCounter))
}

function goBack(){
    if(showBackButton())return;    
    localNav = navHistory.pop();
    document.getElementById('content').src = lastLinks.pop()
    dismissCanvas();
}

function showBackButton(){
    console.log(0 == 0, !navHistory,lastLinks.length == 0, navHistory.length == 0);
    return (navHistory.length == 0 || !navHistory) && lastLinks.length == 0;
}

