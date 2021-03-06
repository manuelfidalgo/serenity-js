'use strict';

const
    { readFileSync } = require('fs'),
    { resolve }      = require('path'),
    devMode          = process.env.NODE_ENV === 'dev',
    noop             = (config) => null,
    Metalsmith       = require('metalsmith'),
    autotoc          = require('metalsmith-autotoc'),
    inplace          = require('metalsmith-in-place'),
    ignore           = require('metalsmith-ignore'),
    layouts          = require('metalsmith-layouts'),
    discoverHelpers  = require('metalsmith-discover-helpers'),
    discoverPartials = require('metalsmith-discover-partials'),
    cleanCSS         = require('metalsmith-clean-css'),
    fileMetadata     = require('metalsmith-filemetadata'),
    uglify           = require('metalsmith-uglify'),
    path             = require('metalsmith-path'),
    rename           = require('metalsmith-rename'),
    sitemap          = require('metalsmith-sitemap'),
    sass             = require('metalsmith-sass'),
    debug            = require('./plugins/debug'),
    renamePath       = require('./plugins/renamePath'),
    replace          = require('./plugins/replace'),
    sources          = require('./plugins/sources'),
    source           = require('./plugins/source'),
    pathToFile       = require('./plugins/pathToFile'),
    highlightEsdoc   = require('./plugins/highlightEsdoc'),
    discoverModules  = require('./plugins/discoverModules'),
    bindHandbook     = require('./plugins/bindHandbook'),
    browserSync      = require('metalsmith-browser-sync'),
    highlight        = require('highlight.js'),
    pkg              = require('../../package'),
    lerna            = require('../../lerna'),
    escape           = require('querystring').escape,

    highlightedLanguages = ['gherkin', 'typescript', 'javascript', 'json', 'bash', 'console', 'html'];

Metalsmith(__dirname)
    .source('src')
    .use(sources('./node_modules/@serenity-js/*/target/site'))
    .use(renamePath(/\.\/node_modules\/@serenity-js\/(.*)\/target\/site\//, 'modules/$1/'))
    .use(source('../../CHANGELOG.md'))
    .use(renamePath(/\.\.\/\.\.\/(.*)/, '$1'))
    .destination('target/site')
    // .ignore()
    .clean(true)
    .use(discoverHelpers())
    .use(discoverPartials())
    .use(cleanCSS({
        files: 'css/*.css',
        sourceMap: true,
        cleanCSS: {
            rebase: true
        }
    }))
    .use(discoverModules('./node_modules/@serenity-js/*/package.json'))
    .use(replace(/\.md$/, {
        options: {
            matchCase: false,
            caseSensitive: true,
            isolatedWord: false,
        },
        subs: [
            {
                search: '%package.engines.node%',
                replace: pkg.engines.node,
            },
            {
                search: '%package.engines.npm%',
                replace: pkg.engines.npm,
            },
            {
                search: '%process.version%',
                replace: process.version,
            },
            {
                search: '%lerna.version%',
                replace: lerna.version,
            }
        ]
    }))
    .use(bindHandbook('./src/handbook-toc.yml'))
    .use(fileMetadata([
        {pattern: 'CHANGELOG.md', metadata: { 'layout': 'changelog.hbs', 'autotoc': true }},
        {pattern: 'modules/**/*.hbs', metadata: { 'layout': 'api-docs.hbs' }},
        {pattern: 'modules/index.hbs', metadata: { 'layout': 'default.hbs' }},
    ]))
    .use(path({
        extensions: [ '.md' ],
        baseDirectory: 'documentation/website/src/',
    }))
    .use(rename([
        // any ALL-CAPS markdown files
        [ /([A-Z]+).md/, filename => filename.toLowerCase() ]
    ]))
    .use(inplace({
        rename: true,
        pattern: [
            '**/*',
        ],
        engineOptions: {
            highlight:  (code, language) => highlight.highlightAuto(code, language ? [language] : highlightedLanguages).value,
        }
    }))
    .use(autotoc({selector: 'h2'}))
    .use(highlightEsdoc(highlight, highlightedLanguages))
    .use(pathToFile())
    .use(layouts({
        directory: 'layouts',
    }))
    // .use(uglify({
    //     concat: true,
    // }))
    .use(sass({
        outputStyle: 'expanded',
    }))
    .use(sitemap({
        hostname: 'https://serenity-js.org',
        lastmod: new Date(),
        changefreq: 'weekly',
        priority: 0.5,
    }))
    // .use(debug(true))
    .use(devMode ? browserSync({
        server: {
            baseDir: './target/site',
            index: 'index.html'
        },
        files: [
            'src/**/*',
            'node_modules/@serenity-js/(.*)/target/site/**/*',
            'layouts/**/*',
            'partials/**/*'
        ],
        callbacks: {
            ready: function(err, bs) {
                const baseDir = bs.options.get('server').get('baseDir').get(0);

                bs.addMiddleware("*", function (req, res) {
                    res.writeHead(302);
                    res.write(readFileSync(resolve(__dirname, baseDir, '404.html')));
                    res.end();
                });
            }
        }
    }) : noop)
    .build(err => {
        if (err) {
            console.error(err);
        }
    });
