function MyPlugin(options) {
    this.context = null;
    this.options = null;
}

MyPlugin.prototype.isCss = function(modules) {
    var cssPattern = /.+\.(css|scss|less)$/;

    var result = false;

    modules.forEach(function(module) {
        if (cssPattern.test(module.rawRequest)) {
            result = true;
            return;
        }
    });

    return result;
}

MyPlugin.prototype.apply = function(compiler) {
    var self = this;

    compiler.plugin('compilation', function(compilation, params) {
        self.options = compilation.options;
        self.context = self.options.context;
    });

    var source,
        jsPattern = /(.+\.)js$/,
        cssFileName;

    compiler.plugin("after-compile", function(compilation, callback) {

        compilation.chunks.forEach(function(chunk) {
            var isCss = self.isCss(chunk.modules),
                isMultipleChunk;

            if (isCss === true) {
                isMultipleChunk = chunk.modules.length > chunk.files.length;
                chunk.files.forEach(function(file, index) {
                    // when the modules length bigger than files length,
                    // that mean the first module is an index module, so skip it
                    isMultipleChunk && index++;

                    //change file suffix to .css
                    cssFileName = file.replace(jsPattern, '$1' + 'css');
                    chunk.files[index] = cssFileName;
                    
                    var source = chunk.modules[index]._source
                    
                    if(source){
                        source = source._value;
                    }else{
                        return true
                        //解决entry 配置为{
                        // key:[value]
                        // }的形式会出现的异常
                    }
                    
                    //remove the bracket symbol from the compiled css string
                    //which is added by the package-webpack-css-loader
                    source = source.slice(1, source.length - 1);
                    source = JSON.parse(source);
                    source = source.content.join('\n');

                    var cssAsset = compilation.assets[cssFileName] = compilation.assets[file];
                    if(cssAsset._source) {
                        // dev mode
                        cssAsset._source.children = [source];
                    } else {
                        // prd mode
                        cssAsset._value = source; 
                    }

                    //把webpack默认的css生成结果干掉
                    delete compilation.assets[file];
                });
            }
        });

        callback();
    });
};

module.exports = MyPlugin;