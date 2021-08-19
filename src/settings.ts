import DeadlinePlugin from "main";
import { Setting, App, PluginSettingTab } from "obsidian";

export interface DeadlinePluginSettings {
	deadlineFolder: string;
	groupList: string;
}

export const DEFAULT_SETTINGS: DeadlinePluginSettings = {
	deadlineFolder: "",
	groupList: ""
}

export class DeadlinePluginSettingTab extends PluginSettingTab {
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