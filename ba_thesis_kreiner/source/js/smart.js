//Global declaration, function, object
var container, element, canvas, c,
    navi, settings, links, originLinks, dLevel, dIcon,
    menuColor, mainColor, undermenuColor,
    scale, scroll, circle, mask, _angle, tmp_dist, amplitude,
    tapped, dragged, dragging, holded, released, created, ready, change, underGround, jsonChange,
    border, upborder, downborder, borderrange, spacer, linkRange,
    reference, count, timerID, timeConstant, timestamp,
    requestAnimationFrames, cancelAnimationFrames,
    angle;

/**
 * Load SmartNav on page load
 */
function SmartNav() {
    //Only for test purpose
    $.getJSON("./json/testNav.json", function (json) {
        //Here insert localproject safe in links
        settings = json.Global;

        mainColor = settings.color[0];
        menuColor = settings.color[1];
        undermenuColor = settings.color[2];

        links = dimensionLevel(json.Links);
        SNonload(settings, mainColor);
        //Animtation should not be interrupted by User Interaction -> ToDo add disabler
        introCheck(settings);

        scroll = settings.orientation == "left" ? 0 : getScrollbarWidth();
        draw();
    });

    //This works fine if implemented in Bowser
    /*loadJSON("./json/testNav.json", function(reponse){
		var set = new Array(), link = new Array();
		
		navi = JSON.parse(reponse);
		settings.push(navi.Global);
		links.push(navi.Links);
        
        mainColor = settings.color[0];
        menuColor = settings.color[1];
        undermenuColor = settings.color[2];
        
        links = dimensionLevel(json.Links);
		SNonload(settings, mainColor);
		//intro soll nicht gestört werden -> disable Touch
    	introCheck(settings);
        
		scroll = settings.orientation == "left" ? 0 : getScrollbarWidth();
		draw();
	});*/
}

//request- & cancelAnimationFrame for all Browser
requestAnimationFrames = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
cancelAnimationFrames = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

//Append Canvas in DOM 
container = document.createElement("canvas");
element = document.body;
element.appendChild(container);

canvas = document.querySelector("canvas");
c = canvas.getContext("2d");

//Button Settings
scale = backingScale();
dpi = 16;
dFAB = 28;
fab = {
    radius: dFAB * scale,
    width: (dpi + dFAB) * scale,
    icon: Math.sqrt((Math.pow(2 * (dFAB * scale), 2)) / 2)
};

//Definitions
circle = [];
mask = [];
_angle = [];
tmp_dist = [];

count = angle = downborder = 0;
upborder = 11;
timeConstant = 325;
created = ready = released = false;
jsonChange = true;


/**
 * Returns the Ratio of the Device
 * @returns {number} window.devicePixelRatio or 1 (defautl)
 */
function backingScale() {
    if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
            return window.devicePixelRatio;
        }
    }
    return 1;
}

/**
 * Changes the content of a Array by removing a range of fields
 * @this    {Array}
 * @param   {number} from Index at which to start removing the array
 * @param   {number} to   Index at which to end removing the array
 * @returns {Array}  A new Array without the removed fields
 */
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
/**
 * Changes the content of an Array by insert a range of new fields 
 * @this    {Array}
 * @param   {number} from Index at which to start insert the array
 * @param   {number} to   Index at which to end insert the array
 * @returns {Array}  A new Array with the inserted fields
 */
Array.prototype.insert = function (from, to) {
    return this.splice(from, 0, to);
};

/**
 * Changes the content of a string by removing a range of characters and/or adding new characters
 * @this 	{String}
 * @param 	{number} start     Index at which to start changing the string.
 * @param 	{number} delCount  An integer indicating the number of old chars to remove
 * @param 	{string} newSubStr The String that is spliced in
 * @return 	{string} A new string with the spliced substring
 */
String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

/**
 * Checks if n is a number (usage for dimensionLevel())
 * @param   {number} n Value which should be a number type
 * @returns {boolean} A boolean value after n value check
 */
function isNumber(n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

/**
 * Sets the Postion of SmartNav in a specific corner when Canvas is small in corner.
 * @param   {object} json Settings of the json file
 * @returns {object} edge Position of SmartNav in the corner (left or right)
 */
function getEdge(json) {
    var edge = {};
    edge.x = edge.y = fab.width;
    if (canvas.width == window.innerWidth && canvas.height == window.innerHeight) {
        if (json.orientation == 0 || json.orientation == "right") {
            edge.x = canvas.width - edge.x;
            edge.y = canvas.height - edge.y;
        } else if (json.orientation == "left") {
            edge.y = canvas.height - edge.y;
        }
    } else {
        edge.x = edge.y = fab.width;
    }
    return edge;
}

/**
 * Sets the Postion of SmartNav in a specific corner when Canvas has the same size as the window.
 * @param   {object} json Settings of the json file
 * @returns {object} corn osition of SmartNav in the corner (left or right)
 */
function getCorner(json) {
    var corn = {
        x: json.orientation == "right" ? canvas.width - scroll : 0,
        y: canvas.height
    }
    return corn;
}

/**
 * Checks if the user tapped a circle
 * @param   {object} radient Is the circle Array
 * @returns {number} The position which circle is tapped or -1 if not
 */
function circleTouch(radient) {
    for (var i = 0; i < radient.length; i++) {
        var dy = reference.y - radient[i].y;
        var dx = reference.x - radient[i].x;
        isInCircle = (dx * dx + dy * dy) < (radient[i].radius * radient[i].radius);
        if (isInCircle) {
            radient[i].drag = true;
            if (i == 0) {
                if (holded) {
                    dragged = true;
                }
            }
            return i;
        }
    }
    return -1;
}

/**
 * Generate the Position of the menuCircle (circle[1-5]) by the angle and the radius of the corner
 * @param   {number} angle  A angle of a menuCircle
 * @param   {number} radius The general distance form the Corner
 * @returns {object} menu   The position of a menuCircle
 */
function circlePosition(angle, radius) {
    var corner = getCorner(settings);
    var menu = {
        x: corner.x + Math.cos(angle) * radius,
        y: corner.y + Math.sin(angle) * radius
    }
    return menu;
}

/**
 * Defines the Level where the Navigation is used (underMenu etc.)
 * @param   {object} json     Links of the json file
 * @param   {number} position A value which definied which menu is tapped
 * @returns {object} json     The new json Links
 */
function dimensionLevel(json, position) {
    var tmp_url;
    tmp_url = location.href;
    if (!position) {
        for(var j = 0; j < json.length; j++) {
        if (json[j].path == tmp_url) {
            position = j;
            console.log(j);
        }
    }
    }
    if (isNumber(position)) {
        if (!underGround) {
            jsonChange = false;
        }
        var color = menuColor;
        if (json[position].hasOwnProperty('icon')) {
            var tmpIcon = pickSVGColor(json[position].icon, color);
            dIcon = convertIcon(tmpIcon);;
        } else {
            dIcon = null;
        }
        if (json[position].hasOwnProperty('title')) {
            dLevel = json[position].title;
        } else {
            dLevel = "Zurück zum Menü";
        }
        json = json[position].nav;
        console.log("bin im under");
    }
    console.log("dimensionLevel", json, position, dLevel, dIcon, tmp_url);
    return json;
}

/**
 * Gets the Scrollbar width 
 * @returns {number} The width of Scrollbar
 */
function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Runs a Timer which counts requestAnimationFrames 
 */
function timer() {
    if (count < 25) {
        timerID = requestAnimationFrame(timer);
        count++;
    } else {
        hold();
    }
}

/**
 * Sets a delay with specific milliseconds 
 * @param {number} millisecond 
 */
function delay(milliseconds) {
    var start = performance.now();
    for (var i = 0; i < 1e7; i++) {
        if ((performance.now() - start) > milliseconds) {
            break;
        }
    }
}

/**
 * @constructs Circle
 * @param {number} x
 * @param {number} y
 * @param {number} radius 
 * @param {string} color  
 * @param {boolean} drag   
 * @param {string} text   
 * @param {string} icon
 * @param {boolean} nav
 */
function Circle(x, y, radius, color, drag, text, icon, nav) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.drag = drag;
    this.text = text;
    this.icon = icon;
    this.nav = nav;
}

//Drawing

/**
 * Draws the canvas and splits into arc() and overlay()  
 */
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (created) {
        c.fillStyle = "rgba(0, 0, 0, 0.5)";
        c.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (var i = 0; i < circle.length; i++) {
        var C = circle[i];
        arc(C.x, C.y, C.radius, C.color);
        overlay(C.x, C.y, C.text, C.icon, C.nav, C.color);
    }
}

/**
 * Draws an arc with the params
 * @param {number} x      
 * @param {number} y      
 * @param {number} radius
 * @param {string} color  
 */
function arc(x, y, radius, color) {
    c.beginPath();
    c.shadowBlur = 10 * scale;
    c.shadowColor = "rgba(0, 0, 0, 0.5)";
    c.shadowOffsetY = 5 * scale;
    c.arc(x, y, radius, 0, Math.PI * 2, false);
    c.closePath();
    c.fillStyle = color;
    c.fill();
}

/**
 * Draws the text and icon on the circle
 * @param {number} x     
 * @param {number} y     
 * @param {string} text  
 * @param {string} icon  
 * @param {boolean} nav   
 * @param {string} color
 */
function overlay(x, y, text, icon, nav, color) {
    var img, menuPosX, menuPosY, corner, lines, textColor, bold;

    textColor = pickTextColor(color, "#FFF", "#000");
    bold = textColor != "#FFF" ? "Bold " : "";
    font_size = (20 * scale) / 2;

    img = new Image();
    menuPosY = (fab.width + (10 * scale));
    menuPosX = settings.orientation == "left" ? -10 * scale : menuPosY;
    corner = getCorner(settings);

    c.font = bold + font_size + "px Arial";
    c.shadowBlur = 0;
    c.shadowColor = "rgba(255, 255, 255, 0.5)";
    c.shadowOffsetY = 1;
    c.textAlign = "center";
    c.fillStyle = textColor;

    if (text && !icon) {
        lines = fragmentText(text, fab.radius * 1.6);
        lines.forEach(function (line, i) {
            c.fillText(line, x, i * font_size + y);
        });
    }
    if (!text && icon) {
        img.src = icon;
        if (created && circle[0].y == y && circle[0].x == x) {
            c.drawImage(img, x - menuPosX, y - menuPosY, fab.icon, fab.icon);
        } else {
            c.drawImage(img, x - (fab.icon / 2), y - (fab.icon / 2), fab.icon, fab.icon);
        }
    }
    if (text && icon) {
        var posX, posY;
        posY = 10;
        posX = settings.orientation == "left" ? -((menuPosY / 2) + (5 * scale)) : ((menuPosX / 2) + (5 * scale));
        lines = fragmentText(text, fab.radius * 2);
        img.src = icon;

        if (created) {
            if (circle[0].y == y && circle[0].x == x) {
                lines.forEach(function (line, i) {
                    c.fillText(line, x - posX, i * font_size + y - (posY * scale));
                });
                c.drawImage(img, x - menuPosX, y - menuPosY - (4 * scale), fab.icon, fab.icon);
            } else {
                lines.forEach(function (line, i) {
                    c.fillText(line, x, i * font_size + y + (8 * scale));
                });
                c.drawImage(img, x - ((fab.radius - (4 * scale)) / 2), y - (fab.icon / 2) - (6 * scale), fab.radius - (4 * scale), fab.radius - (4 * scale));
            }
        }
    }
    if (nav) {
        var menu = new Image();
        var dot = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"/></svg>';

        dot = pickSVGColor(dot, color);
        menu.src = convertIcon(dot);

        c.drawImage(menu, x - (fab.width / 6), y + (fab.width / 4), fab.radius / 2, fab.radius / 2);
    }
}

//Icon and Text changes

/**
 * Defines the font-color depends on the background
 * @param   {string} bgColor    The background-color (color of arc)
 * @param   {string} lightColor The lightcolor for font
 * @param   {string} darkColor  The darkcolor for font
 * @returns {string} ligth or dark if L (light) is higher then the value
 */
function pickTextColor(bgColor, lightColor, darkColor) {
    var rgb, r, g, b, uicolors, hexCheck, color;
    hexCheck = /^#[0-9A-F]{6}$/i;

    if (bgColor.includes('#')) {
        var color = bgColor.substring(1, 7);
        r = parseInt(color.substring(0, 2), 16); // hexToR
        g = parseInt(color.substring(2, 4), 16); // hexToG
        b = parseInt(color.substring(4, 6), 16); // hexToB
    } else {
        rgb = bgColor.match(/\d+/g);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
    }
    uicolors = [r / 255, g / 255, b / 255];
    var c = uicolors.map((col) => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    return (L > 0.179) ? darkColor : lightColor;
}

/**
 * Changes the svg icon color by checking the background
 * @param   {String} svg   The String of the svg icon
 * @param   {string} color The String of the background-color
 * @returns {String} changeSVG  The svg string with a new color
 */
function pickSVGColor(svg, color) {
    var background, changeSVG;
    changeSVG = svg;
    var background = pickTextColor(color, "#FFF", "#000");
    if (background == '#FFF') {
        var position = svg.indexOf("<svg");
        changeSVG = svg.splice(position + 4, 0, " fill='#e5e5e5'");
    }
    return changeSVG;
}

/**
 * Converts the svg string intro a data:image
 * @param   {string} svg The String of the svg icon
 * @returns {string} img The String of the converted icon
 */
function convertIcon(svg) {
    var img, menu;
    menu = svg;
    menu = encodeURIComponent(menu);
    img = "data:image/svg+xml," + menu;
    return img;
}

/**
 * Splits the text of a menuCircle (circle[1-5]) depends on the maxWidth
 * @param   {string} text     A String of the text from menuCircle
 * @param   {number} maxWidth The size of the circle
 * @returns {Array} The splitted text
 */
function fragmentText(text, maxWidth) {
    var words, lines, lineb, line;
    words = text.split(' ');
    lines = [];
    lineb = [];
    line = "";

    while (words.length > 0) {
        while (c.measureText(words[0]).width >= maxWidth) {
            var tmp = words[0];
            words[0] = tmp.slice(0, -1);
            if (words.length > 1) {
                words[1] = tmp.slice(-1) + words[1];
            } else {
                words.push(tmp.slice(-1));
            }
        }
        if (c.measureText(line + words[0]).width < maxWidth) {
            line += words.shift() + " ";
        } else {
            lines.push(line);
            line = "";
        }
        if (words.length === 0) {
            lines.push(line);
        }
    }
    if (lines.length > 3) {
        lines.remove(3, lines.length - 1);
    }
    return lines;
}

//Load JSON

/**
 * Loads the json file
 * @param {string} file     A String of the json in the path
 * @param {object} callback contains the content of the json
 */
function loadJSON(file, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', file);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status == "200") {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
}

//SmartNav - loading page

/**
 * Load the SmartNav FAB
 * @param {object} json  Settings of the json file
 * @param {string} color background-color of the mainCircle (circle[0])
 */
function SNonload(json, color) {
    changeCanvas(json);

    var menuIcon = '<?xml version="1.0" ?><!DOCTYPE svg><svg height="32px" id="Layer_1" style="enable-background:new 0 0 32 32;" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/></svg>';

    menuIcon = pickSVGColor(menuIcon, color);
    menuIcon = convertIcon(menuIcon);

    circle.push(new Circle(fab.width, fab.width, fab.radius, color, false, undefined, menuIcon));
    draw();
}

/**
 * Checks if Intro is false (json: Global)
 * @param {object} json Settings of the json file
 */
function introCheck(json) {
    if (json.Intro == false) {
        requestAnimationFrames(function (timestamp) {
            var startimer = timestamp || performance.now();
            pulse(startimer, timestamp, 3000);
            speechbubble();
        })
    }
    console.log("introCheck");
}

/**
 * Repositions the mainCircle Button in the corne
 * @param {object} main A object from the circle[]
 */
function locateSmartNav(main) {
    var lside = canvas.width / 2 > main;
    settings.orientation = lside ? "left" : "right";
    var i = circleTouch(circle);
    var edge = getEdge(settings);
    scroll = settings.orientation == "left" ? 0 : getScrollbarWidth();
    if (edge.x != (main + scroll)) {
        automove(edge.x - scroll, edge.y, fab.radius, circle[i], performance.now());
        change = true;
    }
}

/**
 * Changes the CSS-Property and Size of the canvas
 * @param {object} json Settings of the json file
 * @param {number} i    A number which circle field is used
 */
function changeCanvas(json, i) {
    canvas.removeAttribute("style");
    if (tapped) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.top = 0;
        canvas.style.left = 0;
    } else {
        canvas.width = canvas.height = 2 * fab.width;
        canvasOrientation(json);
    }
    if (i == 0) {
        update();
    }
    draw();
}

/**
 * Updates the position of mainCircle (circle[0]) at tap
 */
function update() {
    if (tapped) {
        var upCircle = getEdge(settings);
        circle[0].y = !created ? upCircle.y : circle[0].y;
        circle[0].x = !created ? upCircle.x - scroll : circle[0].x;
    } else {
        circle[0].y = circle[0].x = fab.width;
    }
}

/**
 * Sets the CSS-property of the canvas
 * @param {object} json Settings of the json file
 */
function canvasOrientation(json) {
    canvas.style.bottom = 0;
    if (json.orientation.length == 0 || json.orientation == "right") {
        canvas.style.right = 0;
    } else if (json.orientation == "left") {
        canvas.style.left = 0;
    }
}

//SmartNav - open Menu

/**
 * Opens SmartNav (show Menu)
 * @param {[[Type]]} option Settings of the json file
 * @param {[[Type]]} link   Links of the json file
 */
function SNopen(option, link) {
    var corner = getCorner(option);
    if (!created) {
        if (dLevel) {
            circle[0].text = dLevel;
        }
        automove(corner.x, corner.y, 80 * scale, circle[0], performance.now());
        spacer = (2 * Math.PI) / 24;
        border = borders(option, spacer);
        linking(option, link, menuColor);
        created = true;
        changeIcon();
    }
}

/**
 * Generate the menuCircle on the number of links
 * @param {object}   option Settings of the json file
 * @param {object} link   Links of the json file
 * @param {string} color  The String for the circle color
 */
function linking(option, link, color) {
    var parts, start, multi, radius, rounds, spacer, tmpA;
    radius = fab.width * 3;
    rounds = links.length;
    multi = 1;
    if (rounds == 1) {
        parts = 8;
        if (option.orientation == "left") {
            start = 7;
        } else {
            start = 5;
        }
    } else if (rounds == 2) {
        parts = 12;
        if (option.orientation == "left") {
            start = 10;
        } else {
            start = 7;
        }
    } else if (rounds >= 3) {
        parts = 24;
        multi = 2;
        if (rounds == 3) {
            if (option.orientation == "left") {
                start = 19;
            } else {
                start = 13;
            }
        } else {
            if (option.orientation == "left") {
                start = 17;
            } else {
                start = 11;
            }
        }
        if (rounds == 4) {
            rounds = 5;
        }
        for (i = 1; i <= 24; i += 2) {
            var tmp_a = ((2 * Math.PI) / parts) * i;
            mask.push(tmp_a);
        }
        borderrange = option.orientation == "left" ? [7, 3, 1] : [4, 10, 8];
        linkRange = [link.length - 2, 4];
    }
    spacer = (2 * Math.PI) / parts;
    for (var i = 0; i < rounds; i++) {
        if (i < 5) {
            tmpA = spacer * (start + (i * multi));
            _angle.push(tmpA);
            var menu = circlePosition(tmpA, radius);
            var desc = catchText(link, rounds, i, color);
            circle.push(new Circle(menu.x, menu.y, fab.radius, color, false, desc[0], desc[1], desc[2]));
        }
    }
}

/**
 * Gets the Descriptions of one circle
 * @param   {object} json   Links of the json file
 * @param   {number} rounds [[Description]]
 * @param   {number} i      [[Description]]
 * @param   {string} color  [[Description]]
 * @returns {Array}    The description of one circle
 */
function catchText(json, rounds, i, color) {
    var text, tmpIcon, icon, nav;
    if (rounds <= 3) {
        if (json[i].hasOwnProperty('title')) {
            text = json[i].title;
        } else {
            text = null;
        }
        if (json[i].hasOwnProperty('icon')) {
            tmpIcon = pickSVGColor(json[i].icon, color);
            icon = convertIcon(tmpIcon);;
        } else {
            icon = null;
        }
        if (json[i].hasOwnProperty('nav')) {
            nav = true;
        } else {
            nav = false;
        }
    } else {
        if (i == 0) {
            if (json[json.length - 1].hasOwnProperty('title')) {
                text = json[json.length - 1].title;
            } else {
                text = null;
            }
            if (json[json.length - 1].hasOwnProperty('icon')) {
                tmpIcon = pickSVGColor(json[json.length - 1].icon, color);
                icon = convertIcon(tmpIcon);
            } else {
                icon = null;
            }
            if (json[json.length - 1].hasOwnProperty('nav')) {
                nav = true;
            } else {
                nav = false;
            }
        } else {
            if (json[i - 1].hasOwnProperty('title')) {
                text = json[i - 1].title;
            } else {
                text = null;
            }
            if (json[i - 1].hasOwnProperty('icon')) {
                tmpIcon = pickSVGColor(json[i - 1].icon, color);
                icon = convertIcon(tmpIcon);;
            } else {
                icon = null;
            }
            if (json[i - 1].hasOwnProperty('nav')) {
                nav = true;
            } else {
                nav = false;
            }
        }
    }
    return [text, icon, nav];
}

/**
 * Moves the menuCircle (circle[1-5]) in circular Movement
 * @param {object} distance The current distance between the last position calls
 * @param {object} option   Settings of the json file
 * @param {object} link     Links of the json file
 * @param {Array}  angle    A value which is set from autoscroll()
 */
function move(distance, option, link, angle) {
    var neg, tmp_angle, tmp_color, manus, overround, underround, desc;

    //Manus for Mask rotation
    manus = false;
    tmp_color = underGround ? undermenuColor : menuColor;

    if (circle.length > 1) {

        //temporary angle
        if (!angle) {
            neg = option.orientation == "left" ? Math.sign(distance.y) == -1 ? 1 : -1 : Math.sign(distance.y) == -1 ? -1 : 1;

            if (!tmp_dist[1]) {
                tmp_dist[1] = 0;
            }
            tmp_dist[0] = Math.sqrt(Math.pow(distance.x, 2) + Math.pow(distance.y, 2));
            amplitude = tmp_dist[1] == 0 ? 1 * neg : ((tmp_dist[1] / tmp_dist[0]) + 1) * neg;

            tmp_angle = 0.003 * tmp_dist[0] * amplitude;
        } else {
            tmp_angle = 0.05 * -angle; // angle definied from autoscroll()
            neg = angle >= 0 ? -1 : 1;
        }

        //Update of Mask
        for (var j = 0; j < mask.length; j++) {
            mask[j] += tmp_angle;
        }

        overround = option.orientation == "left" ? _angle[4] - (2 * Math.PI) : _angle[4];
        underround = option.orientation == "left" ? mask[borderrange[2]] + (2 * Math.PI) : mask[borderrange[1]];

        //Change Circle if the first or last cross the border
        if (overround > border[1]) {
            _angle.remove(4);
            _angle.insert(0, mask[borderrange[0]]);
            for (var k = 0; k < borderrange.length; k++) {
                borderrange[k] = borderrange[k] == 0 ? 11 : borderrange[k] - 1;
            }
            circle.remove(5);
            console.log("oben", linkRange, borderrange, circle);
            desc = catchText(link, 1, linkRange[0], tmp_color);
            for (var l = 0; l < linkRange.length; l++) {
                linkRange[l] = linkRange[l] == 0 ? link.length - 1 : linkRange[l] - 1;
            }
            circle.insert(1, new Circle(0, 0, fab.radius, tmp_color, false, desc[0], desc[1], desc[2]));
        }
        if (_angle[0] < border[0]) {
            _angle.remove(0);
            _angle.push(underround);
            for (var k = 0; k < borderrange.length; k++) {
                borderrange[k] = borderrange[k] == 11 ? 0 : borderrange[k] + 1;
            }
            circle.remove(1);
            console.log("unten", linkRange, borderrange, circle);
            desc = catchText(link, 1, linkRange[1], tmp_color);
            for (var l = 0; l < linkRange.length; l++) {
                linkRange[l] = linkRange[l] == link.length - 1 ? 0 : linkRange[l] + 1;
            }
            circle.push(new Circle(0, 0, fab.radius, tmp_color, false, desc[0], desc[1], desc[2]));
        }

        //Mask rotation
        if (mask[upborder] > (2 * Math.PI) && !manus) {
            mask[upborder] -= 2 * Math.PI;
            upborder = upborder == 0 ? mask.length - 1 : upborder - 1;
            downborder = upborder == mask.length - 2 ? mask.length - 1 : downborder - 1;
            manus = true;
        }
        if (mask[downborder] < 0 && !manus) {
            mask[downborder] += 2 * Math.PI;
            downborder = downborder == mask.length - 1 ? 0 : downborder + 1;
            upborder = downborder == 1 ? 0 : upborder + 1;
            manus = true;
        }

        //new Position for the menuCircle [1-6]
        for (var i = 1; i < circle.length; i++) {
            _angle[i - 1] += tmp_angle;
            var newPos = circlePosition(_angle[i - 1], fab.width * 3);
            circle[i].x = newPos.x;
            circle[i].y = newPos.y;
        }

        //temporary distance and amplitude
        tmp_dist[1] = tmp_dist[0];
        tmp_dist[2] = amplitude;
        draw();
    }
}

/**
 * Navigates to the tapped link
 * @param {string} A field which contained the tapped circle
 */
function navigate(circle) {
    for (var j = 0; j < links.length; j++) {
        if (links[j].title == circle.text) {
            path = links[j].path;
        }
    }
    window.location.href = path;
}

/**
 * Sets the Border of the max angle position of the menuCircle (max 5 circle)
 * @param   {object} json Settings of the json file
 * @param   {number} part A value which is 15 degreee in a radient (2*Math.PI/24)
 * @returns {Array}  
 */
function borders(json, part) {
    var underB, overB;
    if (json.orientation != "left") {
        underB = part * 10;
        overB = part * 20;
    } else {
        underB = part * 16;
        overB = part * 2;
    }
    return [underB, overB];
}

//SmartNav - open underMenu

/**
 * Shows the underMenu of a Link (which is definied in the json "nav")
 * Changes the values of the menuCircle
 * The holded menu is now the mainCircle 
 */
function SNunderground() {
    if (dLevel) {
        circle[0].text = dLevel;
    }
    changeIcon();
    circle.remove(1, 5);
    linking(settings, json, undermenuColor);
}

//TouchEvents (Mobile and Mouse Events)
if (typeof window.ontouchstart !== 'undefined') {
    canvas.addEventListener('touchstart', tap);
    canvas.addEventListener('touchmove', drag);
    canvas.addEventListener('touchend', release);
}
canvas.addEventListener('mousedown', tap);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', release);

/**
 * Handles the release Events (touchstart or mousedown)
 * @param   {object}   e Enviromental values of the browser
 * @returns {boolean}  A boolean false value to stop e
 */
function tap(e) {
    tapped = true;
    reference = pos(e);
    amplitude = 0;

    //Scale Canvas -> over the Page or small in a Corner
    if (created) {
        var i = circleTouch(circle);
        changeCanvas(settings, i);
    } else {
        changeCanvas(settings, 0);
    }

    //Determination if tap hit a Circle
    var i = circleTouch(circle);
    if (i != -1) {
        pressed(i, true);
    }
    if(i > 0){
        navigate(circle[i]);
    }

    //Timer for hold()
    requestAnimationFrames(timer);

    console.log("tap()");
    e.preventDefault();
    e.stopPropagation();
    return false;
}

/**
 * Handles the drag Events (touchmove or mousemove) 
 * @param   {object}   e Enviromental values of the browser
 * @returns {boolean}  A boolean false value to stop e
 */
function drag(e) {
    var cpos, distance;
    if (tapped) {
        //current position and the distance between
        cpos = pos(e);
        distance = {
            x: reference.x - cpos.x,
            y: reference.y - cpos.y
        };
        //Move mainCircle (circle[0])
        if (dragged && !created) {
            for (var i = 0; i < circle.length; i++) {
                var C = circle[i];
                if (C.drag) {
                    C.x -= distance.x;
                    C.y -= distance.y;
                }
            }
            pressed(0, true, true);
        }
        //Move menuCircle at a regnonizable distance
        for (var f in distance) {
            if (distance[f] > 2 || distance[f] < -2) {
                dragging = true;
                reference = cpos;
                if (circle.length > 4) {
                    move(distance, settings, links);
                }
            }
        }
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
}

/**
 * Handles the release Events (touchend or mouseup)
 * 
 * @param   {object}   e Enviromental values of the browser
 * @returns {boolean}  A boolean false value to stop e
 */
function release(e) {
    quicktap();
    if (!created) {
        locateSmartNav(circle[0].x);
    }
    tapped = dragged = dragging = holded = underGround = false;
    if (ready) {
        changeCanvas(settings, 0);
        ready = false;
    }

    if (amplitude > 1 || amplitude < -1) {
        amplitude *= tmp_dist[0] > 30 ? 2 : 0.1;
        timestamp = performance.now();
        requestAnimationFrame(autoScroll);
    }


    var i = circleTouch(circle);
    if (i != -1) {
        pressed(i, true);
    } // Stop 'press' animation
    cancelAnimationFrames(timerID); // Stop the timer
    count = 0;
    tmp_dist = [];
    draw();

    //Set all circle.drag equal false
    for (var i = 0; i < circle.length; i++) {
        circle[i].drag = false;
    }

    console.log("release()", amplitude);

    e.preventDefault();
    e.stopPropagation();
    return false;
}

/**
 * Handles the quicktap Events (interactions between tap and release without drag)
 */
function quicktap() {
    var edge = getEdge(settings);
    var i = circleTouch(circle);
    if (!holded && !dragged && tapped && !created && i == 0) {
        SNopen(settings, links);
    } else if (!dragging && created && (i == 0 || i == -1)) {
        //Reset Array
        circle.remove(1, 5);
        _angle.remove(0, 5);
        mask.remove(0, 11);

        //Reset values
        upborder = 11;
        downborder = 0;
        created = false;
        changeIcon();
        change = true;

        //Reset Level of Menu
        if (jsonChange) {
            dIcon = dLevel = undefined;
        }
        links = jsonChange ? !originLinks ? links : originLinks : links;

        automove(edge.x - scroll, edge.y, 28 * scale, circle[0], performance.now());
    }
    console.log("quicktap()");
}

/**
 * Handles the hold Events (longpres without drag)
 */
function hold() {
    //TODO hold on mainCircle after underGround -> back to menu
    if (!dragged && tapped && !underGround) {
        //Holded true for move mainCircle in drag()
        holded = true;
        var i = circleTouch(circle);
        if (i != -1) {
            for (var j = 0; j < links.length; j++) {
                if (links[j].title == circle[i].text && links[j].hasOwnProperty('nav')) {
                    originLinks = links;
                    underGround = true;
                    links = dimensionLevel(links, j);
                    SNunderground(links, j);
                }
            }
        }
    }
    console.log("hold()");
}

/**
 * Sets the current position 
 * @param   {object}   e Enviromental values of the browser
 * @returns {object} The current position from the Mouse or Touch Input 
 */
function pos(e) {
    var x, y, position = {};
    //MouseEvent
    position.x = e.clientX;
    position.y = e.clientY;
    //TouchEvent
    if (e.targetTouches && (e.targetTouches.length >= 1)) {
        position.x = e.targetTouches[0].clientX;
        position.y = e.targetTouches[0].clientY;
    }
    return position;
}

//Animations

/**
 * Animates a Pulse effect (usage for introCheck())
 * @param {number} start                         The start time of the animation
 * @param {number} [timestamp=performance.now()] A Time which is definied or not (at beginning)
 * @param {number} duration                      The durration of the animation
 */
function pulse(start, timestamp, duration) {
    var timestamp = timestamp || performance.now();
    var runtime = timestamp - start;
    var progress = runtime / duration;

    if (runtime > 850) {
        var radius = (26 * scale) + ((5 * scale) * Math.abs(Math.cos(angle)));
        c.clearRect(0, 0, canvas.width, canvas.height);
        circle[0].radius = radius;
        draw();
        c.arc(44 * scale, 44 * scale, radius, 0, Math.PI * 2, false);
        c.fillStyle = "rgba(255,255,255, 0.1)";
        c.fill();
    }

    angle += Math.PI / 35;
    if (runtime < duration) {
        requestAnimationFrames(function (timestamp) {
            pulse(start, timestamp, duration);
        })
    } else {
        circle[0].radius = fab.radius;
        draw();
    }
}

/**
 * Set Speechbubbles to introduce SmartNav for the Customer
 * Unfinished -> TODO, where and what should it use
 */
function speechbubble() {
    //Using fragmentedText() to wrap the text for the Textbox
    //Smooth Animation with Opactiy -> 0.2 * 5 = 1 
    //console.log("speechbubble()");
}

/**
 * Animates a button pressed interaction
 * @param {number}  i     The specific position of a field in circle[] 
 * @param {boolean} power Changes the color and size of the circle[i] at pressing
 * @param {boolean} drag  Changes the color and size of the circle[i] at dragging
 */
function pressed(i, power, drag) {
    var radius = circle[i].radius;
    var edit;
    if (i == -1) {
        return
    }
    if (power) {
        if (!drag) {
            edit = -2 * scale;
        } else {
            edit = 5 * scale;
            c.globalAlpha = 0.8;
        }
        circle[i].radius += edit;
        draw();
        c.beginPath();
        c.arc(circle[i].x, circle[i].y, circle[i].radius, 0, Math.PI * 2, false);
        c.fillStyle = "rgba(0,0,0, 0.1)";
        c.fill();
        c.closePath();
        circle[i].radius -= edit;
    } else {
        circle[i].radius = radius;
    }
}

/**
 * Animates the movement of a circle when it changes his position or and his size
 * @param {number} nextX   The new x position of a circle
 * @param {number} nextY   The new y position of a circle
 * @param {number} nextR   The new radius position of a circle
 * @param {object} element The circle which get the new params
 * @param {number} time    The start time of the animation
 * @param {number} start   A Time which is definied or not (at beginning)
 */
function automove(nextX, nextY, nextR, element, time, start) {
    if (!start) {
        start = time || performance.now();
    }
    var deltaTime = (time - start) / 500;
    var currentX = element.x + ((nextX - element.x) * deltaTime);
    var currentY = element.y + ((nextY - element.y) * deltaTime);
    var currentR = element.radius + ((nextR - element.radius) * deltaTime);

    if (deltaTime >= 1) {
        start = null;
        if (!released) {
            element.y = nextY;
            element.x = nextX;
            element.radius = nextR;
            released = false;
        }
        draw();
        //Closing SmartNav
        if (change) {
            change = false;
            changeCanvas(settings, 0);
            released = true;
        }
    } else {
        element.y = currentY;
        element.x = currentX;
        element.radius = currentR;
        draw();
        requestAnimationFrames(function (time) {
            automove(nextX, nextY, nextR, element, time, start);
        });
    }
}

/**
 * Animates the decelerate of the menuCircle (circle[1-5]) after release
 */
function autoScroll() {
    var elapsed, delta;

    if (amplitude) {
        elapsed = performance.now() - timestamp;
        delta = -amplitude * Math.exp(-elapsed / timeConstant);
        if (delta > 0.1 || delta < -0.1) {
            move(undefined, settings, links, delta);
            requestAnimationFrame(autoScroll);
        } else {
            draw();
        }
    }
}

/**
 * Changes the Icon of the mainCircle (circle[0]) when opened or closed or loaded on a other page
 */
function changeIcon() {
    var menuIcon;
    if (!created) {
        menuIcon = '<?xml version="1.0" ?><!DOCTYPE svg><svg height="32px" id="Layer_1" style="enable-background:new 0 0 32 32;" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/></svg>';
        menuIcon = pickSVGColor(menuIcon, mainColor);
        menuIcon = convertIcon(menuIcon);
    } else if (dIcon) {
        menuIcon = dIcon;
        menuIcon = pickSVGColor(menuIcon, mainColor);
    } else {
        menuIcon = '<svg aria-hidden="true" data-prefix="fas" data-icon="times" class="svg-inline--fa fa-times fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="-200 -100 800 800"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>';
        menuIcon = pickSVGColor(menuIcon, mainColor);
        menuIcon = convertIcon(menuIcon);
    }
    circle[0].icon = menuIcon;
    if (!created) {
        circle[0].text = undefined;
    }
}