/**
 * LebabWB - Integrates Lebab into WeBuilder with GUI panel
 *
 * Lebab turn your ES5 code into readable ES6/ES7 <https://github.com/lebab/>
 * Requires nodejs. <https://nodejs.org/>
 *
 * @category  WeBuilder Plugin
 * @package   LebabWB
 * @author    Peter Klein <pmk@io.dk>
 * @copyright 2020 Peter Klein
 * @license   http://www.freebsd.org/copyright/license.html  BSD License
 * @version   1.0
 */

/**
 * [CLASS/FUNCTION INDEX of SCRIPT]
 *
 *     60   function OnReady()
 *     76   function OnDisabled()
 *     89   function OnExit()
 *    101   function ToggleDock(Sender)
 *    116   function D(val)
 *    128   function CreateTabPanel(parent, caption)
 *    143   function CreateDockingPanel()
 *    330   function CreateCheckBox(parent, caption, hint, tagId, tabOrder, left, top)
 *    359   function CreateTranspileButton(parent, caption, tagId, left, top)
 *    384   function SaveCheckboxState(Sender)
 *    397   function GetSettings(tagId)
 *    419   function StartTranspiling(Sender)
 *    483   function InstallGlobalNodeModule(module)
 *    493   function GetEditorData()
 *    516   function SelectTagBlock(tag)
 *    562   function DisplayWarnings(text, editorStartLine)
 *    577   function ScaleImage(NewWidth, NewHeight)
 *    605   function FileGetContents(filename)
 *    625   function FilePutContents(filename, contents)
 *    645   function DeleteFile(file, force)
 *    661   function ExpandEnviromentVariable(path)
 *    673   function GetTempFileName(ext)
 *    684   function OnInstalled()
 *
 * TOTAL FUNCTIONS: 23
 * (This index is automatically created/updated by the WeBuilder plugin "DocBlock Comments")
 *
 */

/**
 * Global variables
 *
 */
var dockPanel;
var mainForm = null;
var tagList = ["arrow", "arrow-return", "for-of", "for-each", "arg-rest", "arg-spread", "obj-method", "obj-shorthand", "no-strict", "exponent", "multi-var", "let", "class", "commonjs", "template", "default-param", "destruct-param", "includes", "arrow,arrow-return,for-of,for-each,arg-rest,arg-spread,obj-method,obj-shorthand,no-strict,exponent,multi-var,let,class,commonjs,template,default-param,destruct-param,includes"];

/**
 * Fired after IDE has finished startup initialization or plugin has been just enabled after disabling.
 *
 * @return void
 */
function OnReady() {
  // If loading layouts eliminated this panel, the redock will restore it.
  // This is important on the 1st run of the plugin
  dockPanel.ReDock();

  // Restore dock visibility
  var ini = new TIniFile(Script.Path + "lebab_settings.ini");
  if (ini.ReadBool("LebabWB", "Dock visible", true)) dockPanel.Show();
  delete ini;
}

/**
 * Signal triggered when plugin is disabled
 *
 * @return void
 */
function OnDisabled() {
    // Save docking panel visibility
    var ini = new TIniFile(Script.Path + "lebab_settings.ini");
    ini.WriteBool("LebabWB", "Dock visible", dockPanel.PanelVisible);
    delete ini;
    dockPanel.Close();
}

/**
 * Fired when plugin is ending due to IDE closing or plugin being disabled or uninstalled.
 *
 * @return void
 */
function OnExit() {
  // Cleanup
  if (mainForm != null) delete mainForm;
}

/**
 * Toggle docking panel visibility
 *
 * @param  object   Sender
 *
 * @return void
 */
function ToggleDock(Sender) {
  if (dockPanel.Visible) dockPanel.Close();
  else dockPanel.Show();
  var ini = new TIniFile(Script.Path + "lebab_settings.ini");
  ini.WriteBool("LebabWB", "Dock visible", dockPanel.PanelVisible);
  delete ini;
}

/**
 * Adjust GUI element size/position by multiplying it with value of "Script.DpiScale"
 *
 * @param  integer   val
 *
 * @return integer
 */
function D(val) {
  return Round(val * Script.DpiScale);
}

/**
 * Create Tab panel
 *
 * @param  object   parent
 * @param  string   caption
 *
 * @return object
 */
function CreateTabPanel(parent, caption) {
    // TabSheet
  var tabSheet = new TTabSheet(WeBuilder);
  tabSheet.Parent = parent;
  tabSheet.PageControl = parent;
  tabSheet.Caption = caption;

  return tabSheet;
}

/**
 * Create docking panel
 *
 * @return void
 */
function CreateDockingPanel() {
  var lf = chr(13);
  var margin = D(5);
  var padding = D(10);
  var darkTheme = Script.IsDarkTheme; // When dark them is used, buttons colors needs to be changed
  var ini = new TIniFile(Script.Path + "lebab_settings.ini");

  dockPanel = new TDockPanel("Lebab_Panel", "dockPanelFileExplorer");
  dockPanel.Caption = "Lebab Panel";

  //create some form to show in the dock
  mainForm = new TForm(WeBuilder);
  mainForm.parent = dockPanel;
  mainForm.BorderStyle = bsNone;
  mainForm.Align = alClient;
  mainForm.Visible = true;
  //mainForm.Color = clWhite;
  mainForm.Font.Size = WeBuilder.Font.Size;
  mainForm.Font.Name = WeBuilder.Font.Name;
  mainForm.AutoScroll = true;
  mainForm.HorzScrollBar.Smooth = true;
  mainForm.VertScrollBar.Smooth = true;
  mainForm.HorzScrollBar.Tracking = true;
  mainForm.VertScrollBar.Tracking = true;

  // PageControl object
  var pctObj = new TPageControl(WeBuilder);
  pctObj.Align = alTop;
  pctObj.Anchors = akLeft + akRight + akTop;
  pctObj.Parent = mainForm;
  pctObj.TabHeight = mainForm.Canvas.TextHeight("hj") + padding;
  pctObj.SetBounds(0, 0, mainForm.ClientWidth, mainForm.ClientHeight);

  // 1st TPanel object
  var tabPanel1 = CreateTabPanel(pctObj, "Multi Transform");
  // 2nd TPanel object
  var tabPanel2 = CreateTabPanel(pctObj, "Single Transform");

  // GUI elements on 1st Tab
  var headerLabel = new TLabel(WeBuilder);
  headerLabel.Parent = tabPanel1;
  headerLabel.Font.Size = WeBuilder.Font.Size;
  headerLabel.Caption = "Safe transforms";
  headerLabel.ShowHint = true;
  headerLabel.Hint = "These transforms can be applied with relatively high confidence." + lf +
  "They use pretty straight-forward and strict rules for changing the code." + lf +
  "The resulting code should be almost 100% equivalent of the original code.";
  headerLabel.SetBounds(padding, padding, mainForm.Canvas.TextWidth(headerLabel.Caption), mainForm.Canvas.TextHeight("hj"));

//  CreateCheckBox(parent, caption, hint, tagId, tabOrder, left, top) {
  var checkbox = CreateCheckBox(tabPanel1, "arrow", "Callbacks to arrow functions", 0, 0, padding + margin, headerLabel.Top + headerLabel.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "arrow-return", "Drop return statements in arrow functions", 1, 1, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "for-of", "For loop to for-of loop", 2, 2, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "for-each", "For loop to Array.forEach()", 3, 3, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "arg-rest", "Use of arguments to function(...args)", 4, 4, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "arg-spread", "use of apply() to spread operator", 5, 5, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "obj-method", "function values in object to methods", 6, 6, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "obj-shorthand", "{foo: foo} to {foo}", 7, 7, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "no-strict", "removal of \"use strict\" directives", 8, 8, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "exponent", "Math.pow() to ** operator (ES7)", 9, 9, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "multi-var", "single var x,y; declaration to multiple var x; var y; (refactor)", 10, 10, padding + margin, checkbox.Top + checkbox.Height + margin);

  headerLabel = new TLabel(WeBuilder);
  headerLabel.Parent = tabPanel1;
  headerLabel.Font.Size = WeBuilder.Font.Size;
  headerLabel.Caption = "Unsafe transforms";
  headerLabel.ShowHint = true;
  headerLabel.Hint = "These transforms should be applied with caution." + lf +
  "They either use heuristics which can't guarantee that the resulting code is equivalent of the original code," + lf +
  "or they have significant bugs which can result in breaking your code.";
  headerLabel.SetBounds(padding, checkbox.Top + checkbox.Height + padding, mainForm.Canvas.TextWidth(headerLabel.Caption), mainForm.Canvas.TextHeight("hj"));

  checkbox = CreateCheckBox(tabPanel1, "let", "var to let/const", 11, 11, padding + margin, headerLabel.Top + headerLabel.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "obj-class", "function/prototypes to classes", 12, 12, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "commonjs", "CommonJS module definition to ES6 modules", 13, 13, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "template", "string concatenation to template strings", 14, 14, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "default-param", "default parameters instead of a = a || 2", 15, 15, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "destruct-param", "use destructuring for objects in function parameters", 16, 16, padding + margin, checkbox.Top + checkbox.Height + margin);

  checkbox = CreateCheckBox(tabPanel1, "includes", "array.indexOf(foo) !== -1 to array.includes(foo) (ES7)", 17, 17, padding + margin, checkbox.Top + checkbox.Height + margin);

  var button = CreateTranspileButton(tabPanel1, "transpile", Length(tagList) + 1, padding + margin, checkbox.Top + checkbox.Height + padding);
  button.Hint = "Transpile using selected transform options";
  button.Caption = "Multi Transpile";
  button.Width = mainForm.Canvas.TextWidth(button.Caption) + D(30);

  // GUI elements on 2nd Tab
  headerLabel = new TLabel(WeBuilder);
  headerLabel.Parent = tabPanel2;
  headerLabel.Font.Size = WeBuilder.Font.Size;
  headerLabel.Caption = "Safe transforms";
  headerLabel.ShowHint = true;
  headerLabel.Hint = "These transforms can be applied with relatively high confidence." + lf +
  "They use pretty straight-forward and strict rules for changing the code." + lf +
  "The resulting code should be almost 100% equivalent of the original code.";
  headerLabel.SetBounds(padding, padding, mainForm.Canvas.TextWidth(headerLabel.Caption), mainForm.Canvas.TextHeight("hj"));


  button = CreateTranspileButton(tabPanel2, "arrow ", 0, padding + margin, headerLabel.Top + headerLabel.Height + padding);

  button = CreateTranspileButton(tabPanel2, "arrow-return", 1, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "for-of", 2, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "for-each", 3, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "arg-rest", 4, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "arg-spread", 5, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "obj-method", 6, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "obj-shorthand", 7, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "no-strict", 8, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "exponent", 9, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "multi-var", 10, padding + margin, button.Top + button.Height + padding);

  headerLabel = new TLabel(WeBuilder);
  headerLabel.Parent = tabPanel2;
  headerLabel.Font.Size = WeBuilder.Font.Size;
  headerLabel.Caption = "Unsafe transforms";
  headerLabel.ShowHint = true;
  headerLabel.Hint = "These transforms should be applied with caution." + lf +
  "They either use heuristics which can't guarantee that the resulting code is equivalent of the original code," + lf +
  "or they have significant bugs which can result in breaking your code.";
  headerLabel.SetBounds(padding, button.Top + button.Height + padding, mainForm.Canvas.TextWidth(headerLabel.Caption), mainForm.Canvas.TextHeight("hj"));

  button = CreateTranspileButton(tabPanel2, "let ", 11, padding + margin, headerLabel.Top + headerLabel.Height + padding);

  button = CreateTranspileButton(tabPanel2, "obj-class", 12, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "commonjs", 13, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "template", 14, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "default-param", 15, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "destruct-param", 16, padding + margin, button.Top + button.Height + padding);

  button = CreateTranspileButton(tabPanel2, "includes", 17, padding + margin, button.Top + button.Height + padding);

  headerLabel = new TLabel(WeBuilder);
  headerLabel.Parent = tabPanel2;
  headerLabel.Font.Size = WeBuilder.Font.Size;
  headerLabel.Caption = "Quick Transforms";
  headerLabel.SetBounds(padding, button.Top + button.Height + padding, mainForm.Canvas.TextWidth(headerLabel.Caption), mainForm.Canvas.TextHeight("hj"));

  button = CreateTranspileButton(tabPanel2, "All Safe + Unsafe transforms ", 18, padding + margin, headerLabel.Top + headerLabel.Height + padding);

  // Adjust height of panel
  pctObj.Height = pctObj.TabHeight + button.Top + button.Height + padding + padding + padding;

  delete ini;

}

/**
 * Create Checkbox object
 *
 * @param  object   parent
 * @param  string   caption
 * @param  string   hint
 * @param  integer   tagId
 * @param  integer   tabOrder
 * @param  integer   left
 * @param  integer   top
 *
 * @return object
 */
function CreateCheckBox(parent, caption, hint, tagId, tabOrder, left, top) {
  var ini = new TIniFile(Script.Path + "lebab_settings.ini"), checkBox = new TcheckBox(WeBuilder);
  checkBox.Parent = parent;
  checkBox.Anchors = akLeft + akRight + akTop;
  checkBox.WordWrap = true;
  checkBox.Checked = ini.ReadBool("Lebab", tagList[tagId], false);
  checkBox.Caption = caption;
  checkBox.ShowHint = true;
  checkBox.Hint = hint;
  checkBox.TabOrder = tabOrder;
  checkBox.OnClick = "SaveCheckboxState";
  checkBox.Tag = tagId;
  checkBox.SetBounds(left, top, parent.Width - (left * 2), D(24));
  delete ini;
  return checkBox;

}

/**
 * Create transpile button
 *
 * @param  object   parent
 * @param  string   caption
 * @param  integer   tagId
 * @param  integer   left
 * @param  integer   top
 *
 * @return object
 */
function CreateTranspileButton(parent, caption, tagId, left, top) {
  var speedButton = new TBitBtn(WeBuilder);
  speedButton.Parent = parent;
  speedButton.Anchors = akLeft + akTop;
  speedButton.ShowHint = true;
  speedButton.Caption = caption;
  //speedButton.Margin = 4;
  speedButton.Hint = "Transpile using \"" + caption + "\" transform";
  speedButton.Glyph.LoadFromFile(Script.Path + "lebab_icon.bmp");
  speedButton.NumGlyphs = 1;
  speedButton.SetBounds(left, top , mainform.Canvas.TextWidth(speedButton.Caption) + D(36), D(22));
  //speedButton.SetBounds(left, top , D(24), D(24));
  speedButton.OnClick = "StartTranspiling";
  speedButton.Tag = tagId;
  speedButton.TabOrder = -1;
  return speedButton;
}

/**
 * Save checkbox state when clicked
 *
 * @param  TSpeedButton  Sender the button clicked
 *
 * @return void
 */
function SaveCheckboxState(Sender) {
  var ini = new TIniFile(Script.Path + "lebab_settings.ini");
  ini.WriteBool("Lebab", tagList[Sender.Tag], Sender.Checked);
  delete ini;
}

/**
 * Create the Lebab transform settings based on the tagId
 *
 * @param  integer   tagId
 *
 * @return string
 */
function GetSettings(tagId) {
  var settings = "";
  if (tagId < Length(tagList)) settings = tagList[tagId];
  else {
    var ini = new TIniFile(Script.Path + "lebab_settings.ini");
    for (var i = 0; i < Length(tagList); i++) {
      if (ini.ReadBool("Lebab", tagList[i], true)) settings += tagList[i] + ",";
    }
    if (settings != "") settings = Copy(settings, 0, Length(settings) - 1);
    delete ini;
  }
  if (settings != "") settings = "--transform " + settings;
  return settings;
}

/**
 * Transpile JavaScript using Lebab
 *
 * @param  TSpeedButton  the button clicked
 *
 * @return void
 */
function StartTranspiling(Sender) {

  var data = GetEditorData();
  if (Length(data) == 3) {
    var editorData = data[0], editorStartLine = data[1], editorDataType = data[2];

    var fileName = Document.FileName,	// Filename of current document
    ext = ExtractFileExt(fileName),	// File extension of current document
    workFileName = GetTempFileName(ext); // Temp file

    // Remove any existing temp file to avoid double requesters popping up
    if (FileExists(workFileName)) DeleteFile(workFileName, true);

    // Save a copy of current document
    FilePutContents(workFileName, editorData);

    // If file exists (saved correctly), then we run Lebab
    if (FileExists(workFileName)) {
      var cmd = ExpandEnviromentVariable("%USERPROFILE%\\AppData\\Roaming\\npm\\lebab.cmd"), tagId;
      if (!FileExists(cmd)) {
        // Lebab module not found
        if (Confirm("Lebab module not found. Install it?")) InstallGlobalNodeModule("lebab");
        else return;
      }

      try tagId = Sender.Tag;
      except tagId = Length(tagList) + 1; // There's no Tag property if WeBuilder menuitem is clicked

      cmd += " " + GetSettings(tagId) + " \"" + workFileName + "\" -o \"" + workFileName + "\"";

      if (ExecuteCommand(cmd, warnings)) {
        // Command was executed correctly
        // Grab the content of the processed temp file
        var transpiledCode = FileGetContents(workFileName);

        // Remove the work file as we no longer need it
      	if (FileExists(workFileName)) DeleteFile(workFileName, true);

        // Replace editor content
        Editor.BeginEditing;
        if (Editor.SelText != "") Editor.SelText = transpiledCode;
        else Editor.Text = transpiledCode;
        Editor.EndEditing;

        // Parse and display the warnings in Message Panel
        DisplayWarnings(warnings, editorStartLine);
      }
      else Script.Message("Error: Unable to locate/run Lebab.");
    }
    else Script.Message("Error: Failed to save Lebab temp file.");
  }
  else Script.Message(data[0]); // Display GetEditorData error message

}

/**
 * Install Nodejs module (global)
 *
 * Open command prompt window and run Node Package Manager (npm)
 *
 * @param  string   module Nodejs module(s)
 *
 * @return void
 */
function InstallGlobalNodeModule(module) {
  var WSH = CreateOleObject("WScript.Shell");
  WSH.run("cmd.exe /C \"" + ExpandEnviromentVariable("%USERPROFILE%\\AppData\\Roaming\\npm\\npm.cmd") + " install " + module + " -g & pause\"", 1, 1);
}

/**
 * Get editor data. Either selection or entire document.
 *
 * @return string
 */
function GetEditorData() {
  // Is something selected?
  if (Editor.SelText !="") {
    if (Document.CurrentCodeType in [ltJScript]) return [Editor.SelText, Editor.Selection.SelStartLine, "Selection"];
    else return ["Error: Selection is not in JavaScript format!"];
  }
  // If not we grab the entire document
  else {
    if (Document.DocType in [dtJScript]) return [Editor.Text, 0, "Document"];
    else if ((Document.CurrentCodeType in [ltJScript]) && (SelectTagBlock("script"))) return [Editor.SelText, Editor.Selection.SelStartLine, "Selection"];
    else return ["Error: Document is not in JavaScript format!"];
  }
}

/**
 * Select content between start and ending HTML tag based on current cursor position.
 *
 * Returns true if content is selected, false if start and ending tags can't be found
 *
 * @param  string   tag
 *
 * @return boolean
 */
function SelectTagBlock(tag) {
  var sel = Editor.Selection, i, match, pos;
  var startLine, startCol, endLine, endCol, count = 0;
  var startRe = "<" + tag + "[^>]*>", endRe = "<\\/" + tag + ">";

  // Find the starting script tag
  for (i = sel.SelStartLine;i>=0;i--) {
    if (RegexMatch(Editor.Lines[i],startRe, false) != "") {
      if (RegexMatchAll(Editor.Lines[i],startRe, false, match, pos) == true) {
        startLine = i;
        startCol = Length(_v(match, [Length(match) - 1, 0])) + _v(pos, [Length(match) - 1, 0]);
        count++;
        break;
      }
    }
  }
  // Find the ending script tag
  for (i = sel.SelStartLine;i< Editor.LineCount;i++) {
    if (RegexMatch(Editor.Lines[i], endRe, false) != "") {
      if (RegexMatchAll(Editor.Lines[i],endRe, false, match, pos) == true) {
        endLine = i;
        endCol = _v(pos,[0,0]);
        count++;
        break;
      }
    }
  }
  if (count == 2) {
    // If both start and end have been found, set the selection
    sel.SelStartLine = startLine;
    sel.SelStartCol = startCol - 1;
    sel.SelEndLine = endLine;
    sel.SelEndCol = endCol - 1;
    Editor.Selection = Sel;
    return true;
  }
  else return false;
}

/**
 * Display Lebab warnings in WeBuilder Message Panel
 *
 * @param  string   text
 *
 * @return void
 */
function DisplayWarnings(text, editorStartLine) {
  Script.ClearMessages;
  Script.Message("Lebab: Transpiling finished.")
  var SL = new TStringList, c = 0;
  SL.Text = text;
  for (var i=1;i<SL.Count;i++) {
    var msg = SL[i], numInt = StrToInt(RegexMatch(msg, "^\\d+", true));
    numInt += editorStartLine; // Adjust line number to compensate for selection position
    msg = "Lebab: line: " + RegexReplace(msg, "^\\d+", IntToStr(numInt), true);
    Script.Message(msg);
  }
  delete SL;

}

function ScaleImage(NewWidth, NewHeight) {

    var bitmap1 = new TBitmap;
    bitmap1.Create;
    bitmap1.LoadFromFile(Script.Path + "lebab256.bmp");

    var bitmap2 = new TBitmap;
    bitmap2.Create;
    bitmap2.Canvas.Brush.Style = bsSolid;
    bitmap2.Canvas.Brush.Color = clBtnFace;
    bitmap2.Canvas.Pen.Color = clBtnFace;
    bitmap2.Width = NewWidth;
    bitmap2.Height = NewHeight;
    bitmap2.Canvas.StretchDraw(0, 0, NewWidth, NewHeight, bitmap1);
    bitmap1.Width = NewWidth;
    bitmap1.Height = NewHeight;
    bitmap1.Canvas.Draw(0, 0, bitmap2);
    bitmap2.Free;
    return bitmap1;
}

/**
 * Load external file and return the contents
 *
 * @param  string   filename the name of the file to load
 *
 * @return string  the contents of the file
 */
function FileGetContents(filename) {
  var stream = CreateOleObject("ADODB.Stream");
  stream.Open;
  stream.Position = 0;
  stream.CharSet = "utf-8";
  stream.Type = 2;
  stream.LoadFromFile(filename);
  var contents = stream.ReadText();
  stream.Close;
  return contents;
}

/**
 * Save contents to external file
 *
 * @param  string   filename the name of the file to save
 * @param  string   contents the contents of the file
 *
 * @return void
 */
function FilePutContents(filename, contents) {
  var stream = CreateOleObject("ADODB.Stream");
  stream.Open;
  stream.Position = 0;
  stream.CharSet = "utf-8";
  stream.Type = 2;
  stream.WriteText(contents);
  stream.SaveToFile(filename, 2);
  stream.Close;
}

/**
 * Delete file or files (using wilcards) from system
 *
 * @param  string  file   path/name of file to delete
 * @param  bool    force  true if files with the read-only attribute set are to be deleted
 *                        false if they are not.
 *
 * @return bool   true if file have been deleted sucessfully
 */
function DeleteFile(file, force) {
  var FSO = CreateOleObject("Scripting.FileSystemObject");
  if (FSO.FileExists(file)) {
    FSO.DeleteFile(file);
    return !FSO.FileExists(file);
  }
  return false;
}

/**
 * Expand Windows Enviroment variables to absolute path.
 *
 * @param  string   path
 *
 * @return string
 */
function ExpandEnviromentVariable(path) {
  var WSH = CreateOleObject("Wscript.Shell");
  return WSH.ExpandEnvironmentStrings(path);
}

/**
 * Creates a random tempfile name, located in the system TEMP folder
 *
 * @param  string   ext  file extension in format ".xxx". Default is ".tmp"
 *
 * @return string   path/name to tempfile
 */
function GetTempFileName(ext) {
  var FSO = CreateOleObject("Scripting.FileSystemObject"), file = FSO.GetTempName();
  if (RegexMatch(ext, "^\\.[\\s\\S]+", true) != "") file = RegexReplace(file, "\\.tmp$", ext, true);
  return FSO.GetSpecialFolder(2).Path + "\\" + file;
}

/**
 * Show info when plugin is installed
 *
 * @return void
 */
function OnInstalled() {
  alert("LebabWB 1.0 by Peter Klein installed sucessfully!");
}

CreateDockingPanel();

// Docks need to be re-docked on "ready" signal
Script.ConnectSignal("ready", "OnReady");
Script.ConnectSignal("exit", "OnExit");
Script.ConnectSignal("disabled", "OnDisabled");
Script.ConnectSignal("installed", "OnInstalled");

var bmp = new TBitmap, act;
LoadFileToBitmap(Script.Path + "lebab_icon.png", bmp);
act = Script.RegisterDocumentAction("Lebab", "Transpile", "", "StartTranspiling");
Actions.SetIcon(act, bmp);
act = Script.RegisterAction("Lebab", "Toggle Lebab Dock", "", "ToggleDock");
Actions.SetIcon(act, bmp);
delete bmp;