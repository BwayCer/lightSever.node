/* 預處理器 */

"use strict";


const fs     = require('fs');
const path   = require('path');


const nodeLightSeverDirPath = path.resolve(__dirname, '../');


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


let pug = tryModule('pug');
pushPreprocessor(
    !!pug,
    'Pug',
    ['.html'],
    function tool(limitOwn, fnDone) {
        let dirPath = path.dirname(limitOwn.url);
        let localHtmlPath = limitOwn.path;
        let localHtmlAbsolutePath = path.join(limitOwn.rootAbsolutePath, limitOwn.url);
        let localPugPath = path.join(
            limitOwn.rootPath,
            dirPath,
            limitOwn.pathParse.name + '.pug'
        );

        if (!fs.existsSync(localPugPath)) {
            fnDone();
            return;
        }

        limitOwn.loog.msg([tool.showName + ' 執行中...']);

        let result = pug.renderFile(localPugPath);

        // result.html
        fs.writeFileSync(localHtmlPath, result, {encoding: 'utf8'});

        fnDone();
    }
);

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

        sass.render({
            file: localScssPath,
            outputStyle: 'expanded',
            outFile: localCssAbsolutePath,
            sourceMap: true,
            sourceMapRoot: dirPath,
            includePaths: [
                limitOwn.rootAbsolutePath,
                limitOwn.rootAbsolutePath + '/node_modules',
            ],
        }, function(err, result) {
            if (err) {
                fnDone(err);
                return
            }

            limitOwn.loog.msg([tool.showName + ' 寫入中...']);
            // result.css
            fs.writeFileSync(localCssPath, result.css, {encoding: 'utf8'});
            // result.map
            fs.writeFileSync(localCssPath + '.map', result.map, {encoding: 'utf8'});
            // result.stats
            // console.log('Sass 預處理器 stats: ', result.stats);

            fnDone();
        });
    }
);


let babel = tryModule('@babel/core');
pushPreprocessor(
    !!babel,
    'Babel',
    ['.js'],
    /* async */ function tool(limitOwn, fnDone) {
        let dirPath = path.dirname(limitOwn.url);
        let localJsPath = limitOwn.path;
        let localJsMapPath = localJsPath + '.map';
        let localJsAbsolutePath = path.join(limitOwn.rootAbsolutePath, limitOwn.url);
        let esFileName = limitOwn.pathParse.name + '.es';
        let localEsPath = path.join(
            limitOwn.rootPath,
            dirPath,
            esFileName
        );

        if (!fs.existsSync(localEsPath)) {
            fnDone();
            return;
        }

        limitOwn.loog.msg([tool.showName + ' 執行中...']);

        Promise.resolve(null)
            .then(function () {
                limitOwn.loog.msg([tool.showName + ' 讀取中...']);
                let asyncList = [
                    // .babelrc
                    new Promise(function (resolve, reject) {
                        Promise.all(['.js', '.cjs', '.json'].map(function (val) {
                            return new Promise(function (resolve, reject) {
                                fs.stat(
                                    path.join(limitOwn.rootPath, 'babel.config' + val),
                                    function (err) {
                                        if (err) {
                                            resolve();
                                        }
                                        reject();
                                    }
                                );
                            });
                        }))
                            .then(
                                function () { resolve(false); },
                                function () { resolve(true); }
                            )
                        ;
                    }),
                    // source.es
                    new Promise(function (resolve, reject) {
                        fs.readFile(localEsPath, 'utf8', function (err, data) {
                            if (err) reject(err);
                            else resolve(data);
                        });
                    }),
                ];
                return Promise.all(asyncList);
            })
            .then(function ([isExistsBabelrcFile, sourceEsCode]) {
                limitOwn.loog.msg([tool.showName + ' 轉換中...']);
                let rootPath = isExistsBabelrcFile
                    ? limitOwn.rootPath
                    : nodeLightSeverDirPath
                ;
                return new Promise(function (resolve, reject) {
                    // https://babeljs.io/docs/en/options
                    babel.transform(sourceEsCode, {
                        // // 設定讀取 babelrc 文件的方式 ---
                        // babelrc: false,
                        // cwd: rootPath,
                        // presets: <babelrc 中 presets 的內容>,
                        // or
                        babelrc: true,
                        root: rootPath,
                        // //---
                        // configFile: false,
                        // passPerPreset: false,
                        // envName: 'development',
                        generatorOpts: {
                            filename: localJsMapPath,
                            // auxiliaryCommentBefore: undefined,
                            // auxiliaryCommentAfter: undefined,
                            // retainLines: undefined,
                            // comments: true,
                            // shouldPrintComment: undefined,
                            // compact: 'auto',
                            // minified: undefined,
                            // sourceMaps: true,
                            sourceMaps: 'inline',
                            sourceRoot: dirPath,
                            sourceFileName: esFileName,
                        },
                    }, function(err, result) {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            })
            .then(function (result) {
                // result; // => { code, map, ast }
                limitOwn.loog.msg([tool.showName + ' 寫入中...']);
                let asyncList = [
                    // result.js
                    new Promise(function (resolve, reject) {
                        fs.writeFile(
                            localJsPath, result.code, 'utf8',
                            function (err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    }),
                    // result.js.map
                    new Promise(function (resolve, reject) {
                        fs.writeFile(
                            localJsMapPath, JSON.stringify(result.map), 'utf8',
                            function (err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    }),
                ];
                return Promise.all(asyncList);
            })
            .then(function () {
                limitOwn.loog.msg([tool.showName + ' 處理結束...']);
                fnDone();
            })
            .catch(function (err) {
                limitOwn.loog.msg([tool.showName + ' 失敗...']);
                fnDone(err);
            })
        ;
    }
);

