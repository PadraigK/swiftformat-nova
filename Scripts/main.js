const compositeDisposable = new CompositeDisposable();

exports.activate = function() {
    compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));
}

async function swiftFormat(text) {
  const process = new Process("swiftformat", {
      "args": ["--quiet"],
      shell: true,
      "stdin": "pipe"
  })
  
  let lines = [];
  
  process.onStdout((data) => {
      if (data) {
          lines.push(data);
      }
  });
  
  const exitPromise = new Promise((resolve) => {
    process.onDidExit((status) => {
      resolve(status);
    });  
  })
  
  process.start();
  
  const writer = process.stdin.getWriter();
  
  try {
    await writer.ready;
    
    console.log("writing: " + text)
    writer.write(text);
    writer.close();
  } catch (e) {
    console.error("Write to STDIN error:", e)
    throw e;
  }
  
  const status = await exitPromise;
  console.log("exit status: " + status)
  console.log("returning: " + lines.join(""))
  return lines.join("");
}

async function formatDocument(editor) {    
    const fullRange = new Range(0, editor.document.length)
    const originalText = editor.document.getTextInRange(fullRange);

    const formattedText = await swiftFormat(originalText);
    const didChange = formattedText!=originalText
    
    if (didChange) {
      await editor.edit((edit) => {
        edit.replace(fullRange, formattedText);
      });
    }
    
    return didChange;
}

function watchEditor(editor) {
    const document = editor.document;
    
    if (!["swift"].includes(document.syntax ?? "")) {
      return;
    }
    
    console.log("Observing " + document.uri + "for willSave");
    
    return editor.onWillSave(async (editor) => {
      // if (shouldFixOnSave()) {
      //   await linter.fixEditor(editor);
      // }
      // linter.lintDocument(editor.document);
      
        const didChange = await formatDocument(editor);
        if (didChange && !editor.document.isUntitled) { 
          await editor.save();
        }
    });
}

exports.deactivate = function() {
    compositeDisposable.dispose();
}

nova.commands.register("swiftformat.formatDocument", async (editor) => {
    await formatDocument(editor);
});

