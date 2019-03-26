/* 預處理器 */

"use strict";


const fs     = require('fs');
const path   = require('path');


function tryModule(name) {
    let module = null;
    try { module = require(name); }
    catch (err) {}
    return module;
}
function pushPreprocessor(isPush, name, mimeList, preprocessor) {
    if (!isPush) return;

    preprocessor.showName = name + ' 的預處理器';
    mimeList.forEach(function (ext) {
        module.exports[ext] = preprocessor;
    });
}


let sass = tryModule('sass');
pushPreprocessor(
    !!sass,
    'Sass',
    ['.css'],
    function tool(limitOwn, fnDone) {
        let dirPath = path.dirname(limitOwn.url);
        let localCssPath = limitOwn.path;
        let localCssAbsolutePath = path.join(limitOwn.rootAbsolutePath, limitOwn.url);
        let localScssPath = path.join(
            limitOwn.rootPath,
            dirPath,
            limitOwn.pathParse.name + '.scss'
        );

        if (!fs.existsSync(localScssPath)) {
            fnDone();
            return;
        }

        limitOwn.loog.msg([tool.showName + ' 執行中...']);

        var result = sass.renderSync({
            file: localScssPath,
            outputStyle: 'expanded',
            outFile: localCssAbsolutePath,
            sourceMap: true,
            sourceMapRoot: dirPath,
        });

        // result.css
        fs.writeFileSync(localCssPath, result.css, {encoding: 'utf8'});
        // result.map
        fs.writeFileSync(localCssPath + '.map', result.map, {encoding: 'utf8'});
        // result.stats
        // console.log('Sass 預處理器 stats: ', result.stats);

        fnDone();
    }
);

