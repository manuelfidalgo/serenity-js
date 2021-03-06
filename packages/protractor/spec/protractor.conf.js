exports.config = {
    chromeDriver: require(`chromedriver/lib/chromedriver`).path,

    SELENIUM_PROMISE_MANAGER: false,

    onPrepare: function() {
        return browser.waitForAngularEnabled(false);
    },

    directConnect: true,

    allScriptsTimeout: 30 * 1000,

    framework: 'mocha',

    specs: [ '**/*.spec.ts' ],

    mochaOpts: {
        timeout: 10 * 1000,
        require: [
            'ts-node/register',
        ],
        reporter: 'dot',
    },

    params: {
        env: 'test',
        user: {
            id: 1,
            firstName: 'Jan',
            lastName: 'Molak',
        }
    },

    capabilities: {
        browserName: 'chrome',
        acceptInsecureCerts : true,

        loggingPrefs: {
            browser: 'INFO',
        },

        chromeOptions: {
            args: [
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--allow-file-access',
                '--disable-infobars',
                '--headless',
                '--disable-gpu',
                '--window-size=200x100',
            ]
        }
    }
};
