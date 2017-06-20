/*! Lxoxg @license: CC-BY-4.0 - BwayCer (https://bwaycer.github.io/about/) */

/* 伺服器專用日誌 */

"use strict";

module.exports = lxoxg;


let jLinkCount = 0,
    jPreTimeMark = +new Date(),
    jCatchMsg = {};

function lxoxg( request, response, jMsgList ){
    let i = this;

    i.linkID = ( ++jLinkCount ).toString();
    let jCatchMsgList = jCatchMsg[ i.linkID ] = [];

    let jDate = new Date();
    i.date = jDate.toJSON();
    i.timeMS = +jDate;

    i.method = request.method;
    i.path = decodeURIComponent( request.url );

    i.customOutputInfo = lxoxg.prototype.customInfo( request, response );

    let jRecord = i.getFixInfo();
    jCatchMsgList.push( i.stateMark('info') + i.path );
    i.saveMsg( jMsgList, jRecord );
    i.outputMark( 'link', jMsgList, jRecord );
}

lxoxg.prototype = {
    //>> 設定參數 -----

    logPath: null,

    //>> 使用函數 -----

    //客製化資訊
    customInfo: function( request, response ){
        let jOutputList = [];
        return jOutputList;
    },

    //輸出訊息
    msg: function( jMsgList ){
        let i = this,
            jRecord = i.getFixInfo();

        if( jMsgList === 'end' ){
            jRecord.onlineCount--;
            i.saveMsg( arguments[1], jRecord );
            i.outputMark( 'offline', arguments[1], jRecord );
            i.outputInfo();
        }else{
            i.saveMsg( jMsgList, jRecord );
            i.outputMark( 'running', jMsgList, jRecord );
        }
    },


    //>> 運作函數 -----

    outputMark: function( jState, jMsgList, jRecord ){
        let i = this,
            jMarkList = [];

        let jStateMark = i.stateMark( jState );
        jStateMark += `+${ jRecord.onlineCount } $[${ jRecord.dwell_self }ms] #[${ jRecord.dwell_pre }ms]`;

        jMarkList.push(
            jStateMark,
            i.method + ' ' + i.path
        );

        if ( jMsgList ) jMarkList.push( textOverflow( jMsgList.toString(), 24 ) );

        i.output( 'mark', jMarkList );
    },

    outputInfo: function(){
        let i = this,
            jDate = new Date(),
            jMark = [];

        i.output( 'info', jCatchMsg[ i.linkID ] );
        i.clear();
    },

    saveMsg: function( jMsgList, jRecord ){
        let i = this,
            jAutoInfo = i.autoInfo( jRecord ),
            jCustomInfo = i.customOutputInfo,
            jCatchMsgList = jCatchMsg[ i.linkID ],
            jList = [];

        jList.push(
            ...jAutoInfo,
            ...jCustomInfo
        );

        if( jMsgList && jMsgList.constructor === Array )
            jList.push( 'message ===\n\t' + jMsgList.join('\n\t') + '\n  |---' );

        jCatchMsgList.push( jList );
    },

    stateMark: function( jState ){
        let i = this,
            Str,
            jMark = i.date + ' - ' + i.linkID;
        switch( jState ){
            case 'link':    Str = '====> ' + jMark + ' ==> '; break;
            case 'running': Str = '=<~>= ' + jMark + ' <~> '; break;
            case 'offline': Str = '<-x-x ' + jMark + ' -x- '; break;
            case 'info':    Str = '-~@~- ' + jMark + ' ~@~ '; break;
        }
        return Str;
    },

    getFixInfo: function(){
        let i = this,
            jTimeMS = +new Date(),
            jRecord = {
                onlineCount: Object.keys( jCatchMsg ).length,
                dwell_self: parseInt( jTimeMS - i.timeMS ),
                dwell_pre: parseInt( jTimeMS - jPreTimeMark ),
            };

        jPreTimeMark = jTimeMS;
        return jRecord;
    },

    autoInfo: function( jRecord ){
        let i = this;
        return [
            `+${ jRecord.onlineCount } $[${ jRecord.dwell_self }ms] #[${ jRecord.dwell_pre }ms]`,
        ];
    },

    output: function( jMarkType, jOutputList ){
        let i = this,
            Str = '';
        if( jMarkType === 'mark' ){
            console.log( jOutputList[0] );
            i.output_prefix( '\t', jOutputList, 1, jOutputList.length );
            Str += jOutputList.join('\n\t');
        }else if( jMarkType === 'info' ){
            console.log( jOutputList[0] );
            Str += jOutputList[0];
            for(let p = 1, jItem; jItem = jOutputList[ p++ ] ; ){
                console.log('  +');
                i.output_prefix( '  |==', jItem, 0, jItem.length );
                Str += '  +';
                Str += jItem.join('\n  |==');
            }
            console.log('=-=-=');
            Str += '=-=-=';
        }

        console.log();
        Str += '\n';
        // console.log( Str );
    },

    output_prefix: function( jPrefix, jList, jIndex_start, jIndex_end ){
        while( jIndex_start < jIndex_end ){
            let jMsg = jList[ jIndex_start++ ];
            console.log( jPrefix, jMsg );
        }
    },

    clear: function(){
        let i = this;

        delete jCatchMsg[ i.linkID ];
        i.linkID = i.date = i.timeMS = i.method =  i.path = i.customOutputInfo = i = null;
    },
};

process.on('exit', function(){
    let Str = '=X-X-X-X==X-X-X-X=\n=X-X-X-X==X-X-X-X=\n';
    console.log( Str );

    for(let jKey in jCatchMsg ){
        let jMsgList = jCatchMsg[ jKey ];

        console.log( jMsgList[0] );
        Str += jMsgList[0];
        for(let p = 1, jItem; jItem = jMsgList[ p++ ] ; ){
            console.log('  +');
            i.output_prefix( '  |==', jItem, 0, jItem.length );
            Str += '  +';
            Str += jItem.join('\n  |==');
        }
        console.log('=<x>=');
        Str += jItem.join('=<x>=');

        console.log();
        Str += '\n';
    }
    // lxoxg.prototype.logPath
    // console.log( Str );
} );


let regexAscii = /[\x00-\x7E]/;

function textOverflow( strMsg, numLen ) {
    let idx = 0;
    let len = strMsg.length;
    let count = 0;
    let strAns = '';

    while ( idx < len ) {
        let letter = strMsg[ idx++ ];

        count += regexAscii.test( letter ) ? 1 : 2;

        if ( count >= numLen ) {
            strAns += '...';
            break;
        }

        strAns += letter;
    }

    return strAns;
}

