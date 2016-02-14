// ==UserScript==
// @name        AceInstead
// @namespace   https://github.com/Som1Lse/AceInstead
// @description Changes the text editor to be Ace (https://ace.c9.io) instead of CodeMirror
// @include     http://gcc.godbolt.org/*
// @include     https://gcc.godbolt.org/*
// @resource    ace_js           https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/ace.js
// @resource    ext_searchbox_js https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/ext-searchbox.js
// @resource    theme_monokai_js https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/theme-monokai.js
// @resource    mode_c_cpp_js    https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/mode-c_cpp.js
// @version     1.0.0
// @grant       unsafeWindow
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @run-at      document-end
// ==/UserScript==

(function(){
    'use strict';

    function RemoteExecute(code){
        if(typeof(code) === 'function') code = '('+code.toString()+')()';
        
        new unsafeWindow.Function(code).call(unsafeWindow);
    }

    GM_addStyle(
        '.ace_gutter-layer .ace_gutter-cell>div {'+
            'display: inline-block;'+
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
            'opacity: 0.3'+
        '}'
    );

    var scripts = ['ace_js','ext_searchbox_js','theme_monokai_js','mode_c_cpp_js'];

    for(var i = 0;i<scripts.length;++i) RemoteExecute(GM_getResourceText(scripts[i]));
    
    RemoteExecute(function(){
        clearBackground = function(cm){
            //alert('Clearing');
            
            var session = cm._editor.getSession();
            var markers = session.getMarkers();
            
            for(var i in markers){
                var marker = markers[i];
                if(marker.type === 'fullLine'){
                    if(marker.range && ((marker.range.start.column === 0 && marker.range.end.column === 1) ||
                                        marker.range.start.row >= session.getLength())){
                        session.removeMarker(i);
                    }
                }
            }
        };
        var asm_mode = window.asm_mode = CodeMirror.modes.asm();
        var StringStream = window.StringStream = CodeMirror.StringStream;
        
        ace.define('ace/mode/asm',['require','exports','module','ace/mode/text','ace/oop'],function(require,exports,module){
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
                        
                        if(line === 0 && (str === '[Processing...]' || str === 'Awaiting' || str === '<Compilation failed>')){
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
                            
                            match = /^[a-z_.\-$@][\w.\-$@]*/i.exec(str);
                            if(match !== null){
                                if(match[0].search(/^[xy]mm\d+$/i) !== -1 ||
                                   match[0].search(/^[re]?([a-d]x|di|si|bp|sp)$/i) !== -1 ||
                                   match[0].search(/^[re]ip$/i) !== -1 ||
                                   match[0].search(/^(di|si|bp|sp)l$/i) !== -1 ||
                                   match[0].search(/^[a-d][hl]$/i) !== -1 ||
                                   match[0].search(/^[c-fs]s$/i) !== -1){
                                    tokens.push({'type': 'variable','value': eat(match[0])});
                                }else if(match[0].search(/^(ptr|offset|flat|byte|(d|q|xmm|ymm)?word)$/i) !== -1){
                                    tokens.push({'type': 'storage.type','value': eat(match[0])});
                                }else{
                                    tokens.push({'type': 'identifier','value': eat(match[0])});
                                }
                                continue;
                            }
                            
                            match = /^-?\d\w*/i.exec(str);
                            if(match !== null){
                                tokens.push({'type': 'constant.numeric','value': eat(match[0])});
                                continue;
                            }
                            
                            if(str[0] === '<' || str[0] === '(' || str[0] === '[' || str[0] === '{'){
                                tokens.push({'type': 'paren.lparen','value': eat(1)});
                            }else if(str[0] === '>' || str[0] === ')' || str[0] === ']' || str[0] === '}'){
                                tokens.push({'type': 'paren.lparen','value': eat(1)});
                            }else if(str[0] === ',' || str[0] === '$' || str[0] === '%' || str[0] === '+' || 
                                     str[0] === '*' || str[0] === ':' || str[0] === '!' || str[0] === '-' ||
                                     str[0] === '&' || str[0] === '~'){
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
        
        var Range = ace.require("ace/range").Range;
                
        CodeMirror = {
            'fromTextArea': function(el,options){
                var r = {
                    'on': function(name,callback){
                        this._editor.on(name,callback);
                    },
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
                            console.log('Unexspected arguments ',arguments,' provided to `cm.addLineClass()`');
                            return;
                        }
                        
                        this._editor.getSession().addMarker(new Range(line,0,line,1),className,'fullLine');
                    },
                    'addLineWidget': function(){
                        //@todo: implement
                    },
                    'removeLineWidget': function(){
                        //@todo: implement
                    },
                    'setGutterMarker': function(){},//noop
                    'setOption': function(){},//noop
                    'markText': function(){},//noop
                    'setSelection': function(begin,end){
                        if(begin.line !== end.line-1 || begin.ch !== 0 || end.ch !== 0){
                            console.log('Unexspected arguments ',arguments,' provided to `cm.setSelection()`');
                            return;
                        }
                        
                        this._editor.getSelection().setRange(
                            new Range(begin.line,0,begin.line,this._editor.getSession().getLine(begin.line).length));
                    },
                    'scrollIntoView': function(){
                        console.log('`cm.scrollIntoView()` called unexpectedly with arguments ',arguments);
                    },
                    
                    '_editor': ace.edit(el)
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
                    case 'text/x-c++src': r._editor.getSession().setMode('ace/mode/c_cpp'); break;
                    case 'text/x-asm':    r._editor.getSession().setMode('ace/mode/asm'); break;
                    default: {
                        console.log('Invalid `options.mode` ',options.mode,' passed to `CodeMirror.fromTextArea()`');
                        break;
                    }
                }
                
                if(options.readOnly) r._editor.setReadOnly(true);
                
                return r;
            }
        };
    });
})();
