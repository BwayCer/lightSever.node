"use strict";


let htm = require( './htm' );

module.exports = errorPage;

function errorPage( errCode, errMsg ) {
    return htmErrPage( errCode + ' - ' + errStageCode[ errCode ], {
        errCode: errCode,
        errStageSummary: errStageCode[ errCode ],
    } );
}

let txtHtmlSvgErrGhost = htm.tag( function ( t ) {
    t( 'svg', { className: 'error-ghost', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 109.92 127.22' },
        t( 'defs',
            htm.tagStyle( {
                '.cls-1,.cls-4': { fill: '#666' },
                '.cls-1,.cls-2,.cls-3': { fillRule: 'evenodd' },
                '.cls-2': { fill: '#fff' },
                '.cls-3': { fill: '#fcded9' },
            } )
        ),
        t( 'g', { id: 'Layer_2', dataset: { name: 'Layer 2' } },
            t( 'g', { id: 'Layer_1-2', dataset: { name: 'Layer 1' } },
                t( 'path', { className: 'cls-1',
                    d: 'M83.27,7.95H7.95V115.56L10,117.63l12.17-12.17a4,4,0,0,1,5.62,0L40,117.63l12.17-12.17a4,4,0,0,1,5.62,0l12.17,12.17,12.17-12.17a4,4,0,0,1,5.62,0L99.9,117.63l2.07-2.07V26.64ZM4,0H84.92a4,4,0,0,1,2.83,1.18l21,21A4,4,0,0,1,109.92,25v92.2a4,4,0,0,1-1.18,2.83l-6,6a4,4,0,0,1-5.62,0L84.92,113.89,72.75,126.06a4,4,0,0,1-5.62,0L55,113.89,42.79,126.06a4,4,0,0,1-5.62,0L25,113.89,12.83,126.06a4,4,0,0,1-5.62,0l-6-6A4,4,0,0,1,0,117.2H0V4A4,4,0,0,1,4,0Z',
                } ),
                t( 'polygon', { className: 'cls-2',
                    points: '3.97 3.97 84.92 3.97 105.94 25 105.94 117.2 99.9 123.25 84.92 108.27 69.94 123.25 54.96 108.27 39.98 123.25 25 108.27 10.02 123.25 3.97 117.2 3.97 3.97',
                } ),
                t( 'path', { className: 'cls-1',
                    d: 'M80.95,25V4h0a4,4,0,0,1,6.78-2.81l21,21a4,4,0,0,1-2.79,6.8h-21a4,4,0,0,1-4-4m7.95-11.43V21h7.46Z',
                } ),
                t( 'polygon', { className: 'cls-3',
                    points: '84.92 3.97 84.92 25 105.94 25 84.92 3.97',
                } ),
                t( 'polygon', { className: 'cls-3',
                    points: '39.98 115.8 25 100.82 10.02 115.8 3.97 109.75 3.97 117.2 10.02 123.25 25 108.27 39.98 123.25 54.96 108.27 69.94 123.25 84.92 108.27 99.9 123.25 105.94 117.2 105.94 109.75 99.9 115.8 84.92 100.82 69.94 115.8 54.96 100.82 39.98 115.8',
                } ),
                t( 'rect', { className: 'cls-4', x: '25.39', y: '37.04', width: '21.02', height: '3.97',
                    transform: 'translate(-17.08 36.82) rotate(-45)',
                } ),
                t( 'rect', { className: 'cls-4', x: '33.92', y: '28.52', width: '3.97', height: '21.02',
                    transform: 'translate(-17.08 36.82) rotate(-45)',
                } ),
                t( 'rect', { className: 'cls-4', x: '63.5', y: '37.04', width: '21.02', height: '3.97',
                    transform: 'translate(-5.92 63.76) rotate(-45)',
                } ),
                t( 'rect', { className: 'cls-4', x: '72.03', y: '28.52', width: '3.97', height: '21.02',
                    transform: 'translate(-5.92 63.77) rotate(-45)',
                } ),
                t( 'path', { className: 'cls-4',
                    d: 'M25.13,66.25a2,2,0,0,1,0-4H84.79a2,2,0,1,1,0,4Z',
                } ),
                t( 'path', { className: 'cls-4',
                    d: 'M82.8,66.25H70.48v6.16a6.16,6.16,0,0,0,12.32,0Zm-14.31-4H86.78V72.41a10.13,10.13,0,0,1-20.27,0V62.27Z',
                } ),
                t( 'path', { className: 'cls-4',
                    d: 'M74.66,64.26a2,2,0,1,1,4,0v5.52a2,2,0,1,1-4,0Z',
                } ),
                t( 'path', { className: 'cls-3',
                    d: 'M76.64,71.76a2,2,0,0,1-2-2V66.25H70.48v6.16a6.16,6.16,0,0,0,12.32,0V66.25H78.63v3.53a2,2,0,0,1-2,2',
                } )
            )
        )
    );
} );

var htmErrPage = htm()
    .head
        .meta( { charset: 'utf-8' } )
        .title()
        .style( {
            '.error-ghost': {
                margin: '15px',
                height: '115px',
                maxWidth: '100%',
                border: '0',
            },
            '.error-details > *': {
                verticalAlign: 'middle',
            },
            '.error-message': {
                margin: '15px',
                display: 'inline-block',
            },
            '.error-code': {
                fontWeight: 'bold',
                margin: '0',
                color: '#979797',
                fontSize: '7.8rem',
                lineHeight: '.9em',
                fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",'
                    + 'Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans",'
                    + '"Droid Sans","Helvetica Neue",sans-serif',
            },
        } )
    .body
        .child( function ( t ) {
            t( 'main', { id: 'main', role: 'main' },
                t( 'div', { className: 'gh-app' },
                    t( 'div', { className: 'gh-viewport' },
                        t( 'div', { className: 'gh-view' },
                            t( 'section', { className: 'error-content error-404 js-error-container' },
                                t( 'section', { className: 'error-details' },
                                    txtHtmlSvgErrGhost,
                                    t( 'section', { className: 'error-message' },
                                        t( 'h1', { className: 'error-code' }, t.pos( 'errCode' ) ),
                                        t( 'h2', { className: 'error-description' }, t.pos( 'errStageSummary' ) )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        } )
.mth();

let errStageCode = {
    // 4xx 用戶端錯誤
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    421: 'Misdirected Request ',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests ',
    431: 'Request Header Fields Too Large ',
    451: 'Unavailable For Legal Reasons',

    // 5xx伺服器錯誤
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected ',
    510: 'Not Extended',
    511: 'Network Authentication Required ',
};

