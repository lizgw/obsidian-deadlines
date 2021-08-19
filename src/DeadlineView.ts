import { off } from "codemirror";
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

    // let today = new Date(2021, 7, 8);
    let today = new Date();
    let todayMonthStr = today.toLocaleString("default", { month: "long" });
    let todayDayNum = today.getDate();
    // let todayWeekday = today.toLocaleString("default", {weekday: "short"});
    let todayWeekdayNum = today.getDay(); // 0 = sunday
    // in case the current day isn't a monday, we need to shift it over
    // so we need to figure out which day to start on
    let pos = todayWeekdayNum - 1;
    if (pos < 0) {
      pos = 6;
    }
    // subtract some days depending on where this date is on the calendar
    let startDate = this.addDays(today, (pos * -1));

    calContainer.append(this.createMonthBar(todayMonthStr));

    calContainer.append(this.createWeekBar());

    // create a row of dates
    let offset = 0;
    for (let i = 0; i < this.numWeeks; i++) {
      // create each day in the row
      for (let j = 0; j < 7; j++) {
        let newDate = this.addDays(startDate, offset);
        calContainer.append(this.createDayBlock(newDate.getDate()));
        offset++;
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

  createMonthBar(month: string) {
    const wrapper = document.createElement("div");
    wrapper.addClass("calendar-month-bar");
    wrapper.createEl("h2", {
      text: month
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

  createDayBlock(num: number) {
    const block = document.createElement("div");
    block.addClass("calendar-day-block");
    block.createEl("span", {
      text: "" + num,
      cls: "calendar-day-block-number"
    });
    return block;
  }

  getNthDayBlock(n: number) {
    let container = document.getElementById("calendar-container");
    // skip month bar and week bar
    return container.children.item(2 + n);
  }

  addDays(date: Date, days: number) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
}