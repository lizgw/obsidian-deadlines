import DeadlinePlugin from "main";
import { App, Modal } from "obsidian";
import { DeadlinePluginSettings } from "settings";

export default class DeadlineCreationModal extends Modal {
	settings: DeadlinePluginSettings;
	plugin: DeadlinePlugin;
	defaultDate: string;

	constructor(app: App, plugin: DeadlinePlugin, defaultDate?: string) {
		super(app);

		this.plugin = plugin;
		this.settings = this.plugin.settings;
		this.defaultDate = defaultDate;
	}

	onOpen() {
		let {contentEl} = this;
		
		const wrapper = document.createElement("div");
		wrapper.setAttribute("class", "deadline-modal-wrapper");

		const title = contentEl.appendChild(document.createElement("h1"));
		title.innerText = "Create New Deadline";

		const leftDiv = wrapper.appendChild(document.createElement("div"));
		leftDiv.setAttribute("class", "deadline-modal-wrapper-left");

		const rightDiv = wrapper.appendChild(document.createElement("div"));
		rightDiv.setAttribute("class", "deadline-modal-wrapper-right");

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
		// set default value to today or whatever was passed in
		let today = this.defaultDate;
		if (today == undefined) {
			let date = new Date();
			let month = date.getMonth() + 1;
			let year = date.getFullYear();
			let day = date.getDate();

			today = `${year}-`;
			if (month < 10) {
			today += "0";
			}
			today += month + "-";
			if (day < 10) {
			today += "0";
			}
			today += day;
		}
		dateField.setAttribute("value", today);

		const groupLabel = leftDiv.appendChild(document.createElement("label"));
		groupLabel.setAttribute("for", "deadline-group");
		groupLabel.innerText = "Group: ";
		const groupField = rightDiv.appendChild(document.createElement("select"));
		groupField.setAttribute("id", "deadline-group");
		groupField.setAttribute("class", "dropdown");
		// load groups from settings
		const groups = [""].concat(this.settings.groupList.split("\n"));
		groups.forEach(groupText => {
			let opt = groupField.appendChild(document.createElement("option"));
			let groupName = this.plugin.getGroupName(groupText);
			opt.setAttribute("value", groupText);
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
