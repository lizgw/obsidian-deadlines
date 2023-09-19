import DeadlinePlugin from "main";
import {ItemView, WorkspaceLeaf} from "obsidian";
import Deadline from "Deadline";

export const VIEW_TYPE_DEADLINES = "deadline";

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

export class DeadlineView extends ItemView {
  plugin: DeadlinePlugin;
  numWeeks: number;
  deadlineData: Deadline[];
  containerElem: HTMLDivElement;
  dayContainer: HTMLDivElement;
  groupColorMap: Map<string, string>;

  constructor(leaf: WorkspaceLeaf, plugin: DeadlinePlugin) {
    super(leaf);
    this.plugin = plugin;
    this.numWeeks = 8;
    this.deadlineData = this.getDeadlineData()
      .sort((a, b) => { return a.compare(b); });

    this.containerElem = this.contentEl.createDiv();
    this.containerElem.setAttribute("id", "container");

    this.groupColorMap = new Map();
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
    // so monday appears in the monday column, etc.
    let startDate = this.addDays(today, (pos * -1));
    
    this.dayContainer = this.containerElem.createDiv();
    this.dayContainer.setAttribute("id", "calendar-container");
    this.dayContainer.append(this.createMonthBar(todayMonthStr, today.getFullYear()));
    this.dayContainer.append(this.createWeekBar());    
    this.createDayRows(this.numWeeks, startDate);
    this.buildGroupColorMap();
    this.renderDeadlines(startDate, this.addDays(startDate, (this.numWeeks * 7)));

    let moreBtn = this.containerElem.createEl("button", {
      text: "Show More",
      cls: "btn-show-more"
    });
    this.registerDomEvent(moreBtn, "click", () => {
      // get last day block
      let lastDay = <HTMLDivElement> this.dayContainer.lastChild.lastChild;
      let lastDate = this.createDateFromText(lastDay.getAttribute("id"));
      let startDate = this.addDays(lastDate, 1);

      const EXTRA_WEEKS = 4;
      this.numWeeks += EXTRA_WEEKS;
      this.createDayRows(EXTRA_WEEKS, startDate);
      this.renderDeadlines(startDate, this.addDays(startDate, EXTRA_WEEKS * 7));
    });
  }

  buildGroupColorMap() {
    let groups = this.plugin.settings.groupList.split("\n");
    groups.forEach(group => {
      let gName = this.plugin.getGroupName(group);
      let gColor = this.plugin.getGroupColor(group);
      this.groupColorMap.set(gName, gColor);
    });
  }

  createDayRows(numRows: number, startDate: Date) {
    // create a row of dates
    let offset = 0;
    let lastDate = startDate;
    for (let i = 0; i < numRows; i++) {
      // check if we need to add a new month bar
      let weekLater = this.addDays(lastDate, 7);
      // if the last day is a monday
      // (this happens when using the show more button)
      if (lastDate.getDay() == 1) {
        weekLater = this.addDays(lastDate, 6);
      }
      // don't do this at the beginning of day creation
      if (weekLater.getDate() < lastDate.getDate()) {
        let newMonthName = weekLater.toLocaleString("default", {month: "long"});
        this.dayContainer.append(this.createMonthBar(newMonthName, weekLater.getFullYear()));
      }

      // create a div to hold the week
      let weekContainer = this.dayContainer.createDiv({
        cls: "calendar-week-row"
      });

      // create each day in the row
      for (let j = 0; j < 7; j++) {
        let newDate = this.addDays(startDate, offset);
        weekContainer.append(this.createDayBlock(newDate));
        lastDate = newDate;
        offset++;
      }
    }
  }

  renderDeadlines(startDate: Date, endDate: Date) {
    this.deadlineData.forEach(dl => {
      // skip dates before & after the designated period
      // only render dates that aren't "done"
      if (dl.compareDate(startDate) >= 0 && dl.compareDate(endDate) <= 0) {
        this.renderSingleDeadline(dl);
      }
    });
  }

  renderSingleDeadline(dl: Deadline) {
    if (dl.status != "done") {
      // find the block to add it to
      let dateStr = this.dateToFormatString(dl.date);
      // console.log(dateStr + "for date " + dl.date.toUTCString());
      let block = document.getElementById(dateStr);
      this.createDeadlineBlock(dl, block);
    }
  }

  getDisplayText() {
    return "Deadlines";
  }

  getViewType() {
    return VIEW_TYPE_DEADLINES;
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
      this.plugin.createDeadlineModal(this.dateToFormatString(date));
    })

    return block;
  }

  // this builds an ISO-like string in local time!
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

    // set the color based on the group
    if (this.groupColorMap.has(deadline.group)) {
      let groupBlock = <HTMLParagraphElement> deadlineElem.children[1];
      // need to convert to alpha to have a semi-transparent background color
      let hex = this.groupColorMap.get(deadline.group);
      const ALPHA = 0.4;
      // thanks https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
      var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
      let colorStr = "rgba(" + r + ", " + g + ", " + b + ", " + ALPHA + ")";
      groupBlock.style.backgroundColor = colorStr;
    }

    // add some styling if it's in the "doing" state
    let metadata = this.app.metadataCache.getFileCache(deadline.note);
    if (metadata && metadata.frontmatter && metadata.frontmatter.status == "doing") {
      deadlineElem.addClass("calendar-deadline-doing");
    }

    // click to open the file
    this.registerDomEvent(deadlineElem, "click", async () => {
      let newLeaf = this.app.workspace.splitActiveLeaf("horizontal");
      await newLeaf.openFile(deadline.note);
    });
    // right click to cycle through doing -> done
    this.registerDomEvent(deadlineElem, "contextmenu", async () => {
      let noteFile = deadline.note;
      let noteContent = await this.app.vault.read(noteFile);
      let noteLines = noteContent.split("\n");

      // TODO: actually figure out which line contains the status property
      let statusLine = 4;
      let currentStatus = noteLines[statusLine].substring(8);

      if (currentStatus == "todo") {
        // change to doing
        deadlineElem.addClass("calendar-deadline-doing");
        noteLines.splice(statusLine, 1, "status: doing");
      } else if (currentStatus == "doing") {
        // instantly hide it from view
        deadlineElem.style.display = "none";
        noteLines.splice(statusLine, 1, "status: done");
      }

      this.app.vault.modify(noteFile, noteLines.join("\n"));
    })
    if (calBlock == null) {
      console.error("null day block for " + deadline.date);
    } else {
      calBlock.append(deadlineElem);
    }
  }

  addDays(date: Date, days: number) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // used to handle timezones vs. utc for creating a date from a string
  createDateFromText(text: string) {
    // we have to copy the date to a new object here
    // reading the date from the file creates a new date on that day at 00:00 UTC
    // which can become a different day in local time
    // so we need to make a day based on now in local time
    // and then copy the date data over from the date in the frontmatter
    // dates are weird and this sucks
    let utcDate = new Date(text);
    let localDate = new Date();
    localDate.setFullYear(utcDate.getUTCFullYear());
    localDate.setMonth(utcDate.getUTCMonth(), utcDate.getUTCDate());
    return localDate;
  }

  getDeadlineData() {
    let data = <Deadline[]> [];

    let files = this.app.vault.getMarkdownFiles();

    files.forEach(file => {
      let cacheInfo = this.app.metadataCache.getFileCache(file);
      // only process files with a deadline in the frontmatter
      if (cacheInfo.frontmatter && cacheInfo.frontmatter.deadline != undefined) {
        data.push(new Deadline(
          cacheInfo.frontmatter.name,
          this.createDateFromText(cacheInfo.frontmatter.deadline),
          cacheInfo.frontmatter.group,
          cacheInfo.frontmatter.status,
          file
        ));
      }
    });

    return data;
  }
  
}