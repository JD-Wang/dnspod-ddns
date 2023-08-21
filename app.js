const { task, repeatTask } = require("./src/index.js");
/**
 * 循环任务
 * 10分钟解析一次
 */
repeatTask(task, 1000 * 60 * 10);
