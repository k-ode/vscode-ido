# vscode-ido

File navigation extension inspired by Helm and ido mode in Emacs.

## Features

Quickly navigate and create files with the keyboard.

![Ido](public/ido.gif)

## Commands

- `ido`

Activate ido mode.

- `ido-go-up-directory`

Jump to parent folder directory (ctrl+l).

- `ido-select-item`

Enter currently selected directory or open file. Also creates a file if doesn't already exists. 
Ido will automatically create missing subdirectories for you! (ctrl+j/enter).

## Keybindings

Ido is not bound to any key binding by default. I bind it to `ctrl+x ctrl+f`.

```
{ "key": "ctrl+x ctrl+f", "command": "extension.ido" }
```

See package.json for how to rebind the other commands.

## Todo

- Typing `~/` should bring you to your home folder
- Switch drives

## Contributing

Pull request are welcome!

## License

MIT
