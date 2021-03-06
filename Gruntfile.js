/*jshint camelcase: false*/
'use strict';

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
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*'
                    ]
                }]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/*.js'
            ]
        },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/background.js': ['<%= yeoman.app %>/scripts/background.js'],
                    '<%= yeoman.dist %>/scripts/contentscript.js': ['<%= yeoman.app %>/scripts/contentscript.js'],
                    '<%= yeoman.dist %>/scripts/options.js': ['<%= yeoman.app %>/scripts/options.js']
                }
            },
            options: {
                compress: {
                    drop_console: true
                }
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '<%= yeoman.app %>/styles/main.css'
                    ],
                    '<%= yeoman.dist %>/styles/options.css': [
                        '<%= yeoman.app %>/styles/options.css'
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
                        '*.{ico,png,txt,html,json}',
                        // no need to copy jpg, which aren't used
                        'images/{,*/}*.{webp,gif,png}',
                        '_locales/{,*/}*.json',
                        // bootstrap is already minified so don't use cssmin
                        'styles/bootstrap.css',
                        // needed for content scripts
                        'scripts/vendor/*.js'
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
        'clean',
        'cssmin',
        'uglify',
        'copy',
        'compress'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'build'
    ]);
};
