nova.commands.register("swiftformat.formatDocument", formatDocument);


const compositeDisposable = new CompositeDisposable();

exports.activate = function() {
    compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));
}

exports.deactivate = function() {
    compositeDisposable.dispose();
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
  
  let errorLines = [];
  
  process.onStderr((data) => {
      if (data) {
          errorLines.push(data);
      }
  });
  
  const exitPromise = new Promise((resolve) => {
    process.onDidExit((status) => {
      resolve(status);
    });  
  })
  
  const writer = process.stdin.getWriter();
  
  process.start();
  
  await writer.ready;
  writer.write(text);
  writer.close();
   
  const status = await exitPromise;
  
  switch (status) {
    case 0: 
      break;
    case 70:
      throw new Error(`Program Error: ${errorLines.join("")}`)
      break;
    case 127:
      throw new Error("Couldn't find the swiftformat executable.");
      break;
    default:
      throw new Error(`${status} - ${errorLines.join("")}`) 
  }
  
  console.log("returning: " + lines.join(""))
  return lines.join("");
}

async function formatDocument(editor) {    
    const fullRange = new Range(0, editor.document.length)
    const originalText = editor.document.getTextInRange(fullRange);

    try {
      const formattedText = await swiftFormat(originalText);
      
      // Clear previous notification if we tried again and succeeded.
      nova.notifications.cancel("swiftformat-process-failed");
      
      if (formattedText!=originalText) {
        await editor.edit((edit) => {
          edit.replace(fullRange, formattedText);
        });
      }
    } catch (e) { 
        let request = new NotificationRequest("swiftformat-process-failed");
        
        request.title = "Error Running SwiftFormat";
        request.body = e.message;
        
        request.actions = [nova.localize("OK")];
        nova.notifications.add(request);
    }
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
      
        await formatDocument(editor);
    });
}

