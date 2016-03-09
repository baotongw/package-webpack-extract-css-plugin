0.0.1
In this build, the plugin subscribe the emit event. In the handler it remove the webpack assets and write the css package in another way.
0.0.2
remove the emit event subscribe, the plugin now will update the compiled result in the cache directly. So the change will follow the webpack origin logic, also support webpack-dev-server
	Update the chunk name for css type.
	Update the assets content for css export. 