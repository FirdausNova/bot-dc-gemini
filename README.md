# Discord Character AI Bot

A Discord bot that allows users to chat with AI characters using Google's Gemini API.

## Features

- Chat with AI characters in Discord channels
- Character management system for roleplay
- Conversation memory and narrative generation
- Support for both slash commands and legacy prefix commands
- Multi-language support (English and Indonesian)

## Setup

### Prerequisites

- Node.js 16.6.0 or higher
- A Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- Google Gemini API key from [Google AI Studio](https://ai.google.dev/)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/discord-character-ai.git
   cd discord-character-ai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   BOT_PREFIX=!
   AUTO_RESPOND_CHANNEL_ID=channel_id_for_auto_responses
   BOT_LANGUAGE=en
   ```

4. Register slash commands (for first time setup or after adding new slash commands):
   ```
   node src/deploy-commands.js
   ```

5. Start the bot
   ```
   npm start
   ```

## Commands

### Legacy Commands (with prefix)

- `!ping`: Check if the bot is responsive
- `!character <n>`: Set active character for AI responses
- `!characters`: List all available characters
- `!clear`: Clear your conversation history
- `!language [set <code>]`: View or change bot language

### Slash Commands

- `/chat [message]`: Chat with the AI
- `/character [action] [name] [template]`: Manage characters
  - `/character list`: List all characters
  - `/character import [template]`: Import a character from template
  - `/character update [name] [template]`: Update character attributes
  - `/character delete [name]`: Delete a character
- `/language [view|set]`: View or change the bot's language

## Character System

Characters are defined in JSON templates with attributes like:
- Name and type
- Description and appearance
- Personality and background
- Relationships
- Quirks, likes, and dislikes
- Goals
- Expression patterns for different emotions

## Conversation Memory

The bot maintains conversation history for each user and can generate narrative summaries based on the conversation. Users can request their conversation memory by asking variants of "remember me" or "memories".

## Multi-Language Support

The bot supports multiple languages for responses and commands:

- **Language Options**:
  - `en`: English (default)
  - `id`: Indonesian (Bahasa Indonesia)

- **Changing Language**:
  - Using legacy command: `!language set <code>` (e.g., `!language set id`)
  - Using slash command: `/language set code:<code>` (select from dropdown)
  - View current language: `!language` or `/language view`

- **Configuration**:
  - Language setting is stored in the `.env` file as `BOT_LANGUAGE=<code>`
  - If not specified, English is used as the default

- **Custom Translations**:
  - Additional languages can be added by modifying the `src/utils/i18n.js` file

## Project Structure

```
discord-character-ai/
├── src/
│   ├── commands/               # Legacy prefix commands
│   ├── slash-commands/         # Discord slash commands
│   ├── config/                 # Bot configuration
│   │   ├── characters.js       # Character management system
│   │   └── character_templates.js  # Template handling
│   ├── data/                   # Data storage
│   │   ├── characters.json     # Character data
│   │   ├── character_templates.json  # Character templates
│   │   ├── history/            # User conversation history
│   │   └── narratives/         # Generated narratives
│   ├── utils/                  # Utility modules
│   │   ├── gemini.js           # Gemini API integration
│   │   └── i18n.js             # Multi-language support
│   ├── deploy-commands.js      # Script to register slash commands
│   └── index.js                # Main bot application
├── .env                        # Environment variables
└── package.json                # Dependencies and scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [discord.js](https://discord.js.org/) for the Discord API wrapper
- [Google Gemini API](https://ai.google.dev/) for the AI capabilities 