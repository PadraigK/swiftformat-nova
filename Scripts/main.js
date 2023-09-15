const compositeDisposable = new CompositeDisposable();

exports.activate = function() {
    compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));
}

// TODO: Refactor so this can run just when the command is run (without saving)
function runFormatter(editor) {    
    const fullRange = new Range(0, editor.document.length)
    const text = editor.document.getTextInRange(fullRange);

    let process = new Process("swiftformat", {
        // "args": ["--quiet"],
        // "env": {},
        shell: true,
        "stdin": "pipe"
    })
    
    var lines = [];
    
    process.onStdout((data) => {
        if (data) {
            lines.push(data);
        }
    });
    
    var err = [];
    
    process.onStderr((data) => {
        if (data) {
            err.push(data);
        }
    });
    
    process.onDidExit((status) => {
        var didChange = false
        editor.edit(
            (textEditorEdit) => { 
                var formattedText = lines.join("")
                if(text!=formattedText) {
                    didChange = true 
                    textEditorEdit.replace(fullRange, lines.join(""));
                }
            }
        ).then( () => {
            if (didChange && !editor.document.isUntitled) {
                editor.save();
            }
        });
    });
    
    compositeDisposable.add(process)
    
    process.start();
    
    const writer = process.stdin.getWriter();
    
    writer.ready
      .then(() => defaultWriter.write(text))
      .then(() => defaultWriter.close())
      .catch((err) => console.error("Write to STDIN error:", err));
}

function watchEditor(editor) {
    const document = editor.document;
    
    if (!["swift"].includes(document.syntax ?? "")) {
      return;
    }
    
    console.log("Observing " + document.uri + "for willSave");
    const editorDisposable = new CompositeDisposable();
    
    editorDisposable.add(
      editor.onWillSave(async (editor) => {
        // if (shouldFixOnSave()) {
        //   await linter.fixEditor(editor);
        // }
        // linter.lintDocument(editor.document);
        
          runFormatter(editor)
      })
    );
    
    return editorDisposable;
}

exports.deactivate = function() {
    compositeDisposable.dispose();
}

nova.commands.register("swiftformat.runFormatter", (editor) => {
    runFormatter(editor)
});

nova.commands.register("swiftformat.openURL", (workspace) => {
    var options = {
        "placeholder": "https://foobar.com",
        "prompt": "Open"
    };
    nova.workspace.showInputPanel("Enter the URL to open:", options, function(result) {
        if (result) {
            nova.openURL(result, function(success) {
                
            });
        }
    });
});

nova.commands.register("swiftformat.runExternalTool", (workspace) => {
    var options = {
        "placeholder": "/path/to/tool",
        "prompt": "Run"
    };
    nova.workspace.showInputPanel("Enter the path to the external tool:", options, function(result) {
        if (result) {
            var options = {
                // "args": [],
                // "env": {},
                // "stdin": <any buffer or string>
            };
            
            var process = new Process(result, options);
            var lines = [];
            
            process.onStdout(function(data) {
                if (data) {
                    lines.push(data);
                }
            });
            
            process.onDidExit(function(status) {
                var string = "External Tool Exited with Stdout:\n" + lines.join("");
                nova.workspace.showInformativeMessage(string);
            });
            
            process.start();
        }
    });
});

