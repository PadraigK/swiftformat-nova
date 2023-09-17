nova.commands.register("padraig.swiftformat.formatDocument", formatDocument);

const compositeDisposable = new CompositeDisposable();

exports.activate = function() {
    compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));
}

exports.deactivate = function() {
    compositeDisposable.dispose();
}

async function swiftFormat(text) {
  let args = ["--quiet"]
  
  const version = swiftVersion() 
  const config = configurationPath()
  
  if (version) {
    args.push("--swiftversion", version)
  }
  
  if (config) {
    args.push("--config", config)
  }
  
  const process = new Process(executablePath(), {
      "args": args,
      shell: true,
      "stdin": "pipe"
  })
  
  let lines = [];
  let errorLines = [];
  
  process.onStdout((data) => {
      if (data) {
          lines.push(data);
      }
  });
  
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
      console.log(errorLines.join(""));
      throw new Error(`Program Error: ${errorLines.join("")}`)
      break;
    case 127:
      console.log(errorLines.join(""));
      throw new Error(`Couldn't find the swiftformat executable at ${executablePath()}`);
      break;
    default:
      console.log(errorLines.join(""));
      throw new Error(`${status} - ${errorLines.join("")}`) 
  }
  
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
    
    return editor.onWillSave(async (editor) => {
        if (shouldFormatOnSave()) {
          await formatDocument(editor);
        }
    });
}

function shouldFormatOnSave() { 
  const configKey = "padraig.swiftformat.config.formatOnSave"
  const str = nova.workspace.config.get(configKey, "string");
  
  switch (str) {
    case "disable":
      return false;
    case "enable":
      return true;
    default:
      return nova.config.get(configKey, "boolean") ?? false
  }
}

function customExecutablePath() { 
  const configKey = "padraig.swiftformat.config.executablePath"
  const workspacePath = nova.workspace.config.get(configKey, "string");
  
  if (workspacePath) {
    return workspacePath;
  }
  
  const globalPath = nova.config.get(configKey, "string");
  
  if (globalPath) {
    return globalPath;
  }
}

function executablePath() { 
  return customExecutablePath() ?? nova.path.join(nova.extension.path, "/bin/swiftformat");
}

function configurationPath() { 
  if (nova.workspace.path) {
    const path = nova.path.join(nova.workspace.path, ".swiftformat");
    
    if (nova.fs.stat(path)) {
      return path
    }
  }
}

function swiftVersion() { 
  // If there's a `.swift-version` file, use that.
  if (nova.workspace.path) {
    const swiftVersionPath = nova.path.join(nova.workspace.path, ".swift-version");
    
    if (nova.fs.stat(swiftVersionPath)) {
      const file = nova.fs.open(swiftVersionPath);
      
      if (file) {
        const version = file.readline()
        return version
      }
    }
  }
  
  const configKey = "padraig.swiftformat.config.swiftVersion"
  const workspacePath = nova.workspace.config.get(configKey, "string");
  
  if (workspacePath) {
    // If there's a workspace setting use that.
    return workspacePath;
  }
  
  const globalPath = nova.config.get(configKey, "string");
  
  if (globalPath) {
    // If there's a workspace setting use that.
    return globalPath;
  }
  
  // Otherwise, we won't send a version at all and swiftformat can do what it thinks is right.
}