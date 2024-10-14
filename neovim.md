Here’s a structured table for the shortcuts and configurations, followed by all complementary configurations in one file for easy setup.

## **Shortcuts Table**

| **Action**                   | **Shortcut**            | **Description**                                                        |
|------------------------------|-------------------------|------------------------------------------------------------------------|
| **File and Buffer Management**|
| Save the current file         | `:w`                    | Saves the current file                                                 |
| Quit the current window       | `:q`                    | Quits the current window                                               |
| Save and quit                 | `:wq`                   | Saves the file and quits the current window                            |
| Close the buffer              | `:bd`                   | Closes the current buffer                                              |
| Go to the next buffer         | `:bn`                   | Moves to the next buffer                                               |
| Go to the previous buffer     | `:bp`                   | Moves to the previous buffer                                           |
| **Navigation**                |
| Jump to the top of file       | `gg`                    | Moves the cursor to the top of the file                                |
| Jump to the bottom of file    | `G`                     | Moves the cursor to the bottom of the file                             |
| Jump to the beginning of line | `0`                     | Moves the cursor to the start of the current line                      |
| Jump to the end of line       | `$`                     | Moves the cursor to the end of the current line                        |
| Move forward by a word        | `w`                     | Moves the cursor one word forward                                      |
| Move backward by a word       | `b`                     | Moves the cursor one word backward                                     |
| Go back to previous location  | `Ctrl + o`              | Jumps back to the previous cursor location                             |
| Go forward                    | `Ctrl + i`              | Jumps forward to the next cursor location                              |
| Scroll up half a page         | `Ctrl + u`              | Scrolls up half a page                                                 |
| Scroll down half a page       | `Ctrl + d`              | Scrolls down half a page                                               |
| **Visual Mode**               |
| Enter visual mode             | `v`                     | Enter character-wise visual mode                                       |
| Enter line-wise visual mode   | `V`                     | Selects an entire line in visual mode                                  |
| Enter block visual mode       | `Ctrl + v`              | Enters block-wise visual mode for column editing                       |
| Yank (copy) selected text     | `y`                     | Copies the selected text                                               |
| Delete selected text          | `d`                     | Deletes the selected text                                              |
| Paste after cursor            | `p`                     | Pastes after the cursor                                                |
| Paste before cursor           | `P`                     | Pastes before the cursor                                               |
| **Editing**                   |
| Undo last action              | `u`                     | Undoes the last action                                                 |
| Redo last action              | `Ctrl + r`              | Redoes the last undone action                                          |
| Indent current line           | `>>`                    | Indents the current line                                               |
| Un-indent current line        | `<<`                    | Un-indents the current line                                            |
| Yank (copy) the current line  | `yy`                    | Copies the current line                                                |
| Delete the current line       | `dd`                    | Deletes the current line                                               |
| **Search and Replace**        |
| Start search                  | `/`                     | Starts forward search                                                  |
| Search backward               | `?`                     | Starts backward search                                                 |
| Next search match             | `n`                     | Goes to the next search match                                          |
| Previous search match         | `N`                     | Goes to the previous search match                                      |
| Replace text globally         | `:%s/foo/bar/gc`        | Replaces "foo" with "bar" throughout the file with confirmation        |
| **Window Management**         |
| Split window vertically       | `Ctrl + w v`            | Splits the window vertically                                           |
| Split window horizontally     | `Ctrl + w s`            | Splits the window horizontally                                         |
| Move between splits           | `Ctrl + w h/j/k/l`      | Move between window splits                                             |
| Close current split           | `Ctrl + w q`            | Closes the current split                                               |
| **Tabs**                      |
| Open new tab                  | `:tabnew <filename>`    | Opens a new tab with the specified file                                |
| Next tab                      | `:tabn`                 | Moves to the next tab                                                  |
| Previous tab                  | `:tabp`                 | Moves to the previous tab                                              |
| Close current tab             | `:tabclose`             | Closes the current tab                                                 |
| **Quickfix/Location List**    |
| Open the quickfix list         | `:copen`                | Opens the quickfix list                                                |
| Next quickfix item            | `:cnext`                | Jumps to the next item in the quickfix list                            |
| Previous quickfix item        | `:cprev`                | Jumps to the previous item in the quickfix list                        |
| Open the location list        | `:lopen`                | Opens the location list                                                |
| Next location list item       | `:lnext`                | Jumps to the next item in the location list                            |
| Previous location list item   | `:lprev`                | Jumps to the previous item in the location list                        |

## **Complete Configuration File**

```lua
-- Enable line numbers and relative line numbers for easier navigation
vim.opt.number = true               -- Shows absolute line number on the current line
vim.opt.relativenumber = true       -- Shows relative line numbers on all other lines

-- Split window behavior for horizontal and vertical splits
vim.opt.splitbelow = true           -- Horizontal splits open below the current window
vim.opt.splitright = true           -- Vertical splits open to the right of the current window

-- Disable line wrapping and configure tab behavior
vim.opt.wrap = false                -- Disable line wrapping
vim.opt.expandtab = false           -- Use tabs instead of spaces
vim.opt.tabstop = 4                 -- Each tab character is equal to 4 spaces
vim.opt.shiftwidth = 4              -- Indentation levels are 4 spaces wide

-- Enable virtual editing in block visual mode
vim.opt.virtualedit = "block"       -- Allows the cursor to move freely in block visual mode

-- Integrate clipboard for system-wide copy-paste
vim.opt.clipboard = "unnamedplus"   -- Uses the system clipboard

-- Scrolling behavior that keeps the cursor centered
vim.opt.scrolloff = 999             -- Always keep the cursor vertically centered

-- Incremental command execution for substitution previews
vim.opt.inccommand = "split"        -- Show live substitution previews in a split window

-- Enable case-insensitive search, with case-sensitive override
vim.opt.ignorecase = true           -- Ignore case while searching
vim.opt.smartcase = true            -- Override to case-sensitive if the search contains uppercase letters

-- Enable true color support for better color schemes
vim.opt.termguicolors = true        -- Enable 24-bit RGB colors for the terminal

-- Automatically highlight all search matches
vim.opt.hlsearch = true             -- Highlight all matches of the search pattern

-- Enable incremental search to show results as you type
vim.opt.incsearch = true            -- Display search matches as you type

-- Enable persistent undo across sessions
vim.opt.undofile = true             -- Store undo history to file

-- Always show the sign column to prevent text shifting
vim.opt.signcolumn = "yes"          -- Show the sign column all the time

-- Set up lazy.nvim plugin manager
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
    local lazyrepo = "https://github.com/folke/lazy.nvim.git"
    local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
    if vim.v.shell_error ~= 0 then
        vim.api.nvim_echo({
            { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
            { out, "WarningMsg" },
            { "\nPress any key to exit..." },
        }, true, {})
        vim.fn.getchar()
        os.exit(1)
    end
end
vim.opt.rtp:prepend(lazypath)

-- Install and configure the kanagawa colorscheme plugin
require("lazy").setup({
    spec = {
        "rebelot/kanagawa.nvim"   -- Install the Kanagawa color scheme plugin
    }
})

-- Apply the Kanagawa color scheme
vim.cmd('colorscheme kanagawa-wave')
```

This file combines configurations to improve navigation, enable better file handling, enhance color support, and handle splits and search efficiently. It also provides Neovim shortcuts that complement the configs, optimizing your Neovim setup.
