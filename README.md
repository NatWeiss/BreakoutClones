This repository is a collection of Breakout clones written in four of today's popular cross-platform game engines. It began as preparation for a blog post published on Binpress called [Selecting a Cross-platform Game Engine](http://www.binpress.com/blog/2014/05/14/selecting-cross-platform-game-engine/).

In order to accurately compare and contrast the game engines, I wrote a Breakout clone from scratch using each game engine. I then re-wrote the clones using [RapidGame](http://wizardfu.com/rapidgame) templates in order to estimate how much development time RapidGame can save.

You will find the original Breakout clones in the `Slow` directory. The clones built with RapidGame are in the `Rapid` directory.


Results
-------

I found that some cross-platform game engines are inherently more rapid than others. Corona, for example, is built for speed. Cocos2D JS can be quick too if you prebuild the libraries statically.

I found that project setup, getting the viewport right, setting up physics and other grunt work tasks can take up to ~80% of development time for simple games like a Breakout clone. Using RapidGame can eliminate most of that time sink.


Setup
-----

In order to run the Breakout clones:

1. Clone this repo
2. Install [RapidGame](http://wizardfu.com/rapidgame): `sudo npm install rapidgame -g`
3. Initialize the Rapid/Cocos2d project: `cd BreakoutClones/Rapid/Cocos2d && rapidgame init .`
4. Run the prebuild: `rapidgame prebuild`
5. Initialize the Slow/Cocos2d project: `cd BreakoutClones/Slow/Cocos2d && rm cocos2d-js && ln -s ~/path/to/cocos2d-js-v3.0-alpha2 cocos2d-js`
