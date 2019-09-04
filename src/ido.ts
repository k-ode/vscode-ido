// TODO:
// create missing directories
// handle errors better
// change drive

'use strict';

import { window, workspace } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { ContextType } from './extension';

const writeFile = util.promisify(fs.writeFile);
const lstat = util.promisify(fs.lstat);
const readdir = util.promisify(fs.readdir);

export type FileData = {
    label: string;
    name: string;
    path: string;
    isFile: boolean;
    isDirectory: boolean;
};

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
                    label: file,
                    name: file,
                    path: fullPath,
                    isFile,
                    isDirectory
                });
            }
        } catch (err) {}

        return arr;
    }, []);

    const filesWithCommands = [
        {
            label: '..',
            name: '..',
            path: path.join(dir, '..'),
            isFile: false,
            isDirectory: true
        }
    ].concat(files);

    return filesWithCommands;
}

async function createNewFileAndOpen(filePath: string, baseDir: string) {
    const newPath = path.join(baseDir, filePath);
    await writeFile(newPath, '');
    openFile(newPath);
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

    const items = await getFileList(dir);
    if (items) {
        context.input.items = items;
    }
    context.input.title = dir;
    context.input.value = '';
    context.cwd = dir;
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
