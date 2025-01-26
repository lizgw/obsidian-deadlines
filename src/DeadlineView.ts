import DeadlinePlugin from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
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
  currentDragDeadline: Deadline;

  constructor(leaf: WorkspaceLeaf, plugin: DeadlinePlugin) {
    super(leaf);
    this.plugin = plugin;
    this.numWeeks = 8;
    this.deadlineData = this.getDeadlineData()
      .sort((a, b) => { return a.compare(b); });

    this.containerElem = this.contentEl.createDiv();
    this.containerElem.setAttribute("id", "container");

    this.groupColorMap = new Map();

    this.currentDragDeadline = null;
  }

  async onOpen() {
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
      let lastDate = this.plugin.createDateFromText(lastDay.getAttribute("id"));
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
      let dateStr = this.plugin.dateToFormatString(dl.date);
      let containerElem = this.containerElem.getElementsByTagName("div").namedItem("calendar-container");
      let block = containerElem.getElementsByTagName("div").namedItem(dateStr);
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
    block.setAttribute("id", this.plugin.dateToFormatString(date));

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

    // make it droppable
    this.registerDomEvent(block, "drop", async (ev: DragEvent) => {
      // move the element here when it's dropped
      const elemId = ev.dataTransfer.getData("application/deadline-id");
      const deadlineElem = document.getElementById(elemId);
      block.appendChild(deadlineElem);
      const targetDate = (<Element> ev.target).getAttribute("id");

      // update date in deadline file
      let noteFile = this.currentDragDeadline.note;
      this.app.vault.process(noteFile, (data: string) => {
        const endFrontmatter = data.indexOf("---", 3) + 3;
        const noteContents = data.substring(endFrontmatter);
        const frontmatter = data.substring(0, endFrontmatter).split("\n");
        // replace the deadline in the frontmatter
        for (let i = 0; i < frontmatter.length; i++) {
          const line = frontmatter[i];
          if (line.indexOf("deadline") == 0) {
            frontmatter[i] = "deadline: " + targetDate;
          }
        }
        // set note contents to new frontmatter and original contents
        return frontmatter.join("\n") + noteContents;
      });
      this.currentDragDeadline = null;
    });
    // in order to allow drop, must prevent default for dragover and dragenter
    function allowDeadlines(ev: DragEvent) {
      // make sure that only deadlines are being dropped here
      if (ev.dataTransfer.types.includes("application/deadline-id")) {
        ev.preventDefault();
      }
    }
    this.registerDomEvent(block, "dragover", allowDeadlines);
    this.registerDomEvent(block, "dragenter", allowDeadlines);

    return block;
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

    // make it draggable
    deadlineElem.setAttribute("draggable", "true");
    this.registerDomEvent(deadlineElem, "dragstart", (ev: DragEvent) => {
      ev.dataTransfer.dropEffect = "move";
      // using a custom type here so only deadlines can be dragged, not other UI elems
      ev.dataTransfer.setData("application/deadline-id", deadlineElem.id);
      this.currentDragDeadline = deadline;
    });
    this.registerDomEvent(deadlineElem, "dragend", (ev: DragEvent) => {
      // using appendChild in the drop event moves the element automatically
      // so nothing really has to happen here visually
      // https://html.spec.whatwg.org/multipage/dnd.html#the-drag-data-store
      // can't access data here either to do file move
    });

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

  getDeadlineData() {
    let data = <Deadline[]> [];

    let files = this.app.vault.getMarkdownFiles();

    files.forEach(file => {
      let cacheInfo = this.app.metadataCache.getFileCache(file);
      // only process files with a deadline in the frontmatter
      if (cacheInfo.frontmatter && cacheInfo.frontmatter.deadline != undefined) {
        data.push(new Deadline(
          cacheInfo.frontmatter.name,
          this.plugin.createDateFromText(cacheInfo.frontmatter.deadline),
          cacheInfo.frontmatter.group,
          cacheInfo.frontmatter.status,
          file
        ));
      }
    });

    console.log("[Obsidian Deadlines] Found " + data.length + " files with deadlines");

    return data;
  }
  
}