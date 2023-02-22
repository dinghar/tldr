# tldr

tldr is a Slackbot that provides communication summaries using OpenAI's API. Interaction with the bot happens through a slash command and accepts a timeframe as a parameter.

Examples:
`/tldr 1h`,
`/tldr the last day`,
`/tldr 30 minutes`

The bot will fetch messages from the given timeframe, generate a transcript, post it to OpenAI's api with a request to summarize it, and then return the output to the user. The response comes in the form of an ephemeral message so that the user can either post the summary to the channel or privately read it.


https://user-images.githubusercontent.com/11843532/220739073-73c42e81-6817-4763-9d27-87be3c00f0e2.mov

