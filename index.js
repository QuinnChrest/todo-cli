#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const blessed = require("blessed");

const program = new Command();
const TODO_FILE = path.join(__dirname, "todo_list.json");

const loadTasks = () => {
  if (!fs.existsSync(TODO_FILE)) return [];
  const tasks = fs.readJSONSync(TODO_FILE);
  return tasks;
};

const saveTasks = (tasks) => {
  fs.writeJSONSync(TODO_FILE, tasks, { spaces: 2 });
};

program
  .name("todo")
  .description("A simple CLI todo list application")
  .version("1.0.0");

program
  .command("add <task>")
  .description("Add a new task")
  .action((task) => {
    const tasks = loadTasks();
    tasks.push({ task, done: false });
    saveTasks(tasks);
    console.log(chalk.green("Added task:"), task);
  });

program
  .command("list")
  .description("List all tasks")
  .action(() => {
    const tasks = loadTasks();
    if (tasks.length === 0) {
      console.log(chalk.yellow("No tasks found."));
      return;
    }
    tasks.forEach((t, i) => {
      const status = t.done ? chalk.green("done") : chalk.red("not done");
      console.log(`${i + 1}. ${t.task} [${status}]`);
    });
  });

program
  .command("done <taskNumber>")
  .description("Mark a task as done")
  .action((taskNumber) => {
    const tasks = loadTasks();
    const index = parseInt(taskNumber, 10) - 1;
    if (index < 0 || index >= tasks.length) {
      console.log(chalk.red("Invalid task number."));
      return;
    }
    tasks[index].done = true;
    saveTasks(tasks);
    console.log(chalk.green(`Marked task ${taskNumber} as done.`));
  });

program.parse(process.argv);
