// TODO:
// handle errors better
// change drive
// go to home directcory

'use strict';

import { window, workspace, FileType } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { ContextType } from './extension';

const writeFile = util.promisify(fs.writeFile);
const lstat = util.promisify(fs.lstat);
const readdir = util.promisify(fs.readdir);

const icons = {
    [FileType.File]: '$(file)',
    [FileType.Directory]: '$(file-directory)',
    [FileType.SymbolicLink]: '$(file-symlink-file)',
    [FileType.Unknown]: '$(file)'
};

export type FileData = {
    label: string;
    name: string;
    path: string;
    isFile: boolean;
    isDirectory: boolean;
};

function getFileType(stat: fs.Stats): FileType {
    if (stat.isFile()) {
        return FileType.File;
    } else if (stat.isDirectory()) {
        return FileType.Directory;
    } else if (stat.isSymbolicLink()) {
        return FileType.SymbolicLink;
    } else {
        return FileType.Unknown;
    }
}

async function getFileList(dir?: string): Promise<FileData[] | undefined> {
    if (!dir) {
        return;
    }

    const stats = await lstat(dir);

    if (!stats.isDirectory()) {
        return;
    }

    const results = await readdir(dir);

    const files = results.reduce<FileData[]>((arr, file) => {
        try {
            const fullPath: string = path.join(dir, file);
            const stats = fs.lstatSync(fullPath);
            const isFile = stats.isFile();
            const isDirectory = stats.isDirectory();

            if (isFile || isDirectory) {
                arr.push({
                    label: `${icons[getFileType(stats)]} ${file}`,
                    name: file,
                    path: fullPath,
                    isFile,
                    isDirectory
                });
            }
        } catch (err) {}

        return arr;
    }, []);

    const sortedFiles = files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (b.isDirectory && !a.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });

    const filesWithCommands = [
        {
            label: '$(file-directory) ..',
            name: '..',
            path: path.join(dir, '..'),
            isFile: false,
            isDirectory: true
        }
    ].concat(sortedFiles);

    return filesWithCommands;
}

async function createNewFileAndOpen(filePath: string, baseDir: string) {
    const newPath = path.join(baseDir, filePath);
    ensureDirectoryExistence(newPath);
    await writeFile(newPath, '');
    openFile(newPath);
}


function ensureDirectoryExistence(filePath: string) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

async function openFile(filePath: string) {
    const doc = await workspace.openTextDocument(filePath);
    window.showTextDocument(doc);
}

export function goUpDirectory(context: ContextType) {
    changeToDirectory(context, path.join(context.cwd, '..'));
}

export function selectItem(context: ContextType) {
    if (!context.input) {
        return;
    }
    const items =
        context.input.selectedItems.length > 0
            ? context.input.selectedItems
            : context.input.activeItems;

    if (!items.length) {
        return;
    }

    const file = items[0];
    if (file.isDirectory) {
        changeToDirectory(context, file.path);
    } else if (file.isFile) {
        openFile(file.path);
    }
}

export async function changeToDirectory(context: ContextType, dir: string) {
    if (!context.input) {
        return;
    }

    context.input.value = '';
    context.input.title = dir;
    context.cwd = dir;

    const items = await getFileList(dir);
    if (items) {
        context.input.items = items;
    }
}

export async function createFilePick(context: ContextType, dir: string) {
    const input = window.createQuickPick<FileData>();
    input.onDidAccept(() => {
        if (!input.activeItems.length) {
            createNewFileAndOpen(input.value, context.cwd);
        }
    });
    input.onDidChangeSelection(() => {
        selectItem(context);
    });
    input.onDidHide(() => {
        input.dispose();
    });
    input.title = dir;

    const items = await getFileList(dir);
    if (items) {
        input.items = items;
    }

    context.cwd = dir;
    context.input = input;

    input.show();
}
