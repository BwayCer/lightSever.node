/*! Node Light Sever @license: CC-BY-4.0 - BwayCer (https://bwaycer.github.io/about/) */

"use strict";


const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const events = require('events');


let htm           = require('./htm');
let lxoxg         = require('./lxoxg');
let getMIME       = require('./getMIME');
let errorPage     = require('./errorPage');
let preprocessors = require('./preprocessor');


let config = {};
void function () {
    // 命令行傳遞的參數 argument vector
    let argv = Array.prototype.slice.call(process.argv, 1);

    let compartment = {_: []};
    let keyCmpt = 1;
    let regexFlog = /^(-|--)([$_0-9A-Za-z]+)(=(.+))?$/;

    for (let p = 1, len = argv.length; p < len ; p++) {
        let item = argv[p];
        let matchFlog = item.match(regexFlog);

        if (matchFlog) {
            if (!keyCmpt) throw Error('請遵守「命令 > 選項 > 參數」的命令次序。');

            keyCmpt = (matchFlog[1].length === 1 ? '_' : '__') + matchFlog[2];

            let val = matchFlog[4];
            compartment[keyCmpt] = val ? val : true;
            if (val) keyCmpt = 1;
        } else {
            if (typeof keyCmpt === 'string') {
                compartment[keyCmpt] = item;
                keyCmpt = 1;
            } else {
                compartment._.push(item);
                keyCmpt = 0;
            }
        }
    }

    // 數字文字不影響 http.createServer 的判斷
    config.port = process.env.PORT || compartment._p || 8080;
    config.host = process.env.HOST || compartment._h || '0.0.0.0'; // '127.0.0.1'

    let rootPath = compartment._[0];
    rootPath = (rootPath && fs.existsSync(rootPath)) ? rootPath : process.cwd();
    config.rootPath = rootPath;
    config.rootAbsolutePath = path.join(process.cwd(), rootPath);


    console.log('config: ' + JSON.stringify(config, null, 4));
}();

let faviconInfo = {};
void function () {
    var path = faviconInfo.path = __dirname + '/favicon_ftp_128.png';
    var bufFile = faviconInfo.bufFile = fs.readFileSync( path );
    var resHeader = faviconInfo.resHeader = {};

    resHeader[ 'Content-Type' ] = getMIME( '.ico' ) + '; charset=UTF-8';
    resHeader[ 'Content-Length' ] = Buffer.from( bufFile ).length;
}();


let asyncSeries;
void function () {
    /***
     * 陣列的重新包裝。
     */
    let _rewrapArr = function rewrapArr( arrTarget ) {
        var len = arrTarget.length;
        var arrAns = new Array( len );

        while ( len-- ) arrAns[ len ] = arrTarget[ len ];
        return arrAns;
    };

    /* 異步編程 Asynchronous Programming */

    /***
     * 連續： 連續之函式清單。
     *
     * @param {Array} [preArgs] - 初始參數。
     * @param {...Function} asyncOpt - 操作異步的函數。
     *
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
    asyncSeries = function series() {
        var pushArgs;
        var list = _rewrapArr( arguments );

        pushArgs = typeof list[ 0 ] === 'function' ? [] : list.shift();
        pushArgs.push( series.toBind( list ) );

        list.shift().apply( null, pushArgs );
    };

    asyncSeries.toBind = function ( arrList ) {
        function asyncCtrl() {
            var list = asyncCtrl.list;
            var pushArgs = asyncCtrl._getPushArgs( arguments );
            if( list.length > 1 ) pushArgs.push( asyncCtrl );
            list.shift().apply( null, pushArgs );
        }

        asyncCtrl.list = arrList;
        asyncCtrl.needArgs = null;
        asyncCtrl.next = this.next;
        asyncCtrl.addArgs = this.addArgs;
        asyncCtrl._getPushArgs = this._getPushArgs;

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

    asyncSeries.addArgs = function ( arrNeedArgs ) {
        this.needArgs = arrNeedArgs;
        return this;
    };

    asyncSeries._getPushArgs = function ( arrArgs ) {
        var arrNeed = this.needArgs;

        if ( !arrNeed ) return _rewrapArr( arrArgs );

        var len = arrArgs.length;
        while ( len-- ) arrNeed[ len ] = arrArgs[ len ];

        this.needArgs = null;
        return arrNeed;
    };
}();


let taskTick;

taskTick = [
    null,
    function getPathFsStat(own, fnDone) {
        let localPath = path.join(config.rootPath, own.url);
        own.loog.msg(['對應路徑： ' + localPath]);
        own.path = localPath;
        own.pathParse = path.parse(localPath);

        let ext = path.extname(own.url);
        let limitOwn = {
            loog: own.loog,
            rootPath: config.rootPath,
            rootAbsolutePath: config.rootAbsolutePath,
            url: own.url,
            urlQuery: own.urlQuery,
            path: own.path,
            pathParse: own.pathParse,
        };

        // 預處理器
        let preprocessor = preprocessors[ext];
        if (preprocessor) {
            own.loog.msg([preprocessor.showName + ' 檢查中...']);
            preprocessor(limitOwn, fnDone.addArgs([null, own]));
        } else {
            fnDone(null, own);
        }
    },
    function (err, own, fnDone) {
        if (err) {
            errStage(own, '404', err, '預處理器執行失敗');
        } else {
            fs.stat(own.path, fnDone.addArgs([null, null, own]));
        }
    },
    function (err, objStat, own, fnDone){
        if (err) {
            errStage(own, '404', err, '讀取文件失敗');
        } else if (objStat.isDirectory()) {
            own.loog.msg(['取得文件類型： 資料夾']);
            own.pathStat = objStat;
            fnDone(null, own);
        } else if (objStat.isFile()) {
            own.loog.msg(['取得文件類型： 文件']);
            own.pathStat = objStat;

            let ext = own.pathParse.ext.toLowerCase();
            let isHCJFile = ext === '.html' || ext === '.css' || ext === '.js';
            if (isHCJFile) fnDone.next(2)(null, own, ext);
            else fnDone.next(3)(null, own, ext);
        } else {
            errStage(own, '404', null, '取得未知的文件類型');
        }
    },
    // directory
    function getPathFsReaddir( err, own, fnDone ) {
        fs.readdir( own.path, fnDone.addArgs( [ null, null, own ] ) );
    },
    function openDirectory( err, arrFiles, own ) {
        if( err ) errStage( own, '404', err, '無法開啟資料夾' );

        let url = path.join( own.url, '/' );

        let txtHtml = htmViewDir( '目錄 - ' + own.url, {
            fileNameInDir: htm.tag( function ( t ) {
                t.loop( arrFiles, function ( t, val ) {
                    t( 'div',
                        t.singleTag( 'img', { src: '?' } ),
                        t( 'a', { href: url + val }, val )
                    );
                } );
            } )
        } );

        let resHeader = {};

        resHeader[ 'Content-Type' ] = 'text/html; charset=UTF-8';
        resHeader[ 'Accept-Ranges' ] = 'bytes';
        resHeader[ 'Content-Length' ] = Buffer.from( txtHtml ).length;

        let response = own.response;
        response.writeHead( 200, resHeader );
        response.end( txtHtml );
        response.on( 'finish', function () {
            own.loog.msg('end');
        } );
    },
    function openHCJ( err, own, ext ) {
        let mime;

        switch ( ext ) {
            case '.html': mime = 'text/html'; break;
            case '.css': mime = 'text/css'; break;
            case '.js': mime = 'application/x-javascript'; break;
        }

        let resHeader = {};
        resHeader[ 'Content-Type' ] = mime + '; charset=UTF-8';
        resHeader[ 'Content-Length' ] = own.pathStat.size;

        pipeResponse( own.path, '', own, own.response, 200, resHeader );
    },
    // file
    function openCommonFile( err, own, ext, fnDone ) {
        let reqRange = own.request.headers.range;

        if( reqRange ) return fnDone( err, own, ext, reqRange );

        let response = own.response;

        let resHeader = {};
        resHeader[ 'Content-Type' ] = getMIME( ext ) + '; charset=UTF-8';

        if ( ~( [ '.mp4', ].indexOf( ext ) ) ) {
            resHeader[ 'Content-Length' ] = 0;
            response.writeHead( 200, resHeader );
            response.end();
            own.loog.msg( 'end' );
            return;
        }

        resHeader[ 'Content-Length' ] = own.pathStat.size;

        pipeResponse( own.path, '', own, response, 200, resHeader );
    },
    function filepipeStream( err, own, ext, reqRange ) {
        let response = own.response;
        let fileSize = own.pathStat.size;
        let rangeInfo = _handleRange( reqRange, fileSize );
        let statusCode = rangeInfo.statusCode;
        let contentType = getMIME( ext ) + '; charset=UTF-8';

        own.loog.msg( [
            'HTTP 狀態碼： ' + statusCode,
            '類型： ' + contentType,
        ] );

        let resHeader = {};

        resHeader[ 'Content-Type' ] = contentType;

        if ( rangeInfo.statusCode !== 206 ) {
            resHeader[ 'Content-Range' ] = 'bytes *\/' + fileSize;
            response.writeHead( statusCode, resHeader );
            response.end();
            own.loog.msg( 'end' );
        }

        own.loog.msg( [
            '請求範圍： ' + rangeInfo.start + ' ~ ' + rangeInfo.end
                + ' ( ' + rangeInfo.length + ' )'
        ] );

        let maxResLength = 512 * 1024 * 8;

        if ( rangeInfo.length > maxResLength ) {
            rangeInfo.length = maxResLength;
            rangeInfo.end = rangeInfo.start + maxResLength - 1;
        }

        resHeader[ 'Accept-Ranges' ] = 'bytes';
        resHeader[ 'Content-Range' ] = 'bytes ' + rangeInfo.start + '-' + rangeInfo.end + '/' + fileSize;
        resHeader[ 'Content-Length' ] = rangeInfo.length;

        own.loog.msg( [
            '回應範圍： ' + rangeInfo.start + ' ~ ' + rangeInfo.end
                + ' ( ' + rangeInfo.length + ' )'
        ] );


        pipeResponse(
            own.path,
            { start: rangeInfo.start, end: rangeInfo.end },
            own,
            own.response,
            rangeInfo.statusCode,
            resHeader
        );
    }
];


let htmViewDir = htm()
        .head
            .meta( { charset: 'utf-8' } )
            .title()
            .style( {
                'img': {
                    verticalAlign: 'middle',
                    width: '24px',
                    height: '24px',
                    padding: '4px',
                    fontSize: '18px',
                },
            } )
        .body
            .txt( '{{fileNameInDir}}' )
    .mth();


// http://blog.aijc.net/server/2015/11/12/HTTP协议206状态码
function _handleRange( strReqRange, numFileSize ){
    let rangeInfo = {
        statusCode: 206,
        length: 0,
        start: 0,
        end: 0
    };

    if ( strReqRange === 'bytes=0-0,-1' ) {
        rangeInfo.length = numFileSize;
        rangeInfo.end = numFileSize - 1;
        return rangeInfo;
    }

    let matchReqRange = strReqRange.match( /^bytes=(\d*)-(\d*)$/ );

    if( !matchReqRange ) {
        rangeInfo.statusCode = 406;
        return rangeInfo;
    }

    let reqStart = matchReqRange[ 1 ];
    let reqEnd   = matchReqRange[ 2 ];

    // 請求值相等的情況有看過 但不明白
    if( reqStart === reqEnd ) {
        rangeInfo.statusCode = 406;
        return rangeInfo;
    }

    let numReqStart = Number( reqStart );
    let numReqEnd   = Number( reqEnd );

    // 請求超出範圍
    if ( reqEnd > numFileSize ) {
        rangeInfo.statusCode = 416;
        return rangeInfo;
    }

    if ( reqStart && reqEnd ) {
        // 請求不合理
        if ( numReqStart > numReqEnd ) {
            rangeInfo.statusCode = 406;
            return rangeInfo;
        }

        rangeInfo.length = numReqEnd - numReqStart + 1;
        rangeInfo.start = numReqStart;
        rangeInfo.end = numReqEnd;
        return rangeInfo;
    }

    if ( reqStart ) {
        numReqEnd = numFileSize - 1;
        rangeInfo.length = numFileSize - numReqStart;
        rangeInfo.start = numReqStart;
        rangeInfo.end = numReqEnd;
        return rangeInfo;
    }

    // reqEnd
    rangeInfo.length = numReqEnd;
    rangeInfo.start = numFileSize - numReqEnd;
    rangeInfo.end = numFileSize - 1;
    return rangeInfo;
}

function pipeResponse( path, fsReadOptions, own, response, statusCode, resHeader ) {
    fs.createReadStream( path, fsReadOptions )
        .on( 'open', function () {
            own.loog.msg( [ '成功開啟 "' + path + '" 文件' ] );
            response.writeHead( statusCode, resHeader );
        } )
        .on( 'error', function ( err ) {
            errStage( own, '404', err, '讀取 "' + path + '" 文件失敗' );
        } )
        .pipe( response )
        .on( 'finish', function () {
            own.loog.msg( 'end' );
        } )
    ;
}

function errStage( own, errCode, insErr, strErrMsg ) {
    var errMsg = [ 'HTTP 狀態碼： ' + errCode  ]
    if ( strErrMsg ) errMsg.push( strErrMsg );
    if ( insErr ) errMsg.push( 'Uncaught ' + insErr.stack );

    own.loog.msg( 'end', errMsg );

    let bufHtml = Buffer.from( errorPage( errCode, errMsg ) );

    let resHeader = {};
    resHeader[ 'Content-Type' ] = 'text/html; charset=UTF-8';
    resHeader[ 'Content-Length' ] = bufHtml.length;

    own.response.writeHead( 404, resHeader );
    own.response.end( bufHtml );
}

function getIpList() {
    let key;
    let networkInterfaces = require('os').networkInterfaces();
    let list = [];

    for (key in networkInterfaces) {
        networkInterfaces[key].forEach(function (info, idx) {
            if (info.family === 'IPv4') {
                list.push(info.address);
            }
        });
    }

    return list;
}


let nodeServer = http.createServer( function( request, response ) {
    let urlParse = url.parse( request.url, true );
    let urlPathname = urlParse.pathname;

    if ( urlPathname === '/favicon.ico' ) {
        response.writeHead( 200, faviconInfo.resHeader );
        response.end( faviconInfo.bufFile );
        return;
    }

    let own ={
        loog: new lxoxg( request, response ),
        request: request,
        response: response,
        url: decodeURIComponent( urlPathname ),
        urlQuery: urlParse.query,
    };

    taskTick[ 0 ] = [ own ];
    asyncSeries.apply( null, taskTick );
} );

nodeServer.listen(
    config.port,
    function () {
        let ipList = getIpList();
        let ipInfotxt = '伺服器開啟於 ';

        switch (ipList.length) {
            case 0:
                break;
            case 1:
                ipInfotxt += 'http://' + orgin + ':' + config.port + '/';
                break;
            default:
                ipList.forEach(function (ip) {
                    ipInfotxt += '\n    http://' + ip + ':' + config.port + '/';
                });
        }

        console.log(ipInfotxt + '\n\n');
    }
);

