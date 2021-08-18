import { App, Modal, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

interface DeadlinePluginSettings {
	deadlineFolder: string;
	groupList: string;
}

const DEFAULT_SETTINGS: DeadlinePluginSettings = {
	deadlineFolder: "",
	groupList: ""
}

export default class DeadlinePlugin extends Plugin {
	settings: DeadlinePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "create-deadline",
			name: "Create New Deadline",
			callback: () => {
				const modal = new DeadlineCreationModal(this.app, this.settings);
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
		});

		this.addSettingTab(new DeadlinePluginSettingTab(this.app, this));
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
			// this code is probably bad but it at least kind of works
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

class DeadlineCreationModal extends Modal {
	settings: DeadlinePluginSettings;

	constructor(app: App, settings: DeadlinePluginSettings) {
		super(app);

		this.settings = settings;
	}

	onOpen() {
		let {contentEl} = this;
		
		const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");

    const title = contentEl.appendChild(document.createElement("h1"));
    title.innerText = "Create New Deadline";

		const leftDiv = wrapper.appendChild(document.createElement("div"));
		leftDiv.setAttribute("class", "wrapper-left");

		const rightDiv = wrapper.appendChild(document.createElement("div"));
		rightDiv.setAttribute("class", "wrapper-right");

		const titleLabel = leftDiv.appendChild(document.createElement("label"));
		titleLabel.setAttribute("for", "deadline-title");
		titleLabel.innerText = "Title: ";
		const titleField = rightDiv.appendChild(document.createElement("input"));
		titleField.setAttribute("id", "deadline-title");
		titleField.setAttribute("type", "text");

		const dateLabel = leftDiv.appendChild(document.createElement("label"));
		dateLabel.setAttribute("for", "deadline-date");
		dateLabel.innerText = "Deadline: ";
		const dateField = rightDiv.appendChild(document.createElement("input"));
		dateField.setAttribute("type", "date");
		dateField.setAttribute("id", "deadline-date");
		// set default value to today
		const today = new Date();
		const todayString = today.toISOString().substring(0, 10);
		dateField.setAttribute("value", todayString);

		const groupLabel = leftDiv.appendChild(document.createElement("label"));
		groupLabel.setAttribute("for", "deadline-group");
		groupLabel.innerText = "Group: ";
		const groupField = rightDiv.appendChild(document.createElement("select"));
		groupField.setAttribute("id", "deadline-group");
		groupField.setAttribute("class", "dropdown");
		// load groups from settings
		const groups = [""].concat(this.settings.groupList.split("\n"));
		groups.forEach(groupName => {
			let opt = groupField.appendChild(document.createElement("option"));
			opt.setAttribute("value", groupName);
			opt.innerText = groupName;
		});

		contentEl.appendChild(wrapper);

		const cancelBtn = contentEl.appendChild(document.createElement("button"));
		cancelBtn.innerText = "Cancel";
		cancelBtn.setAttribute("id", "btn-cancel-new-deadline");

		const createBtn = contentEl.appendChild(document.createElement("button"));
		createBtn.innerText = "Create";
		createBtn.setAttribute("id", "btn-create-deadline");
		createBtn.setAttribute("class", "mod-cta");
	}

	onClose() {
		// let {contentEl} = this;
	}
}


class DeadlinePluginSettingTab extends PluginSettingTab {
	plugin: DeadlinePlugin;

	constructor(app: App, plugin: DeadlinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Deadlines"
		});

		new Setting(containerEl)
			.setName("Deadline Note Folder")
			.setDesc("The default folder for new deadlines. Leave blank to use the Obsidian default.")
			.addText(text => text
				.setPlaceholder("")
				.setValue(this.plugin.settings.deadlineFolder)
				.onChange(async (value) => {
					this.plugin.settings.deadlineFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Groups")
			.setDesc("Newline-separated list of groups to use")
			.addTextArea(text => text
				.setValue(this.plugin.settings.groupList)
				.onChange(async (value) => {
					this.plugin.settings.groupList = value;
					await this.plugin.saveSettings();
				}))
	}
}
