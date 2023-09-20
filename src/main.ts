import { Modal, Plugin} from 'obsidian';
import {DeadlineView, VIEW_TYPE_DEADLINES} from './DeadlineView';
import DeadlineCreationModal from 'DeadlineCreationModal';
import Deadline from 'Deadline';
import {DeadlinePluginSettings, DeadlinePluginSettingTab, DEFAULT_SETTINGS} from './settings';

export default class DeadlinePlugin extends Plugin {
	settings: DeadlinePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new DeadlinePluginSettingTab(this.app, this));

		this.registerView(VIEW_TYPE_DEADLINES, (leaf) => new DeadlineView(leaf, this));

		this.addRibbonIcon("calendar-with-checkmark", "Deadline View", () => {
			this.openDeadlineView();
		});

		this.addCommand({
			id: "create-deadline",
			name: "Create New Deadline",
			callback: () => {
				this.createDeadlineModal();
			}
		});

		this.addCommand({
			id: "show-deadlines",
			name: "Show Deadline View",
			callback: () => {
				this.openDeadlineView();
			}
		});		
	}

	createDeadlineModal(date?: Date) {
		const modal = new DeadlineCreationModal(this.app, this, this.dateToFormatString(date));
		modal.open();
		const createBtn = document.getElementById("btn-create-deadline");
		const cancelBtn = document.getElementById("btn-cancel-new-deadline");
		this.registerDomEvent(createBtn, "click", () => {
			this.createNewDeadline(modal);
		});
		this.registerDomEvent(cancelBtn, "click", () => {
			modal.close();
		});
	}

	async openDeadlineView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DEADLINES);

		await this.app.workspace.getLeaf('tab').setViewState({
			type: VIEW_TYPE_DEADLINES,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_DEADLINES)[0]
		);
	}

	async onunload() {
		// console.log('unloading plugin');
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DEADLINES);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getGroupName(groupText: string) {
		let end = groupText.indexOf("[");
		return groupText.substring(0, end - 1);
	}

	getGroupColor(groupText: string) {
		let start = groupText.indexOf("[");
		let end = groupText.indexOf("]");
		return groupText.substring(start + 1, end);
	}

	async createNewDeadline(modal: Modal) {
		let deadlineTitle = (<HTMLInputElement> document.getElementById("deadline-title")).value;
		let deadlineDate = (<HTMLInputElement> document.getElementById("deadline-date")).value;
		let deadlineGroupText = (<HTMLSelectElement> document.getElementById("deadline-group")).value;
		let deadlineGroup = this.getGroupName(deadlineGroupText);
		let deadlineColor = this.getGroupColor(deadlineGroupText);

		let deadlineFilename = `${deadlineDate} ${deadlineGroup} ${deadlineTitle}`;

		let frontMatter = "---\n" + 
			"name: " + deadlineTitle +
			"\ndeadline: " + deadlineDate +
			"\ngroup: " + deadlineGroup + 
			"\nstatus: todo\n---";

		// get default new note folder from settings
		// use the Obsidian default
		let folder = this.app.fileManager.getNewFileParent(this.settings.deadlineFolder);
		if (this.settings.deadlineFolder != "") {
			// use the path in Deadlines settings
			// TODO: this code is causes weird behavior with subfolders
			folder.path = this.settings.deadlineFolder;
			folder.name = this.settings.deadlineFolder;
		}

		try {
			// the createNewMarkdownFile function exists, even if it's not in the ts files
			// (got this from the code for obsidian-kanban)
			// @ts-ignore
			const deadlineFile = await this.app.fileManager.createNewMarkdownFile(
				folder,
				deadlineFilename
			);
			// write the frontmatter to the file
			await this.app.vault.modify(deadlineFile, frontMatter);

			// update open deadline views with new deadline
			let deadlineLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DEADLINES);
			deadlineLeaves.forEach(leaf => {
				let view = <DeadlineView> leaf.view;
				let date = this.createDateFromText(deadlineDate);
				view.renderSingleDeadline(new Deadline(
					deadlineTitle,
					date,
					deadlineGroup,
					"todo",
					deadlineFile
				));
			});
			// we don't have to worry about adding it to the deadline list
			// because it'll get updated next time the view opens
		} catch (err) {
			console.error("error creating file", err);
		}

		// now close
		modal.close();
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
}