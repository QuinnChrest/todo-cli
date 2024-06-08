#!/usr/bin/env node

const App = (() => {
  const blessed = require("blessed");
  const path = require("path");
  const fs = require("fs-extra");
  const TODO_FILE = path.join(__dirname, "todo.json");

  let screen;
  let program = blessed.program();

  let title, footer, tasks, list, listContent, addBox, form;

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

  const saveTasks = (tasks, selected) => {
    fs.writeJSONSync(TODO_FILE, tasks, { spaces: 2 });
    listContent.setItems(
      tasks.map((task) => `${task.done ? "\u2612" : "\u2610"}\t${task.task}`)
    );
    listContent.select(selected);
    screen.render();
  };

  const add = (task) => {
    tasks.push({ task, done: false });
    saveTasks(tasks, tasks.length - 1);
  };

  const markComplete = () => {
    tasks[listContent.selected].done = !tasks[listContent.selected].done;
    saveTasks(tasks, listContent.selected);
  };

  const removeTask = () => {
    tasks.splice(listContent.selected, 1);
    let selected = listContent.selected - 1;
    saveTasks(tasks, selected < 0 ? 0 : selected);
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
      list.focus();
    });

    input.on("keypress", (ch, key) => {
      if (key.name === "escape") {
        screen.remove(addBox);
        screen.render();
      } else if (key.name === "enter") {
        screen.remove(addBox);
        form.submit();
      }
    });

    screen.render();
  };

  const drawList = (tasks) => {
    if (list) {
      screen.remove(list);
    }

    list = blessed.box({
      parent: screen,
      top: 0,
      height: program.rows - 1,
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
      items: tasks.map(
        (task) => `${task.done ? "\u2612" : "\u2610"}\t${task.task}`
      ),
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
      c: "Mark Complete",
      r: "Remove",
      Esc: "Exit",
    };

    let text = "";
    let index = 0;
    for (const c in commands) {
      text += `\t{black-fg}${c} : {/black-fg}{blue-fg}${commands[c]}{/blue-fg}${
        index != 3 ? "\t{black-fg}|{/black-fg}" : ""
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
          } else if (key.name === "r") {
            removeTask();
          } else if (key.name === "c") {
            markComplete();
          }
        }
      });

      screen.on("resize", () => {
        drawHeader();
        drawFooter();
        screen.render();
      });

      const asciiArt = `
  _____       ____        
 |_   _|__   |  _ \\  ___  
   | |/ _ \\  | | | |/ _ \\ 
   | | (_) | | |_| | (_) |
   |_|\\___/  |____/ \\___/ 
                          
`;

      title = blessed.box({
        parent: screen,
        content: asciiArt,
        top: "center",
        left: "center",
        width: "100%",
        height: "100%",
        align: "center",
        valign: "middle",
      });
      screen.render();

      setTimeout(() => {
        screen.remove(title);
        drawList(getTasks());
        drawFooter();
        screen.render();
      }, 2000);
    },
  };
})();

App.init();
