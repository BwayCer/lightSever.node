/*! Node Light Sever @license: CC-BY-4.0 - BwayCer (https://bwaycer.github.io/about/) */

"use strict";


const http   = require( 'http' );
const fs     = require( 'fs' );
const path   = require( 'path' );
const url    = require( 'url' );
const events = require( 'events' );


let config = {};
void function(){
    // 命令行傳遞的參數 argument vector
    var argv = Array.prototype.slice.call( process.argv, 1 );

    let compartment = { _: [] };
    let keyCmpt = 1;
    let regexFlog = /^(-|--)([$_0-9A-Za-z]+)(=(.+))?$/;

    for ( let p = 1, len = argv.length; p < len ; p++ ) {
        let item = argv[ p ];
        let matchFlog = item.match( regexFlog );

        if( matchFlog ) {
            if ( !keyCmpt ) throw Error( '請遵守「命令 > 選項 > 參數」的命令次序。' );

            keyCmpt = ( matchFlog[ 1 ].length === 1 ? '_' : '__' ) + matchFlog[ 2 ];

            let val = matchFlog[ 4 ];
            compartment[ keyCmpt ] = val ? val : true;
            if ( val ) keyCmpt = 1;
        } else{
            if ( typeof keyCmpt === 'string' ) {
                compartment[ keyCmpt ] = item;
                keyCmpt = 1;
            } else {
                compartment._.push( item );
                keyCmpt = 0;
            }
        }
    }

    // 數字文字不影響 http.createServer 的判斷
    config.port = process.env.PORT || compartment._p || 8080;

    let rootPath = compartment._[ 0 ];
    config.rootPath = ( rootPath && fs.existsSync( rootPath ) ) ? rootPath : process.cwd();

    console.log( 'config: ' + JSON.stringify( config, null, 4 ) );
}();


let taskTick;

let nodeServer = http.createServer( function( request, response ) {
    let urlParse = url.parse( request.url, true );
    let own ={
        request: request,
        response: response,
        url: decodeURIComponent( urlParse.pathname ),
    };

    taskTick[ 0 ] = [ own ];
    asyncSeries.apply( null, taskTick );
} );

nodeServer.listen(
    config.port,
    function () {
        var orgin = require( 'os' ).networkInterfaces().ens33[ 0 ].address;
        console.log( '伺服器開啟於 http://' + orgin + ':' + config.port + '/' );
    }
);

taskTick = [
    null,
    function getPathFsStat( own, fnDone ){
        let localPath = config.rootPath + own.url;
        own.path = localPath;
        own.pathParse = path.parse( localPath );
        fs.stat( localPath, function ( err, objStat ) {
            fnDone( err, objStat, own );
        } );
    },
    function ( err, objStat, own, fnDone ){
        if( err ) {
            // throw err;
            own.response.writeHead( 404 );
            own.response.write( 'Uncaught ' + err.stack );
            own.response.end();
        } else if ( objStat.isDirectory() ) {
            own.pathStat = objStat;
            fnDone( null, own );
        } else if ( objStat.isFile() ) {
            own.pathStat = objStat;
            fnDone.next( 2 )( null, own );
        } else {
            own.response.writeHead( 422 );
            own.response.write( 'Unprocessable Entity' );
            own.response.end();
        }
    },
    // directory
    function getPathFsReaddir( err, own, fnDone ) {
        fs.readdir( own.path, function ( err, arrFiles ) {
            fnDone( err, arrFiles, own );
        } );
    },
    function openDirectory( err, arrFiles, own ) {
        let viewHtml = [
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>',
            '</title>'
                + '<style>'
                + 'img { vertical-align: middle; width: 24px; height: 24px; padding: 4px; font-size: 18px; }'
                + '</style></head><body>',
            '</body></html>'
        ];
        let title = '目錄 - ' + own.url;
        let txt = '';

        for ( let p = 0, len = arrFiles.length; p < len ; p++ ) {
            let val = arrFiles[ p ];
            txt += '<div><img src="?" />';
            txt += '<a href="./' + val + '">' + val + '</a>';
            txt += '</div>';
        }

        let txtHtml = viewHtml[ 0 ] + title + viewHtml[ 1 ] + txt + viewHtml[ 2 ];
        let resHeader = {};

        resHeader[ 'Content-Type' ] = 'text/html; charset=UTF-8';
        resHeader[ 'Accept-Ranges' ] = 'bytes';
        resHeader[ 'Content-Length' ] = txtHtml.length;

        own.response.writeHead( 200, resHeader );
        own.response.write( txtHtml );
        own.response.end();
    },
    // file
    function openFile( err, own, fnDone ) {
    }
];


/***
 * 陣列的重新包裝。
 *
 * @func rewrapArr
 * @param {Array} target - 複製目標對象。
 * @return {Array}
 */
function _rewrapArr( arrTarget ) {
    var len = arrTarget.length;
    var arrAns = new Array( len );

    while ( len-- ) arrAns[ len ] = arrTarget[ len ];
    return arrAns;
}

/*! Asynchronous Programming @license: CC-BY-4.0 - BwayCer (https://bwaycer.github.io/about/) */
/* 異步編程 */
/***
 * 連續： 連續之函式清單。
 *
 * @param {Array} [preArgs] - 初始參數。
 * @param {...Function} asyncOpt - 操作異步的函數。
 * @example
 * async.series(
 *     [[ ...anyData],]
 *     function ( [ ...anyData,] fnDone ) {
 *         setTimeout( fnDone, 1000, null, 'data' );
 *     },
 *     function ( err[, ...anyData], fnDone ) {...},
 *     ...,
 *     function ( err[, ...anyData] ) {...}
 * );
 */
function asyncSeries() {
    var pushArgs;
    var list = _rewrapArr( arguments );
    var asyncCtrl = asyncSeries.toBind( list );

    pushArgs = typeof list[ 0 ] === 'function' ? [] : list.shift();
    pushArgs.push( asyncCtrl );

    list.shift().apply( null, pushArgs );
}

asyncSeries.toBind = function ( arrList ) {
    function asyncCtrl() {
        var list = asyncCtrl.list;
        var pushArgs = _rewrapArr( arguments );
        if( list.length > 1 ) pushArgs.push( asyncCtrl );
        list.shift().apply( null, pushArgs );
    }

    asyncCtrl.list = arrList;
    asyncCtrl.next = this.next;

    return asyncCtrl;
};

asyncSeries.next = function ( numQuantity ) {
    numQuantity = numQuantity > 1 ? numQuantity : 1;

    var list = this.list;
    var len = list.length;
    var idx = 0;
    var idxReplace = numQuantity;

    while ( idxReplace < len ) list[ idx++ ] = list[ idxReplace++ ];
    while ( idx++ < len ) list.pop();

    return this;
};

