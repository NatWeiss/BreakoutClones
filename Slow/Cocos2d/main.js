cc.game.onStart = function(){
    cc.view.setDesignResolutionSize(2048, 1536, cc.ResolutionPolicy.SHOW_ALL);
	cc.view.resizeWithBrowserSize(true);
    cc.LoaderScene.preload([], function () {
        cc.director.runScene(new MenuScene());
    }, this);
};
cc.game.run();