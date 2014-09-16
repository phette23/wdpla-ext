/*jshint camelcase: false*/
// Generated on 2014-02-17 using generator-chrome-extension 0.2.5
'use strict';
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        watch: {
            options: {
                spawn: false
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*'
                    ]
                }]
            },
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        // eventually use for options.css + bootstrap.css
        // concat: {
        //     dist: {
        //         src: [],
        //         dest: ''
        //     }
        // },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/background.js': ['<%= yeoman.app %>/scripts/background.js'],
                    '<%= yeoman.dist %>/scripts/contentscript.js': ['<%= yeoman.app %>/scripts/contentscript.js'],
                    '<%= yeoman.dist %>/scripts/options.js': ['<%= yeoman.app %>/scripts/options.js'],
                    '<%= yeoman.dist %>/scripts/popup.js': ['<%= yeoman.app %>/scripts/popup.js']
                }
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        // Put files not handled in other tasks here
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.html',
                        '*.{ico,png,txt}',
                        // no need to copy jpg, which aren't used
                        'images/{,*/}*.{webp,gif,png}',
                        '_locales/{,*/}*.json',
                        'styles/bootstrap.css',
                        'styles/options.css'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: [
                        'generated/*'
                    ]
                }]
            }
        },
        chromeManifest: {
            dist: {
                options: {
                    buildnumber: false,
                    background: {
                        target:'scripts/background.js'
                    }
                },
                src: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>'
            }
        },
        compress: {
            dist: {
                options: {
                    archive: 'webstore/WikipeDPLA.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: ''
                }]
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'chromeManifest:dist',
        'cssmin',
        'concat',
        'uglify',
        'copy',
        'compress'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'build'
    ]);
};
