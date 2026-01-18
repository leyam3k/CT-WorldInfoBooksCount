# CT-WorldInfoBooksCount

A SillyTavern/CozyTavern extension that provides quick awareness of active World Info / Lorebook count. Displays a badge with the number of active lorebooks and shows a detailed list panel on click.

## Features

- **Badge Counter**: Shows the number of active World Info books directly in the send form area
- **Animated Badge**: Smooth pop-in, pop-out, and bounce animations when the count changes
- **Detailed Panel**: Click the icon to see a categorized breakdown of all active lorebooks
- **Smart Categorization**: Books are organized by their source:
  - Globally Selected Book  
  - Character Primary Book
  - Character Extra/Aux Books
  - Chat-bound Book
  - Persona-bound Book
- **Real-time Updates**: Automatically updates when switching chats, characters, or changing World Info settings
- **CozyWI Filtering**: Automatically excludes internal CozyWI books from the count

## Installation

### Method 1: Using SillyTavern Extension Installer
1. Open SillyTavern
2. Go to Extensions panel
3. Click "Install Extension"
4. Enter the repository URL: `https://github.com/leyam3k/CT-WorldInfoBooksCount`

### Method 2: Manual Installation
1. Navigate to your SillyTavern installation directory
2. Go to `public/scripts/extensions/third-party/`
3. Clone or download this repository into that folder
4. Restart SillyTavern

## Usage

After installation, a book icon (📚) will appear in the left side of the send form area near the chat input.

- **Badge**: The badge shows the total number of unique active lorebooks
- **Hover**: Hover over the icon to see a tooltip listing all active lorebook names
- **Click**: Click the icon to open a detailed panel showing lorebooks organized by category
- **Click outside**: Click anywhere outside the panel to close it

## Prerequisites

- SillyTavern (latest release version recommended)
- A browser that supports CSS anchor positioning (Chrome 125+, Edge 125+, or recent Chromium-based browsers for best experience)

## Support and Contributions

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/leyam3k/CT-WorldInfoBooksCount).

Contributions are welcome! Feel free to submit pull requests for bug fixes or new features.

## Changelog

### 1.1.0
- **Constant Entries Display**: Panel now shows all constant/always-active entries from your lorebooks
- **Preview Triggers**: Real-time preview of which entries would be triggered based on your current input text
- **Regex Support**: Trigger preview supports both plain text keywords and regex patterns
- **Enhanced Badge**: Badge now shows format `X-Y` where X is book count and Y is triggered entries count
- **Improved Panel Layout**: Reorganized panel with sections for Active Books, Constant Entries, and Preview Triggers

### 1.0.0
- Initial release
- Badge counter showing active World Info book count
- Animated badge with pop-in, pop-out, and bounce effects
- Detailed panel with categorized lorebook breakdown
- Smart categorization by source (Global, Character Primary, Character Extra/Aux, Chat-bound, Persona-bound)
- Real-time updates on chat/character/settings changes
- CozyWI internal book filtering

## License

This extension is released under the AGPLv3 License.
