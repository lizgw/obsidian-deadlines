import { Modal, Plugin} from 'obsidian';
import DeadlineView from './DeadlineView';
import DeadlineCreationModal from 'DeadlineCreationModal';
import {DeadlinePluginSettings, DeadlinePluginSettingTab, DEFAULT_SETTINGS} from './settings';

export default class DeadlinePlugin extends Plugin {
	settings: DeadlinePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new DeadlinePluginSettingTab(this.app, this));

		this.registerView("deadline", (leaf) => new DeadlineView(leaf, this));

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
		const modal = new DeadlineCreationModal(this.app, this.settings, date);
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
		const leaf = this.app.workspace.getLeaf(false);
		const deadlineView = new DeadlineView(leaf, this);
		await this.app.workspace.activeLeaf.open(deadlineView);
	}

	onunload() {
		// console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createNewDeadline(modal: Modal) {
		let deadlineTitle = (<HTMLInputElement> document.getElementById("deadline-title")).value;
		let deadlineDate = (<HTMLInputElement> document.getElementById("deadline-date")).value;
		let deadlineGroup = (<HTMLSelectElement> document.getElementById("deadline-group")).value;

		let frontMatter = "---\n" + 
			"deadline: " + deadlineDate +
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
			// the createNewMarkdownFile function exists(, even if it's not in the ts files
			// (got this from the code for obsidian-kanban)
			// @ts-ignore
			const deadlineFile = await this.app.fileManager.createNewMarkdownFile(
        folder,
        deadlineTitle
      );
			// write the frontmatter to the file
			await this.app.vault.modify(deadlineFile, frontMatter);
		} catch (err) {
			console.error("error creating file");
		}
		
		// now close
		modal.close();
	}
}