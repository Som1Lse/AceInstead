# AceInstead.user.js for [gcc.godbolt.org](https://gcc.godbolt.org/)
A [userscript](https://en.wikipedia.org/wiki/Greasemonkey) that replaces the editor used by gcc.godbolt.org ([CodeMirror](https://codemirror.net/)) with the editor [Ace](https://ace.c9.io/). This is achieved by replacing the interface provided by CodeMirror with an interface that emulates the functionality of CodeMirror but calls into Ace's interface instead. This results in a (subjectively) better editing experience.

# Installation
In order to install the userscript you will first need a userscript plugin for your browser [Greasemonkey](http://www.greasespot.net/) for [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/desktop/), [Tampermonkey](https://tampermonkey.net/) for [Google Chrome](https://www.google.com/chrome/), [Opera beta](http://www.opera.com/computer/beta) and [Apple Safari](https://www.apple.com/safari/), and once you have such a plugin download the userscript and install it from [here](https://raw.githubusercontent.com/Som1Lse/AceInstead/master/AceInstead.user.js).

# Missing features (todo)
Most features work as expected, but a few are missing. If you implement them feel free to submit a pull request.
1. When using Binary mode, the address and opcodes of each instruction is not shown in the gutter.
