# Obsidian Deadlines

This is a plugin for [Obsidian](https://obsidian.md), created from their plugin template.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time! That means this plugin may break without warning.

## Using the plugin
### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

Alternatively, clone this repo into the same location as above, run `npm install`, then `npm run build`.

This plugin currently isn't available in the Obsidian menu. It's useable, but there are still some improvements to be made and things that need fixing. [See the 1.0 release plan](https://github.com/lizgw/obsidian-deadlines/projects/1).

## Setting up and using obsidian-deadlines
1. Open settings and go to the Deadlines section.
  - Choose a default folder for new deadline files, if you want. If you leave this blank, the plugin will use the default value for Obsidian.
  - Enter any groups that you would like to use. Put one group on each line, and if you would like to select a color for that group, put it in `[]`.
    Ex: `CS 4349 [#9f000f]` or `Final Project [green]`.
2. Create your first deadline using the `Deadlines: Create New Deadline` command. Fill in the name, deadline, and group, then click create. To cancel, click cancel or click out of the menu.
3. Open up the deadline view. You can use the command `Deadlines: Show Deadline View` or click the calendar icon in the left sidebar.
4. In deadline view:
  - Click a deadline to open its file. Here, you can edit the metadata or add more details.
  - Right-click a deadline to cycle its state from `todo` to `doing` and then from `doing` to `done`. Deadlines with the status `done` do not appear on the calendar.
  - Scroll to the bottom of the page and click the "Show More" button to load more weeks.
  - Hover over a day on the calendar and click the "+" button in the lower right corner to create a new deadline for that date.

## Frontmatter
The frontmatter for a deadline should look like this:
```yaml
---
name: read ch. 1
deadline: 2021-08-24
group: CS 4349
status: todo
---
```
Valid strings for the `status` property are `todo`, `doing`, and `done`.

Any file with the `deadline` property will be rendered in the deadline view, even if it is outside the default folder for new deadlines.

## Known Bugs
See [Issues](https://github.com/lizgw/obsidian-deadlines/issues).