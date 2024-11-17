#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import { backup_postgresDB } from './utils/postgres/pg_dumpProcess.js';
import { backup_mysqlDB } from './utils/mySql/mySql_dumpProcess.js';

let mySqlDump
let pgDump


const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
    const rainbowTitle = chalkAnimation.rainbow(
      `Welcome to Klynton's DB backup CLI tool \n`
    );
  
    await sleep();
    rainbowTitle.stop();
  
    console.log(`
        ${chalk.bgGreen('INSTRUCTIONS')} 
        ${chalk.bgRed('*')} Make sure you have the database of choice installed
        ${chalk.bgRed('*')} Run "which mysqldump/pg_dump" to get the file installation path 
        ${chalk.bgRed('*')} Copy the path that was returned from the above command, it'll be required later.
        ${chalk.bgRed('*')} You'll be prompted to provide your DB HOST, DB USERNAME, DB PASSWORD, DB NAME and DESTINATION FILE
        ${chalk.bgRed('*')} Please provide these details with a space seperating them

        ${chalk.bgRedBright('NOTE')}: If the database does not have a password please leave a space
    `);
}

async function question1() {
    const answers = await inquirer.prompt({
      name: 'question_1',
      type: 'list',
      message: 'Which database do you want to backup?',
      choices: [
        'PostgreSQL',
        'MySql',
      ],
    });
  
    if (answers.question_1 === 'PostgreSQL') {
        await req_pgDump();
        await backup_postgres();
    }else{
        await req_mySqlDump();
        await backup_mySql();
    }
}

async function req_mySqlDump(){
    const answers = await inquirer.prompt({
        name: 'dump_path',
        type: 'input',
        message: 'Please provide the path you got after running "which mysqldump"',
        default() {
          return 'Dump path';
        },
      });
    
      mySqlDump = answers.dump_path;
}

async function req_pgDump(){
    const answers = await inquirer.prompt({
        name: 'dump_path',
        type: 'input',
        message: 'Please provide the path you got after running "which pgdump"',
        default() {
          return 'Dump path';
        },
      });
    
      pgDump = answers.dump_path;
}

async function backup_postgres() {
    const prompt = inquirer.createPromptModule()
    prompt([{
        type: 'input',
        name: 'backUp',
        message: 'Please enter your DB host, username, password, name and destination file',
    }]).then((answers) => {
        const backup = answers.backUp
        const [host, username, password, db_name, dest_file] = backup.split(' ');
        backup_postgresDB(host, username, password, db_name, dest_file, pgDump)
    })
}

async function backup_mySql() {
    const prompt = inquirer.createPromptModule()
    prompt([{
        type: 'input',
        name: 'backUp',
        message: 'Please enter your DB host, username, password, name and destination file',
    }]).then((answers) => {
        const backup = answers.backUp
        const [host, username, password, db_name, dest_file] = backup.split(' ');
        backup_mysqlDB(host, username, password, db_name, dest_file, mySqlDump)
    })
}

export async function confirm_continue(){
    const answers = await inquirer.prompt({
        name: 'continue',
        type: 'list',
        message: 'Are you done or do u wish to continue?',
        choices: [
          `I'm done`,
          'I wish to continue',
        ],
    });
    if(answers.continue === `I'm done`){


        const rainbowTitle = chalkAnimation.rainbow(
            `Thanks for using Klynton's DB backup CLI tool \n`
          );
        
          await sleep();
          rainbowTitle.stop();
        process.exit(0);
    }else{
        await mainfunction();
    }
}


async function mainfunction(){
    console.clear();
    await welcome();
    await sleep();
    await question1();
}

await mainfunction();


