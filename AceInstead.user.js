// ==UserScript==
// @name        AceInstead
// @namespace   https://github.com/Som1Lse/AceInstead
// @description Changes the text editor to be Ace (https://ace.c9.io) instead of CodeMirror
// @include     http://d.godbolt.org/*
// @include     http://go.godbolt.org/*
// @include     http://gcc.godbolt.org/*
// @include     http://rust.godbolt.org/*
// @include     https://d.godbolt.org/*
// @include     https://go.godbolt.org/*
// @include     https://gcc.godbolt.org/*
// @include     https://rust.godbolt.org/*
// @resource    require_js          http://requirejs.org/docs/release/2.3.2/comments/require.js
// @resource    ace_js              https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/ace.js
// @resource    ext_searchbox_js    https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/ext-searchbox.js
// @resource    theme_monokai_js    https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/theme-monokai.js
// @resource    mode_d_js           https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/mode-d.js
// @resource    mode_rust_js        https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/mode-rust.js
// @resource    mode_c_cpp_js       https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/mode-c_cpp.js
// @resource    mode_golang_js      https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/mode-golang.js
// @version     2.0.1
// @grant       unsafeWindow
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @run-at      document-start
// ==/UserScript==

(function(){
    'use strict';

    function RemoteExecute(code){
        if(typeof(code) === 'function') code = '('+code.toString()+')()';

        new unsafeWindow.Function(code).call(unsafeWindow);
    }

    GM_addStyle(
        '.ace_editor {'+
            'margin-bottom: 0px;'+
        '}'+
        '.ace_gutter-layer .ace_gutter-cell>div {'+
            'display: inline-block;'+
        '}'+
        '.ace_search {'+
            'color: #000000;'+
            'font-family: sans-serif;'+
        '}'+
        '.address, .opcodes {'+
            'vertical-align: top !important;'+
            'font-size: 12px !important;'+
            'display: inline-block;'+
            'width: initial !important;'+
        '}'+

        //fix the markers for the monokai-theme so they are properly transparent
        '.ace-monokai .ace_marker-layer .ace_active-line {'+
            'background: rgba(0,0,0,0.2) !important;'+
        '}'+
        '.ace-monokai .ace_marker-layer .ace_selection {'+
            'background: rgba(209, 200, 174, 0.2) !important;'+
        '}'+

        '.rainbow-0, .rainbow-1, .rainbow-2, .rainbow-3, .rainbow-4, .rainbow-5,'+
        '.rainbow-6, .rainbow-7, .rainbow-8, .rainbow-9, .rainbow-10,.rainbow-11 {'+
            'position: absolute;'+
            'opacity: 0.3;'+
        '}'
    );

    RemoteExecute(GM_getResourceText('require_js')+
                  'window.define = define;'+
                  'window.require = require;'+
                  'window.requirejs = requirejs;');

    var scripts = [
        'ace_js',
        'ext_searchbox_js',
        'theme_monokai_js',
        'mode_d_js',
        'mode_rust_js',
        'mode_c_cpp_js',
        'mode_golang_js',
    ];

    for(var i = 0;i<scripts.length;++i){
        try {
            RemoteExecute(GM_getResourceText(scripts[i]));
        }catch(e){
            console.log(scripts[i]+' FAILED: ',e);
        }
    }

    RemoteExecute(function(){
        function assert(b,msg){
            if(msg === undefined) msg = 'ASSERTION FAILED!';

            if(!b){
                alert(msg);
                throw msg;
            }
        }
        
        window.addEventListener('DOMContentLoaded',function(e){
            var main_str = document.head.querySelector('script[data-main]').dataset.main;
            var main_index = main_str.lastIndexOf('/');
            
            var conf = {
                paths: {
                    bootstrap: 'ext/bootstrap/dist/js/bootstrap.min',
                    jquery: 'ext/jquery/dist/jquery.min',
                    underscore: 'ext/underscore/underscore-min',
                    goldenlayout: 'ext/golden-layout/dist/goldenlayout',
                    selectize: 'ext/selectize/dist/js/selectize.min',
                    sifter: 'ext/sifter/sifter.min',
                    microplugin: 'ext/microplugin/src/microplugin',
                    events: 'ext/eventEmitter/EventEmitter',
                    lzstring: 'ext/lz-string/libs/lz-string',
                    clipboard: 'ext/clipboard/dist/clipboard',
                    'raven-js': 'ext/raven-js/dist/raven'
                },
                shim: {
                    underscore: {exports: '_'},
                    bootstrap: ['jquery']
                }
            };
            
            if(main_index !== -1){
                conf.baseUrl = main_str.substr(0,main_index+1);
            }

            //gcc.godbolt.org has a compiled main.js file that contains many of the modules
            if(location.hostname.substr(-11) === 'godbolt.org') conf.paths.editor = 'main';

            require.config(conf);

            require.config = function(){};

            var Range = ace.require("ace/range").Range;

            define('codemirror',[],function(){
                return {
                    'defineMode': function(){
                        //do nothing
                    },
                    'defineMIME': function(){
                        //do nothing
                    },
                    'registerHelper': function(){
                        //do nothing
                    },
                    'fromTextArea': function(el,options){
                        var r = {
                            'on': function(name,callback){
                                this._editor.on(name,callback);
                            },
                            'refresh': function(){},//noop
                            'setSize': function(width,height){
                                if(width  !== null) this._editor.container.style.width  = width+'px';
                                if(height !== null) this._editor.container.style.height = height+'px';

                                this._editor.resize();
                            },
                            'setValue': function(value){
                                this._editor.setValue(value,-1);
                            },
                            'getValue': function(){
                                return this._editor.getValue();
                            },
                            'lineCount': function(){
                                return this._editor.getSession().getLength();
                            },
                            'operation': function(f){
                                f();
                            },
                            'addLineClass': function(line,where,className){
                                if(where !== 'background'){
                                    console.log('Unexpected arguments ',arguments,' provided to `cm.addLineClass()`');
                                    return;
                                }

                                this._editor.getSession().addMarker(new Range(line,0,line,1),className,'fullLine');
                            },
                            'removeLineClass': function(line,where,className){
                                if(where !== 'background'){
                                    console.log('Unexpected arguments ',arguments,' provided to `cm.removeLineClass()`');
                                    return;
                                }

                                var session = this._editor.getSession();
                                var markers = session.getMarkers();

                                for(var i in markers){
                                    var marker = markers[i];

                                    if((className === null || marker.clazz === className) && marker.type === 'fullLine' &&
                                       marker.range.start.column === 0 && marker.range.end.column === 1 &&
                                       marker.range.start.row === line && marker.range.end.row === line){
                                        session.removeMarker(i);
                                    }
                                }
                            },
                            'setGutterMarker': function(){},//noop
                            'setOption': function(){},//noop
                            'markText': function(){},//noop
                            'setSelection': function(begin,end){
                                if(begin.line !== end.line-1 || begin.ch !== 0 || end.ch !== 0){
                                    console.log('Unexpected arguments ',arguments,' provided to `cm.setSelection()`');
                                    return;
                                }

                                this._editor.getSelection().setRange(
                                    new Range(begin.line,0,begin.line,this._editor.getSession().getLine(begin.line).length));
                            },

                            '_editor': ace.edit(el),
                        };

                        if(window.r1 === undefined) window.r1 = r;
                        else if(window.r2 === undefined) window.r2 = r;

                        r._editor.setSelectionStyle('text');
                        r._editor.setOption('scrollPastEnd',true);
                        r._editor.setOption('vScrollBarAlwaysVisible',true);
                        r._editor.renderer.setShowPrintMargin(true);

                        r._editor.container.classList.add('CodeMirror');//simulate CodeMirror
                        r._editor.$blockScrolling = Infinity;

                        r._editor.setTheme('ace/theme/monokai');
                        switch(options.mode){
                            case 'text/x-d':        r._editor.getSession().setMode('ace/mode/d'); break;
                            case 'text/x-go':       r._editor.getSession().setMode('ace/mode/golang'); break;
                            case 'text/x-asm':      r._editor.getSession().setMode('ace/mode/asm'); break;
                            case 'text/x-c++src':   r._editor.getSession().setMode('ace/mode/c_cpp'); break;
                            case 'text/x-rustsrc':  r._editor.getSession().setMode('ace/mode/rust'); break;
                            default: {
                                console.log('Invalid `options.mode` ',options.mode,' passed to `CodeMirror.fromTextArea()`');
                                break;
                            }
                        }

                        if(options.readOnly) r._editor.setReadOnly(true);

                        return r;
                    },
                };
            });

            define('codemirror/mode/clike/clike',[],function(){ return {}; });
            define('codemirror/mode/d/d',[],function(){ return {}; });
            define('codemirror/mode/go/go',[],function(){ return {}; });
            define('codemirror/mode/rust/rust',[],function(){ return {}; });

            ace.define('ace/mode/asm',['require','exports','module','ace/mode/text','ace/oop'],
                       function(require,exports,module){
                var oop = require('../lib/oop');

                var Mode = exports.Mode = function(){
                    this._tokenizer = {
                        'getLineTokens': function(str,prev,line){
                            var tokens = [];

                            function eat(n){
                                var r;
                                if(typeof(n) === 'undefined'){
                                    r = str;
                                    str = '';
                                    return r;
                                }else if(typeof(n) === 'string'){
                                    r = n;
                                    n = n.length;
                                }else{
                                    r = str.substr(0,n);
                                }
                                str = str.substr(n);
                                return r;
                            }

                            if(line === 0 &&
                               (str === '[Processing...]' || str === 'Awaiting' || str === '<Compilation failed>')){
                                tokens = [{'type': 'keyword','value': eat()}];
                            }


                            var match = /^\S[^#]*:/i.exec(str);
                            if(match === null){
                                match = /^\s+[a-z_]\w*/i.exec(str);
                                if(match !== null){
                                    tokens.push({'type': 'keyword','value': eat(match[0])});
                                }else{
                                    match = /^\s+\.\w+/i.exec(str);
                                    if(match !== null){
                                        tokens.push({'type': 'storage.type','value': eat(match[0])});
                                    }
                                }
                            }else{
                                tokens.push({'type': 'variable.parameter','value': eat(match[0])});
                            }


                            while(str.length>0){
                                match = /^\s+/i.exec(str);
                                if(match !== null){
                                    tokens.push({'type': 'spacing','value': eat(match[0])});
                                    continue;
                                }

                                match = /^\$?-?\d\w*/i.exec(str);
                                if(match !== null){
                                    tokens.push({'type': 'constant.numeric','value': eat(match[0])});
                                    continue;
                                }

                                match = /^%?\w+/i.exec(str);
                                if(match !== null &&
                                   (match[0].search(/^%?[xy]mm\d+$/i) === 0 ||
                                    match[0].search(/^%?[re]?([a-d]x|di|si|bp|sp)$/i) === 0 ||
                                    match[0].search(/^%?[re]ip$/i) === 0 ||
                                    match[0].search(/^%?(di|si|bp|sp)l$/i) === 0 ||
                                    match[0].search(/^%?[a-d][hl]$/i) === 0 ||
                                    match[0].search(/^%?[c-fs]s$/i) === 0)){
                                    console.log(match);
                                    tokens.push({'type': 'variable','value': eat(match[0])});
                                    continue;
                                }

                                match = /^(ptr|offset|flat|byte|(d|w|xmm|ymm)?word)/i.exec(str);
                                if(match !== null){
                                    tokens.push({'type': 'storage.type','value': eat(match[0])});
                                    continue;
                                }

                                match = /^[a-z_.\-$@][\w.\-$@]*/i.exec(str);
                                if(match !== null){
                                    tokens.push({'type': 'identifier','value': eat(match[0])});
                                    continue;
                                }

                                if(str[0] === '<' || str[0] === '(' || str[0] === '[' || str[0] === '{'){
                                    tokens.push({'type': 'paren.lparen','value': eat(1)});
                                }else if(str[0] === '>' || str[0] === ')' || str[0] === ']' || str[0] === '}'){
                                    tokens.push({'type': 'paren.lparen','value': eat(1)});
                                }else if(str[0] === ',' || str[0] === '$' || str[0] === '%' || str[0] === '+' ||
                                         str[0] === '*' || str[0] === ':' || str[0] === '!' || str[0] === '-' ||
                                         str[0] === '&'){
                                    tokens.push({'type': 'punctuation.operator','value': eat(1)});
                                }else if(str[0] === '\"'){
                                    var i;
                                    for(i = 1;i<str.length && str[i] !== '\"';++i){
                                        if(str[i] === '\\') ++i;
                                    }

                                    if(str[i] === '\"'){
                                        tokens.push({'type': 'string','value': eat(i+1)});
                                    }else{
                                        if(str.length>0) tokens.push({'type': 'invalid','value': eat(i)});
                                    }
                                }else if(str[0] === '#'){
                                    tokens.push({'type': 'comment','value': eat()});
                                }else{
                                    tokens.push({'type': 'invalid','value': eat(1)});
                                }
                            }

                            return {'state': 'start','tokens': tokens};
                        },
                    };
                    this.getTokenizer = function(){ return this._tokenizer; };
                    this.createWorker = function(){ return null; };
                };

                oop.inherits(Mode,require('./text').Mode);
            });

            require(['editor'],function(editor){
                function DiagTypeAsInt(type){
                    switch(type){
                        case 'error': return 2;
                        case 'warning': return 1;
                        default: return 0;
                    }
                }
                function MaxDiagType(type1,type2){
                    if(DiagTypeAsInt(type2) >= DiagTypeAsInt(type1)){
                        return type2;
                    }else{
                        return type1;
                    }
                }

                function UpdateAnnotations(editor){
                    var temp_annotations = {};

                    var a,x;
                    for(a in editor.widgetsByCompiler){
                        var compiler = editor.widgetsByCompiler[a].compiler;
                        x = editor.widgetsByCompiler[a].widgets;
                        for(var i = 0;i<x.length;++i){
                            var line = x[i].line;
                            if(!(line in temp_annotations)){
                                temp_annotations[line] = {
                                    'type': 'info',
                                    'output': {},
                                };
                            }

                            var y = temp_annotations[line];
                            if(!(compiler.name in y.output)){
                                y.output[compiler.name] = '';
                            }

                            y.type = MaxDiagType(y.type,x[i].type);
                            y.output[compiler.name] += '\n  '+x[i].text;
                        }
                    }

                    var annotations = [];

                    for(a in temp_annotations){
                        x = temp_annotations[a].output;

                        var text = '';
                        for(var b in x){
                            if(text !== '') text += '\n';
                            text += b+':'+x[b];
                        }

                        annotations.push({
                            'row': a,
                            'column': 0,
                            'type': temp_annotations[a].type,
                            'text': text,
                            'raw': text,//@todo: what should `raw` be?
                        });
                    }

                    editor.editor._editor.getSession().setAnnotations(annotations);
                }

                console.log(editor.Editor.prototype.onCompileResponse.toString());
                editor.Editor.prototype.onCompileResponse = function(id,compiler,result){
                    console.log(this,'.onCompileResponse(',id,', ',compiler,', ',result,')');

                    var widgets = {
                        'compiler': compiler,
                        'widgets': [],
                    };

                    var lines = (result.stdout+result.stderr).split('\n');

                    var regex = /^(\/tmp\/.*?):(\d+):((\d+:)*) (.*)$/;
                    for(var i = 0;i<lines.length;++i){
                        var match = lines[i].match(regex);
                        if(!match) continue;

                        var type = '';
                        var text = match[5];

                        var index = text.indexOf(': ');
                        if(index !== -1) type = text.substr(0,index);

                        if(type !== 'error' && type !== 'warning'){
                            //continue;
                            type = 'info';
                        }

                        widgets.widgets.push({
                            'line': Number(match[2])-1,
                            'type': type,
                            'text': text.trim(),
                        });
                    }

                    this.widgetsByCompiler[id] = widgets;

                    UpdateAnnotations(this);
                    this.asmByCompiler[id] = result.asm;
                    this.numberUsedLines();
                };
                editor.Editor.prototype.removeWidgets = function(widgets){
                    widgets.widgets = [];
                    UpdateAnnotations(this);
                };

                require([main_str.substr(main_index+1)]);
            });
        },false);
    });
})();
