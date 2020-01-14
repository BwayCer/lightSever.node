module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                // modules: false, // 不轉譯 import, export 語法
                targets: '> 0.25%, not dead',
                // targets: {
                //     https://caniuse.com/
                //     https://github.com/babel/babel-preset-env/issues/112
                //     "chrome": "54",
                //     "edge": "17",
                //     "firefox": "60",
                //     "safari": "11.1",
                //     "ie": "11"
                // },
            },
        ],
    ],
};
