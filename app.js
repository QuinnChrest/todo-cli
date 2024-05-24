#!/usr/bin/env node

const App = (() => {
  const cli = require("commander");
  const blessed = require("blessed");
  const path = require("path");
  const fs = require("fs-extra");
  const TODO_FILE = path.join(__dirname, "todo_list.json");

  let screen;
  let program = blessed.program();

  let header, footer, tasks, list, listContent, addBox, form;

  const getTasks = () => {
    if (tasks) {
      return tasks;
    } else {
      tasks = loadTasks();
      return tasks;
    }
  };

  const loadTasks = () => {
    if (!fs.existsSync(TODO_FILE)) return [];
    const tasks = fs.readJSONSync(TODO_FILE);
    return tasks;
  };

  const saveTasks = (tasks) => {
    fs.writeJSONSync(TODO_FILE, tasks, { spaces: 2 });
  };

  const add = (task) => {
    let maxIndex = 0;
    for (let task of tasks) {
      maxIndex = Math.max(maxIndex, task.id);
    }

    tasks.push({ id: maxIndex + 1, task, done: false });
    saveTasks(tasks);
  };

  const markComplete = (id) => {
    for (let task of tasks) {
      if (task.id == id) {
        task.done = true;
        saveTasks(tasks);
        break;
      }
    }
  };

  const showAddPopup = () => {
    addBox = blessed.box({
      parent: screen,
      top: "center",
      left: "center",
      height: "50%",
      width: "50%",
      bg: "black",
      border: {
        type: "line",
        fg: "white",
      },
    });

    blessed.box({
      parent: addBox,
      content: "\tAdd Task",
      top: "top",
      height: 1,
      bg: "white",
      fg: "black",
    });

    form = blessed.form({
      parent: addBox,
      name: "form",
      top: 1,
      left: 0,
      width: "100%-2",
      height: "100%-4",
    });

    let input = blessed.textarea({
      parent: form,
      top: 1,
      left: 1,
      width: "100%-2",
      height: "100%-2",
      input: true,
      keys: true,
      mouse: true,
      vi: true,
      inputOnFocus: true,
      fg: "white",
    });
    input.focus();
    input.readInput();

    blessed.box({
      parent: addBox,
      content:
        "\t{black-fg}Enter : {/black-fg}{blue-fg}Add Task{/blue-fg}\t{black-fg}|{/black-fg}\t{black-fg}Esc : {/black-fg}{blue-fg}Cancel{/blue-fg}",
      top: "100%-3",
      height: 1,
      bg: "white",
      fg: "black",
      tags: true,
    });

    form.on("submit", (data) => {
      add(data.textarea);
      header.focus();
    });

    input.on("keypress", (ch, key) => {
      if (key.name === "escape") {
        screen.remove(addBox);
        screen.render();
      } else if (key.name === "enter") {
        screen.remove(addBox);
        form.submit();
        screen.render();
      }
    });

    screen.render();
  };

  const drawHeader = () => {
    if (header) {
      screen.remove(header);
    }
    header = blessed.box({
      parent: screen,
      width: "100%",
      height: 1,
      top: "top",
      tags: true,
      bg: "white",
    });
    header.setContent("\t{black-fg}To Do{/black-fg}");
  };

  const drawList = (tasks) => {
    if (list) {
      screen.remove(list);
    }
    list = blessed.box({
      parent: screen,
      top: 1,
      height: program.rows - 2,
      tags: true,
      bg: "black",
      border: {
        type: "line",
        fg: "white",
      },
    });

    listContent = blessed.list({
      parent: list,
      keys: true,
      vi: true,
      style: {
        selected: {
          bg: "white",
          fg: "black",
        },
      },
      items: tasks.map((task) => task.task),
    });
    listContent.select(0);
    listContent.focus();
  };

  const drawFooter = () => {
    if (footer) {
      screen.remove(footer);
    }

    const commands = {
      a: "Add Task",
      d: "Mark Complete",
      w: "Up",
      s: "Down",
      "-": "Remove",
      Esc: "Exit",
    };

    let text = "";
    let index = 0;
    for (const c in commands) {
      text += `\t{black-fg}${c} : {/black-fg}{blue-fg}${commands[c]}{/blue-fg}${
        index != 5 ? "\t{black-fg}|{/black-fg}" : ""
      }`;
      index++;
    }

    footer = blessed.box({
      parent: screen,
      width: "100%",
      top: program.rows - 1,
      tags: true,
      bg: "white",
      content: text,
    });
  };

  return {
    init() {
      screen = blessed.screen();
      screen.on("keypress", (ch, key) => {
        if (screen.children.includes(addBox)) {
          if (key.name === "escape") {
            screen.remove(addBox);
            screen.render();
          } else if (key.name === "enter") {
            screen.remove(addBox);
            form.submit();
            screen.render();
          }
        } else {
          if (
            key.name === "escape" ||
            (key.name === "c" && key.ctrl === true)
          ) {
            return process.exit(0);
          } else if (key.name === "a") {
            showAddPopup();
          } else if (key.name === "w") {
            listContent.up(1);
            screen.render();
          } else if (key.name === "s") {
            listContent.down(1);
            screen.render();
          }
        }
      });

      drawHeader();
      drawList(getTasks());
      drawFooter();
      screen.render();

      screen.on("resize", () => {
        drawHeader();
        drawFooter();
        screen.render();
      });
    },
  };
})();

App.init();
