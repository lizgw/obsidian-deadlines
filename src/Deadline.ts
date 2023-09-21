import { TFile } from "obsidian";

export default class Deadline {
  date: Date;
  name: string;
  group: string;
  status: string;
  note: TFile;
  uuid: string;

  constructor(name: string, date: Date, group: string, status: string, note: TFile) {
    this.name = name;
    this.date = date;
    this.group = group;
    this.status = status;
    this.note = note;
    // use a random uuid to help track the element for drag and drop
    this.uuid = crypto.randomUUID();
  }

  compare(other: Deadline) {
    return this.compareDate(other.date);
  }

  // compare based only on day, not on time within that day
  compareDate(other: Date) {
    var earlierYear = this.date.getFullYear() < other.getFullYear();
    var sameYear = this.date.getFullYear() == other.getFullYear();
    var earlierMonth = this.date.getMonth() < other.getMonth();
    var sameMonth = this.date.getMonth() == other.getMonth();
    var earlierDay = this.date.getDate() < other.getDate();
    var sameDay = this.date.getDate() == other.getDate();

    if (earlierYear ||
       (sameYear && earlierMonth) ||
       (sameYear && sameMonth && earlierDay))
    {
      return -1;
    } else if (sameYear && sameMonth && sameDay) {
      return 0;
    } else {
      return 1;
    }
  }

  createElement() {
    let el = document.createElement("div");
    el.setAttribute("id", this.uuid);
    el.addClass("calendar-deadline");
    el.createEl("p", {
      text: this.name,
      cls: "calendar-deadline-name"
    });
    el.createEl("p", {
      text: this.group,
      cls: "calendar-deadline-group"
    });
    return el;
  }
}