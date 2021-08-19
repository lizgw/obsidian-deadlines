import DeadlinePlugin from "main";
import {ItemView, WorkspaceLeaf} from "obsidian";

// TODO: i8n?
const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun"
];

export default class DeadlineView extends ItemView {
  plugin: DeadlinePlugin;
  numWeeks: Number;

  constructor(leaf: WorkspaceLeaf, plugin: DeadlinePlugin) {
    super(leaf);
    this.plugin = plugin;
    this.numWeeks = 5;
  }

  onload() {
    super.onload();

    let calContainer = this.contentEl.createDiv({
      cls: "calendar-container"
    });
    calContainer.append(this.createWeekBar());
    calContainer.append(this.createMonthBar());

    for (let i = 0; i < this.numWeeks; i++) {
      for (let j = 0; j < 7; j++) {
        calContainer.append(this.createDayBlock(j));
      }
    }
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

  createMonthBar() {
    const wrapper = document.createElement("div");
    wrapper.addClass("calendar-month-bar");
    wrapper.createEl("h2", {
      text: "CURRENT MONTH"
    });

    return wrapper;
  }

  createWeekBar() {
    const wrapper = document.createElement("div");
    wrapper.addClass("calendar-week-bar");

    WEEKDAYS.forEach(day => {
      wrapper.createEl("span", {
        text: day
      });
    });

    return wrapper;
  }

  createDayBlock(num: Number) {
    const block = document.createElement("div");
    block.addClass("calendar-day-block");
    block.createEl("span", {
      text: "" + num,
      cls: "calendar-day-block-number"
    });
    return block;
  }
  
}