// Script to generate bot invite link
require('dotenv').config();

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
  console.error('Error: DISCORD_CLIENT_ID not found in .env file');
  process.exit(1);
}

// Invite link with Administrator permission (8) and bot + applications.commands scopes
const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;

console.log('=== Bot Invite Link ===');
console.log('Use the following link to invite the bot to your server:');
console.log(inviteLink);
console.log('\nImportant: Make sure "applications.commands" scope is checked when inviting the bot!'); 