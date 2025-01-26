import {
  Editor,
  MarkdownPostProcessor,
  MarkdownPreviewRenderer,
  MarkdownView,
  Notice,
  Plugin,
} from "obsidian"
import type { MyPluginSettings } from "../types"
import { SampleModal } from "./sample-modal"
import { SampleSettingTab } from "./sample-settings-tab"
import { indentStateField } from "./indent-state-field"

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
}

export class MyPlugin extends Plugin {
  settings: MyPluginSettings
  mdPostProcessor: MarkdownPostProcessor

  async onload() {
    await this.loadSettings()

    this.registerEditorExtension(indentStateField);

    // For the rendered (reader) view:
    const mdPostProcessor = this.registerMarkdownPostProcessor((element) => {
      if (!element || !element.parentNode) {
        return;
      }
      if (element.classList.contains("el-p")) {
        return;
      }
      const headerClass = Array.from(element.classList).find(c => c.startsWith("el-h"));
      if (!headerClass) {
        return;
      }
      console.log('should only be headers', {element})
      let next = element.nextElementSibling;
      while (next && !Array.from(next.classList).some(c => c.includes('el-h'))) {
        next.classList.add(`${headerClass}-line`);
        next = next.nextElementSibling;
      }
      // const nodes = Array.from(element.parentNode.querySelectorAll("[class^='el-h'] ~ .el-p"));
      // for (const node of nodes) {
      //   console.log({element, node})
      //   const classes = Array.from(node.classList);
      //   if (classes.some(c => c.startsWith("el-h") && !c.endsWith("-line"))) {
      //     console.log('does this ever happen?')
      //     return;
      //   }
      //   node.classList.add(`${headerClass}-line`);
      // }
    });

    // // For the editor (CodeMirror) view:
    // this.registerCodeMirror((cm) => {
    //   cm.on("renderLine", (instance, line, el) => {
    //     el.classList.add("my-editor-class");
    //   });
    // });

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "dice",
      "Sample Plugin",
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new Notice("This is a notice!")
      },
    )
    // Perform additional things with the ribbon
    ribbonIconEl.addClass("my-plugin-ribbon-class")

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem()
    statusBarItemEl.setText("Status Bar Text")

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "open-sample-modal-simple",
      name: "Open sample modal (simple)",
      callback: () => {
        new SampleModal(this.app).open()
      },
    })
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "sample-editor-command",
      name: "Sample editor command",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection())
        editor.replaceSelection("Sample Editor Command")
      },
    })
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: "open-sample-modal-complex",
      name: "Open sample modal (complex)",
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView)
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new SampleModal(this.app).open()
          }

          // This command will only show up in Command Palette when the check function returns true
          return true
        }
      },
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this))

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt)
    })

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
    )
  }


  onunload() {
    // MarkdownPreviewRenderer.unregisterPostProcessor(this.mdPostProcessor)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}