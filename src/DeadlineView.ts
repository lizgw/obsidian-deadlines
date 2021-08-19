import DeadlinePlugin from "main";
import {ItemView, WorkspaceLeaf} from "obsidian";

export default class DeadlineView extends ItemView {
  plugin: DeadlinePlugin;

  constructor(leaf: WorkspaceLeaf, plugin: DeadlinePlugin) {
    super(leaf);
    this.plugin = plugin;  
  }

  onload() {
    super.onload();

    console.log("LOAD!!!");

    this.contentEl.createEl("h1", {
      text: "Deadlines"
    });

    let calContainer = this.contentEl.createDiv({
      cls: "calendar-container"
    });
  }

  getDisplayText() {
    return "Deadlines";
  }

  getViewType() {
    return "deadline";
  }

  getIcon() {
    // list here: https://forum.obsidian.md/t/list-of-available-icons-for-component-seticon/16332/4
    return "calendar-with-checkmark";
  }
  
}