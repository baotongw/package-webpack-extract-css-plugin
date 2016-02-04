var pathsys = require('path'),
    filesys = require('fs');

function MyPlugin(options) {
    this.context = null;
    this.options = null;

    this.fileCount = 0;
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

MyPlugin.prototype.createDir = function(path, fileName, callback) {
    var stat,
        fullPath = this.context,
        dirList = path.split(pathsys.sep);


    for (var i = 0; i < dirList.length; i++) {
        fullPath = pathsys.join(fullPath, dirList[i]);

        if (!filesys.existsSync(fullPath)) {
            filesys.mkdirSync(fullPath);
        }
    }

    fullPath = pathsys.join(fullPath, fileName);

    callback(fullPath);
}

MyPlugin.prototype.writeCssChunk = function(path, fileName, content) {
        this.createDir(path, fileName, function(fullPath) {
        var result = filesys.writeFileSync(fullPath, content);

        if (result === undefined) {
            console.log(fullPath + ' is generated.');            
        } else {
            console.log(result.message || ('error happen: ' + fullPath))
        }
    });
}

MyPlugin.prototype.generatedCssChunks = function(chunks) {
    var fileName,
        filePath,
        outputPath,
        hash,
        chunk,
        modules,
        content,
        source;

    var filePattern = /(.+)\/([\w_-]+)/i;
    var total = 0;

    for (var i = 0; i < chunks.length; i++) {
        chunk = chunks[i];
        chunk.name.match(filePattern);
        hash = chunk.renderedHash;
        filePath = RegExp.$1;
        fileName = RegExp.$2 + '@' + hash + '.css';
        outputPath = pathsys.join(this.options.output.path, filePath);
        content = [];
        modules = chunk.modules;

        for (var j = 0; j < chunk.modules.length; j++) {
            source = chunk.modules[j]._source._value;
            // 去掉预留的javascript语法格式
            source = source.slice(1, source.length - 1);

            source = JSON.parse(source);
            content.push(source.content.join('\n'));
        }
        this.fileCount++;
        this.writeCssChunk(outputPath, fileName, content.join('\n'));
    }

    console.log('A total of ' + this.fileCount + ' css files are generated.');
}

MyPlugin.prototype.apply = function(compiler) {
    var self = this;

    compiler.plugin('compilation', function(compilation, params) {
        self.options = compilation.options;
        self.context = self.options.context;
    });

    var extractedChunks = [];

    var source;
    compiler.plugin("after-compile", function(compilation, callback) {
        // Remove all chunk assets
        var jsPattern = /(.+\.)js$/;

        compilation.chunks.forEach(function(chunk) {
            var isCss = self.isCss(chunk.modules);

            if (isCss === true) {
                extractedChunks.push(chunk);

                // 从编译好的集合中去除css的部分，css我们单独处理
                chunk.files.forEach(function(file) {
                    delete compilation.assets[file];
                });
            }
        });

        callback();
    });

    compiler.plugin("emit", function(compilation, callback) {
        if (extractedChunks.length) {
            self.generatedCssChunks(extractedChunks);
        }

        callback();
    });
};

module.exports = MyPlugin;