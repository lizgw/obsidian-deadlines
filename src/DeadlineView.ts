import DeadlinePlugin from "main";
import {ItemView, WorkspaceLeaf} from "obsidian";
import Deadline from "Deadline";

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
  deadlineData: Deadline[];
  containerElem: HTMLDivElement;

  constructor(leaf: WorkspaceLeaf, plugin: DeadlinePlugin) {
    super(leaf);
    this.plugin = plugin;
    this.numWeeks = 8;
    this.deadlineData = this.getDeadlineData()
      .sort((a, b) => { return a.compare(b); });

    this.containerElem = this.contentEl.createDiv();
    this.containerElem.setAttribute("id", "calendar-container");
  }

  onload() {
    super.onload();
    // let today = new Date(2021, 7, 8);
    let today = new Date();
    let todayMonthStr = today.toLocaleString("default", { month: "long" });
    let todayWeekdayNum = today.getDay(); // 0 = sunday
    // in case the current day isn't a monday, we need to shift it over
    // so we need to figure out which day to start on
    let pos = todayWeekdayNum - 1;
    if (pos < 0) {
      pos = 6;
    }
    // subtract some days depending on where this date is on the calendar
    let startDate = this.addDays(today, (pos * -1));

    this.containerElem.append(this.createMonthBar(todayMonthStr, today.getFullYear()));

    this.containerElem.append(this.createWeekBar());

    // create a row of dates
    let offset = 0;
    let lastDate = startDate;
    for (let i = 0; i < this.numWeeks; i++) {
      // check if we need to add a new month bar
      let weekLater = this.addDays(lastDate, 7);
      if (weekLater.getDate() < lastDate.getDate()) {
        let newMonthName = weekLater.toLocaleString("default", {month: "long"});
        this.containerElem.append(this.createMonthBar(newMonthName, weekLater.getFullYear()));
      }

      // create each day in the row
      for (let j = 0; j < 7; j++) {
        let newDate = this.addDays(startDate, offset);
        this.containerElem.append(this.createDayBlock(newDate));
        lastDate = newDate;
        offset++;
      }
    }

    this.renderDeadlines();
  }

  renderDeadlines() {
    console.log(this.deadlineData);
    let skipping = false;
    // render all the deadlines
    this.deadlineData.forEach(dl => {
      // TODO: skip dates before current week
      // only render dates that aren't "done"
      if (!skipping && dl.status != "done") {
        // find the block to add it to
        let dateStr = this.dateToFormatString(dl.date);
        // console.log(dateStr + "for date " + dl.date.toUTCString());
        let block = document.getElementById(dateStr);

        // if this date isn't on the calendar, then stop
        // because we've gone too far into the future
        if (block != null) {
          this.createDeadlineBlock(dl, block);
        } else {
          skipping = true;
        }
      }
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

  createMonthBar(month: string, year: number) {
    const wrapper = document.createElement("div");
    wrapper.addClass("calendar-month-bar");
    wrapper.createEl("h2", {
      text: month + " " + year
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

  createDayBlock(date: Date) {
    const block = document.createElement("div");
    block.addClass("calendar-day-block");
    block.createEl("span", {
      text: "" + date.getDate(),
      cls: "calendar-day-block-number"
    });
    block.setAttribute("id", this.dateToFormatString(date));

    // add a class to the weekends
    // TODO: make a toggle setting for this
    if (date.getDay() == 0 || date.getDay() == 6) {
      block.addClass("calendar-day-block-weekend");
    }

    // add a class to today
    // TODO: make a toggle setting for this
    let today = new Date();
    // let today = new Date(2021, 7, 8);
    if (date.toDateString() == today.toDateString()) {
      block.addClass("calendar-day-block-today");
    }

    // add a hover button that lets you create a deadline for that date
    let addBtn = block.createEl("button", {
      text: "+",
      cls: "calendar-add-btn"
    });
    addBtn.addEventListener("click", () => {
      this.plugin.createDeadlineModal(date);
    })

    return block;
  }

  // this deals in local time!
  dateToFormatString(date: Date) {
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let day = date.getDate();

    let result = `${year}-`;
    if (month < 10) {
      result += "0";
    }
    result += month + "-";
    if (day < 10) {
      result += "0";
    }
    result += day;
    return result;
  }

  createDeadlineBlock(deadline: Deadline, calBlock: Element) {
    let deadlineElem = deadline.createElement();
    deadlineElem.addEventListener("click", async () => {
      let newLeaf = this.app.workspace.splitActiveLeaf("horizontal");
      await newLeaf.openFile(deadline.note);
    });
    calBlock.append(deadlineElem);
  }

  getNthDayBlock(n: number) {
    // skip month bar and week bar
    return this.containerElem.children.item(2 + n);
  }

  addDays(date: Date, days: number) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  getDeadlineData() {
    let data = <Deadline[]> [];

    let files = this.app.vault.getMarkdownFiles();

    files.forEach(file => {
      let cacheInfo = this.app.metadataCache.getFileCache(file);
      // only process files with a deadline in the frontmatter
      if (cacheInfo.frontmatter && cacheInfo.frontmatter.deadline != undefined) {
        // we have to copy the date to a new object here
        // reading the date from the file creates a new date on that day at 00:00 UTC
        // which can become a different day in local time
        // so we need to make a day based on now in local time
        // and then copy the date data over from the date in the frontmatter
        // dates are weird and this sucks
        let utcDate = new Date(cacheInfo.frontmatter.deadline);
        let localDate = new Date();
        localDate.setFullYear(utcDate.getUTCFullYear());
        localDate.setMonth(utcDate.getUTCMonth());
        localDate.setDate(utcDate.getUTCDate());
        data.push(new Deadline(
          file.basename,
          localDate,
          cacheInfo.frontmatter.group,
          cacheInfo.frontmatter.status,
          file
        ));
      }
    });

    return data;
  }
  
}