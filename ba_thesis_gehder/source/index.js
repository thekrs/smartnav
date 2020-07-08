window.$ = window.jQuery = require("jquery");
var eleGen = require("htmlElements.js");
var initTouch;
var navigation = [
    {
        title: 'Mobilfunk',
        path: 'https://geschaeftskunden.telekom.de/startseite/mobilfunk/340038/mobilfunk-aktionen-neuheiten.html',
        nav: [
            {
                title: 'Aktionen & Neuheiten',
                path: ''
            },
            {
                title: 'Tarife',
                path: 'https://geschaeftskunden.telekom.de/startseite/mobilfunk/290190/die-mobilfunktarife-der-telekom-fuer-geschaeftskunden.html',
                nav: [
                    {
                        title: 'Telefonieren & Surfen',
                        path: ''
                    },
                    {
                        title: 'Datentarife',
                        path: 'https://geschaeftskunden.telekom.de/startseite/mobilfunk/tarife/293134/lte-internet-flat-datentarife-fuer-geschaeftskunden-der-telekom.html#293050'
                    },
                    {
                        title: 'Zusatzkarten',
                        path: ''
                    }
                ]
            },
            {
                title: 'Smartphones & Handys',
                path: ''
            },
            {
                title: 'Tablets & Surfsticks',
                path: ''
            },
            {
                title: 'Zubuchoptionen',
                path: ''
            }
        ]
    },
    {
        title: 'Festnetz & Internet',
        path: 'https://geschaeftskunden.telekom.de/startseite/festnetz-internet/tarife/288914/internet-telefonie.html'
    },
    {
        title: 'Cloud & IT',
        path: 'https://geschaeftskunden.telekom.de/startseite/cloud-it/300436/telekomcloud.html'
    },
    {
        title: 'Hilfe & Service',
        path: 'https://geschaeftskunden.telekom.de/startseite/service/311066/online-services.html'
    },
    {
        title: 'Lösungen',
        path: 'https://geschaeftskunden.telekom.de/',
        nav:[
            {
                title:'Für Selbständige',
                path:'https://geschaeftskunden.telekom.de/startseite/loesungen/297620/fuer-selbststaendige.html',
                nav:[
                    {
                        title:'Absatz & Service',
                        path:''
                    },
                    {
                        title:'Produktivität',
                        path:''
                    },
                    {
                        title:'Zusammenarbeit',
                        path:''
                    },
                    {
                        title:'Sicherheit',
                        path:'https://geschaeftskunden.telekom.de/startseite/loesungen/fuer-selbststaendige/297732/sicherheit-gewaehrleisten.html'
                    }
                ]
        },
        {
            title:'Für kleine und mittelständige U.',
            path:'https://geschaeftskunden.telekom.de/startseite/loesungen/298256/fuer-kleine-und-mittlere-unternehmen.html'
        },
        {
            title:'Für Grossunternehmen',
            path:'https://geschaeftskunden.telekom.de/startseite/loesungen/298278/fuer-grossunternehmen.html'
        }
    ]
        
    },
    {
        title: 'Referenzen',
        path: 'https://geschaeftskunden.telekom.de/startseite/referenzen/330116/unternehmensgroesse.html'
    }
]


$(document).ready(function () {
    var body = document.getElementById('content-container'); //document.body;
    body.addEventListener('touchstart', function (eStart) {
        initTouch = eStart.changedTouches[0];
        // Check if canvas already shown and do actions on this condition
        if (initTouch.target == eleGen.getCanvas()) {
            eStart.preventDefault();
            return;
        } else {
            eleGen.dismissCanvas();
        }
        //Check if Start is in bottom 60px
        //according to usability: https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/
        var bottomRowPixel = window.screen.height - 60;
        var bottomRow = bottomRowPixel < initTouch.screenY;
        if (bottomRow) {
            console.log('Bottom Row');
            var canvasRight = window.screen.width / 2 < initTouch.screenX;
            eleGen.createCanvas(navigation, canvasRight)
            //https://stackoverflow.com/questions/26478267/touch-move-getting-stuck-ignored-attempt-to-cancel-a-touchmove
            //disable scrolling when u are in the Box
            eStart.preventDefault();
            body.addEventListener('touchmove', touchMove);
            body.addEventListener('touchend', touchEnd);
        }

    }, { passive: false })
})


/**
 * 
 * @param {TouchEvent} e 
 */
function touchMove(e) {
    eleGen.flyCanvasIn(initTouch, e)
}


/**
 * 
 * @param {TouchEvent} endEvent 
 */
function touchEnd(endEvent) {
    eleGen.removeCanvas()
    console.log("Detach Listeners");
    this.removeEventListener('touchmove', touchMove);
    this.removeEventListener('touchend', touchEnd);
}


