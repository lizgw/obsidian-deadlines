import { group } from 'console';
import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "create-deadline",
			name: "Create Deadline",
			callback: () => {
				console.log("yeet");
				new DeadlineCreationModel(this.app).open();
			}
		});

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
}

class DeadlineCreationModel extends Modal {
	constructor(app: App) {
		super(app);
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
		console.log("today is " + todayString);
		dateField.setAttribute("value", todayString);

		const groupLabel = leftDiv.appendChild(document.createElement("label"));
		groupLabel.setAttribute("for", "deadline-group");
		groupLabel.innerText = "Group: ";
		const groupField = rightDiv.appendChild(document.createElement("select"));
		groupField.setAttribute("id", "deadline-group");
		groupField.setAttribute("class", "dropdown");
		// TODO: load groups from settings
		const groups = ["", "CS 4349", "CS 3354", "PSY 2301"];
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
		let {contentEl} = this;

		let titleField = <HTMLInputElement> document.getElementById("deadline-title");
		let dateField = <HTMLInputElement> document.getElementById("deadline-date");
		let groupField = <HTMLSelectElement> document.getElementById("deadline-group");
		
		console.log(titleField.value, dateField.value, groupField.value);

		contentEl.empty();
		// TODO: get rid of event listeners
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
