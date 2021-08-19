import { TFile } from "obsidian";

export default class Deadline {
  date: Date;
  name: string;
  group: string;
  status: string;
  note: TFile;

  constructor(name: string, date: Date, group: string, status: string, note: TFile) {
    this.name = name;
    this.date = date;
    this.group = group;
    this.status = status;
    this.note = note;
  }

  compare(other: Deadline) {
    if (this.date < other.date) {
      return -1;
    } else if (this.date == other.date) {
      return 0;
    } else {
      return 1;
    }
  }

  createElement() {
    let el = document.createElement("div");
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